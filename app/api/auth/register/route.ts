import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { name, firstName, lastName, phone, companyName, email, password } = await req.json();

    if (!name || !firstName || !lastName || !phone || !email || !password) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    const issuer = process.env.KEYCLOAK_ISSUER;
    const clientId = process.env.KEYCLOAK_CLIENT_ID;
    const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

    if (!issuer || !clientId || !clientSecret) {
      console.error("Missing Keycloak environment variables");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Extract realm from issuer (assuming format: https://domain.com/realms/{realm})
    const realmMatch = issuer.match(/\/realms\/([^/]+)/);
    const realm = realmMatch ? realmMatch[1] : null;
    const baseUrl = issuer.split("/realms/")[0];

    if (!realm || !baseUrl) {
      return NextResponse.json(
        { error: "Invalid Keycloak issuer format" },
        { status: 500 }
      );
    }

    // 1. Get Admin Access Token using Client Credentials Grant
    const tokenUrl = `${issuer}/protocol/openid-connect/token`;
    const tokenBody = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    });

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody.toString(),
    });

    if (!tokenRes.ok) {
      const errorText = await tokenRes.text();
      console.error("Failed to get Admin Token:", errorText);
      return NextResponse.json(
        { error: "Failed to authenticate with Identity Provider" },
        { status: 500 }
      );
    }

    const { access_token } = await tokenRes.json();

    // 2. Create User
    const usersUrl = `${baseUrl}/admin/realms/${realm}/users`;

    const userPayload = {
      username: name, // Using the 'name' payload field as the Keycloak custom username
      email: email,
      firstName: firstName,
      lastName: lastName,
      enabled: true,
      emailVerified: true, // Force email to be verified
      requiredActions: [], // Force Keycloak to skip any required actions like VERIFY_EMAIL
    };

    const createUserRes = await fetch(usersUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userPayload),
    });

    if (!createUserRes.ok) {
      const errorText = await createUserRes.text();
      console.error("Failed to create user in Keycloak:", errorText);
      
      if (createUserRes.status === 409) {
         return NextResponse.json(
          { error: "User with this email already exists" },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 500 }
      );
    }

    // Get the User ID from the Location header
    const locationHeader = createUserRes.headers.get("Location");
    let userId = "";
    
    if (locationHeader) {
      const parts = locationHeader.split("/");
      userId = parts[parts.length - 1];
    } else {
      // Fallback: Query user by email if Location header is missing
      const searchRes = await fetch(`${usersUrl}?email=${encodeURIComponent(email)}&exact=true`, {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.length > 0) {
          userId = searchData[0].id;
        }
      }
    }

    if (!userId) {
      console.error("Could not determine newly created user ID.");
      return NextResponse.json(
        { error: "User created, but failed to retrieve ID for password setup" },
        { status: 500 }
      );
    }

    // 3. Set User Password
    const resetPasswordUrl = `${usersUrl}/${userId}/reset-password`;
    const resetPasswordPayload = {
      type: "password",
      value: password,
      temporary: false,
    };

    const resetRes = await fetch(resetPasswordUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resetPasswordPayload),
    });

    if (!resetRes.ok) {
      const errorText = await resetRes.text();
      console.error("Failed to set user password:", errorText);
      return NextResponse.json(
        { error: "User created, but failed to set password" },
        { status: 500 }
      );
    }

    // 4. Create User Profile in local PostgreSQL Database
    try {
      const profileRes = await fetch("http://localhost:3001/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          phoneNumber: phone,
          companyName: companyName || null,
        }),
      });

      if (!profileRes.ok) {
        console.error("Failed to create PostgreSQL user profile", await profileRes.text());
        // We do not fail the registration if profile sync fails, 
        // because the Keycloak user is already created!
      }
    } catch (dbError) {
      console.error("Database connection failed while creating profile:", dbError);
    }

    return NextResponse.json(
      { message: "User registered successfully" },
      { status: 201 }
    );
    
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

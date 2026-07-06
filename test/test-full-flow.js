

async function test() {
  const issuer = "https://auth.enfycon.com/realms/enfycon-tender";
  const clientId = "enfycon-tender";
  const clientSecret = "QPumFFxu83otPHheKgsYzc3YouvBGkpU";

  const adminTokenUrl = `${issuer}/protocol/openid-connect/token`;
  const adminBody = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  try {
    const adminRes = await fetch(adminTokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: adminBody.toString(),
    });
    
    if (!adminRes.ok) {
        console.error("Failed Admin Token", await adminRes.text());
        return;
    }
    const adminTokens = await adminRes.json();
    console.log("Got admin token");

    // Try to register user
    const baseUrl = issuer.split("/realms/")[0];
    const realm = "enfycon-tender";
    const usersUrl = `${baseUrl}/admin/realms/${realm}/users`;

    const userPayload = {
      username: "testuser@enfycon.com",
      email: "testuser@enfycon.com",
      enabled: true,
      emailVerified: true,
      firstName: "Test",
      lastName: "User"
    };

    const createUserRes = await fetch(usersUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminTokens.access_token}`
      },
      body: JSON.stringify(userPayload)
    });

    if (!createUserRes.ok) {
       console.log("User might already exist", await createUserRes.text());
    } else {
       console.log("User created");
    }

    // Now let's find the user ID
    const searchRes = await fetch(`${usersUrl}?username=testuser@enfycon.com`, {
        headers: { Authorization: `Bearer ${adminTokens.access_token}` }
    });
    const users = await searchRes.json();
    const testUserId = users[0].id;

    // Set password
    const passwordUrl = `${usersUrl}/${testUserId}/reset-password`;
    const passwordPayload = {
      type: "password",
      value: "TestPassword123!",
      temporary: false
    };

    await fetch(passwordUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminTokens.access_token}`
      },
      body: JSON.stringify(passwordPayload)
    });
    console.log("Password set");

    // Now try to login via Direct Access Grants
    const tokenBody = new URLSearchParams({
      grant_type: "password",
      client_id: clientId,
      client_secret: clientSecret,
      username: "testuser@enfycon.com",
      password: "TestPassword123!",
      scope: "openid profile email",
    });

    const loginRes = await fetch(adminTokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody.toString(),
    });

    console.log("Login Status:", loginRes.status);
    console.log("Login Response:", await loginRes.text());

  } catch (e) {
    console.error("Fetch error:", e);
  }
}

test();

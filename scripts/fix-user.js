async function fixUser() {
  const issuer = "https://auth.enfycon.com/realms/enfycon-tender";
  const clientId = "enfycon-tender";
  const clientSecret = "QPumFFxu83otPHheKgsYzc3YouvBGkpU";
  const targetEmail = "imsahadeb@gmail.com";

  const adminTokenUrl = `${issuer}/protocol/openid-connect/token`;
  const adminBody = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  try {
    console.log("Getting admin token...");
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

    // Search for the user
    const baseUrl = issuer.split("/realms/")[0];
    const realm = "enfycon-tender";
    const usersUrl = `${baseUrl}/admin/realms/${realm}/users`;

    console.log(`Searching for user: ${targetEmail}`);
    const searchRes = await fetch(`${usersUrl}?email=${targetEmail}&exact=true`, {
        headers: { Authorization: `Bearer ${adminTokens.access_token}` }
    });
    
    if (!searchRes.ok) {
        console.error("Search failed", await searchRes.text());
        return;
    }
    
    const users = await searchRes.json();
    if (users.length === 0) {
        console.log("User not found!");
        return;
    }
    
    const targetUserId = users[0].id;
    console.log(`Found user ID: ${targetUserId}`);
    console.log(`Current required actions:`, users[0].requiredActions);
    console.log(`Current email verified:`, users[0].emailVerified);

    // Update the user
    const updatePayload = {
      emailVerified: true,
      requiredActions: []
    };

    console.log("Fixing user account...");
    const updateRes = await fetch(`${usersUrl}/${targetUserId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminTokens.access_token}`
      },
      body: JSON.stringify(updatePayload)
    });

    if (!updateRes.ok) {
       console.error("Failed to update user", await updateRes.text());
    } else {
       console.log("Successfully fixed user! They can now log in.");
    }
    
    // Let's test the login right now
    console.log("Testing login...");
    const tokenBody = new URLSearchParams({
      grant_type: "password",
      client_id: clientId,
      client_secret: clientSecret,
      username: targetEmail,
      password: "Rtyfgh12!",
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

fixUser();

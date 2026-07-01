async function fixUserLastName() {
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
    const adminRes = await fetch(adminTokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: adminBody.toString(),
    });
    
    const adminTokens = await adminRes.json();
    const baseUrl = issuer.split("/realms/")[0];
    const realm = "enfycon-tender";
    const usersUrl = `${baseUrl}/admin/realms/${realm}/users`;

    const searchRes = await fetch(`${usersUrl}?email=${targetEmail}&exact=true`, {
        headers: { Authorization: `Bearer ${adminTokens.access_token}` }
    });
    
    const users = await searchRes.json();
    const targetUserId = users[0].id;

    // Update the user
    const updatePayload = {
      lastName: "User"
    };

    const updateRes = await fetch(`${usersUrl}/${targetUserId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminTokens.access_token}`
      },
      body: JSON.stringify(updatePayload)
    });

    console.log("Update status:", updateRes.status);
    
    // Let's test the login right now
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

  } catch (e) {
    console.error("Fetch error:", e);
  }
}

fixUserLastName();

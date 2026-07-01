async function checkUser() {
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
    console.log(users[0]);
  } catch (e) {
    console.error("Fetch error:", e);
  }
}

checkUser();

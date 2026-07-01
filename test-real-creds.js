async function test() {
  const issuer = "https://auth.enfycon.com/realms/enfycon-tender";
  const clientId = "enfycon-tender";
  const clientSecret = "QPumFFxu83otPHheKgsYzc3YouvBGkpU";

  const tokenUrl = `${issuer}/protocol/openid-connect/token`;
  const tokenBody = new URLSearchParams({
    grant_type: "password",
    client_id: clientId,
    client_secret: clientSecret,
    username: "imsahadeb@gmail.com",
    password: "Rtyfgh12!",
    scope: "openid profile email",
  });

  try {
    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody.toString(),
    });
    
    const text = await res.text();
    console.log("Token Status:", res.status);
    console.log("Token Response:", text);
    
    if (res.ok) {
       const tokens = JSON.parse(text);
       const userInfoRes = await fetch(`${issuer}/protocol/openid-connect/userinfo`, {
         headers: { Authorization: `Bearer ${tokens.access_token}` }
       });
       console.log("UserInfo Status:", userInfoRes.status);
       console.log("UserInfo Response:", await userInfoRes.text());
    }
  } catch (e) {
    console.error("Fetch error:", e);
  }
}

test();

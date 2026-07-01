

async function test() {
  const issuer = "https://auth.enfycon.com/realms/enfycon-tender";
  const clientId = "enfycon-tender";
  const clientSecret = "QPumFFxu83otPHheKgsYzc3YouvBGkpU";

  const tokenUrl = `${issuer}/protocol/openid-connect/token`;
  const tokenBody = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  try {
    const res = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody.toString(),
    });
    
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Response:", text);
  } catch (e) {
    console.error("Fetch error:", e);
  }
}

test();

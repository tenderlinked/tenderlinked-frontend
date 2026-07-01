import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const issuer = process.env.KEYCLOAK_ISSUER;
    const clientId = process.env.KEYCLOAK_CLIENT_ID;
    const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

    if (!issuer || !clientId || !clientSecret) {
      console.error("Missing Keycloak environment variables");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const realmMatch = issuer.match(/\/realms\/([^/]+)/);
    const realm = realmMatch ? realmMatch[1] : null;
    const baseUrl = issuer.split("/realms/")[0];

    if (!realm || !baseUrl) {
      return NextResponse.json({ error: "Invalid Keycloak issuer format" }, { status: 500 });
    }

    // 1. Get Admin Access Token
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
      return NextResponse.json({ error: "Failed to authenticate" }, { status: 500 });
    }

    const { access_token } = await tokenRes.json();

    // 2. Check if username exists
    const usersUrl = `${baseUrl}/admin/realms/${realm}/users`;
    const searchRes = await fetch(`${usersUrl}?username=${encodeURIComponent(username)}&exact=true`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!searchRes.ok) {
      const errorText = await searchRes.text();
      console.error("Failed to search user:", errorText);
      return NextResponse.json({ error: "Failed to check username" }, { status: 500 });
    }

    const searchData = await searchRes.json();
    const isAvailable = searchData.length === 0;

    return NextResponse.json({ available: isAvailable });
  } catch (error) {
    console.error("Check username error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

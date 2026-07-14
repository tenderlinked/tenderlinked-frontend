"use server";

import { signOut } from "@/auth";
import { headers } from "next/headers";

export async function getLogoutUrl() {
  const issuer = process.env.KEYCLOAK_ISSUER || "https://auth.enfycon.com/realms/enfycon-tender";
  const clientId = process.env.KEYCLOAK_CLIENT_ID || "enfycon-tender";
  
  // Try to get the host from headers to build absolute URL dynamically
  const headersList = await headers();
  const host = headersList.get("host") || process.env.NEXT_PUBLIC_ROOT_DOMAIN || "localhost:3000";
  const protocol = host.includes("localhost") || host.includes("lvh.me") ? "http" : "https";
  const postLogoutRedirectUri = `${protocol}://${host}/auth/login`;

  return `${issuer}/protocol/openid-connect/logout?client_id=${clientId}&post_logout_redirect_uri=${encodeURIComponent(postLogoutRedirectUri)}`;
}

export async function doLogout() {
  const url = await getLogoutUrl();
  await signOut({ redirectTo: url });
}

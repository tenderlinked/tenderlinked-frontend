import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET(req) {
  const session = await auth();
  const cookies = req.cookies.getAll();
  return NextResponse.json({
    session,
    cookies,
    headers: Object.fromEntries(req.headers.entries()),
    env: {
      AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      AUTH_URL: process.env.AUTH_URL
    }
  });
}

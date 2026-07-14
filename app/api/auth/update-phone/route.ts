import { NextResponse } from "next/server";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phone } = await req.json();
    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    // Call the backend NestJS API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/users/profile/${session.user.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        // Pass internal secret since NextAuth tokens from Keycloak might have tricky scopes for profile updating
        // Or just pass the JWT if it has the right scopes, but let's use the secret just in case
        "x-internal-secret": process.env.INTERNAL_API_SECRET || "fallback-internal-secret-xyz",
      },
      body: JSON.stringify({ phoneNumber: phone }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Backend error patching profile:", errorData);
      return NextResponse.json({ error: "Failed to update profile on server" }, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update phone error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}`}/api/users/profile/check-phone/${encodeURIComponent(phone)}`);
    
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to check phone number" }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ available: data.available });
  } catch (error) {
    console.error("Check phone error:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

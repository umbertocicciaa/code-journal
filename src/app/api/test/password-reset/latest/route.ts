import { NextResponse } from "next/server";
import { getPasswordResetEmailForAddress } from "@/server/services/password-reset-email";

export async function GET(request: Request) {
  if (process.env.PASSWORD_RESET_EMAIL_CAPTURE !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const email = new URL(request.url).searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const captured = getPasswordResetEmailForAddress(email);
  if (!captured) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    token: captured.token,
    url: captured.url,
  });
}

import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { getConsentUrl } from "@/lib/google/calendar";

export const runtime = "nodejs";

/** GET /api/google/connect → redirect the user to Google's consent screen. */
export async function GET() {
  const { user } = await getApiUser();
  if (!user) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  try {
    return NextResponse.redirect(getConsentUrl(user.id));
  } catch {
    const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
    return NextResponse.redirect(`${base}/settings/profile?google=error`);
  }
}

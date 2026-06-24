import { NextResponse, type NextRequest } from "next/server";
import { getApiUser } from "@/lib/auth";
import { exchangeCodeForTokens, saveCredentials } from "@/lib/google/calendar";

export const runtime = "nodejs";

/**
 * GET /api/webhooks/google — OAuth redirect URI.
 * Exchanges the authorization code for tokens and stores them for the user.
 */
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const profileUrl = `${origin}/settings/profile`;

  const error = searchParams.get("error");
  if (error) {
    return NextResponse.redirect(`${profileUrl}?google=denied`);
  }

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code || !state) {
    return NextResponse.redirect(`${profileUrl}?google=error`);
  }

  const { supabase, user } = await getApiUser();
  // The `state` is the user id captured when the flow started; require a match.
  if (!user || user.id !== state) {
    return NextResponse.redirect(`${origin}/login`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    await saveCredentials(supabase, user.id, tokens);
    return NextResponse.redirect(`${profileUrl}?google=connected`);
  } catch {
    return NextResponse.redirect(`${profileUrl}?google=error`);
  }
}

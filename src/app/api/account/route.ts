import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { deleteAllUserDocuments } from "@/lib/supabase/storage";
import type { ApiError } from "@/types";

export const runtime = "nodejs";

/**
 * DELETE /api/account — GDPR erasure.
 * Removes the user's documents from Storage and every database record, then
 * deletes the auth user (which cascades profiles → bills, memberships, tokens).
 */
export async function DELETE() {
  const { supabase, user } = await getApiUser();
  if (!user) {
    return NextResponse.json<ApiError>({ error: "Non autenticato" }, { status: 401 });
  }

  const admin = createAdminClient();

  try {
    // 1) Original documents from Storage.
    await deleteAllUserDocuments(admin, user.id);

    // 2) Groups owned by the user (cascades memberships; nulls shared bills' group_id).
    await admin.from("family_groups").delete().eq("owner_id", user.id);

    // 3) Delete the auth user → cascades profiles and all owned records
    //    (bills, group_members, google_credentials) via ON DELETE CASCADE.
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw new Error(error.message);

    // 4) Clear the current session cookies.
    await supabase.auth.signOut();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[account] deletion failed:", err instanceof Error ? err.message : err);
    return NextResponse.json<ApiError>(
      { error: "Eliminazione account non riuscita. Riprova." },
      { status: 500 },
    );
  }
}

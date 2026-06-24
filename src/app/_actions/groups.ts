"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export type GroupActionResult = { ok: true } | { ok: false; error: string };

async function currentUserId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

async function assertOwner(groupId: string, userId: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from("family_groups")
    .select("owner_id")
    .eq("id", groupId)
    .maybeSingle();
  return data?.owner_id === userId;
}

export async function createGroup(formData: FormData): Promise<GroupActionResult> {
  const name = z.string().trim().min(1, "Inserisci un nome").max(80).safeParse(formData.get("name"));
  if (!name.success) return { ok: false, error: name.error.issues[0]!.message };

  const uid = await currentUserId();
  if (!uid) return { ok: false, error: "Sessione non valida" };

  const supabase = createClient();
  const { data: group, error } = await supabase
    .from("family_groups")
    .insert({ name: name.data, owner_id: uid })
    .select("id")
    .single();
  if (error || !group) return { ok: false, error: error?.message ?? "Creazione non riuscita" };

  const { error: memberErr } = await supabase
    .from("group_members")
    .insert({ group_id: group.id, user_id: uid, role: "owner" });
  if (memberErr) return { ok: false, error: memberErr.message };

  revalidatePath("/settings/family");
  return { ok: true };
}

export async function renameGroup(
  groupId: string,
  name: string,
): Promise<GroupActionResult> {
  const parsed = z.object({ groupId: z.string().uuid(), name: z.string().trim().min(1).max(80) })
    .safeParse({ groupId, name });
  if (!parsed.success) return { ok: false, error: "Dati non validi" };

  const uid = await currentUserId();
  if (!uid || !(await assertOwner(parsed.data.groupId, uid))) {
    return { ok: false, error: "Solo il proprietario può rinominare il gruppo" };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("family_groups")
    .update({ name: parsed.data.name })
    .eq("id", parsed.data.groupId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings/family");
  return { ok: true };
}

/**
 * Adds an existing BillTracker user (looked up by email) to a group.
 * A full email-invite/accept flow is out of scope; the invitee must already
 * have an account.
 */
export async function inviteMember(
  groupId: string,
  email: string,
): Promise<GroupActionResult> {
  const parsed = z
    .object({ groupId: z.string().uuid(), email: z.string().email() })
    .safeParse({ groupId, email });
  if (!parsed.success) return { ok: false, error: "Email non valida" };

  const uid = await currentUserId();
  if (!uid || !(await assertOwner(parsed.data.groupId, uid))) {
    return { ok: false, error: "Solo il proprietario può invitare membri" };
  }

  // Profile lookup across users requires the privileged client.
  const admin = createAdminClient();
  const normalized = parsed.data.email.toLowerCase();
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .ilike("email", normalized)
    .maybeSingle();

  if (!profile) {
    return {
      ok: false,
      error: "Nessun utente registrato con questa email. Invitalo a iscriversi prima.",
    };
  }

  const { error } = await admin
    .from("group_members")
    .upsert(
      { group_id: parsed.data.groupId, user_id: profile.id, role: "member" },
      { onConflict: "group_id,user_id", ignoreDuplicates: true },
    );
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings/family");
  return { ok: true };
}

export async function removeMember(
  groupId: string,
  memberId: string,
): Promise<GroupActionResult> {
  const parsed = z
    .object({ groupId: z.string().uuid(), memberId: z.string().uuid() })
    .safeParse({ groupId, memberId });
  if (!parsed.success) return { ok: false, error: "Dati non validi" };

  const uid = await currentUserId();
  if (!uid || !(await assertOwner(parsed.data.groupId, uid))) {
    return { ok: false, error: "Solo il proprietario può rimuovere membri" };
  }
  if (parsed.data.memberId === uid) {
    return { ok: false, error: "Il proprietario non può rimuovere se stesso" };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", parsed.data.groupId)
    .eq("user_id", parsed.data.memberId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings/family");
  return { ok: true };
}

export async function leaveGroup(groupId: string): Promise<GroupActionResult> {
  const parsed = z.string().uuid().safeParse(groupId);
  if (!parsed.success) return { ok: false, error: "Dati non validi" };

  const uid = await currentUserId();
  if (!uid) return { ok: false, error: "Sessione non valida" };
  if (await assertOwner(parsed.data, uid)) {
    return { ok: false, error: "Il proprietario non può abbandonare: elimina il gruppo" };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", parsed.data)
    .eq("user_id", uid);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings/family");
  return { ok: true };
}

export async function deleteGroup(groupId: string): Promise<GroupActionResult> {
  const parsed = z.string().uuid().safeParse(groupId);
  if (!parsed.success) return { ok: false, error: "Dati non validi" };

  const uid = await currentUserId();
  if (!uid || !(await assertOwner(parsed.data, uid))) {
    return { ok: false, error: "Solo il proprietario può eliminare il gruppo" };
  }

  const supabase = createClient();
  const { error } = await supabase.from("family_groups").delete().eq("id", parsed.data);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings/family");
  return { ok: true };
}

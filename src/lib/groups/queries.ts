import { createClient } from "@/lib/supabase/server";
import type { FamilyGroup, GroupRole } from "@/types";

export interface GroupWithRole extends FamilyGroup {
  role: GroupRole;
  memberCount: number;
}

export interface GroupMemberView {
  userId: string;
  name: string | null;
  email: string | null;
  role: GroupRole;
  isYou: boolean;
}

export interface GroupDetail extends GroupWithRole {
  isOwner: boolean;
  members: GroupMemberView[];
}

/** Groups the current user belongs to, with their role and member count. */
export async function listMyGroups(): Promise<GroupWithRole[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id, role")
    .eq("user_id", user.id);

  if (!memberships?.length) return [];

  const groupIds = memberships.map((m) => m.group_id);
  const { data: groups } = await supabase
    .from("family_groups")
    .select("*")
    .in("id", groupIds);

  // Member counts (RLS lets members see co-members).
  const { data: allMembers } = await supabase
    .from("group_members")
    .select("group_id")
    .in("group_id", groupIds);

  const counts = new Map<string, number>();
  for (const m of allMembers ?? []) {
    counts.set(m.group_id, (counts.get(m.group_id) ?? 0) + 1);
  }
  const roleById = new Map(memberships.map((m) => [m.group_id, m.role as GroupRole]));

  return (groups ?? []).map((g) => ({
    ...(g as FamilyGroup),
    role: roleById.get(g.id) ?? "member",
    memberCount: counts.get(g.id) ?? 1,
  }));
}

/** Groups with their full member list (for the family settings page). */
export async function getFamilyData(): Promise<{
  userId: string;
  groups: GroupDetail[];
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { userId: "", groups: [] };

  const groups = await listMyGroups();
  if (groups.length === 0) return { userId: user.id, groups: [] };

  const groupIds = groups.map((g) => g.id);

  const { data: members } = await supabase
    .from("group_members")
    .select("group_id, user_id, role")
    .in("group_id", groupIds);

  const memberUserIds = Array.from(new Set((members ?? []).map((m) => m.user_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, email")
    .in("id", memberUserIds);

  const profileById = new Map(
    (profiles ?? []).map((p) => [p.id, { name: p.display_name, email: p.email }]),
  );

  return {
    userId: user.id,
    groups: groups.map((g) => ({
      ...g,
      isOwner: g.owner_id === user.id,
      members: (members ?? [])
        .filter((m) => m.group_id === g.id)
        .map((m) => ({
          userId: m.user_id,
          name: profileById.get(m.user_id)?.name ?? null,
          email: profileById.get(m.user_id)?.email ?? null,
          role: m.role as GroupRole,
          isYou: m.user_id === user.id,
        }))
        .sort((a, b) => (a.role === "owner" ? -1 : b.role === "owner" ? 1 : 0)),
    })),
  };
}

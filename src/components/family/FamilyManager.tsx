"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  Users,
  UserPlus,
  Crown,
  Trash2,
  LogOut,
  Plus,
  Loader2,
} from "lucide-react";
import {
  createGroup,
  inviteMember,
  removeMember,
  leaveGroup,
  deleteGroup,
} from "@/app/_actions/groups";
import type { GroupDetail } from "@/lib/groups/queries";

export function FamilyManager({ groups }: { groups: GroupDetail[] }) {
  const t = useTranslations("family");
  return (
    <div className="space-y-6">
      <CreateGroupCard />
      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-12 text-center">
          <Users className="mx-auto text-slate-300" size={40} />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            {t("empty")}
          </p>
        </div>
      ) : (
        groups.map((g) => <GroupCard key={g.id} group={g} />)
      )}
    </div>
  );
}

function CreateGroupCard() {
  const t = useTranslations("family");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function action(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await createGroup(formData);
      if (!res.ok) setError(res.error);
    });
  }

  return (
    <form
      action={action}
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm sm:p-5"
    >
      <h2 className="mb-3 text-base font-semibold text-slate-800 dark:text-slate-200">{t("createTitle")}</h2>
      {error && (
        <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <input
          name="name"
          required
          maxLength={80}
          placeholder={t("namePlaceholder")}
          className="tap-target min-w-0 flex-1 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
        <button
          type="submit"
          disabled={pending}
          className="tap-target inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          {t("create")}
        </button>
      </div>
    </form>
  );
}

function GroupCard({ group }: { group: GroupDetail }) {
  const t = useTranslations("family");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, onOk?: () => void) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? t("operationFailed"));
      else onOk?.();
    });
  }

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteMsg(null);
    setError(null);
    startTransition(async () => {
      const res = await inviteMember(group.id, inviteEmail.trim());
      if (!res.ok) setError(res.error);
      else {
        setInviteEmail("");
        setInviteMsg(t("memberAdded"));
      }
    });
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
            <Users size={18} />
          </span>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">{group.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("members", { count: group.memberCount })}
            </p>
          </div>
        </div>
        {group.isOwner ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              if (confirm(t("confirmDeleteGroup", { name: group.name }))) {
                run(() => deleteGroup(group.id));
              }
            }}
            className="tap-target inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm text-red-600 transition hover:bg-red-50"
          >
            <Trash2 size={15} /> {t("delete")}
          </button>
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => leaveGroup(group.id))}
            className="tap-target inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-sm text-slate-600 dark:text-slate-300 transition hover:bg-slate-100"
          >
            <LogOut size={15} /> {t("leave")}
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {inviteMsg && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {inviteMsg}
        </p>
      )}

      <ul className="mt-4 divide-y divide-slate-100">
        {group.members.map((m) => (
          <li key={m.userId} className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300">
                {(m.name || m.email || "?").charAt(0).toUpperCase()}
              </span>
              <div className="text-sm">
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {m.name || m.email}
                  {m.isYou && (
                    <span className="ml-1 text-slate-400 dark:text-slate-500">{t("you")}</span>
                  )}
                </p>
                {m.email && m.name && <p className="text-xs text-slate-400 dark:text-slate-500">{m.email}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {m.role === "owner" && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                  <Crown size={13} /> {t("owner")}
                </span>
              )}
              {group.isOwner && !m.isYou && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => removeMember(group.id, m.userId))}
                  aria-label={t("removeMember", { name: m.name || m.email || "" })}
                  className="tap-target rounded-lg p-1.5 text-slate-400 dark:text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {group.isOwner && (
        <form onSubmit={handleInvite} className="mt-3 flex gap-2">
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email@esempio.it"
            className="tap-target min-w-0 flex-1 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
          />
          <button
            type="submit"
            disabled={pending}
            className="tap-target inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 font-medium text-brand-700 transition hover:bg-brand-100 disabled:opacity-60"
          >
            {pending ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
            {t("invite")}
          </button>
        </form>
      )}
    </div>
  );
}

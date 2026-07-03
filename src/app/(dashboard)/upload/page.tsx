import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { UploadWizard } from "@/components/bills/UploadWizard";
import { listMyGroups } from "@/lib/groups/queries";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const [groups, t] = await Promise.all([
    listMyGroups(),
    getTranslations("upload"),
  ]);
  // Document parsing needs an Anthropic key; without it, go manual-only.
  const parsingEnabled = Boolean(process.env.ANTHROPIC_API_KEY);

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700"
      >
        <ArrowLeft size={16} /> {t("backToBills")}
      </Link>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm sm:p-6">
        <h1 className="mb-1 text-lg font-bold text-slate-900 dark:text-slate-100">{t("title")}</h1>
        <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
          {parsingEnabled ? t("subtitleParsing") : t("subtitleManual")}
        </p>
        <UploadWizard
          groups={groups.map((g) => ({ id: g.id, name: g.name }))}
          parsingEnabled={parsingEnabled}
        />
      </div>
    </div>
  );
}

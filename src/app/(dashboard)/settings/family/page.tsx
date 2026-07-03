import { getTranslations } from "next-intl/server";
import { FamilyManager } from "@/components/family/FamilyManager";
import { getFamilyData } from "@/lib/groups/queries";

export const dynamic = "force-dynamic";

export default async function FamilyPage() {
  const [{ groups }, t] = await Promise.all([
    getFamilyData(),
    getTranslations("family"),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">{t("title")}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t("subtitle")}
        </p>
      </div>
      <FamilyManager groups={groups} />
    </div>
  );
}

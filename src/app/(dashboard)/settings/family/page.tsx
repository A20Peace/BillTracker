import { FamilyManager } from "@/components/family/FamilyManager";
import { getFamilyData } from "@/lib/groups/queries";

export const dynamic = "force-dynamic";

export default async function FamilyPage() {
  const { groups } = await getFamilyData();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <h1 className="text-lg font-bold text-slate-900">Gruppo familiare</h1>
        <p className="text-sm text-slate-500">
          Condividi le scadenze con la tua famiglia. I membri vedono le scadenze
          condivise e ricevono i promemoria.
        </p>
      </div>
      <FamilyManager groups={groups} />
    </div>
  );
}

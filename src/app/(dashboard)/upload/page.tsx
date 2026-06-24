import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UploadWizard } from "@/components/bills/UploadWizard";
import { listMyGroups } from "@/lib/groups/queries";

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const groups = await listMyGroups();
  // Document parsing needs an Anthropic key; without it, go manual-only.
  const parsingEnabled = Boolean(process.env.ANTHROPIC_API_KEY);

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft size={16} /> Torna alle scadenze
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h1 className="mb-1 text-lg font-bold text-slate-900">Nuova scadenza</h1>
        <p className="mb-5 text-sm text-slate-500">
          {parsingEnabled
            ? "Carica il documento: estraiamo importo, data e categoria per te."
            : "Compila i dati della scadenza."}
        </p>
        <UploadWizard
          groups={groups.map((g) => ({ id: g.id, name: g.name }))}
          parsingEnabled={parsingEnabled}
        />
      </div>
    </div>
  );
}

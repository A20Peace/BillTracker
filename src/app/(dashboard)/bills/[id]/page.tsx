import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BillDetail } from "@/components/bills/BillDetail";
import { requireUser } from "@/lib/auth";
import { getSignedUrl } from "@/lib/supabase/storage";
import { listMyGroups } from "@/lib/groups/queries";
import type { Bill } from "@/types";

export const dynamic = "force-dynamic";

export default async function BillPage({ params }: { params: { id: string } }) {
  const { supabase } = await requireUser();

  const { data: bill } = await supabase
    .from("bills")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (!bill) notFound();

  const [signedUrl, groups] = await Promise.all([
    bill.document_url ? getSignedUrl(supabase, bill.document_url) : Promise.resolve(null),
    listMyGroups(),
  ]);

  const isPdf = (bill.document_url ?? "").toLowerCase().endsWith(".pdf");

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700"
      >
        <ArrowLeft size={16} /> Torna alle scadenze
      </Link>
      <BillDetail
        bill={bill as Bill}
        documentUrl={signedUrl}
        isPdf={isPdf}
        groups={groups.map((g) => ({ id: g.id, name: g.name }))}
      />
    </div>
  );
}

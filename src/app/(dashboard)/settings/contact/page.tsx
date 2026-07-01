import { redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ContactAdmin } from "@/components/settings/ContactAdmin";
import { requireUser } from "@/lib/auth";
import { getContactInfo } from "@/lib/app-settings/queries";

export const dynamic = "force-dynamic";

export default async function ContactSettingsPage() {
  const { profile } = await requireUser();

  // Sezione admin: chi non è amministratore viene rimandato in dashboard,
  // senza alcun indizio che questa pagina esista.
  if (!profile?.is_admin) redirect("/dashboard");

  const contact = await getContactInfo();

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Pagina Contattaci
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          I riferimenti mostrati nella pagina pubblica{" "}
          <Link
            href="/contatti"
            target="_blank"
            className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline"
          >
            /contatti <ExternalLink size={12} />
          </Link>
          . Le modifiche sono visibili subito a tutti i visitatori.
        </p>
      </div>
      <ContactAdmin contact={contact} />
    </div>
  );
}

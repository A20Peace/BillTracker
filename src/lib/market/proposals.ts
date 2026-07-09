import { createAdminClient } from "@/lib/supabase/server";
import type { BenchmarkCategory } from "@/types";

/**
 * Raccolta semi-automatica dei benchmark di mercato.
 *
 * Ogni esecuzione (cron mensile, idempotente per trimestre) produce al massimo
 * una proposta "pending" per categoria e trimestre:
 *
 *  - luce / gas ......... prova a estrarre la spesa annua della famiglia tipo
 *                         dall'ultimo comunicato stampa ARERA (testo semplice,
 *                         molto più stabile delle pagine dati in JS);
 *  - internet/telefono .. nessuna fonte machine-readable: ripropone l'ultimo
 *                         valore approvato con l'invito a verificarlo su AGCOM.
 *
 * In ogni caso NIENTE viene pubblicato: i valori finiscono in
 * benchmark_proposals e l'amministratore li approva da /settings/benchmarks.
 */

const ARERA_BASE = "https://www.arera.it";
const PRESS_LIST_URL = `${ARERA_BASE}/comunicati-stampa`;
const AGCOM_URL = "https://www.agcom.it";

export const PROPOSAL_CATEGORIES: BenchmarkCategory[] = [
  "luce",
  "gas",
  "internet",
  "telefono",
];

export interface ProposalDraft {
  category: BenchmarkCategory;
  period: string;
  avg_monthly_eur: number;
  source_url: string | null;
  notes: string;
  auto_extracted: boolean;
}

export interface ProposalRunResult {
  period: string;
  created: ProposalDraft[];
  skippedExisting: BenchmarkCategory[];
  skippedNoData: BenchmarkCategory[];
  extractionErrors: string[];
}

/** Trimestre corrente nel formato usato da market_benchmarks, es. "2026-Q3". */
export function currentQuarter(now: Date = new Date()): string {
  return `${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`;
}

// ─── Fetch & parsing ─────────────────────────────────────────────────────────

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "KeepinBillBot/1.0 (+benchmark updater)" },
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#0?39;/g, "'")
    .replace(/&euro;|&#8364;/g, "€")
    .replace(/&agrave;/g, "à")
    .replace(/&egrave;/g, "è")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");
}

/** "1.234,56" → 1234.56 */
function parseItalianNumber(raw: string): number {
  return Number(raw.replace(/\./g, "").replace(",", "."));
}

/**
 * Primo link a un comunicato pertinente nella pagina elenco (ordinata dal più
 * recente). Servono i comunicati su tutela/aggiornamenti trimestrali, non
 * quelli generici (es. la relazione annuale cita "elettricita" nello slug ma
 * non contiene i prezzi): per questo il filtro richiede anche un termine
 * legato all'aggiornamento tariffario.
 */
export function findReleaseHref(
  listHtml: string,
  category: "luce" | "gas",
): string | null {
  const hrefs = Array.from(
    listHtml.matchAll(/href="(\/comunicati-stampa\/dettaglio\/[^"]+)"/g),
    (m) => m[1]!,
  );
  const tariffTerms = ["trimestre", "tutela", "materia-prima", "condizioni"];
  const matches = (h: string) => {
    const isTariff = tariffTerms.some((term) => h.includes(term));
    if (!isTariff) return false;
    return category === "luce"
      ? h.includes("elettricita")
      : h.includes("gas-") || h.startsWith("/comunicati-stampa/dettaglio/gas");
  };
  const found = hrefs.find(matches);
  return found ? `${ARERA_BASE}${found}` : null;
}

/**
 * Estrae la spesa annua (in €) della famiglia/utente tipo dal testo di un
 * comunicato ARERA. Ritorna null se nessun pattern combacia: meglio nessuna
 * proposta automatica che un numero sbagliato.
 */
export function extractAnnualSpend(text: string): number | null {
  const NUM = "(\\d{1,3}(?:\\.\\d{3})*(?:,\\d{1,2})?)";
  const patterns = [
    // "la spesa annuale ... si attesterà a 591,86 euro"
    new RegExp(`spesa\\s+annuale[^.]{0,200}?${NUM}\\s*euro`, "i"),
    // "la spesa della famiglia tipo nell'anno scorrevole è di 1.184 euro"
    new RegExp(
      `spesa[^.]{0,250}?(?:famiglia|utente)\\s+tipo[^.]{0,250}?${NUM}\\s*euro`,
      "i",
    ),
    new RegExp(`(?:famiglia|utente)\\s+tipo[^.]{0,250}?${NUM}\\s*euro`, "i"),
  ];

  for (const re of patterns) {
    const m = re.exec(text);
    if (!m) continue;
    const annual = parseItalianNumber(m[1]!);
    // Sanity check: una spesa annua domestica plausibile (evita di catturare
    // percentuali, €/MWh o refusi di parsing).
    if (Number.isFinite(annual) && annual >= 100 && annual <= 5000) {
      return annual;
    }
  }
  return null;
}

interface AreraExtraction {
  monthlyEur: number;
  annualEur: number;
  sourceUrl: string;
}

/** Tenta l'estrazione automatica del valore luce/gas dai comunicati ARERA. */
async function fetchAreraValue(
  category: "luce" | "gas",
): Promise<AreraExtraction | null> {
  const listHtml = await fetchText(PRESS_LIST_URL);
  if (!listHtml) return null;

  const releaseUrl = findReleaseHref(listHtml, category);
  if (!releaseUrl) return null;

  const releaseHtml = await fetchText(releaseUrl);
  if (!releaseHtml) return null;

  const annual = extractAnnualSpend(htmlToText(releaseHtml));
  if (annual === null) return null;

  return {
    annualEur: annual,
    monthlyEur: Math.round((annual / 12) * 100) / 100,
    sourceUrl: releaseUrl,
  };
}

// ─── Generazione proposte ────────────────────────────────────────────────────

/**
 * Crea le proposte pendenti per il trimestre corrente. Idempotente: salta le
 * categorie che hanno già un benchmark per il trimestre o una proposta in
 * attesa di revisione.
 */
export async function generateBenchmarkProposals(): Promise<ProposalRunResult> {
  const admin = createAdminClient();
  const period = currentQuarter();

  const result: ProposalRunResult = {
    period,
    created: [],
    skippedExisting: [],
    skippedNoData: [],
    extractionErrors: [],
  };

  const [{ data: benchmarks }, { data: pending }] = await Promise.all([
    admin
      .from("market_benchmarks")
      .select("category, period, avg_monthly_eur")
      .order("period", { ascending: false }),
    admin
      .from("benchmark_proposals")
      .select("category, period")
      .eq("status", "pending"),
  ]);

  for (const category of PROPOSAL_CATEGORIES) {
    const hasBenchmark = (benchmarks ?? []).some(
      (b) => b.category === category && b.period === period,
    );
    const hasPending = (pending ?? []).some(
      (p) => p.category === category && p.period === period,
    );
    if (hasBenchmark || hasPending) {
      result.skippedExisting.push(category);
      continue;
    }

    // Ultimo valore approvato, usato come base per il carry-forward.
    const previous = (benchmarks ?? []).find((b) => b.category === category);

    let draft: ProposalDraft | null = null;

    if (category === "luce" || category === "gas") {
      try {
        const extracted = await fetchAreraValue(category);
        if (extracted) {
          draft = {
            category,
            period,
            avg_monthly_eur: extracted.monthlyEur,
            source_url: extracted.sourceUrl,
            notes: `Estratto automaticamente dal comunicato ARERA: spesa annua famiglia/utente tipo ${extracted.annualEur.toFixed(2).replace(".", ",")} €/anno.`,
            auto_extracted: true,
          };
        }
      } catch (err) {
        result.extractionErrors.push(
          `${category}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    // Fallback (internet/telefono sempre; luce/gas se l'estrazione fallisce):
    // ripropone l'ultimo valore approvato, da verificare a mano.
    if (!draft && previous) {
      const source = category === "luce" || category === "gas" ? ARERA_BASE : AGCOM_URL;
      draft = {
        category,
        period,
        avg_monthly_eur: previous.avg_monthly_eur,
        source_url: source,
        notes: `Riproposto il valore del periodo ${previous.period}: verifica manualmente sulla fonte prima di approvare.`,
        auto_extracted: false,
      };
    }

    if (!draft) {
      result.skippedNoData.push(category);
      continue;
    }

    const { error } = await admin.from("benchmark_proposals").insert(draft);
    if (error) {
      result.extractionErrors.push(`${category}: insert failed — ${error.message}`);
    } else {
      result.created.push(draft);
    }
  }

  return result;
}

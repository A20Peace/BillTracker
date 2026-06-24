# 🧾 BillTracker

Web app per gestire le scadenze di bollette, MAV, spese condominiali e altri
pagamenti. Carica una foto o un PDF: l'app estrae importo, scadenza, intestatario
e categoria con **Claude**, crea un promemoria su **Google Calendar**, tiene
traccia di pagato/non pagato, mostra lo storico della spesa e permette di
condividere le scadenze con la famiglia.

## Stack

| Layer | Tecnologia |
|---|---|
| Frontend / Backend | Next.js 14 (App Router) · TypeScript · Tailwind CSS |
| Database / Auth / Storage | Supabase (PostgreSQL + Auth + Storage) |
| Document parsing | Anthropic Claude (`claude-sonnet-4-6`, vision + PDF) |
| Calendar | Google Calendar API v3 |
| Email | Resend |
| Charts | Recharts |
| Deploy | Vercel (+ Vercel Cron) |

## Architettura

```
src/
  app/
    (auth)/            login, register, server actions, OAuth callback
    (dashboard)/       dashboard, upload, bills/[id], analytics, settings/*
    api/
      bills/           REST: list/create, [id] CRUD, [id]/calendar, parse
      cron/reminders/  job giornaliero protetto da CRON_SECRET
      google/connect   avvio OAuth Google
      webhooks/google  redirect URI OAuth (scambio code → token)
      account/         DELETE — cancellazione account GDPR
    _actions/          server actions (bills, groups, profile)
  components/          bills/ · analytics/ · family/ · settings/ · layout/
  lib/
    supabase/          client, server, middleware, storage helpers
    claude/parser.ts   estrazione strutturata dal documento
    google/calendar.ts OAuth + creazione evento + refresh token
    resend/            template email + job promemoria
    bills/ groups/ analytics/  query tipizzate
  types/               domain types + Database type per Supabase
supabase/migrations/   schema, RLS, trigger, storage bucket
```

## Setup locale

### 1. Prerequisiti
- Node.js 20+
- Un progetto [Supabase](https://supabase.com)
- Una API key [Anthropic](https://console.anthropic.com)
- (Opzionale) credenziali Google OAuth e una API key [Resend](https://resend.com)

### 2. Variabili d'ambiente
Copia `.env.example` in `.env.local` e compila i valori:

```bash
cp .env.example .env.local
```

| Variabile | Dove trovarla |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | stessa pagina (segreto, solo server) |
| `ANTHROPIC_API_KEY` | console Anthropic |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud → OAuth client |
| `RESEND_API_KEY` / `RESEND_FROM` | dashboard Resend |
| `CRON_SECRET` | stringa casuale (es. `openssl rand -hex 32`) |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` in locale |

### 3. Database
Nel SQL Editor di Supabase esegui la migration:

```
supabase/migrations/0001_init.sql
```

Crea tabelle, indici, trigger (profilo automatico, `updated_at`), le **RLS
policy** e il bucket Storage privato `documents`. In alternativa, con la
[Supabase CLI](https://supabase.com/docs/guides/cli): `supabase db push`.

### 4. Auth
- Supabase → Authentication → Providers: abilita **Email** e **Google**.
- Per Google, aggiungi il redirect URL di Supabase
  (`https://<project>.supabase.co/auth/v1/callback`) tra gli URI autorizzati del
  tuo client OAuth.

### 5. Google Calendar (opzionale)
Nel client OAuth di Google Cloud aggiungi come **Authorized redirect URI**:

```
http://localhost:3000/api/webhooks/google      (dev)
https://<tuo-dominio>/api/webhooks/google       (prod)
```

Scope richiesto: `https://www.googleapis.com/auth/calendar.events`.
L'utente collega il proprio calendario da **Profilo → Integrazioni**. Se non è
collegato, le scadenze si salvano comunque senza evento (degrado graceful).

### 6. Avvio

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # build di produzione
npm run typecheck  # tsc --noEmit
npm run lint
```

## Notifiche email (cron)

`GET /api/cron/reminders` invia i promemoria e marca come `overdue` le scadenze
passate. È protetto da `CRON_SECRET` (header `Authorization: Bearer <secret>`).
`vercel.json` lo schedula ogni giorno alle 08:00. Per testarlo in locale:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/reminders
```

Rispetta la preferenza `email_reminders` di ogni profilo e, per le scadenze
condivise, notifica tutti i membri del gruppo.

## Sicurezza & privacy
- **RLS** su tutte le tabelle: ogni utente vede solo le proprie scadenze o
  quelle condivise con un gruppo a cui appartiene.
- Lo Storage è **privato**; i documenti si servono via signed URL a scadenza.
- Il contenuto dei documenti **non viene mai loggato**.
- La service-role key è usata solo in contesti server fidati (cron, notifiche
  cross-utente, cancellazione account).
- `DELETE /api/account` cancella documenti Storage e tutti i record (GDPR).

## Note
- Il middleware Supabase gira su Edge Runtime: il warning di build su
  `process.version` proviene da `@supabase/ssr` ed è innocuo (è il pattern
  ufficiale Supabase).
- L'invito di un membro al gruppo richiede che l'invitato abbia già un account
  BillTracker (un flusso completo di invito via token è un'estensione futura).

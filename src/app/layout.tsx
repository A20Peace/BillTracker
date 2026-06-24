import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BillTracker — Gestione scadenze bollette",
  description:
    "Carica le tue bollette, estrai automaticamente importo e scadenza, sincronizza con Google Calendar e non perdere mai una scadenza.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1b5df5",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}

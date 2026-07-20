import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/content";

export const metadata: Metadata = {
  title: "Informativa privacy",
  description: "Informativa sul trattamento dei dati personali di R.G.R. Handmade.",
  alternates: { canonical: "/privacy-policy" },
};

const contactEmail = site.email;

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-warm-black px-5 py-14 text-ivory sm:px-8 sm:py-20">
      <article className="mx-auto max-w-3xl border border-gold/25 bg-[#171411] px-6 py-10 shadow-[0_34px_120px_rgba(0,0,0,0.32)] sm:px-12 sm:py-14">
        <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-light">R.G.R. Handmade</p>
        <h1 className="mt-4 font-serif text-5xl leading-none text-ivory sm:text-6xl">Informativa privacy</h1>
        <p className="mt-6 text-[15px] leading-7 text-ivory/72">
          Informativa resa ai sensi dell&apos;art. 13 del Regolamento (UE) 2016/679 (GDPR) per le richieste inviate dal sito.
        </p>

        <div className="mt-12 grid gap-9 text-[15px] leading-7 text-ivory/72">
          <section>
            <h2 className="font-serif text-3xl text-ivory">Titolare del trattamento</h2>
            <p>
              Il titolare del trattamento e {site.legalName}, P. IVA {site.vat}, con sede in {site.address.street}, {site.address.postalCode} {site.address.city}, {site.address.country}. Per informazioni o per esercitare i diritti privacy puoi scrivere a <a className="text-gold-light underline underline-offset-4" href={`mailto:${contactEmail}`}>{contactEmail}</a>.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-3xl text-ivory">Dati e finalita</h2>
            <p>
              Trattiamo nome, recapiti, eventuale azienda e il contenuto del messaggio per rispondere alla richiesta di informazioni o di appuntamento e per gestire i successivi contatti correlati.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-3xl text-ivory">Base giuridica e conferimento</h2>
            <p>
              La base giuridica e l&apos;esecuzione di misure precontrattuali adottate su richiesta dell&apos;interessato (art. 6, par. 1, lett. b GDPR) e, ove necessario, il legittimo interesse del titolare a gestire e tutelare le comunicazioni ricevute (art. 6, par. 1, lett. f GDPR). Il conferimento dei dati contrassegnati come obbligatori e necessario per inviare e gestire la richiesta; senza di essi non potremo rispondere.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-3xl text-ivory">Destinatari e trasferimenti</h2>
            <p>
              I dati sono trattati dal personale autorizzato e da fornitori che operano quali responsabili del trattamento, inclusi hosting, infrastruttura tecnica, gestione email e protezione anti-abuso. Se Cloudflare Turnstile e attivo, vengono trasmessi a Cloudflare i dati tecnici necessari alla verifica anti-bot. Eventuali trasferimenti verso Paesi fuori dallo Spazio economico europeo avvengono con le garanzie previste dal GDPR.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-3xl text-ivory">Conservazione e sicurezza</h2>
            <p>
              I messaggi sono conservati per il tempo necessario a gestire la richiesta e, comunque, non oltre 24 mesi dall&apos;ultima comunicazione, salvo obblighi di legge o necessita di tutela. Per prevenire abusi della form registriamo per un massimo di 48 ore un identificativo tecnico ottenuto tramite hash salato dell&apos;indirizzo IP, non l&apos;indirizzo IP in chiaro.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-3xl text-ivory">Diritti dell&apos;interessato</h2>
            <p>
              Puoi chiedere accesso, rettifica, cancellazione, limitazione, opposizione e portabilita dei dati nei casi previsti dagli artt. 15-22 GDPR, scrivendo al titolare. Hai inoltre diritto di proporre reclamo al <a className="text-gold-light underline underline-offset-4" href="https://www.garanteprivacy.it/" target="_blank" rel="noreferrer">Garante per la protezione dei dati personali</a>.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-3xl text-ivory">Nessun marketing dalla form</h2>
            <p>
              I dati inviati con questa form non sono usati per newsletter o comunicazioni commerciali. Qualsiasi futura attivita di marketing richiedera un consenso separato, facoltativo e revocabile.
            </p>
          </section>
        </div>

        <Link href="/" className="mt-12 inline-flex min-h-11 items-center rounded-full border border-gold px-6 py-3 font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-light transition-colors hover:bg-gold hover:text-warm-black">
          Torna al sito
        </Link>
      </article>
    </main>
  );
}

import Link from "next/link";
import {
  CalendarDays,
  FileX2,
  Folder,
  Home,
  Image as ImageIcon,
  LayoutGrid,
  Search
} from "lucide-react";

const orbitItems = [
  { icon: LayoutGrid, className: "not-found-orbit-item one", label: "Moduli" },
  { icon: ImageIcon, className: "not-found-orbit-item two", label: "Media" },
  { icon: Folder, className: "not-found-orbit-item three", label: "Archivio" },
  { icon: CalendarDays, className: "not-found-orbit-item four", label: "Calendario" }
];

export function VitrixNotFoundPage() {
  return (
    <main className="not-found-page" data-theme="light">
      <div className="not-found-haze" aria-hidden="true" />
      <section className="not-found-content" aria-labelledby="not-found-title">
        <div className="not-found-visual" aria-hidden="true">
          <div className="not-found-orbit-line left" />
          <div className="not-found-orbit-line right" />
          {orbitItems.map((item) => {
            const Icon = item.icon;
            return (
              <span className={item.className} key={item.label}>
                <Icon size={24} strokeWidth={2.2} />
              </span>
            );
          })}
          <div className="not-found-window">
            <div className="not-found-window-bar">
              <i />
              <i />
              <i />
            </div>
            <div className="not-found-dropzone">
              <FileX2 size={58} strokeWidth={1.8} />
            </div>
          </div>
        </div>

        <p className="not-found-code">404</p>
        <h1 id="not-found-title">Pagina non trovata</h1>
        <p className="not-found-copy">
          La pagina che stai cercando non esiste o è stata spostata.
        </p>

        <div className="not-found-actions" aria-label="Azioni pagina non trovata">
          <Link className="not-found-primary" href="/admin">
            <Home size={18} strokeWidth={2.2} />
            Torna alla dashboard
          </Link>
          <Link className="not-found-secondary" href="/">
            <Search size={18} strokeWidth={2.2} />
            Esplora contenuti
          </Link>
        </div>
      </section>
    </main>
  );
}

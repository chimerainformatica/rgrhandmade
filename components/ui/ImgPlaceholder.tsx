/** Placeholder via placehold.co — sostituire con foto reali quando disponibili */

const CATALOGUE_BG = "B89254";
const CATALOGUE_FG = "ffffff";
const NEWS_BG = "44403c";
const NEWS_FG = "f8f2e9";
const ATELIER_BG = "6b5342";
const ATELIER_FG = "f8f2e9";

function PlaceholderWrapper({ label, caption, src, alt }: { label: string; caption: string; src: string; alt: string }) {
  return (
    <div className="relative w-full h-full">
      <img src={src} alt={alt} className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute left-0 right-0 bottom-0 z-10 bg-warm-black/65 backdrop-blur-sm px-3 py-3 text-warm-white">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] opacity-90">{label}</div>
        <div className="mt-1 text-[12px] leading-[1.4] text-ivory/85">{caption}</div>
      </div>
    </div>
  );
}

// 3:4 portrait — catalogue cards
export function CataloguePlaceholder({ ref: collRef, name }: { ref: string; name: string }) {
  return (
    <PlaceholderWrapper
      src={`https://placehold.co/500x500/${CATALOGUE_BG}/${CATALOGUE_FG}?text=${encodeURIComponent(`${collRef} · ${name}`)}`}
      alt={name}
      label="500x500"
      caption={name}
    />
  );
}

// 4:5 portrait — news regular cards
// 16:9 landscape — news feature card
export function NewsPlaceholder({ category, title, feature = false }: { category: string; title: string; feature?: boolean }) {
  return (
    <PlaceholderWrapper
      src={`https://placehold.co/500x500/${NEWS_BG}/${NEWS_FG}?text=${encodeURIComponent(`${category} · ${title}`)}`}
      alt={title}
      label="500x500"
      caption={feature ? `${category} — Feature placeholder` : `${category} — Placeholder immagine`}
    />
  );
}

// Atelier split image
export function AtelierPlaceholder() {
  return (
    <PlaceholderWrapper
      src={`https://placehold.co/500x500/${ATELIER_BG}/${ATELIER_FG}?text=Atelier`}
      alt="Atelier RGR"
      label="500x500"
      caption="Atelier placeholder"
    />
  );
}

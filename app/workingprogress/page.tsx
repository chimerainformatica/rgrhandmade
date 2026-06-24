export const metadata = {
  title: "Aggiornamento in corso",
  robots: "noindex,nofollow"
};

export default function WorkingProgressPage() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "Sito";

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0a0a0a",
        color: "#f5f5f5",
        fontFamily: "system-ui, sans-serif",
        textAlign: "center",
        padding: "2rem"
      }}
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        style={{ marginBottom: "1.5rem", opacity: 0.7 }}
      >
        <circle cx="24" cy="24" r="22" stroke="#a0a0a0" strokeWidth="2" />
        <path d="M24 12v12l8 4" stroke="#a0a0a0" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <h1
        style={{
          fontSize: "1.25rem",
          fontWeight: 600,
          letterSpacing: "0.05em",
          marginBottom: "0.75rem",
          color: "#e0e0e0"
        }}
      >
        {siteName}
      </h1>
      <p style={{ color: "#888", fontSize: "0.95rem", maxWidth: "360px", lineHeight: 1.6 }}>
        Il sito è momentaneamente in manutenzione per un aggiornamento del sistema.
        <br />
        Sarà di nuovo disponibile a breve.
      </p>
      <p style={{ marginTop: "2rem", fontSize: "0.75rem", color: "#555", letterSpacing: "0.08em" }}>
        VITRIX CMS · CHIMERA INFORMATICA
      </p>
    </main>
  );
}

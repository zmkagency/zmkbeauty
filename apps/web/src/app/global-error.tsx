"use client";

/**
 * Catches errors thrown in the root layout itself. Next.js requires this
 * boundary to render its own <html> and <body>. Keep it minimal so it works
 * even when Tailwind/global styles failed to load.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="tr">
      <body style={{ fontFamily: "system-ui, -apple-system, sans-serif", margin: 0, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
        <div style={{ textAlign: "center", padding: "24px", maxWidth: 400 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111827", marginBottom: 8 }}>
            Uygulama hatası
          </h1>
          <p style={{ color: "#6b7280", marginBottom: 24 }}>
            Uygulama başlatılamadı. Lütfen sayfayı yenileyin.
          </p>
          {error?.digest && (
            <p style={{ fontSize: 12, fontFamily: "monospace", color: "#9ca3af", marginBottom: 24 }}>
              {error.digest}
            </p>
          )}
          <button
            onClick={() => reset()}
            style={{ padding: "10px 20px", background: "#e11d48", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}
          >
            Yenile
          </button>
        </div>
      </body>
    </html>
  );
}

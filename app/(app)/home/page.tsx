export default function HomePage() {
  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl uppercase tracking-wide" style={{ color: "var(--ink)" }}>
        Home
      </h1>
      <p className="mt-2 text-sm" style={{ color: "var(--ink-2)" }}>
        Próximos jogos e countdown — em breve.
      </p>
    </div>
  );
}

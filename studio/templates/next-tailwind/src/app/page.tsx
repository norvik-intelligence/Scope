// Baseline page — replaced by the design agent with a premium, industry-styled
// landing page. Kept minimal and buildable so the project is valid from the start.

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="text-center">
        <p className="text-sm uppercase tracking-widest text-neutral-500">Scope Studio</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Bereit für den Neuaufbau.
        </h1>
        <p className="mt-3 text-neutral-600">
          Diese Startseite wird durch den Design-Agenten ersetzt.
        </p>
      </div>
    </main>
  );
}

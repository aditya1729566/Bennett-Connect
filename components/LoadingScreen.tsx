export function LoadingScreen() {
  return (
    <div className="page-mesh min-h-screen bg-[#f5f7fb] px-3 py-5 text-zinc-950 sm:px-4 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 h-14 rounded-2xl border border-zinc-200 bg-white/80 shadow-sm" />
        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <aside className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="skeleton h-3 w-28 rounded-full" />
            <div className="skeleton mt-4 h-8 w-4/5 rounded-full" />
            <div className="skeleton mt-3 h-4 w-full rounded-full" />
            <div className="skeleton mt-2 h-4 w-3/4 rounded-full" />
            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="skeleton h-16 rounded-lg" />
              <div className="skeleton h-16 rounded-lg" />
              <div className="skeleton h-16 rounded-lg" />
            </div>
          </aside>
          <section className="space-y-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex gap-3">
                  <div className="skeleton h-16 w-16 shrink-0 rounded-full" />
                  <div className="flex-1">
                    <div className="skeleton h-5 w-2/3 rounded-full" />
                    <div className="skeleton mt-3 h-4 w-1/2 rounded-full" />
                    <div className="skeleton mt-4 h-4 w-full rounded-full" />
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <div className="skeleton h-8 w-24 rounded-full" />
                  <div className="skeleton h-8 w-28 rounded-full" />
                  <div className="skeleton h-8 w-20 rounded-full" />
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}

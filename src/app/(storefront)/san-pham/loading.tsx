export default function ProductsLoading() {
  return (
    <div className="overflow-x-clip bg-background">
      <header className="site-shell pt-6 pb-2 sm:pt-7 sm:pb-3 lg:pt-8 lg:pb-3">
        <div className="border-b border-border/60 pb-3 sm:pb-4">
          <div className="h-3 w-32 animate-pulse rounded bg-surface" />
          <div className="mt-2 h-8 w-52 animate-pulse rounded bg-surface sm:h-9" />
        </div>
      </header>
      <section className="site-shell pt-4 pb-12 sm:pt-5 sm:pb-16 lg:pt-6 lg:pb-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-x-10 lg:gap-x-14 xl:gap-x-16">
          {[0, 1].map((idx) => (
            <div key={idx} className="space-y-4">
              <div className="aspect-[5/4] w-full animate-pulse border border-border/40 bg-[#F4EFE6]" />
              <div className="h-3 w-40 animate-pulse rounded bg-surface" />
              <div className="h-7 w-4/5 animate-pulse rounded bg-surface" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-surface" />
              <div className="flex gap-2 pt-2">
                <div className="h-9 w-20 animate-pulse bg-surface" />
                <div className="h-9 w-20 animate-pulse bg-surface" />
              </div>
              <div className="flex gap-2.5 pt-2">
                <div className="h-11 flex-1 animate-pulse bg-surface" />
                <div className="h-11 flex-1 animate-pulse bg-surface" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}


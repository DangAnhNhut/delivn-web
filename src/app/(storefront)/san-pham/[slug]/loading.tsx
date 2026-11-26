export default function ProductDetailLoading() {
  return (
    <div className="overflow-x-clip bg-background pb-20 sm:pb-24 lg:pb-32">
      <div className="site-shell">
        <div className="py-5 sm:py-7">
          <div className="h-3.5 w-36 animate-pulse rounded bg-surface" />
        </div>
        <div className="grid grid-cols-1 gap-8 border-t border-border pt-7 sm:gap-12 sm:pt-9 lg:grid-cols-12 lg:gap-12 lg:pt-12 xl:gap-16">
          <div className="lg:col-span-6 xl:col-span-7">
            <div className="aspect-square w-full animate-pulse border border-border/40 bg-[#F4EFE6]" />
          </div>
          <div className="space-y-4 lg:col-span-6 xl:col-span-5">
            <div className="h-3 w-32 animate-pulse rounded bg-surface" />
            <div className="h-10 w-5/6 animate-pulse rounded bg-surface" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-surface" />
            <div className="grid grid-cols-2 gap-3 pt-4">
              <div className="h-16 animate-pulse bg-surface" />
              <div className="h-16 animate-pulse bg-surface" />
            </div>
            <div className="h-10 w-36 animate-pulse bg-surface" />
            <div className="flex gap-2.5 pt-2">
              <div className="h-12 flex-1 animate-pulse bg-surface" />
              <div className="h-12 flex-1 animate-pulse bg-surface" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


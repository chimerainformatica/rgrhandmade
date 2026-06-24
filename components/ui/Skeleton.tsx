export function CatalogueHeaderSkeleton() {
  return (
    <div className="max-w-[640px]">
      <div className="flex items-center gap-3.5 mb-6">
        <div className="h-px w-8 skeleton" />
        <div className="h-3 w-24 skeleton rounded" />
      </div>
      <div className="h-[clamp(28px,5vw,68px)] w-4/5 skeleton rounded mb-3 mt-4" />
      <div className="h-[clamp(28px,5vw,68px)] w-full skeleton rounded mb-4" />
      <div className="h-4 w-full skeleton rounded mt-2" />
      <div className="h-4 w-3/4 skeleton rounded mt-2" />
    </div>
  );
}

export const CollectionHeaderSkeleton = CatalogueHeaderSkeleton;

export function CatalogueSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-4 gap-x-4 gap-y-5 max-[1100px]:grid-cols-3 max-[768px]:grid-cols-2 max-[420px]:grid-cols-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="aspect-[3/4] skeleton rounded-sm" />
          <div className="h-5 w-3/4 skeleton rounded" />
          <div className="h-3 w-1/2 skeleton rounded" />
          <div className="h-3 w-1/4 skeleton rounded" />
        </div>
      ))}
    </div>
  );
}

export const CollectionSkeleton = CatalogueSkeleton;

export function CatalogueTabsSkeleton() {
  return (
    <div className="flex items-center gap-2 min-w-max">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`h-10 skeleton rounded-full shrink-0 ${i === 0 ? "w-20" : i === 1 ? "w-24" : "w-28"}`}
        />
      ))}
    </div>
  );
}

export const CollectionTabsSkeleton = CatalogueTabsSkeleton;

export function CataloguePreviewSkeleton() {
  return (
    <div className="grid w-full max-w-[980px] grid-cols-[minmax(0,0.95fr)_minmax(320px,0.75fr)] overflow-hidden border border-white/14 bg-ivory shadow-[0_34px_90px_rgba(0,0,0,0.42)] max-[820px]:max-w-[560px] max-[820px]:grid-cols-1">
      <div className="relative min-h-[540px] bg-[#d5cfc8] max-[820px]:min-h-[360px] max-[520px]:min-h-[300px]">
        <div className="absolute inset-0 skeleton" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-5 left-5 h-8 w-24 rounded-full skeleton" />
      </div>
      <div className="flex flex-col justify-center px-10 py-12 max-[520px]:px-6 max-[520px]:py-8">
        <div className="mb-6 flex items-center gap-3.5">
          <div className="h-px w-8 skeleton" />
          <div className="h-3 w-24 skeleton rounded" />
        </div>
        <div className="h-10 w-4/5 skeleton rounded mb-3" />
        <div className="h-10 w-2/3 skeleton rounded mb-2" />
        <div className="h-4 w-full skeleton rounded mt-4" />
        <div className="h-4 w-11/12 skeleton rounded mt-2" />
        <div className="h-4 w-3/4 skeleton rounded mt-2" />
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <div className="h-9 w-32 skeleton rounded-full" />
          <div className="h-9 w-28 skeleton rounded-full" />
        </div>
      </div>
    </div>
  );
}

export const CollectionPreviewSkeleton = CataloguePreviewSkeleton;

export function PreviewModalSkeleton() {
  return (
    <div className="grid w-full max-w-[1060px] grid-cols-[1.08fr_0.92fr] overflow-hidden rounded-[22px] border border-white/50 bg-ivory shadow-[0_44px_120px_rgba(40,30,18,0.4)] max-[860px]:max-w-[560px] max-[860px]:grid-cols-1">
      <div className="flex flex-col gap-7 p-8 max-[520px]:gap-5 max-[520px]:p-5">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[16px] skeleton" />
        <div className="flex items-start justify-center gap-8 px-6 max-[520px]:gap-5 max-[520px]:px-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2.5">
              <div className="h-[60px] w-[60px] rounded-full skeleton max-[520px]:h-[50px] max-[520px]:w-[50px]" />
              <div className="h-3 w-14 skeleton rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col items-center justify-center border-l border-hairline px-12 py-14 text-center max-[860px]:border-l-0 max-[860px]:border-t max-[860px]:px-8 max-[860px]:py-10 max-[520px]:px-6 max-[520px]:py-8">
        <div className="flex items-center gap-2.5" aria-hidden="true">
          <div className="h-px w-8 skeleton" />
          <div className="h-3 w-3 skeleton rounded-sm" />
          <div className="h-px w-8 skeleton" />
        </div>
        <div className="mt-5 h-3 w-24 skeleton rounded" />
        <div className="mt-3 h-10 w-3/4 skeleton rounded" />
        <div className="my-6 h-px w-12 skeleton" />
        <div className="h-4 w-full skeleton rounded" />
        <div className="h-4 w-4/5 skeleton rounded mt-2" />
        <div className="mt-9 h-11 w-36 skeleton rounded" />
      </div>
    </div>
  );
}

export function NewsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-x-5 gap-y-6 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
      {/* Feature card */}
      <div className="col-span-3 max-[900px]:col-span-2 max-[560px]:col-span-1 grid grid-cols-[1.5fr_1fr] max-[900px]:grid-cols-1 border border-white/10">
        <div className="aspect-video skeleton" />
        <div className="p-12 flex flex-col gap-4 bg-white/[0.04]">
          <div className="h-3 w-20 skeleton rounded" />
          <div className="h-8 w-3/4 skeleton rounded" />
          <div className="h-3 w-16 skeleton rounded mt-auto" />
        </div>
      </div>
      {/* Regular cards */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-4">
          <div className="aspect-[4/5] skeleton" />
          <div className="h-3 w-20 skeleton rounded" />
          <div className="h-6 w-3/4 skeleton rounded" />
          <div className="h-3 w-16 skeleton rounded" />
        </div>
      ))}
    </div>
  );
}

export function MediaSkeleton() {
  return (
    <section className="space-y-6" aria-busy="true" aria-label="Medya verileri yükleniyor">
      <div className="space-y-3">
        <SkeletonBlock className="h-11 w-64 rounded-xl" />
        <SkeletonBlock className="h-5 w-full max-w-xl rounded-lg" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 2xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, index) => (
          <SkeletonBlock className="h-28 rounded-2xl" key={index} />
        ))}
      </div>

      <SkeletonBlock className="h-96 rounded-2xl" />
      <SkeletonBlock className="h-40 rounded-2xl" />
      <SkeletonBlock className="h-96 rounded-2xl" />
    </section>
  )
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse bg-surface-2 ${className}`} />
}

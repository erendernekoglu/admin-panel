export function WeatherSkeleton() {
  return (
    <section className="space-y-6" aria-busy="true" aria-label="Hava durumu verileri yükleniyor">
      <div className="space-y-3">
        <SkeletonBlock className="h-11 w-56 rounded-xl" />
        <SkeletonBlock className="h-5 w-full max-w-xl rounded-lg" />
      </div>

      <SkeletonBlock className="h-24 rounded-2xl" />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock className="h-28 rounded-2xl" key={index} />
        ))}
      </div>

      <SkeletonBlock className="h-96 rounded-2xl" />
      <SkeletonBlock className="h-96 rounded-2xl" />
    </section>
  )
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`animate-pulse bg-surface-2 ${className}`} />
}

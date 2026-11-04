export function PageLoader() {
  return (
    <div aria-label="Sayfa yükleniyor" className="flex min-h-64 items-center justify-center" role="status">
      <span className="relative flex size-3">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-signal/50" />
        <span className="relative inline-flex size-3 rounded-full bg-signal" />
      </span>
    </div>
  )
}

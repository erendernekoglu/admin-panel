import type { ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "../../atoms/Button"

interface PaginationProps {
  /** 1-based page number shown between the buttons. */
  page: number
  /** Total page count when known; omitted for cursor-based lists. */
  pageCount?: number
  hasPrevious: boolean
  hasNext: boolean
  onPrevious: () => void
  onNext: () => void
  isLoading?: boolean
  summary?: ReactNode
}

export function Pagination({
  hasNext,
  hasPrevious,
  isLoading = false,
  onNext,
  onPrevious,
  page,
  pageCount,
  summary,
}: PaginationProps) {
  return (
    <nav
      aria-label="Sayfalama"
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p aria-live="polite" className="text-sm text-muted">
        {summary}
      </p>
      <div className="flex items-center gap-2">
        <Button
          disabled={!hasPrevious || isLoading}
          onClick={onPrevious}
          size="sm"
          variant="secondary"
        >
          <ChevronLeft aria-hidden="true" size={14} />
          Önceki
        </Button>
        <span className="min-w-16 text-center text-xs font-semibold tabular-nums text-ink-soft">
          {pageCount ? `${page} / ${pageCount}` : `Sayfa ${page}`}
        </span>
        <Button
          disabled={!hasNext || isLoading}
          onClick={onNext}
          size="sm"
          variant="secondary"
        >
          Sonraki
          <ChevronRight aria-hidden="true" size={14} />
        </Button>
      </div>
    </nav>
  )
}

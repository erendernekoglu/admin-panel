import { useState } from "react"

/**
 * Slices an in-memory list into pages. Returns to the first page whenever the
 * list itself changes (new filter, search or data), without an effect.
 */
export function useClientPagination<T>(items: T[], pageSize: number) {
  const [state, setState] = useState({ source: items, page: 0 })
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const page = state.source === items ? Math.min(state.page, pageCount - 1) : 0
  const start = page * pageSize

  return {
    page,
    pageCount,
    pageItems: items.slice(start, start + pageSize),
    start,
    isPaginated: items.length > pageSize,
    hasPrevious: page > 0,
    hasNext: page < pageCount - 1,
    goPrevious: () => setState({ source: items, page: Math.max(0, page - 1) }),
    goNext: () => setState({ source: items, page: Math.min(pageCount - 1, page + 1) }),
  }
}

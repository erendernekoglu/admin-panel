import type {
  BucketPoint,
  DateRange,
  DualBucketPoint,
  Granularity,
} from "../../features/analytics/types"

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function startOfWeek(date: Date) {
  const next = startOfDay(date)
  const day = next.getDay()
  const diff = day === 0 ? -6 : 1 - day
  next.setDate(next.getDate() + diff)
  return next
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function addWeeks(date: Date, weeks: number) {
  return addDays(date, weeks * 7)
}

function addHours(date: Date, hours: number) {
  const next = new Date(date)
  next.setHours(next.getHours() + hours)
  return next
}

function differenceInCalendarDays(later: Date, earlier: Date) {
  const msPerDay = 86_400_000
  return Math.round(
    (startOfDay(later).getTime() - startOfDay(earlier).getTime()) / msPerDay,
  )
}

function isSameDay(a: Date, b: Date) {
  return startOfDay(a).getTime() === startOfDay(b).getTime()
}

function formatBucketDate(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
  }).format(date)
}

export function autoGranularity(since: Date, until: Date): Granularity {
  return differenceInCalendarDays(until, since) <= 14 ? "day" : "week"
}

export function createDateRange(days = 7): DateRange {
  const until = new Date()
  const since = days === 1
    ? addHours(until, -24)
    : addDays(startOfDay(until), -(days - 1))

  return {
    since,
    until,
    granularity: days === 1 ? "hour" : autoGranularity(since, until),
  }
}

export function bucketByHour<T>(
  items: T[],
  getDate: (item: T) => Date | null,
  range: DateRange,
): BucketPoint[] {
  const bucketDuration = 3_600_000
  const buckets = Array.from({ length: 24 }, (_, index) => {
    const dateObj = addHours(range.since, index)
    return {
      date: new Intl.DateTimeFormat("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(dateObj),
      dateObj,
      count: 0,
    }
  })

  items.forEach((item) => {
    const date = getDate(item)
    if (!date || date < range.since || date > range.until) return
    const index = Math.min(
      23,
      Math.floor((date.getTime() - range.since.getTime()) / bucketDuration),
    )
    if (index >= 0) buckets[index].count += 1
  })

  return buckets
}

export function bucketByDay<T>(
  items: T[],
  getDate: (item: T) => Date | null,
  range: DateRange,
): BucketPoint[] {
  const dayCount = differenceInCalendarDays(range.until, range.since) + 1
  const buckets = Array.from({ length: dayCount }, (_, index) => {
    const dateObj = addDays(startOfDay(range.since), index)
    return { date: formatBucketDate(dateObj), dateObj, count: 0 }
  })

  items.forEach((item) => {
    const date = getDate(item)
    if (!date) return
    const index = buckets.findIndex((bucket) => isSameDay(bucket.dateObj, date))
    if (index >= 0) buckets[index].count += 1
  })

  return buckets
}

export function bucketByWeek<T>(
  items: T[],
  getDate: (item: T) => Date | null,
  range: DateRange,
): BucketPoint[] {
  const buckets: BucketPoint[] = []
  let cursor = startOfWeek(range.since)

  while (cursor <= range.until) {
    buckets.push({
      date: formatBucketDate(cursor),
      dateObj: cursor,
      count: 0,
    })
    cursor = addWeeks(cursor, 1)
  }

  items.forEach((item) => {
    const date = getDate(item)
    if (!date) return
    const index = buckets.findLastIndex((bucket) => date >= bucket.dateObj)
    if (index >= 0) buckets[index].count += 1
  })

  return buckets
}

export function bucketByGranularity<T>(
  items: T[],
  getDate: (item: T) => Date | null,
  range: DateRange,
) {
  if (range.granularity === "hour") return bucketByHour(items, getDate, range)
  if (range.granularity === "day") return bucketByDay(items, getDate, range)
  return bucketByWeek(items, getDate, range)
}

export function dualBucketByGranularity<T>(
  items: T[],
  getDate: (item: T) => Date | null,
  classifyA: (item: T) => boolean,
  classifyB: (item: T) => boolean,
  range: DateRange,
): DualBucketPoint[] {
  const aBuckets = bucketByGranularity(
    items.filter(classifyA),
    getDate,
    range,
  )
  const bBuckets = bucketByGranularity(
    items.filter(classifyB),
    getDate,
    range,
  )

  return aBuckets.map((bucket, index) => ({
    ...bucket,
    a: bucket.count,
    b: bBuckets[index]?.count ?? 0,
  }))
}

export function unionUniqueUserIds(
  ...idLists: Array<Array<string | undefined | null>>
) {
  const result = new Set<string>()
  idLists.forEach((list) => {
    list.forEach((id) => {
      if (id) result.add(id)
    })
  })
  return result
}

export function comparePrevPeriod(currentCount: number, prevCount: number) {
  if (prevCount === 0 && currentCount === 0) {
    return { text: "No change", type: "neutral" as const }
  }
  if (prevCount === 0) {
    return { text: `+${currentCount} new`, type: "positive" as const }
  }

  const percentage = ((currentCount - prevCount) / prevCount) * 100
  const rounded = Math.round(Math.abs(percentage))

  if (percentage > 0) return { text: `+${rounded}%`, type: "positive" as const }
  if (percentage < 0) return { text: `-${rounded}%`, type: "negative" as const }
  return { text: "No change", type: "neutral" as const }
}

export function countByKey<T>(
  items: T[],
  getKey: (item: T) => string | undefined,
) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = getKey(item)
    if (key) acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {})
}

export function topN(map: Record<string, number>, n: number) {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count }))
}

export function prevPeriodStart(since: Date, until: Date) {
  const days = differenceInCalendarDays(until, since) + 1
  return addDays(since, -days)
}

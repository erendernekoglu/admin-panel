import { useMemo, useState } from "react"
import { Coins } from "lucide-react"

import { Card } from "../components/molecules/Card"
import { CreditTransactionsTable } from "../features/credits/components/CreditTransactionsTable"
import type { CreditTypeFilter } from "../features/credits/components/CreditTransactionsTable"
import { CreditTrendChart } from "../features/credits/components/CreditTrendChart"
import type { CreditTrendPoint } from "../features/credits/components/CreditTrendChart"
import { CreditsErrorState } from "../features/credits/components/CreditsErrorState"
import { CreditsHeader } from "../features/credits/components/CreditsHeader"
import { CreditsKpiGrid } from "../features/credits/components/CreditsKpiGrid"
import { CreditsSkeleton } from "../features/credits/components/CreditsSkeleton"
import { useCreditData } from "../features/credits/hooks/useCreditData"
import type { CreditTransaction } from "../features/credits/types"
import type { DateRange } from "../features/analytics/types"
import type { DashboardRangeDays } from "../features/dashboard/types"
import { createDateRange } from "../lib/analytics/analyticsUtils"
import { isCreditLoad, isCreditSpend } from "../lib/credits/creditUtils"
import { toDate } from "../features/shared/format"

function getCreditCategory(transaction: CreditTransaction): CreditTypeFilter {
  const type = transaction.type.toLowerCase()
  if (isCreditLoad(type, transaction.amount)) return "load"
  if (["refund", "revoke"].includes(type)) return "other"
  if (isCreditSpend(type, transaction.amount)) return "spend"
  return "other"
}

function matchesSearch(transaction: CreditTransaction, search: string) {
  const query = search.trim().toLowerCase()
  if (!query) return true

  const email =
    typeof transaction.details?.email === "string"
      ? transaction.details.email
      : undefined

  return [transaction.userId, transaction.displayName, email]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(query))
}

function buildCreditTrendData(
  transactions: CreditTransaction[],
  range: DateRange,
): CreditTrendPoint[] {
  const bucketCount =
    range.granularity === "day"
      ? Math.round(
          (range.until.getTime() - range.since.getTime()) / 86_400_000,
        ) + 1
      : Math.ceil(
          (range.until.getTime() - range.since.getTime()) /
            (86_400_000 * 7),
        ) + 1

  const buckets = Array.from({ length: bucketCount }, (_, index) => {
    const date = new Date(range.since)
    date.setDate(
      range.since.getDate() + index * (range.granularity === "day" ? 1 : 7),
    )
    return {
      date,
      label: new Intl.DateTimeFormat("tr-TR", {
        day: "numeric",
        month: "short",
      }).format(date),
      load: 0,
      spend: 0,
    }
  })

  transactions.forEach((transaction) => {
    const date = toDate(transaction.createdAt)
    if (!date) return

    const index =
      range.granularity === "day"
        ? Math.round((date.getTime() - range.since.getTime()) / 86_400_000)
        : Math.floor((date.getTime() - range.since.getTime()) / (86_400_000 * 7))

    const bucket = buckets[index]
    if (!bucket) return

    if (isCreditLoad(transaction.type, transaction.amount)) {
      bucket.load += transaction.amount
      return
    }

    if (isCreditSpend(transaction.type, transaction.amount)) {
      bucket.spend += Math.abs(transaction.amount)
    }
  })

  return buckets.map((bucket) => ({
    date: bucket.label,
    load: bucket.load,
    spend: bucket.spend,
  }))
}

export default function CreditsPage() {
  const [rangeDays, setRangeDays] = useState<DashboardRangeDays>(30)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<CreditTypeFilter>("all")
  const range = useMemo(() => createDateRange(rangeDays), [rangeDays])
  const { data, error, isError, isPending } = useCreditData(range)

  const transactions = useMemo(() => data ?? [], [data])

  const metrics = useMemo(() => {
    return transactions.reduce(
      (acc, transaction) => {
        if (isCreditLoad(transaction.type, transaction.amount)) {
          acc.totalLoad += transaction.amount
        }

        if (isCreditSpend(transaction.type, transaction.amount)) {
          acc.totalSpend += Math.abs(transaction.amount)
        }

        acc.netMovement += transaction.amount
        acc.transactionCount += 1
        return acc
      },
      {
        netMovement: 0,
        totalLoad: 0,
        totalSpend: 0,
        transactionCount: 0,
      },
    )
  }, [transactions])

  const trendData = useMemo(
    () => buildCreditTrendData(transactions, range),
    [transactions, range],
  )

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const category = getCreditCategory(transaction)
      const matchesType = typeFilter === "all" || category === typeFilter
      return matchesType && matchesSearch(transaction, search)
    })
  }, [transactions, search, typeFilter])

  const isEmpty = transactions.length === 0
  const hasTrend = trendData.some((point) => point.load > 0 || point.spend > 0)

  return (
    <section className="space-y-6">
      <CreditsHeader onRangeChange={setRangeDays} rangeDays={rangeDays} />

      {isPending ? (
        <CreditsSkeleton />
      ) : isError ? (
        <CreditsErrorState error={error} />
      ) : isEmpty ? (
        <Card className="flex flex-col items-center px-6 py-16 text-center" tone="quiet">
          <Coins aria-hidden="true" className="size-8 text-muted" />
          <h2 className="mt-3 text-base font-semibold text-ink">
            Bu aralıkta kredi hareketi yok
          </h2>
          <p className="mt-1 max-w-md text-sm text-ink-soft">
            Seçili tarih aralığında yükleme veya harcama kaydı bulunamadı.
            Yukarıdan daha geniş bir aralık seçin.
          </p>
        </Card>
      ) : (
        <>
          <CreditsKpiGrid
            netMovement={metrics.netMovement}
            totalLoad={metrics.totalLoad}
            totalSpend={metrics.totalSpend}
            transactionCount={metrics.transactionCount}
          />

          <CreditTrendChart data={trendData} empty={!hasTrend} />

          <CreditTransactionsTable
            onSearchChange={setSearch}
            onTypeFilterChange={setTypeFilter}
            search={search}
            totalCount={transactions.length}
            transactions={filteredTransactions}
            typeFilter={typeFilter}
          />
        </>
      )}
    </section>
  )
}

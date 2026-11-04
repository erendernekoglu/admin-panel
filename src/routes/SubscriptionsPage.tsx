import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, Crown } from "lucide-react"

import { Card } from "../components/molecules/Card"
import { SubscriptionDistributionChart } from "../features/subscriptions/components/SubscriptionDistributionChart"
import type { SubscriptionDistributionPoint } from "../features/subscriptions/components/SubscriptionDistributionChart"
import { SubscriptionsErrorState } from "../features/subscriptions/components/SubscriptionsErrorState"
import { SubscriptionsHeader } from "../features/subscriptions/components/SubscriptionsHeader"
import { SubscriptionsKpiGrid } from "../features/subscriptions/components/SubscriptionsKpiGrid"
import { SubscriptionsSkeleton } from "../features/subscriptions/components/SubscriptionsSkeleton"
import { SubscriptionsTable } from "../features/subscriptions/components/SubscriptionsTable"
import type {
  SubscriptionPlanFilter,
  SubscriptionStatusFilter,
} from "../features/subscriptions/components/SubscriptionsTable"
import { useSubscriptionData } from "../features/subscriptions/hooks/useSubscriptionData"
import type { SubscriptionRecord } from "../features/subscriptions/types"
import {
  fetchUserPlanCounts,
  fetchUsersByIds,
  type UserPlanCounts,
} from "../features/users/services/userService"
import type { AdminUser } from "../features/users/types"
import { toDate } from "../features/shared/format"

function getRecordPlan(record: SubscriptionRecord): SubscriptionPlanFilter {
  const value = `${record.productId} ${record.basePlanId}`.toLowerCase()
  if (value.includes("premium")) return "premium"
  if (value.includes("pro")) return "pro"
  if (value.includes("free")) return "free"
  return "all"
}

function getRecordStatus(record: SubscriptionRecord): SubscriptionStatusFilter {
  const status = record.status.toLowerCase()
  const expiryDate = toDate(record.expiryTime)
  const isExpired = expiryDate ? expiryDate.getTime() < Date.now() : false

  if (record.isActive && !isExpired && !record.wasRevoked) return "active"
  if (status.includes("cancel") || record.wasRevoked) return "cancelled"
  if (status.includes("expire") || isExpired) return "expired"
  return "unknown"
}

function matchesSearch(
  record: SubscriptionRecord,
  usersById: Map<string, AdminUser>,
  search: string,
) {
  const query = search.trim().toLowerCase()
  if (!query) return true

  const user = usersById.get(record.userId)

  return [
    record.userId,
    record.displayName,
    record.email,
    user?.displayName,
    user?.email,
  ]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(query))
}

function enrichRecords(
  records: SubscriptionRecord[],
  usersById: Map<string, AdminUser>,
) {
  return records.map((record) => {
    const user = usersById.get(record.userId)
    return {
      ...record,
      displayName: record.displayName ?? user?.displayName,
      email: record.email ?? user?.email,
    }
  })
}

function buildDistribution(
  counts: UserPlanCounts | undefined,
): SubscriptionDistributionPoint[] {
  if (!counts) return []
  return [
    { name: "Ücretsiz", users: counts.free },
    { name: "Pro", users: counts.pro },
    { name: "Premium", users: counts.premium },
    ...(counts.unassigned > 0 ? [{ name: "Plan yok", users: counts.unassigned }] : []),
  ]
}

export default function SubscriptionsPage() {
  const [search, setSearch] = useState("")
  const [planFilter, setPlanFilter] = useState<SubscriptionPlanFilter>("all")
  const [statusFilter, setStatusFilter] =
    useState<SubscriptionStatusFilter>("all")
  const subscriptionsQuery = useSubscriptionData()
  const planCountsQuery = useQuery({
    queryKey: ["admin", "users", "planCounts"],
    queryFn: fetchUserPlanCounts,
  })

  const subscriptions = useMemo(
    () => subscriptionsQuery.data ?? [],
    [subscriptionsQuery.data],
  )
  // Only owners whose record lacks a name or e-mail need a profile read.
  const ownerIds = useMemo(
    () =>
      [
        ...new Set(
          subscriptions
            .filter((record) => record.userId && (!record.displayName || !record.email))
            .map((record) => record.userId),
        ),
      ].sort(),
    [subscriptions],
  )
  const ownersQuery = useQuery({
    queryKey: ["admin", "users", "byIds", ownerIds],
    queryFn: () => fetchUsersByIds(ownerIds),
    enabled: subscriptionsQuery.isSuccess,
  })
  const users = useMemo(() => ownersQuery.data ?? [], [ownersQuery.data])
  const planCounts = planCountsQuery.data

  const usersById = useMemo(
    () => new Map(users.map((user) => [user.uid, user])),
    [users],
  )

  const enrichedSubscriptions = useMemo(
    () => enrichRecords(subscriptions, usersById),
    [subscriptions, usersById],
  )

  const metrics = useMemo(() => {
    const premiumUsers = planCounts?.premium ?? 0
    const proUsers = planCounts?.pro ?? 0
    const freeUsers = planCounts?.free ?? 0
    const activeSubscriptions = subscriptions.filter(
      (record) => getRecordStatus(record) === "active",
    ).length
    const cancelledOrExpired = subscriptions.filter((record) =>
      ["cancelled", "expired"].includes(getRecordStatus(record)),
    ).length

    return {
      activeSubscriptions,
      cancelledOrExpired,
      freeUsers,
      premiumUsers,
      proUsers,
      totalRecords: subscriptions.length,
    }
  }, [planCounts, subscriptions])

  const distributionData = useMemo(() => buildDistribution(planCounts), [planCounts])

  const filteredSubscriptions = useMemo(() => {
    return enrichedSubscriptions.filter((record) => {
      const plan = getRecordPlan(record)
      const status = getRecordStatus(record)
      const matchesPlan = planFilter === "all" || plan === planFilter
      const matchesStatus = statusFilter === "all" || status === statusFilter

      return (
        matchesPlan &&
        matchesStatus &&
        matchesSearch(record, usersById, search)
      )
    })
  }, [enrichedSubscriptions, planFilter, search, statusFilter, usersById])

  const isLoading = subscriptionsQuery.isPending || planCountsQuery.isPending
  const isEmpty = subscriptions.length === 0
  const hasDistribution = distributionData.some((point) => point.users > 0)

  return (
    <section className="space-y-6">
      <SubscriptionsHeader />

      {isLoading ? (
        <SubscriptionsSkeleton />
      ) : subscriptionsQuery.isError ? (
        <SubscriptionsErrorState error={subscriptionsQuery.error} />
      ) : (
        <>
          {planCountsQuery.isError ? (
            <div
              className="flex items-start gap-3 rounded-xl bg-warning-soft p-4 text-sm text-warning"
              role="status"
            >
              <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <p>
                Kullanıcı plan sayıları yüklenemedi, bu yüzden plan sayıları
                sıfır görünebilir. Abonelik kayıtları yine de listeleniyor;
                doğru sayılar için sayfayı yenileyin.
              </p>
            </div>
          ) : null}

          <SubscriptionsKpiGrid
            activeSubscriptions={metrics.activeSubscriptions}
            cancelledOrExpired={metrics.cancelledOrExpired}
            freeUsers={metrics.freeUsers}
            premiumUsers={metrics.premiumUsers}
            proUsers={metrics.proUsers}
            totalRecords={metrics.totalRecords}
          />

          <SubscriptionDistributionChart
            data={distributionData}
            empty={!hasDistribution}
          />

          {isEmpty ? (
            <Card className="flex flex-col items-center px-6 py-14 text-center" tone="quiet">
              <Crown aria-hidden="true" className="size-8 text-muted" />
              <h2 className="mt-3 text-base font-semibold text-ink">
                Henüz abonelik kaydı yok
              </h2>
              <p className="mt-1 max-w-md text-sm text-ink-soft">
                Uygulamada ilk abonelik satın alındığında kayıtlar burada
                listelenir. Beklediğiniz kayıtlar yoksa yönetim servisindeki
                abonelik kayıtlarını kontrol edin.
              </p>
            </Card>
          ) : (
            <SubscriptionsTable
              onPlanFilterChange={setPlanFilter}
              onSearchChange={setSearch}
              onStatusFilterChange={setStatusFilter}
              planFilter={planFilter}
              records={filteredSubscriptions}
              search={search}
              statusFilter={statusFilter}
              totalCount={subscriptions.length}
            />
          )}
        </>
      )}
    </section>
  )
}

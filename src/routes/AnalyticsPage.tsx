import { useMemo, useState } from "react"

import { AnalyticsSetupState } from "../features/analytics/components/AnalyticsSetupState"
import { AnalyticsSkeleton } from "../features/analytics/components/AnalyticsSkeleton"
import {
  AcquisitionSection,
  ActivationSection,
  EngagementSection,
  ReliabilitySection,
  RetentionSection,
} from "../features/analytics/components/LaunchAnalyticsSections"
import {
  LaunchAnalyticsShell,
} from "../features/analytics/components/LaunchAnalyticsShell"
import { toDateInput } from "../features/analytics/analyticsDate"
import { useLaunchAnalytics } from "../features/analytics/hooks/useLaunchAnalytics"
import type {
  AcquisitionData,
  ActivationData,
  AnalyticsSection,
  EngagementData,
  LaunchAnalyticsFilters,
  ReliabilityData,
  RetentionData,
} from "../features/analytics/types"

interface AnalyticsPageProps {
  section: AnalyticsSection
}

export default function AnalyticsPage({ section }: AnalyticsPageProps) {
  const initialFilters = useMemo(() => createInitialFilters(section), [section])
  const [storedFilters, setStoredFilters] = useState(initialFilters)
  const filters = useMemo(
    () => ({ ...storedFilters, section }),
    [section, storedFilters],
  )
  const query = useLaunchAnalytics<
    AcquisitionData | ActivationData | RetentionData | EngagementData | ReliabilityData
  >(filters)

  const content = (() => {
    if (query.isPending) return <AnalyticsSkeleton />
    if (query.error || !query.data) {
      return <AnalyticsSetupState error={query.error} />
    }

    switch (section) {
      case "acquisition":
        return (
          <AcquisitionSection
            data={query.data.data as AcquisitionData}
            filters={filters}
          />
        )
      case "activation":
        return (
          <ActivationSection
            data={query.data.data as ActivationData}
            filters={filters}
          />
        )
      case "retention":
        return (
          <RetentionSection
            data={query.data.data as RetentionData}
            filters={filters}
          />
        )
      case "engagement":
        return <EngagementSection data={query.data.data as EngagementData} />
      case "reliability":
        return <ReliabilitySection data={query.data.data as ReliabilityData} />
    }
  })()

  return (
    <LaunchAnalyticsShell
      filters={filters}
      generatedAt={query.data?.generatedAt}
      isFetching={query.isFetching}
      onChange={setStoredFilters}
      onRefresh={() => void query.refetch()}
    >
      {content}
    </LaunchAnalyticsShell>
  )
}

function createInitialFilters(section: AnalyticsSection): LaunchAnalyticsFilters {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - 29)

  return {
    section,
    startDate: toDateInput(start),
    endDate: toDateInput(end),
    platform: null,
    language: null,
    notificationStatus: null,
  }
}

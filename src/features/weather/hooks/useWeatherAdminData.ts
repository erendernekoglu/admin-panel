import { useQuery } from "@tanstack/react-query"

import {
  fetchWeatherForecasts,
  fetchWeatherLocations,
} from "../services/weatherService"

export function useWeatherAdminData(cutoffDate?: string) {
  return useQuery({
    queryKey: ["admin", "weather", cutoffDate],
    queryFn: async () => {
      const [locations, forecasts] = await Promise.all([
        fetchWeatherLocations(),
        fetchWeatherForecasts(cutoffDate),
      ])

      return { locations, forecasts }
    },
    staleTime: 60_000,
  })
}

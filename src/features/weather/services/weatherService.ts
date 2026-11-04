import { adminRequest } from "../../../lib/api/client"
import {
  demoSyncWeatherLocations,
  demoTriggerWeatherUpdate,
  demoWeatherForecasts,
  demoWeatherLocations,
} from "../../demo/store"
import { isRecord, safeNumber, safeString, toIsoString } from "../../shared/format"
import type { WeatherForecast, WeatherLocation } from "../types"

function mapLocation(value: unknown): WeatherLocation {
  const data = isRecord(value) ? value : {}
  const coordinates = isRecord(data.coordinates) ? data.coordinates : undefined

  return {
    id: safeString(data.id, ""),
    city: safeString(data.city, ""),
    country: typeof data.country === "string" ? data.country : undefined,
    district: typeof data.district === "string" ? data.district : undefined,
    coordinates:
      typeof coordinates?.lat === "number" && typeof coordinates.lon === "number"
        ? { lat: coordinates.lat, lon: coordinates.lon }
        : undefined,
    active: typeof data.active === "boolean" ? data.active : undefined,
    userCount: safeNumber(data.userCount),
    lastUpdated: toIsoString(data.lastUpdated),
    updatedAt: toIsoString(data.updatedAt),
    createdAt: toIsoString(data.createdAt),
  }
}

function mapForecast(value: unknown): WeatherForecast {
  const data = isRecord(value) ? value : {}
  return {
    id: safeString(data.id, ""),
    locationId: safeString(data.locationId, ""),
    locationName:
      typeof data.locationName === "string" ? data.locationName : undefined,
    date: safeString(data.date, ""),
    timeSlot: typeof data.timeSlot === "string" ? data.timeSlot : undefined,
    morning: isRecord(data.morning) ? data.morning : undefined,
    noon: isRecord(data.noon) ? data.noon : undefined,
    evening: isRecord(data.evening) ? data.evening : undefined,
    night: isRecord(data.night) ? data.night : undefined,
    daytimeAverage:
      typeof data.daytimeAverage === "number" ? data.daytimeAverage : undefined,
    dailyHigh: typeof data.dailyHigh === "number" ? data.dailyHigh : undefined,
    dailyLow: typeof data.dailyLow === "number" ? data.dailyLow : undefined,
    dominantCondition:
      typeof data.dominantCondition === "string"
        ? data.dominantCondition
        : undefined,
    dominantIcon:
      typeof data.dominantIcon === "string" ? data.dominantIcon : undefined,
    lastUpdated: toIsoString(data.lastUpdated),
    updatedAt: toIsoString(data.updatedAt),
    createdAt: toIsoString(data.createdAt),
  }
}

export async function fetchWeatherLocations() {
  const records = await adminRequest<unknown[]>(
    "weather.locations",
    {},
    () => demoWeatherLocations(),
  )
  return records.map(mapLocation)
}

export async function fetchWeatherForecasts(cutoffDate?: string) {
  const cutoff =
    cutoffDate ??
    new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
  const records = await adminRequest<unknown[]>(
    "weather.forecasts",
    { cutoffDate: cutoff },
    () => demoWeatherForecasts(cutoff),
  )
  return records.map(mapForecast)
}

export interface SyncWeatherLocationsResult {
  success?: boolean
  message?: string
  synced: number
}

export interface TriggerWeatherUpdateResult {
  success: number
  total: number
  failed: number
  totalDaysProcessed: number
  deletedOldForecasts: number
  results: Array<{
    locationId: string
    success: boolean
    daysProcessed: number
    error?: string
  }>
}

export async function syncWeatherLocations(input: {
  consolePassword: string
}): Promise<SyncWeatherLocationsResult> {
  return adminRequest<SyncWeatherLocationsResult>(
    "weather.syncLocations",
    input,
    () => demoSyncWeatherLocations(input),
  )
}

export async function triggerWeatherUpdate(input: {
  consolePassword: string
}): Promise<TriggerWeatherUpdateResult> {
  return adminRequest<TriggerWeatherUpdateResult>(
    "weather.triggerUpdate",
    input,
    () => demoTriggerWeatherUpdate(input),
    { timeoutMs: 30 * 60_000 },
  )
}

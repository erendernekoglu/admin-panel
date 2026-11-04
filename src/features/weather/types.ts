export interface WeatherLocation {
  id: string
  city: string
  country?: string
  district?: string
  coordinates?: {
    lat: number
    lon: number
  }
  active?: boolean
  userCount: number
  lastUpdated: string | null
  updatedAt?: string | null
  createdAt?: string | null
}

export interface TimeSlotWeather {
  temperature?: number
  feelsLike?: number
  condition?: string
  icon?: string
  humidity?: number
  windSpeed?: number
}

export interface WeatherForecast {
  id: string
  locationId: string
  locationName?: string
  date: string
  timeSlot?: string
  morning?: TimeSlotWeather
  noon?: TimeSlotWeather
  evening?: TimeSlotWeather
  night?: TimeSlotWeather
  daytimeAverage?: number
  dailyHigh?: number
  dailyLow?: number
  dominantCondition?: string
  dominantIcon?: string
  lastUpdated: string | null
  updatedAt?: string | null
  createdAt?: string | null
}

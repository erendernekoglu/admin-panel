import type { AppEnvironment } from "../../types/admin"

const rawAppEnv = import.meta.env.VITE_APP_ENV?.toLowerCase()

/** Neutral environment label retained for the topbar badge. */
export const appEnv: AppEnvironment = rawAppEnv === "staging" ? "staging" : "production"

export const isProduction = appEnv === "production"
export const isStaging = appEnv === "staging"

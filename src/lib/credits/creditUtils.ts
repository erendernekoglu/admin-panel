export const CREDIT_OPERATION_LABELS: Record<
  string,
  { label: string; defaultCost?: number }
> = {
  ANALYZE_CLOTHING: { label: "Kıyafet analizi", defaultCost: 1 },
  ANALYZE_OUTFIT: { label: "Kombin analizi", defaultCost: 1 },
  CREATE_COMBINATION: { label: "Yapay zekâ kombini", defaultCost: 2 },
  WEATHER_OUTFIT_SUGGESTION: {
    label: "Havaya göre kombin önerisi",
    defaultCost: 2,
  },
  REMOVE_BACKGROUND: { label: "Arka plan silme", defaultCost: 10 },
  VIRTUAL_TRY_ON: { label: "Sanal deneme", defaultCost: 10 },
  CREATE_AVATAR: { label: "Avatar oluşturma", defaultCost: 30 },
  CABIN_AI_ADVICE: { label: "Kabin yapay zekâ önerisi" },
  CABIN_BULK_REVIEW: { label: "Kabin toplu inceleme" },
}

export const SUBSCRIPTION_NOTIFICATION_LABELS: Record<number, string> = {
  1: "Geri kazanıldı",
  2: "Yenilendi",
  3: "İptal edildi",
  4: "Satın alındı",
  5: "Beklemede",
  6: "Ek süre",
  7: "Yeniden başladı",
  9: "Süresi doldu",
  12: "Geri alındı",
  13: "Fiyat değişikliği reddedildi",
}

export function getOperationLabel(operation: string) {
  return CREDIT_OPERATION_LABELS[operation]?.label ?? operation
}

export function getDefaultOperationCost(operation: string) {
  return CREDIT_OPERATION_LABELS[operation]?.defaultCost ?? 0
}

export function isCreditSpend(type: string, amount: number) {
  return type === "spend" || amount < 0
}

export function isCreditLoad(type: string, amount: number) {
  return (
    ["purchase", "renewal", "manual_add", "signup_bonus"].includes(type) &&
    amount > 0
  )
}

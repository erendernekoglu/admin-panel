export function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10)
}

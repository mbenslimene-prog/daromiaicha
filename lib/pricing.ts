import { getDay, parseISO, eachDayOfInterval } from "date-fns"

export interface PriceRule {
  id: string
  property_id: string
  label: string
  start_date: string
  end_date: string
  price_weekday: number
  price_weekend: number
}

/** Retourne le prix pour une nuit donnée en tenant compte des règles tarifaires. */
export function getPriceForDate(date: Date, rules: PriceRule[], defaultWeekday: number, defaultWeekend: number): number {
  const dow = getDay(date) // 0=dim, 1=lun, ..., 5=ven, 6=sam
  const isWeekend = dow === 5 || dow === 6
  const dateStr = date.toISOString().slice(0, 10)

  const rule = rules.find((r) => dateStr >= r.start_date && dateStr <= r.end_date)

  if (rule) return isWeekend ? rule.price_weekend : rule.price_weekday
  return isWeekend ? defaultWeekend : defaultWeekday
}

/** Calcule le total d'un séjour en appliquant les règles tarifaires. */
export function calculateTotalWithRules(
  checkIn: string,
  checkOut: string,
  rules: PriceRule[],
  defaultWeekday: number,
  defaultWeekend: number
): number {
  const nights = eachDayOfInterval({
    start: parseISO(checkIn),
    end: parseISO(checkOut),
  }).slice(0, -1)

  return nights.reduce((sum, night) => sum + getPriceForDate(night, rules, defaultWeekday, defaultWeekend), 0)
}

import { eachDayOfInterval, parseISO, getDay } from "date-fns"

/**
 * Calcule le total du séjour en appliquant le bon tarif par nuit.
 * Vendredi (5) et Samedi (6) → prix week-end, reste → prix semaine.
 */
export function calculateTotal(
  checkIn: string,
  checkOut: string,
  weekdayPrice: number,
  weekendPrice: number
): number {
  const nights = eachDayOfInterval({
    start: parseISO(checkIn),
    end: parseISO(checkOut),
  }).slice(0, -1) // on retire le jour de départ (pas une nuit)

  return nights.reduce((sum, night) => {
    const day = getDay(night) // 0=dim, 1=lun, ..., 5=ven, 6=sam
    return sum + (day === 5 || day === 6 ? weekendPrice : weekdayPrice)
  }, 0)
}

/**
 * Décompte les nuits semaine et week-end séparément.
 */
export function countNightTypes(
  checkIn: string,
  checkOut: string
): { weekday: number; weekend: number } {
  const nights = eachDayOfInterval({
    start: parseISO(checkIn),
    end: parseISO(checkOut),
  }).slice(0, -1)

  return nights.reduce(
    (acc, night) => {
      const day = getDay(night)
      if (day === 5 || day === 6) acc.weekend++
      else acc.weekday++
      return acc
    },
    { weekday: 0, weekend: 0 }
  )
}

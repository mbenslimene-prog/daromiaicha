import { eachDayOfInterval, parseISO, addDays, format } from "date-fns"
import type { SupabaseClient } from "@supabase/supabase-js"

export interface DateWindow {
  check_in: string
  check_out: string
}

/** Construit l'ensemble de toutes les dates bloquées pour un bien (iCal + réservations confirmées) */
export async function getBlockedSet(
  propertyId: string,
  db: SupabaseClient
): Promise<Set<string>> {
  const blocked = new Set<string>()

  const addRange = (start: string, end: string) => {
    eachDayOfInterval({ start: parseISO(start), end: parseISO(end) })
      .forEach((d) => blocked.add(format(d, "yyyy-MM-dd")))
  }

  const [{ data: ranges }, { data: bookings }] = await Promise.all([
    db.from("blocked_dates").select("start_date, end_date").eq("property_id", propertyId),
    db.from("bookings").select("check_in, check_out").eq("property_id", propertyId).eq("status", "confirmed"),
  ])

  for (const r of ranges ?? []) addRange(r.start_date, r.end_date)
  for (const b of bookings ?? []) addRange(b.check_in, b.check_out)

  return blocked
}

/**
 * Vérifie si un créneau est libre pour un bien donné.
 */
export function isWindowFree(blocked: Set<string>, checkIn: string, nights: number): boolean {
  for (let n = 0; n < nights; n++) {
    const day = format(addDays(parseISO(checkIn), n), "yyyy-MM-dd")
    if (blocked.has(day)) return false
  }
  return true
}

/**
 * Trouve la première fenêtre disponible de `nights` nuits à partir de `fromDate`.
 * Cherche jusqu'à `maxLookAhead` jours en avant.
 */
export function findNextWindow(
  blocked: Set<string>,
  nights: number,
  fromDate: string,
  maxLookAhead = 90
): DateWindow | null {
  for (let offset = 0; offset <= maxLookAhead; offset++) {
    const candidate = format(addDays(parseISO(fromDate), offset), "yyyy-MM-dd")
    if (isWindowFree(blocked, candidate, nights)) {
      return {
        check_in: candidate,
        check_out: format(addDays(parseISO(candidate), nights), "yyyy-MM-dd"),
      }
    }
  }
  return null
}

import { createServiceClient } from "./supabase"
import { fetchBlockedDates } from "./ical"

/**
 * Synchronise les flux iCal (Airbnb + Booking.com) d'un bien dans blocked_dates.
 * Les erreurs sont silencieuses — la page/API continue avec les données en cache.
 */
export async function syncPropertyIcal(propertyId: string): Promise<void> {
  const db = createServiceClient()

  const { data: prop } = await db
    .from("properties")
    .select("airbnb_ical_url, booking_ical_url")
    .eq("id", propertyId)
    .single()

  if (!prop) return

  const sources = (
    [
      { url: prop.airbnb_ical_url as string | null, source: "airbnb" },
      { url: prop.booking_ical_url as string | null, source: "booking" },
    ] as { url: string | null; source: string }[]
  ).filter((s): s is { url: string; source: string } => !!s.url)

  if (!sources.length) return

  await Promise.allSettled(
    sources.map(async ({ url, source }) => {
      const ranges = await fetchBlockedDates(url, source)
      await db
        .from("blocked_dates")
        .delete()
        .eq("property_id", propertyId)
        .eq("source", source)
      if (ranges.length) {
        await db.from("blocked_dates").insert(
          ranges.map((r) => ({ ...r, property_id: propertyId }))
        )
      }
      console.log(`[ical-sync] ${source} → ${ranges.length} plages pour ${propertyId}`)
    })
  )
}

/**
 * Même chose avec un timeout — si les serveurs externes sont lents,
 * on renvoie après `ms` ms sans bloquer la page.
 */
export async function syncPropertyIcalWithTimeout(
  propertyId: string,
  ms = 4000
): Promise<void> {
  await Promise.race([
    syncPropertyIcal(propertyId),
    new Promise<void>((resolve) => setTimeout(resolve, ms)),
  ]).catch(() => {})
}

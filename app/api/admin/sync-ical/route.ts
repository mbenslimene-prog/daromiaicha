import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServiceClient } from "@/lib/supabase"
import { fetchBlockedDates } from "@/lib/ical"

// Route protégée par cookie admin — appelée depuis le dashboard admin
export async function POST(_request: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin_token")?.value
  if (token !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const db = createServiceClient()

  const { data: properties, error } = await db
    .from("properties")
    .select("id, slug, airbnb_ical_url, booking_ical_url")
    .eq("active", true)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const results: Record<string, { synced: number; error?: string }> = {}

  for (const property of properties ?? []) {
    let synced = 0

    // Supprimer les anciennes dates bloquées de sources externes
    await db
      .from("blocked_dates")
      .delete()
      .eq("property_id", property.id)
      .in("source", ["airbnb", "booking"])

    if (property.airbnb_ical_url) {
      try {
        const ranges = await fetchBlockedDates(property.airbnb_ical_url, "airbnb")
        if (ranges.length > 0) {
          await db.from("blocked_dates").insert(
            ranges.map((r) => ({ ...r, property_id: property.id }))
          )
          synced += ranges.length
        }
      } catch (e) {
        console.error(`iCal Airbnb error for ${property.id}:`, e)
        results[property.id] = { synced, error: "Erreur Airbnb iCal" }
        continue
      }
    }

    if (property.booking_ical_url) {
      try {
        const ranges = await fetchBlockedDates(property.booking_ical_url, "booking")
        if (ranges.length > 0) {
          await db.from("blocked_dates").insert(
            ranges.map((r) => ({ ...r, property_id: property.id }))
          )
          synced += ranges.length
        }
      } catch (e) {
        console.error(`iCal Booking error for ${property.id}:`, e)
        results[property.id] = { synced, error: "Erreur Booking iCal" }
        continue
      }
    }

    results[property.id] = { synced }
  }

  return NextResponse.json({ ok: true, results })
}

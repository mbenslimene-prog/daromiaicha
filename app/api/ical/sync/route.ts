export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase"
import { fetchBlockedDates } from "@/lib/ical"

// Cette route est appelée par un cron job (Vercel Cron ou appel externe)
// ou manuellement depuis l'admin
export async function POST(request: NextRequest) {
  // Protection basique par token secret
  const auth = request.headers.get("authorization")
  if (auth !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const db = createServiceClient()

  // Récupérer tous les biens actifs avec des URLs iCal
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

    // Sync Airbnb
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
      }
    }

    // Sync Booking.com
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
      }
    }

    results[property.id] = { synced }
  }

  return NextResponse.json({ ok: true, results })
}

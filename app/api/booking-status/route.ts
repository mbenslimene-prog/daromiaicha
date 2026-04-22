import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  const bookingId = request.nextUrl.searchParams.get("id")
  if (!bookingId) {
    return NextResponse.json({ error: "id manquant" }, { status: 400 })
  }

  const db = createServiceClient()

  // Récupérer la réservation sans join (évite les erreurs de relation FK non résolue)
  const { data: booking, error: bookingError } = await db
    .from("bookings")
    .select("id, status, guest_name, check_in, check_out, nights, deposit_amount, total_amount, property_id")
    .eq("id", bookingId)
    .single()

  if (bookingError) {
    console.error("[booking-status] Supabase error:", bookingError)
    const notFound = bookingError.code === "PGRST116"
    return NextResponse.json(
      { error: notFound ? "Réservation introuvable" : bookingError.message },
      { status: notFound ? 404 : 500 }
    )
  }

  if (!booking) {
    return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 })
  }

  // Récupérer le nom du bien séparément
  let propertyTitle: string | null = null
  if (booking.property_id) {
    const { data: prop } = await db
      .from("properties")
      .select("title")
      .eq("id", booking.property_id)
      .single()
    propertyTitle = prop?.title ?? null
  }

  return NextResponse.json({
    ...booking,
    properties: propertyTitle ? { title: propertyTitle } : null,
  })
}

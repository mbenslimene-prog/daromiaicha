import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createServiceClient } from "@/lib/supabase"
import { PROPERTIES } from "@/lib/properties"
import { calculateTotal } from "@/lib/utils"
import type { CheckoutPayload } from "@/lib/types"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function resolveProperty(
  property_id: string,
  db: ReturnType<typeof createServiceClient>,
  property_slug?: string
) {
  if (UUID_REGEX.test(property_id)) {
    if (property_slug) {
      const property = PROPERTIES.find((p) => p.slug === property_slug)
      if (property) return { dbId: property_id, property }
    }
    const { data: dbProp } = await db
      .from("properties").select("slug").eq("id", property_id).single()
    if (!dbProp) return null
    const property = PROPERTIES.find((p) => p.slug === dbProp.slug)
    if (!property) return null
    return { dbId: property_id, property }
  }
  const property = PROPERTIES.find((p) => p.id === property_id || p.slug === property_id)
  if (!property) return null
  const { data: dbProp } = await db
    .from("properties").select("id").eq("slug", property.slug).single()
  if (!dbProp) return null
  return { dbId: dbProp.id, property }
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutPayload = await request.json()
    const { property_id, property_slug, check_in, check_out, nights, guest_name, guest_email, guest_phone } = body

    if (!property_id || !check_in || !check_out || !nights || !guest_name || !guest_email) {
      return NextResponse.json({ error: "Données manquantes." }, { status: 400 })
    }

    const db = createServiceClient()
    const resolved = await resolveProperty(property_id, db, property_slug)
    if (!resolved) {
      return NextResponse.json({ error: "Logement introuvable." }, { status: 404 })
    }
    const { dbId, property } = resolved

    const total = calculateTotal(check_in, check_out, property.price_per_night_weekday, property.price_per_night_weekend)
    const deposit = Math.round(total / 2)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

    const { data: booking, error: dbError } = await db
      .from("bookings")
      .insert({
        property_id: dbId,
        guest_name,
        guest_email,
        guest_phone: guest_phone ?? null,
        check_in,
        check_out,
        nights,
        total_amount: total,
        deposit_amount: deposit,
        status: "pending",
        source: "direct",
      })
      .select()
      .single()

    if (dbError) {
      console.error("Supabase insert error:", dbError)
      return NextResponse.json({ error: "Impossible de créer la réservation." }, { status: 500 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: guest_email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `${property.title} – Acompte (50%)`,
              description: `Séjour du ${check_in} au ${check_out} · ${nights} nuit${nights > 1 ? "s" : ""}`,
              images: property.photos.slice(0, 1),
            },
            unit_amount: deposit * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        booking_id: booking.id,
        property_slug: property.slug,
        check_in,
        check_out,
      },
      success_url: `${appUrl}/confirmation?booking_id=${booking.id}`,
      cancel_url: `${appUrl}/bien/${property.slug}?cancelled=1`,
    })

    await db
      .from("bookings")
      .update({ stripe_session_id: session.id })
      .eq("id", booking.id)

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("Checkout error:", err)
    return NextResponse.json({ error: "Erreur interne du serveur." }, { status: 500 })
  }
}

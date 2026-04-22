import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createServiceClient } from "@/lib/supabase"
import { PROPERTIES } from "@/lib/properties"
import { calculateTotal } from "@/lib/utils"
import type { CheckoutPayload } from "@/lib/types"
import type { Property } from "@/lib/types"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Résout property_id + property_slug en { dbId, property } :
 *   - Si property_id est un UUID ET property_slug est fourni :
 *       UUID utilisé directement comme dbId, slug pour trouver le bien statique — zéro aller-retour DB
 *   - Si property_id est un UUID seul :
 *       lookup slug depuis Supabase (1 requête) puis bien statique par slug
 *   - Sinon (id statique "1"/"2" ou slug) :
 *       bien statique par id/slug, lookup UUID depuis Supabase (1 requête)
 */
async function resolveProperty(
  property_id: string,
  db: ReturnType<typeof createServiceClient>,
  property_slug?: string
): Promise<{ dbId: string; property: Property } | null> {
  if (UUID_REGEX.test(property_id)) {
    // Chemin optimal : UUID + slug fournis par la page serveur — aucun aller-retour DB
    if (property_slug) {
      const property = PROPERTIES.find((p) => p.slug === property_slug)
      if (property) return { dbId: property_id, property }
    }
    // Fallback : UUID seul → récupérer le slug depuis Supabase
    const { data: dbProp } = await db
      .from("properties").select("slug").eq("id", property_id).single()
    if (!dbProp) return null
    const property = PROPERTIES.find((p) => p.slug === dbProp.slug)
    if (!property) return null
    return { dbId: property_id, property }
  }

  // id statique ("1", "2") ou slug — lookup UUID depuis Supabase
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

    const paymentIntent = await stripe.paymentIntents.create({
      amount: deposit * 100,
      currency: "eur",
      receipt_email: guest_email,
      description: `${property.title} – Acompte 50% · ${check_in} → ${check_out}`,
      metadata: {
        booking_id: booking.id,
        property_slug: property.slug,
        check_in,
        check_out,
        guest_name,
      },
    })

    await db
      .from("bookings")
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq("id", booking.id)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      bookingId: booking.id,
      deposit,
      total,
    })
  } catch (err) {
    console.error("PaymentIntent error:", err)
    return NextResponse.json({ error: "Erreur interne du serveur." }, { status: 500 })
  }
}

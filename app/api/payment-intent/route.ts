import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createServiceClient } from "@/lib/supabase"
import { PROPERTIES } from "@/lib/properties"
import { calculateTotalWithRules } from "@/lib/pricing"
import type { CheckoutPayload } from "@/lib/types"
import type { Property } from "@/lib/types"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
    if (!DATE_REGEX.test(check_in) || !DATE_REGEX.test(check_out)) {
      return NextResponse.json({ error: "Format de date invalide." }, { status: 400 })
    }
    if (!EMAIL_REGEX.test(guest_email)) {
      return NextResponse.json({ error: "Email invalide." }, { status: 400 })
    }
    if (typeof nights !== "number" || !Number.isInteger(nights) || nights < 1 || nights > 90) {
      return NextResponse.json({ error: "Durée du séjour invalide (1-90 nuits)." }, { status: 400 })
    }
    if (typeof guest_name !== "string" || guest_name.trim().length < 2 || guest_name.length > 100) {
      return NextResponse.json({ error: "Nom invalide." }, { status: 400 })
    }
    const checkInDate = new Date(check_in)
    const checkOutDate = new Date(check_out)
    const today = new Date(); today.setHours(0, 0, 0, 0)
    if (checkInDate < today) {
      return NextResponse.json({ error: "La date d'arrivée ne peut pas être dans le passé." }, { status: 400 })
    }
    if (checkOutDate <= checkInDate) {
      return NextResponse.json({ error: "La date de départ doit être après la date d'arrivée." }, { status: 400 })
    }

    const db = createServiceClient()
    const resolved = await resolveProperty(property_id, db, property_slug)
    if (!resolved) {
      return NextResponse.json({ error: "Logement introuvable." }, { status: 404 })
    }
    const { dbId, property } = resolved

    const { data: priceRulesData } = await db
      .from("price_rules")
      .select("*")
      .eq("property_id", dbId)
      .lte("start_date", check_out)
      .gte("end_date", check_in)

    const total = calculateTotalWithRules(
      check_in,
      check_out,
      (priceRulesData ?? []) as import("@/lib/pricing").PriceRule[],
      property.price_per_night_weekday,
      property.price_per_night_weekend
    )
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
      console.error("[payment-intent] Supabase insert error:", dbError)
      return NextResponse.json({ error: "Impossible de créer la réservation (base de données)." }, { status: 500 })
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
    console.error("[payment-intent] Erreur inattendue:", err)
    return NextResponse.json({ error: "Erreur interne du serveur. Veuillez réessayer." }, { status: 500 })
  }
}

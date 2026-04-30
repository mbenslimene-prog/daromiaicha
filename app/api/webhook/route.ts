export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createServiceClient } from "@/lib/supabase"
import { sendBookingConfirmation, sendUnavailabilityNotification, sendCancellationNotification } from "@/lib/email"
import { getBlockedSet, findNextWindow, isWindowFree } from "@/lib/availability"
import { syncPropertyIcal } from "@/lib/ical-sync"
import { PROPERTIES } from "@/lib/properties"
import type { Property } from "@/lib/types"
import type { SupabaseClient } from "@supabase/supabase-js"
import Stripe from "stripe"

// ── Confirmation ──────────────────────────────────────────────────────────────

async function confirmBooking(
  bookingId: string,
  paymentIntentId: string,
  propertySlug: string | undefined
) {
  const db = createServiceClient()

  console.log("[webhook] confirmBooking →", bookingId)

  // 1. Lire toutes les données du booking — nécessaire pour les emails et les vérifications
  const { data: current } = await db
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .single()

  if (!current) {
    console.error("[webhook] booking introuvable:", bookingId)
    return
  }
  if (current.status === "confirmed") {
    console.log("[webhook] booking déjà confirmé (idempotent) — rien à faire:", bookingId)
    return
  }
  if (current.status === "cancelled") {
    console.log("[webhook] booking déjà annulé — on ne reconfirme pas:", bookingId)
    return
  }

  // Résoudre le bien pour les emails + valider que le slug metadata correspond au booking
  let property: Property | undefined = propertySlug
    ? PROPERTIES.find((p) => p.slug === propertySlug)
    : undefined
  if (!property) {
    const { data: dbProp } = await db
      .from("properties").select("slug").eq("id", current.property_id).single()
    if (dbProp) property = PROPERTIES.find((p) => p.slug === dbProp.slug)
  }
  // Vérification anti-falsification : le slug metadata doit correspondre au bien en base
  if (propertySlug && property) {
    const { data: dbProp } = await db
      .from("properties").select("id").eq("slug", propertySlug).single()
    if (dbProp && dbProp.id !== current.property_id) {
      console.error("[webhook] metadata property_slug ne correspond pas au booking — abandon:", bookingId)
      return
    }
  }

  // 2a. Vérifier qu'aucune autre réservation confirmée (site direct) ne chevauche ces dates
  const { data: bookingConflicts } = await db
    .from("bookings")
    .select("id")
    .eq("property_id", current.property_id)
    .eq("status", "confirmed")
    .neq("id", bookingId)
    .lt("check_in", current.check_out)
    .gt("check_out", current.check_in)

  if (bookingConflicts?.length) {
    console.log("[webhook] conflit avec réservation directe confirmée — annulation:", bookingId)
    await db.from("bookings").update({ status: "cancelled" }).eq("id", bookingId)
    if (property) await sendCancellationNotification(current, property, "direct")
    return
  }

  // 2b. Vérifier qu'aucune date bloquée externe (Airbnb / Booking.com) ne chevauche ces dates
  const { data: externalConflicts } = await db
    .from("blocked_dates")
    .select("id, source")
    .eq("property_id", current.property_id)
    .lt("start_date", current.check_out)
    .gte("end_date", current.check_in)

  if (externalConflicts?.length) {
    const sources = [...new Set(externalConflicts.map((e: { source: string }) => e.source))].join(", ")
    console.log(`[webhook] conflit avec dates bloquées externes (${sources}) — annulation:`, bookingId)
    await db.from("bookings").update({ status: "cancelled" }).eq("id", bookingId)
    if (property) await sendCancellationNotification(current, property, "external")
    return
  }

  // 3. Confirmer la réservation — optimistic lock : n'écrit que si status est encore "pending"
  const { data: updated, error: updateError } = await db
    .from("bookings")
    .update({ status: "confirmed", stripe_payment_intent_id: paymentIntentId })
    .eq("id", bookingId)
    .eq("status", "pending")
    .select()

  if (updateError) {
    console.error("[webhook] update error:", updateError)
    return
  }
  if (!updated?.length) {
    console.log("[webhook] booking déjà traité par un autre processus — abandon:", bookingId)
    return
  }
  console.log("[webhook] statut → confirmed ✓")

  if (property) {
    await sendBookingConfirmation(current, property)
  }

  await handleConflicts(current, property, db)

  // Sync iCal en arrière-plan après confirmation — met à jour les dates pour les prochains visiteurs
  syncPropertyIcal(current.property_id as string).catch((e) =>
    console.error("[webhook] ical-sync error:", e)
  )
}

// ── Gestion des conflits ──────────────────────────────────────────────────────

async function handleConflicts(
  confirmedBooking: Record<string, unknown>,
  originalProperty: Property | undefined,
  db: SupabaseClient
) {
  const { id, property_id, check_in, check_out, nights } = confirmedBooking as {
    id: string
    property_id: string
    check_in: string
    check_out: string
    nights: number
  }

  const { data: conflicts } = await db
    .from("bookings")
    .select("*")
    .eq("property_id", property_id)
    .eq("status", "pending")
    .neq("id", id)
    .lt("check_in", check_out)
    .gt("check_out", check_in)

  if (!conflicts?.length) return

  const { data: allProperties } = await db
    .from("properties")
    .select("id, title, slug")
    .eq("active", true)

  const otherProperties = (allProperties ?? []).filter((p) => p.id !== property_id)

  for (const pending of conflicts) {
    await db.from("bookings").update({ status: "cancelled" }).eq("id", pending.id)
    syncPropertyIcal(property_id).catch(() => {})

    if (!originalProperty) continue

    const alternatives = await findAlternatives(
      pending as { check_in: string; nights: number },
      otherProperties,
      property_id,
      db
    )

    const altForEmail = alternatives
      .map((alt) => {
        const prop = PROPERTIES.find((p) => p.slug === alt.slug)
        return prop ? { property: prop, window: alt.window, label: alt.label } : null
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)

    await sendUnavailabilityNotification(pending, originalProperty, altForEmail)
  }
}

// ── Recherche d'alternatives ──────────────────────────────────────────────────

interface RawAlternative {
  slug: string
  window: { check_in: string; check_out: string }
  label: string
}

async function findAlternatives(
  pending: { check_in: string; nights: number },
  otherProperties: { id: string; title: string; slug: string }[],
  originalPropertyId: string,
  db: SupabaseClient
): Promise<RawAlternative[]> {
  const { addDays, parseISO, format } = await import("date-fns")
  const { check_in, nights } = pending
  const results: RawAlternative[] = []

  for (const otherProp of otherProperties) {
    const blockedOther = await getBlockedSet(otherProp.id, db)
    if (isWindowFree(blockedOther, check_in, nights)) {
      results.push({
        slug: otherProp.slug,
        window: { check_in, check_out: format(addDays(parseISO(check_in), nights), "yyyy-MM-dd") },
        label: `Mêmes dates sur ${otherProp.title}`,
      })
    } else {
      const next = findNextWindow(blockedOther, nights, check_in)
      if (next) {
        results.push({
          slug: otherProp.slug,
          window: next,
          label: `Prochaines dates disponibles sur ${otherProp.title}`,
        })
      }
    }
  }

  const blockedOriginal = await getBlockedSet(originalPropertyId, db)
  const nextOnOriginal = findNextWindow(blockedOriginal, nights, check_in)
  if (nextOnOriginal && nextOnOriginal.check_in !== check_in) {
    const { data: orig } = await db
      .from("properties").select("slug, title").eq("id", originalPropertyId).single()
    if (orig) {
      results.push({
        slug: orig.slug,
        window: nextOnOriginal,
        label: `Prochaines dates disponibles sur ${orig.title}`,
      })
    }
  }

  return results.slice(0, 3)
}

// ── Handler principal ─────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error("[webhook] signature error:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  console.log("[webhook] event:", event.type)

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent
    const bookingId = pi.metadata?.booking_id
    const propertySlug = pi.metadata?.property_slug
    if (bookingId) {
      await confirmBooking(bookingId, pi.id, propertySlug)
    }
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const bookingId = session.metadata?.booking_id
    if (bookingId) {
      await confirmBooking(bookingId, session.payment_intent as string, undefined)
    }
  }

  return NextResponse.json({ received: true })
}

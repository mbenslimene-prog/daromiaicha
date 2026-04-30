import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase"
import { cookies } from "next/headers"

async function requireAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin_token")?.value
  if (token !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth) return auth

  const propertyId = request.nextUrl.searchParams.get("property_id")
  const db = createServiceClient()

  const query = db.from("price_rules").select("*").order("start_date")
  if (propertyId) query.eq("property_id", propertyId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth) return auth

  const body = await request.json()
  const { property_id, label, start_date, end_date, price_weekday, price_weekend } = body

  if (!property_id || !start_date || !end_date || price_weekday == null || price_weekend == null) {
    return NextResponse.json({ error: "Données manquantes." }, { status: 400 })
  }
  if (start_date >= end_date) {
    return NextResponse.json({ error: "La date de début doit être avant la date de fin." }, { status: 400 })
  }

  const db = createServiceClient()

  // Vérifier chevauchement avec règles existantes sur ce bien
  const { data: overlapping } = await db
    .from("price_rules")
    .select("id, label, start_date, end_date")
    .eq("property_id", property_id)
    .lt("start_date", end_date)
    .gt("end_date", start_date)

  if (overlapping?.length) {
    const r = overlapping[0]
    return NextResponse.json(
      { error: `Chevauchement avec la règle "${r.label}" (${r.start_date} → ${r.end_date}).` },
      { status: 409 }
    )
  }

  const { data, error } = await db
    .from("price_rules")
    .insert({ property_id, label: label || "Tarif spécial", start_date, end_date, price_weekday, price_weekend })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth) return auth

  const id = request.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id manquant." }, { status: 400 })

  const db = createServiceClient()
  const { error } = await db.from("price_rules").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth) return auth

  const body = await request.json()
  const { id, label, start_date, end_date, price_weekday, price_weekend } = body

  if (!id) return NextResponse.json({ error: "id manquant." }, { status: 400 })

  const db = createServiceClient()

  // Récupérer le property_id de la règle existante
  const { data: existing } = await db.from("price_rules").select("property_id").eq("id", id).single()
  if (!existing) return NextResponse.json({ error: "Règle introuvable." }, { status: 404 })

  // Vérifier chevauchement en excluant la règle elle-même
  const { data: overlapping } = await db
    .from("price_rules")
    .select("id, label, start_date, end_date")
    .eq("property_id", existing.property_id)
    .neq("id", id)
    .lt("start_date", end_date)
    .gt("end_date", start_date)

  if (overlapping?.length) {
    const r = overlapping[0]
    return NextResponse.json(
      { error: `Chevauchement avec la règle "${r.label}" (${r.start_date} → ${r.end_date}).` },
      { status: 409 }
    )
  }

  const { data, error } = await db
    .from("price_rules")
    .update({ label, start_date, end_date, price_weekday, price_weekend })
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

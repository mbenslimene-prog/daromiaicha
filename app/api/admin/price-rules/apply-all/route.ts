import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase"
import { cookies } from "next/headers"

async function requireAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin_token")?.value
  if (token !== process.env.ADMIN_SECRET)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return null
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth) return auth

  const { label, start_date, end_date, price_weekday, price_weekend, source_property_id } =
    await request.json()

  if (!start_date || !end_date || price_weekday == null || price_weekend == null || !source_property_id) {
    return NextResponse.json({ error: "Données manquantes." }, { status: 400 })
  }

  const db = createServiceClient()

  // Récupérer tous les autres biens actifs
  const { data: properties } = await db
    .from("properties")
    .select("id, title")
    .eq("active", true)
    .neq("id", source_property_id)

  const created: string[] = []
  const skipped: { title: string; reason: string }[] = []

  for (const prop of properties ?? []) {
    // Vérifier chevauchement
    const { data: overlapping } = await db
      .from("price_rules")
      .select("label, start_date, end_date")
      .eq("property_id", prop.id)
      .lt("start_date", end_date)
      .gt("end_date", start_date)

    if (overlapping?.length) {
      const r = overlapping[0]
      skipped.push({
        title: prop.title,
        reason: `Chevauchement avec "${r.label}" (${r.start_date} → ${r.end_date})`,
      })
      continue
    }

    const { error } = await db.from("price_rules").insert({
      property_id: prop.id,
      label: label || "Tarif spécial",
      start_date,
      end_date,
      price_weekday,
      price_weekend,
    })

    if (error) {
      skipped.push({ title: prop.title, reason: error.message })
    } else {
      created.push(prop.title)
    }
  }

  return NextResponse.json({ created, skipped })
}

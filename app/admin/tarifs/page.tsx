import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createServiceClient } from "@/lib/supabase"
import { PROPERTIES } from "@/lib/properties"
import PricingManager from "./PricingManager"
import type { PriceRule } from "@/lib/pricing"

async function requireAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin_token")?.value
  if (token !== process.env.ADMIN_SECRET) redirect("/admin/login")
}

export default async function TarifsPage() {
  await requireAdmin()

  const db = createServiceClient()
  const { data: rules } = await db
    .from("price_rules")
    .select("*")
    .order("start_date")

  // Enrichir les properties avec leur UUID Supabase dans host_id pour usage côté client
  const { data: dbProps } = await db.from("properties").select("id, slug")
  const dbIdBySlug: Record<string, string> = {}
  for (const p of dbProps ?? []) dbIdBySlug[p.slug] = p.id

  const propertiesWithDbId = PROPERTIES.map((p) => ({
    ...p,
    host_id: dbIdBySlug[p.slug] ?? "",
  }))

  return (
    <PricingManager
      properties={propertiesWithDbId}
      initialRules={(rules ?? []) as PriceRule[]}
    />
  )
}

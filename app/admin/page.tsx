import { createServiceClient } from "@/lib/supabase"
import { PROPERTIES } from "@/lib/properties"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import AdminDashboard from "./AdminDashboard"

async function requireAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get("admin_token")?.value
  if (token !== process.env.ADMIN_SECRET) {
    redirect("/admin/login")
  }
}

export default async function AdminPage() {
  await requireAdmin()

  let bookings: Record<string, unknown>[] = []
  try {
    const db = createServiceClient()

    // Réservations sans join — évite les erreurs FK PostgREST
    const { data: bookingsData } = await db
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    // Récupérer TOUS les biens pour construire la map UUID → nom
    const { data: propsData } = await db
      .from("properties")
      .select("id, title")

    const nameById: Record<string, string> = {}
    for (const p of propsData ?? []) nameById[p.id] = p.title

    // Enrichir chaque réservation avec le nom du bien
    bookings = (bookingsData ?? []).map((b) => ({
      ...b,
      property_title: nameById[b.property_id] ?? null,
    }))
  } catch {
    // Supabase pas encore configuré — mode démo
  }

  return <AdminDashboard bookings={bookings} properties={PROPERTIES} />
}

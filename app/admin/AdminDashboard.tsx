"use client"

import { useState } from "react"
import Link from "next/link"
import { Waves, LayoutDashboard, Home, Calendar, RefreshCw, LogOut } from "lucide-react"
import type { Property, Booking } from "@/lib/types"

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: "En attente",  color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Confirmée",   color: "bg-green-100  text-green-700"  },
  cancelled: { label: "Annulée",     color: "bg-red-100    text-red-700"    },
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

export default function AdminDashboard({
  bookings,
  properties,
}: {
  bookings: Record<string, unknown>[]
  properties: Property[]
}) {
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncMsg, setSyncMsg] = useState("")
  const [tab, setTab] = useState<"bookings" | "properties">("bookings")

  const confirmed  = bookings.filter((b) => b.status === "confirmed").length
  const pending    = bookings.filter((b) => b.status === "pending").length
  const revenue    = bookings
    .filter((b) => b.status === "confirmed")
    .reduce((sum, b) => sum + ((b.deposit_amount as number) ?? 0), 0)

  async function syncIcal() {
    setSyncLoading(true)
    setSyncMsg("")
    try {
      const res = await fetch("/api/admin/sync-ical", { method: "POST" })
      const data = await res.json()
      setSyncMsg(res.ok ? "Calendriers synchronisés avec succès." : data.error)
    } catch {
      setSyncMsg("Erreur lors de la synchronisation.")
    } finally {
      setSyncLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#4a4e69] text-white flex flex-col shrink-0">
        <div className="flex items-center gap-2 px-6 py-5 border-b border-white/10">
          <Waves className="text-[#d4af37] w-5 h-5" />
          <span className="font-serif font-bold text-lg">Admin</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {[
            { label: "Tableau de bord", icon: LayoutDashboard, key: "bookings" },
            { label: "Propriétés",      icon: Home,            key: "properties" },
          ].map(({ label, icon: Icon, key }) => (
            <button
              key={key}
              onClick={() => setTab(key as "bookings" | "properties")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition ${
                tab === key
                  ? "bg-white/20 font-semibold"
                  : "hover:bg-white/10 text-white/70"
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>

        <div className="px-4 pb-6 space-y-2">
          <button
            onClick={syncIcal}
            disabled={syncLoading}
            className="w-full flex items-center justify-center gap-2 bg-[#0077b6] hover:bg-[#005f92] text-white text-sm py-2.5 rounded-lg transition"
          >
            <RefreshCw size={14} className={syncLoading ? "animate-spin" : ""} />
            Sync. iCal
          </button>
          {syncMsg && <p className="text-xs text-center text-[#f4ebd0]">{syncMsg}</p>}
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 text-white/60 hover:text-white text-sm py-2 rounded-lg transition"
          >
            <LogOut size={14} /> Voir le site
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 overflow-auto">
        {tab === "bookings" && (
          <>
            <h1 className="font-serif text-2xl font-bold text-[#4a4e69] mb-6">
              Tableau de bord
            </h1>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
              <StatCard label="Réservations confirmées" value={confirmed} color="text-green-600" />
              <StatCard label="En attente de paiement"  value={pending}   color="text-yellow-600" />
              <StatCard label="Acomptes reçus (€)"      value={revenue}   color="text-[#0077b6]"  />
            </div>

            {/* Tableau réservations */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <Calendar size={16} className="text-[#0077b6]" />
                <h2 className="font-semibold text-[#4a4e69]">Réservations récentes</h2>
              </div>

              {bookings.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-400 text-sm">
                  Aucune réservation pour l&apos;instant.
                  <br />
                  <span className="text-xs">Connectez Supabase pour voir les données réelles.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                      <tr>
                        {["Voyageur", "Logement", "Arrivée", "Départ", "Nuits", "Acompte", "Statut"].map((h) => (
                          <th key={h} className="px-4 py-3 text-left">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {bookings.map((b) => {
                        const propertyTitle = (b.property_title as string | null) ?? (b.property_id as string)
                        const s = STATUS_LABELS[b.status as string] ?? { label: String(b.status), color: "bg-gray-100" }
                        return (
                          <tr key={b.id as string} className="hover:bg-gray-50/50 transition">
                            <td className="px-4 py-3">
                              <div className="font-medium text-[#4a4e69]">{b.guest_name as string}</div>
                              <div className="text-xs text-gray-400">{b.guest_email as string}</div>
                            </td>
                            <td className="px-4 py-3 text-gray-600">{propertyTitle}</td>
                            <td className="px-4 py-3 text-gray-600">{b.check_in as string}</td>
                            <td className="px-4 py-3 text-gray-600">{b.check_out as string}</td>
                            <td className="px-4 py-3 text-gray-600">{b.nights as number}</td>
                            <td className="px-4 py-3 font-medium text-[#4a4e69]">{b.deposit_amount as number}€</td>
                            <td className="px-4 py-3">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${s.color}`}>
                                {s.label}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {tab === "properties" && (
          <>
            <h1 className="font-serif text-2xl font-bold text-[#4a4e69] mb-6">
              Propriétés
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {properties.map((p) => (
                <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#0077b6] mb-1">{p.type}</p>
                  <h3 className="font-serif text-xl font-bold text-[#4a4e69] mb-2">{p.title}</h3>
                  <div className="text-sm text-gray-500 space-y-1 mb-4">
                    <p>{p.capacity_guests} voyageurs · {p.capacity_bedrooms} ch. · À partir de {p.price_per_night_weekday}€/nuit</p>
                    <p className={`text-xs ${p.airbnb_ical_url ? "text-green-600" : "text-yellow-600"}`}>
                      Airbnb iCal : {p.airbnb_ical_url ? "✓ configuré" : "⚠ manquant"}
                    </p>
                    <p className={`text-xs ${p.booking_ical_url ? "text-green-600" : "text-yellow-600"}`}>
                      Booking iCal : {p.booking_ical_url ? "✓ configuré" : "⚠ manquant"}
                    </p>
                  </div>
                  <Link
                    href={`/bien/${p.slug}`}
                    className="text-xs text-[#0077b6] hover:underline"
                    target="_blank"
                  >
                    Voir la page →
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle, Clock, XCircle, Calendar, Mail, Loader2 } from "lucide-react"
import Link from "next/link"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"

interface BookingData {
  id: string
  status: "pending" | "confirmed" | "cancelled"
  guest_name: string
  check_in: string
  check_out: string
  nights: number
  deposit_amount: number
  total_amount: number
  properties: { title: string } | null
}

const POLL_INTERVAL_MS = 2000
const POLL_TIMEOUT_MS = 30000

export default function ConfirmationPage() {
  const searchParams = useSearchParams()
  const bookingId = searchParams.get("booking_id")

  const [booking, setBooking] = useState<BookingData | null>(null)
  const [error, setError] = useState("")
  const [polling, setPolling] = useState(true)

  const fetchStatus = useCallback(async () => {
    if (!bookingId) return null
    try {
      const res = await fetch(`/api/booking-status?id=${bookingId}`)
      if (!res.ok) throw new Error("Réservation introuvable")
      return (await res.json()) as BookingData
    } catch {
      return null
    }
  }, [bookingId])

  useEffect(() => {
    if (!bookingId) {
      setError("Identifiant de réservation manquant.")
      setPolling(false)
      return
    }

    let stopped = false
    const deadline = Date.now() + POLL_TIMEOUT_MS

    async function poll() {
      const data = await fetchStatus()
      if (stopped) return

      if (data) {
        setBooking(data)
        if (data.status === "confirmed" || data.status === "cancelled") {
          setPolling(false)
          return
        }
      }

      if (Date.now() >= deadline) {
        // Timeout : on affiche quand même ce qu'on a (probablement pending)
        setPolling(false)
        return
      }

      setTimeout(poll, POLL_INTERVAL_MS)
    }

    poll()
    return () => { stopped = true }
  }, [bookingId, fetchStatus])

  return (
    <>
      <Navbar />
      <main className="min-h-screen flex items-center justify-center px-4 py-24">
        <div className="max-w-md w-full text-center">

          {/* État : chargement / polling */}
          {polling && (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 mb-6">
                <Loader2 className="text-[#0077b6] w-10 h-10 animate-spin" />
              </div>
              <h1 className="font-serif text-3xl font-bold text-[#4a4e69] mb-3">
                Confirmation en cours…
              </h1>
              <p className="text-gray-500">
                Votre paiement a été reçu. Nous finalisons votre réservation.
              </p>
            </>
          )}

          {/* État : confirmé */}
          {!polling && booking?.status === "confirmed" && (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
                <CheckCircle className="text-green-500 w-10 h-10" />
              </div>
              <h1 className="font-serif text-4xl font-bold text-[#4a4e69] mb-3">
                Réservation confirmée !
              </h1>
              <p className="text-gray-500 mb-8">
                Votre acompte a bien été reçu. Un email de confirmation vous a été envoyé.
              </p>
              <div className="bg-[#f4ebd0]/60 rounded-2xl p-6 text-left space-y-3 mb-8 border border-[#d4af37]/20">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="text-xs font-mono bg-white px-2 py-1 rounded border text-gray-400">
                    #{booking.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span>Numéro de réservation</span>
                </div>
                {booking.properties?.title && (
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="font-medium text-[#4a4e69]">{booking.properties.title}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Calendar size={16} className="text-[#0077b6] shrink-0" />
                  {booking.check_in} → {booking.check_out} · {booking.nights} nuit{booking.nights > 1 ? "s" : ""}
                </div>
                <div className="flex items-center justify-between text-sm pt-1 border-t border-[#d4af37]/20">
                  <span className="text-gray-500">Acompte payé</span>
                  <span className="font-bold text-[#4a4e69]">{booking.deposit_amount}€</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Solde à régler sur place</span>
                  <span className="font-medium text-gray-600">{booking.total_amount - booking.deposit_amount}€</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <Mail size={16} className="text-[#0077b6] shrink-0" />
                  Un email récapitulatif vous a été envoyé.
                </div>
              </div>
              <Link
                href="/"
                className="inline-block bg-[#0077b6] hover:bg-[#005f92] text-white font-semibold px-8 py-3 rounded-full transition shadow-md"
              >
                Retour à l&apos;accueil
              </Link>
            </>
          )}

          {/* État : timeout (pending après 30s) */}
          {!polling && booking?.status === "pending" && (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-50 mb-6">
                <Clock className="text-yellow-500 w-10 h-10" />
              </div>
              <h1 className="font-serif text-3xl font-bold text-[#4a4e69] mb-3">
                Paiement reçu
              </h1>
              <p className="text-gray-500 mb-8">
                Votre paiement a bien été traité. La confirmation de votre réservation
                arrive sous quelques instants — vérifiez votre email.
              </p>
              {booking && (
                <div className="bg-[#f4ebd0]/60 rounded-2xl p-4 text-left mb-8 border border-[#d4af37]/20">
                  <p className="text-sm text-gray-500">
                    Référence : <span className="font-mono font-medium">#{booking.id.slice(0, 8).toUpperCase()}</span>
                  </p>
                </div>
              )}
              <Link href="/" className="inline-block bg-[#0077b6] hover:bg-[#005f92] text-white font-semibold px-8 py-3 rounded-full transition shadow-md">
                Retour à l&apos;accueil
              </Link>
            </>
          )}

          {/* État : annulé */}
          {!polling && booking?.status === "cancelled" && (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 mb-6">
                <XCircle className="text-red-400 w-10 h-10" />
              </div>
              <h1 className="font-serif text-3xl font-bold text-[#4a4e69] mb-3">
                Réservation annulée
              </h1>
              <p className="text-gray-500 mb-8">
                Ces dates ont été réservées par un autre voyageur. Vous allez recevoir
                un email avec des alternatives disponibles.
              </p>
              <Link href="/" className="inline-block bg-[#0077b6] hover:bg-[#005f92] text-white font-semibold px-8 py-3 rounded-full transition shadow-md">
                Voir nos disponibilités
              </Link>
            </>
          )}

          {/* État : erreur */}
          {!polling && error && (
            <>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 mb-6">
                <XCircle className="text-red-400 w-10 h-10" />
              </div>
              <h1 className="font-serif text-3xl font-bold text-[#4a4e69] mb-3">
                Une erreur est survenue
              </h1>
              <p className="text-gray-500 mb-8">{error}</p>
              <Link href="/" className="inline-block bg-[#0077b6] hover:bg-[#005f92] text-white font-semibold px-8 py-3 rounded-full transition shadow-md">
                Retour à l&apos;accueil
              </Link>
            </>
          )}

        </div>
      </main>
      <Footer />
    </>
  )
}

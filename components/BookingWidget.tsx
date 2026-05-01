"use client"

import { useState, useCallback } from "react"
import { DayPicker, DateRange, type DayButtonProps } from "react-day-picker"
import { fr } from "date-fns/locale"
import { differenceInCalendarDays, format, addDays } from "date-fns"
import { ArrowRight, Star, X } from "lucide-react"
import type { Property } from "@/lib/types"
import type { PriceRule } from "@/lib/pricing"
import { getPriceForDate, calculateTotalWithRules } from "@/lib/pricing"
import { calculateTotal, countNightTypes } from "@/lib/utils"
import PaymentForm from "@/components/PaymentForm"
import "react-day-picker/dist/style.css"

interface Props {
  property: Property
  blockedDates?: Date[]
  propertyDbId?: string
  priceRules?: PriceRule[]
}

type Step = "booking" | "payment"

export default function BookingWidget({ property, blockedDates = [], propertyDbId, priceRules = [] }: Props) {
  const [step, setStep] = useState<Step>("booking")
  const [range, setRange] = useState<DateRange | undefined>()
  const [guestName, setGuestName] = useState("")
  const [guestEmail, setGuestEmail] = useState("")
  const [guestPhone, setGuestPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Données retournées par l'API payment-intent
  const [clientSecret, setClientSecret] = useState("")
  const [bookingId, setBookingId] = useState("")
  const [deposit, setDeposit] = useState(0)
  const [total, setTotal] = useState(0)

  const nights =
    range?.from && range?.to
      ? differenceInCalendarDays(range.to, range.from)
      : 0

  const hasVariablePrice =
    property.price_per_night_weekday !== property.price_per_night_weekend

  const totalCalc =
    range?.from && range?.to && nights > 0
      ? calculateTotalWithRules(
          format(range.from, "yyyy-MM-dd"),
          format(range.to, "yyyy-MM-dd"),
          priceRules,
          property.price_per_night_weekday,
          property.price_per_night_weekend
        )
      : 0

  const nightTypes =
    range?.from && range?.to && nights > 0
      ? countNightTypes(
          format(range.from, "yyyy-MM-dd"),
          format(range.to, "yyyy-MM-dd")
        )
      : null

  const depositCalc = Math.round(totalCalc / 2)

  const disabledDays = [
    { before: addDays(new Date(), 1) },
    ...blockedDates,
  ]

  const DayButtonWithPrice = useCallback(
    ({ day, modifiers, ...buttonProps }: DayButtonProps) => {
      const price = getPriceForDate(
        day.date,
        priceRules,
        property.price_per_night_weekday,
        property.price_per_night_weekend
      )
      const showPrice = !modifiers.disabled && !modifiers.booked

      return (
        <button
          {...buttonProps}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "52px",
            padding: "2px 0",
            gap: 0,
          }}
        >
          <span style={{ fontSize: "13px", fontWeight: 500, lineHeight: 1.2 }}>
            {day.date.getDate()}
          </span>
          <span style={{ fontSize: "10px", lineHeight: 1.2, color: showPrice ? "#9ca3af" : "transparent" }}>
            {price}€
          </span>
        </button>
      )
    },
    [property.price_per_night_weekday, property.price_per_night_weekend, priceRules]
  )

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault()
    if (!range?.from || !range?.to || nights < 1) {
      setError("Veuillez sélectionner vos dates de séjour.")
      return
    }
    if (nights > 90) {
      setError("La durée maximale de séjour est de 90 nuits.")
      return
    }
    if (!guestName || !guestEmail) {
      setError("Veuillez renseigner votre nom et email.")
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(guestEmail)) {
      setError("Veuillez saisir un email valide.")
      return
    }
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: propertyDbId ?? property.id,
          property_slug: property.slug,
          check_in: format(range.from, "yyyy-MM-dd"),
          check_out: format(range.to, "yyyy-MM-dd"),
          nights,
          guest_name: guestName,
          guest_email: guestEmail,
          guest_phone: guestPhone,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de la réservation.")

      setClientSecret(data.clientSecret)
      setBookingId(data.bookingId)
      setDeposit(data.deposit)
      setTotal(data.total)
      setStep("payment")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.")
    } finally {
      setLoading(false)
    }
  }

  // ── Étape 2 : Formulaire de paiement intégré ──────────────────
  if (step === "payment" && clientSecret) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-28">
        <h3 className="font-serif text-xl font-bold text-[#4a4e69] mb-5">
          Paiement sécurisé
        </h3>
        <PaymentForm
          clientSecret={clientSecret}
          bookingId={bookingId}
          deposit={deposit}
          total={total}
          onBack={() => setStep("booking")}
        />
      </div>
    )
  }

  // ── Étape 1 : Sélection dates + infos voyageur ────────────────
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sticky top-28">
      {/* Prix + note */}
      {(() => {
        const allPrices = [
          property.price_per_night_weekday,
          property.price_per_night_weekend,
          ...priceRules.map((r) => r.price_weekday),
          ...priceRules.map((r) => r.price_weekend),
        ]
        const minPrice = Math.min(...allPrices)
        const hasRules = priceRules.length > 0
        return (
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-baseline gap-1">
                {hasRules && <span className="text-sm text-gray-400 mr-0.5">À partir de</span>}
                <span className="text-3xl font-bold text-[#4a4e69]">
                  {hasRules ? minPrice : property.price_per_night_weekday}€
                </span>
                <span className="text-gray-400 text-sm">/ nuit</span>
              </div>
              {!hasRules && hasVariablePrice && (
                <p className="text-xs text-gray-400 mt-0.5">{property.price_per_night_weekend}€ ven–sam</p>
              )}
              {hasRules && (
                <p className="text-xs text-gray-400 mt-0.5">Voir les prix dans le calendrier</p>
              )}
            </div>
            {property.rating && (
              <div className="flex items-center gap-1 text-sm font-semibold text-[#4a4e69]">
                <Star size={14} className="fill-[#d4af37] text-[#d4af37]" />
                {property.rating.toFixed(1)}
                {property.review_count && (
                  <span className="text-xs font-normal text-gray-400">({property.review_count})</span>
                )}
              </div>
            )}
          </div>
        )
      })()}

      <form onSubmit={handleContinue} className="space-y-4">
        {/* Calendrier */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Dates du séjour
            </label>
            {range?.from && (
              <button
                type="button"
                onClick={() => setRange(undefined)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition"
              >
                <X size={12} /> Réinitialiser
              </button>
            )}
          </div>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <DayPicker
              mode="range"
              selected={range}
              onSelect={setRange}
              disabled={disabledDays}
              modifiers={{ booked: blockedDates }}
              modifiersClassNames={{ booked: "day-booked" }}
              locale={fr}
              numberOfMonths={1}
              className="p-2 text-sm"
              classNames={{ today: "text-[#0077b6] font-bold" }}
              components={{ DayButton: DayButtonWithPrice }}
            />
          </div>
        </div>

        {/* Résumé prix */}
        {nights > 0 && nightTypes && (
          <div className="bg-[#f4ebd0]/60 rounded-xl p-4 text-sm space-y-1.5">
            {priceRules.length === 0 ? (
              <>
                {nightTypes.weekday > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>
                      {property.price_per_night_weekday}€ × {nightTypes.weekday} nuit
                      {nightTypes.weekday > 1 ? "s" : ""} semaine
                    </span>
                    <span>{property.price_per_night_weekday * nightTypes.weekday}€</span>
                  </div>
                )}
                {nightTypes.weekend > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>
                      {property.price_per_night_weekend}€ × {nightTypes.weekend} nuit
                      {nightTypes.weekend > 1 ? "s" : ""} week-end
                    </span>
                    <span>{property.price_per_night_weekend * nightTypes.weekend}€</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex justify-between text-gray-600">
                <span>{nights} nuit{nights > 1 ? "s" : ""}</span>
                <span>{totalCalc}€</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-[#4a4e69] border-t border-[#d4af37]/30 pt-2 mt-1">
              <span>Acompte (50%)</span>
              <span>{depositCalc}€</span>
            </div>
            <p className="text-xs text-gray-400">
              Solde ({totalCalc - depositCalc}€) réglé sur place.
            </p>
          </div>
        )}

        {/* Coordonnées */}
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Votre nom complet *"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0077b6]/40"
            required
          />
          <input
            type="email"
            placeholder="Email *"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0077b6]/40"
            required
          />
          <input
            type="tel"
            placeholder="Téléphone (optionnel)"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0077b6]/40"
          />
        </div>

        {error && (
          <p className="text-red-500 text-xs bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || nights < 1}
          className="w-full bg-[#0077b6] hover:bg-[#005f92] disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-md"
        >
          {loading ? (
            <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5" />
          ) : (
            <>
              {nights > 0 ? `Continuer – ${depositCalc}€ d'acompte` : "Sélectionnez vos dates"}
              {nights > 0 && <ArrowRight size={16} />}
            </>
          )}
        </button>

        {/* Option secondaire : Stripe Checkout */}
        {nights > 0 && (
          <p className="text-center text-xs text-gray-400">
            ou{" "}
            <StripeCheckoutLink
              property={property}
              propertyDbId={propertyDbId}
              range={range}
              nights={nights}
              guestName={guestName}
              guestEmail={guestEmail}
              guestPhone={guestPhone}
            />
          </p>
        )}
      </form>
    </div>
  )
}

// Lien secondaire vers Stripe Checkout (ancienne méthode)
function StripeCheckoutLink({
  property, propertyDbId, range, nights, guestName, guestEmail, guestPhone,
}: {
  property: Property
  propertyDbId?: string
  range: DateRange | undefined
  nights: number
  guestName: string
  guestEmail: string
  guestPhone: string
}) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (!range?.from || !range?.to || !guestName || !guestEmail) return
    setLoading(true)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: propertyDbId ?? property.id,
          property_slug: property.slug,
          check_in: format(range.from, "yyyy-MM-dd"),
          check_out: format(range.to, "yyyy-MM-dd"),
          nights,
          guest_name: guestName,
          guest_email: guestEmail,
          guest_phone: guestPhone,
        }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="underline hover:text-[#0077b6] transition disabled:opacity-50"
    >
      {loading ? "Chargement…" : "payer via Stripe Checkout"}
    </button>
  )
}

"use client"

import { useState } from "react"
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { Lock, ArrowLeft } from "lucide-react"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface Props {
  clientSecret: string
  bookingId: string
  deposit: number
  total: number
  onBack: () => void
}

function CheckoutForm({ deposit, total, bookingId, onBack }: Omit<Props, "clientSecret">) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError("")

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${appUrl}/confirmation?booking_id=${bookingId}`,
      },
    })

    if (stripeError) {
      setError(stripeError.message ?? "Le paiement a échoué. Veuillez réessayer.")
      setLoading(false)
    }
    // Si succès, Stripe redirige vers return_url automatiquement
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Résumé */}
      <div className="bg-[#f4ebd0]/60 rounded-xl p-4 text-sm">
        <div className="flex justify-between text-gray-600 mb-1">
          <span>Total séjour</span>
          <span>{total}€</span>
        </div>
        <div className="flex justify-between font-bold text-[#4a4e69] border-t border-[#d4af37]/30 pt-2">
          <span>Acompte à payer (50%)</span>
          <span>{deposit}€</span>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Le solde ({total - deposit}€) sera réglé sur place à votre arrivée.
        </p>
      </div>

      {/* Formulaire carte Stripe (style Airbnb) */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Informations de paiement
        </label>
        <div className="border border-gray-200 rounded-xl p-4 bg-white">
          <PaymentElement
            options={{
              layout: "tabs",
              defaultValues: {},
            }}
          />
        </div>
      </div>

      {error && (
        <p className="text-red-500 text-xs bg-red-50 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !stripe}
        className="w-full bg-[#0077b6] hover:bg-[#005f92] disabled:bg-gray-300 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-md"
      >
        {loading ? (
          <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5" />
        ) : (
          `Confirmer et payer – ${deposit}€`
        )}
      </button>

      <p className="flex items-center justify-center gap-1 text-xs text-gray-400">
        <Lock size={11} /> Paiement 100% sécurisé · Cryptage SSL
      </p>

      <button
        type="button"
        onClick={onBack}
        className="w-full flex items-center justify-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition"
      >
        <ArrowLeft size={14} /> Modifier mes informations
      </button>
    </form>
  )
}

export default function PaymentForm({ clientSecret, bookingId, deposit, total, onBack }: Props) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#0077b6",
            colorBackground: "#ffffff",
            colorText: "#4a4e69",
            colorDanger: "#ef4444",
            fontFamily: "Inter, sans-serif",
            borderRadius: "8px",
          },
        },
        locale: "fr",
      }}
    >
      <CheckoutForm
        deposit={deposit}
        total={total}
        bookingId={bookingId}
        onBack={onBack}
      />
    </Elements>
  )
}

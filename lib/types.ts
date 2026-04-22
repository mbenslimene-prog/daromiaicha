export interface Property {
  id: string
  slug: string
  title: string
  type: string
  description: string
  capacity_guests: number
  capacity_bedrooms: number
  capacity_bathrooms: number
  size_m2?: number
  beds_breakdown?: string
  price_per_night_weekday: number
  price_per_night_weekend: number
  rating?: number
  review_count?: number
  photos: string[]
  amenities: string[]
  airbnb_ical_url?: string
  booking_ical_url?: string
  host_id?: string
  active: boolean
  created_at?: string
}

export interface Booking {
  id: string
  property_id: string
  property?: Property
  guest_name: string
  guest_email: string
  guest_phone?: string
  check_in: string
  check_out: string
  nights: number
  total_amount: number
  deposit_amount: number
  status: "pending" | "confirmed" | "cancelled"
  stripe_payment_intent_id?: string
  stripe_session_id?: string
  source: "direct" | "airbnb" | "booking"
  created_at: string
}

export interface BlockedDate {
  id: string
  property_id: string
  start_date: string
  end_date: string
  source: string
  external_uid?: string
}

export interface CheckoutPayload {
  property_id: string
  property_slug?: string   // slug statique — permet de retrouver le bien sans aller-retour DB
  check_in: string
  check_out: string
  nights: number
  guest_name: string
  guest_email: string
  guest_phone?: string
}

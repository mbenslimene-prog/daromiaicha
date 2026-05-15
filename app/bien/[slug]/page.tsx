import { notFound } from "next/navigation"
import { eachDayOfInterval, parseISO } from "date-fns"
import type { Metadata } from "next"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import BookingWidget from "@/components/BookingWidget"
import PhotoGallery from "@/components/PhotoGallery"
import { PROPERTIES } from "@/lib/properties"
import { createServiceClient } from "@/lib/supabase"
import { syncPropertyIcalWithTimeout } from "@/lib/ical-sync"
import type { PriceRule } from "@/lib/pricing"
import { Users, BedDouble, Bath, MapPin, CheckCircle, Maximize2, Star } from "lucide-react"

export async function generateStaticParams() {
  return PROPERTIES.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const property = PROPERTIES.find((p) => p.slug === slug)
  if (!property) return {}

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://daromiaicha.mbstn.com"
  const url = `${base}/bien/${property.slug}`
  const description = `Location ${property.title} à Kerkouane, Hammam Ghézez, Cap Bon, Tunisie. ${property.capacity_guests} voyageurs, ${property.capacity_bedrooms} chambres, 100m de la plage. À partir de ${property.price_per_night_weekday}€/nuit. Réservation directe en ligne.`

  return {
    title: property.title,
    description,
    keywords: `location ${property.title}, location Kerkouane, maison bord de mer Cap Bon, Hammam Ghézez, Dar Allouche, Kélibia, El Houaria, vacances Tunisie`,
    alternates: { canonical: url },
    openGraph: {
      title: `${property.title} – Location Kerkouane, Cap Bon`,
      description,
      url,
      type: "website",
      locale: "fr_FR",
      images: [
        {
          url: property.photos[0],
          width: 1200,
          height: 800,
          alt: property.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${property.title} – Location Kerkouane`,
      description,
      images: [property.photos[0]],
    },
  }
}

interface PropertyDbData {
  dbId: string | null
  blockedDates: Date[]
  priceRules: PriceRule[]
}

async function getPropertyDbData(propertySlug: string): Promise<PropertyDbData> {
  try {
    const db = createServiceClient()

    const { data: dbProperty } = await db
      .from("properties")
      .select("id")
      .eq("slug", propertySlug)
      .single()

    if (!dbProperty) return { dbId: null, blockedDates: [], priceRules: [] }

    await syncPropertyIcalWithTimeout(dbProperty.id, 2500)

    const [{ data: blockedRanges }, { data: confirmedBookings }, { data: priceRulesData }] = await Promise.all([
      db.from("blocked_dates").select("start_date, end_date").eq("property_id", dbProperty.id),
      db.from("bookings").select("check_in, check_out").eq("property_id", dbProperty.id).eq("status", "confirmed"),
      db.from("price_rules").select("*").eq("property_id", dbProperty.id).order("start_date"),
    ])

    const dates: Date[] = []

    for (const range of blockedRanges ?? []) {
      eachDayOfInterval({ start: parseISO(range.start_date), end: parseISO(range.end_date) })
        .forEach((d) => dates.push(d))
    }
    for (const booking of confirmedBookings ?? []) {
      eachDayOfInterval({ start: parseISO(booking.check_in), end: parseISO(booking.check_out) })
        .forEach((d) => dates.push(d))
    }

    return { dbId: dbProperty.id, blockedDates: dates, priceRules: (priceRulesData ?? []) as PriceRule[] }
  } catch {
    return { dbId: null, blockedDates: [], priceRules: [] }
  }
}

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const property = PROPERTIES.find((p) => p.slug === slug)
  if (!property) notFound()

  const { dbId, blockedDates, priceRules } = await getPropertyDbData(property.slug)

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://daromiaicha.mbstn.com"
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: property.title,
    description: property.description,
    url: `${base}/bien/${property.slug}`,
    image: property.photos[0],
    priceRange: `À partir de ${property.price_per_night_weekday}€/nuit`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Kerkouane, Hammam Ghézez",
      addressLocality: "Kerkouane",
      addressRegion: "Nabeul",
      addressCountry: "TN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 36.897,
      longitude: 11.099,
    },
    ...(property.rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: property.rating,
        reviewCount: property.review_count ?? 1,
        bestRating: 5,
      },
    }),
    amenityFeature: property.amenities.map((a) => ({
      "@type": "LocationFeatureSpecification",
      name: a,
      value: true,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      <div className="pt-20">
        <PhotoGallery photos={property.photos} title={property.title} />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#0077b6] mb-1">
              {property.type}
            </p>
            <h1 className="font-serif text-4xl font-bold text-[#4a4e69] mb-3">
              {property.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-gray-500 mb-6">
              <p className="flex items-center gap-2">
                <MapPin size={14} className="text-[#0077b6]" />
                Kerkouane, Hammam Ghézez, Cap Bon, Tunisie
              </p>
              {property.rating && (
                <span className="flex items-center gap-1 text-sm font-semibold text-[#4a4e69]">
                  <Star size={14} className="fill-[#d4af37] text-[#d4af37]" />
                  {property.rating.toFixed(1)}
                  {property.review_count ? (
                    <span className="font-normal text-gray-400">({property.review_count} avis)</span>
                  ) : null}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-5 text-sm text-gray-600 border-y border-gray-100 py-5 mb-8">
              <span className="flex items-center gap-2">
                <Users size={16} className="text-[#0077b6]" />
                {property.capacity_guests} voyageurs
              </span>
              <span className="flex items-center gap-2">
                <BedDouble size={16} className="text-[#0077b6]" />
                {property.capacity_bedrooms} chambre{property.capacity_bedrooms > 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-2">
                <Bath size={16} className="text-[#0077b6]" />
                {property.capacity_bathrooms} salle{property.capacity_bathrooms > 1 ? "s" : ""} de bain
              </span>
              {property.size_m2 && (
                <span className="flex items-center gap-2">
                  <Maximize2 size={16} className="text-[#0077b6]" />
                  {property.size_m2} m²
                </span>
              )}
              {property.beds_breakdown && (
                <span className="flex items-center gap-2">🛏 {property.beds_breakdown}</span>
              )}
            </div>

            <h2 className="font-serif text-xl font-bold text-[#4a4e69] mb-3">
              À propos de ce logement
            </h2>
            <p className="text-gray-600 leading-relaxed mb-10">{property.description}</p>

            <h2 className="font-serif text-xl font-bold text-[#4a4e69] mb-4">À proximité</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 mb-10">
              {[
                { emoji: "🏛️", label: "Site archéologique de Kerkouane (UNESCO)", dist: "5 km" },
                { emoji: "🏖️", label: "Plage de Hammam Ghézez", dist: "5 km" },
                { emoji: "🏖️", label: "Plage de Dar Allouche", dist: "8 km" },
                { emoji: "🏰", label: "Fort de Kélibia", dist: "10 km" },
                { emoji: "🌊", label: "Grottes d'El Houaria", dist: "15 km" },
                { emoji: "🛍️", label: "Souk de Nabeul & médina d'Hammamet", dist: "60–70 km" },
                { emoji: "💦", label: "Sources chaudes de Korbous", dist: "73 km" },
                { emoji: "🏙️", label: "Tunis & Sidi Bou Saïd", dist: "120 km" },
              ].map(({ emoji, label, dist }) => (
                <li key={label} className="flex items-start gap-2">
                  <span>{emoji}</span>
                  <span>{label} — <span className="text-[#0077b6] font-medium">{dist}</span></span>
                </li>
              ))}
            </ul>

            <h2 className="font-serif text-xl font-bold text-[#4a4e69] mb-4">Équipements</h2>
            <ul className="grid grid-cols-2 gap-3 text-sm text-gray-600">
              {property.amenities.map((a) => (
                <li key={a} className="flex items-center gap-2">
                  <CheckCircle size={14} className="text-[#0077b6] shrink-0" />
                  {a}
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-1">
            {/* dbId = UUID Supabase du bien — utilisé directement dans les API de réservation */}
            <BookingWidget
              property={property}
              blockedDates={blockedDates}
              propertyDbId={dbId ?? undefined}
              priceRules={priceRules}
            />
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}

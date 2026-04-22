import Link from "next/link"
import Image from "next/image"
import { Users, BedDouble, Bath, ArrowRight } from "lucide-react"
import type { Property } from "@/lib/types"

export default function PropertyCard({ property }: { property: Property }) {
  return (
    <Link
      href={`/bien/${property.slug}`}
      className="group bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col"
    >
      {/* Photo */}
      <div className="relative h-72 overflow-hidden">
        <Image
          src={property.photos[0]}
          alt={property.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold text-[#4a4e69] shadow">
          À partir de {property.price_per_night_weekday}€ / nuit
        </div>
      </div>

      {/* Infos */}
      <div className="p-6 flex flex-col flex-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#0077b6] mb-1">
          {property.type}
        </p>
        <h3 className="font-serif text-2xl font-bold text-[#4a4e69] mb-3">
          {property.title}
        </h3>

        {/* Capacité */}
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <Users size={14} /> {property.capacity_guests} voyageurs
          </span>
          <span className="flex items-center gap-1">
            <BedDouble size={14} /> {property.capacity_bedrooms} ch.
          </span>
          <span className="flex items-center gap-1">
            <Bath size={14} /> {property.capacity_bathrooms} sdb.
          </span>
        </div>

        <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">
          {property.description}
        </p>

        <hr className="border-gray-100 mb-4" />

        <span className="flex items-center gap-2 text-[#0077b6] font-medium group-hover:text-[#d4af37] transition text-sm">
          Voir les disponibilités <ArrowRight size={16} />
        </span>
      </div>
    </Link>
  )
}

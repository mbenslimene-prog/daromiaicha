import Image from "next/image"
import Navbar from "@/components/Navbar"
import PropertyCard from "@/components/PropertyCard"
import RegionSection from "@/components/RegionSection"
import Footer from "@/components/Footer"
import { PROPERTIES } from "@/lib/properties"

export default function HomePage() {
  return (
    <>
      <Navbar  />

      {/* Hero */}
      <section id="accueil" className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            // src="https://madainproject.com/content/media/collect/kerkouane_tunisia_182378.jpg"
            src="https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1c/bc/b6/5c/ruins-of-kerkouane.jpg?w=1400&h=-1&s=1"
            alt="Ruines puniques de Kerkouane au bord de la Méditerranée"
            fill
            priority
            className="object-cover hero-zoom"
            sizes="100vw"
            unoptimized
          />
          <div className="absolute inset-0 bg-black/45" />
        </div>

        <div className="relative z-10 text-center text-white px-4 max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#f4ebd0] mb-4">
            Kerkouane · Cap Bon · Tunisie
          </p>
          <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6 drop-shadow-lg leading-tight">
            L&apos;évasion à l&apos;état pur.
          </h1>
          <p className="text-xl md:text-2xl mb-10 font-light drop-shadow-md text-[#f4ebd0]">
            Votre refuge entre mer azur et cité antique à Kerkouane.
          </p>
          <a
            href="#logements"
            className="inline-block bg-white text-[#4a4e69] font-semibold px-8 py-4 rounded-full text-lg hover:bg-[#f4ebd0] hover:text-[#0077b6] transition shadow-xl transform hover:-translate-y-1"
          >
            Découvrir nos maisons
          </a>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-white/70 rounded-full" />
          </div>
        </div>
      </section>

      {/* Logements */}
      <section id="logements" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#0077b6] mb-2">
            Nos propriétés
          </p>
          <h2 className="font-serif text-4xl font-bold text-[#4a4e69] mb-4">
            Nos Joyaux en Bord de Mer
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Choisissez entre le design épuré de notre maison moderne ou le charme
            chaleureux de notre espace cosy. Chaque bien est à quelques minutes des
            plages et du site punique de Kerkouane.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {PROPERTIES.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </section>

      <RegionSection />
      <Footer />
    </>
  )
}

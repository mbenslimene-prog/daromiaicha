import Image from "next/image"
import { Landmark, Waves, Sun } from "lucide-react"

const KERKOUANE_PHOTOS = [
  {
    src: "https://madainproject.com/content/media/collect/kerkouane_tunisia_182378.jpg",
    alt: "Ruines puniques de Kerkouane au bord de la Méditerranée",
  },
  {
    src: "https://madainproject.com/content/media/collect/kerkouane_karkwan_courtyard_house_819212.jpg",
    alt: "Maison à cour centrale – Kerkouane",
  },
  {
    src: "https://madainproject.com/content/media/collect/tanit_maison_kerkouane_karkwan_tanit_house_810281.jpg",
    alt: "Maison de Tanit – mosaïque punique",
  },
]

const HIGHLIGHTS = [
  {
    icon: Landmark,
    title: "Site UNESCO",
    text: "La cité punique de Kerkouane est la seule ville phénico-punique entièrement préservée au monde — abandonnée en 250 av. J.‑C., jamais reconstruite.",
  },
  {
    icon: Waves,
    title: "Plages vierges",
    text: "Des kilomètres de plage de sable blanc à Hammam Ghézez, eaux turquoise cristallines, loin du tourisme de masse.",
  },
  {
    icon: Sun,
    title: "Cap Bon authentique",
    text: "Agrumes, oliviers, vignobles et villages de pêcheurs. La Tunisie authentique, à seulement 1h30 de Tunis.",
  },
]

export default function RegionSection() {
  return (
    <section id="region" className="py-24 bg-[#f4ebd0]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Titre */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#0077b6] mb-2">
            La destination
          </p>
          <h2 className="font-serif text-4xl font-bold text-[#4a4e69] mb-4">
            Kerkouane & Cap Bon
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Séjournez à deux pas d&apos;un site archéologique phénicien classé au Patrimoine
            mondial de l&apos;UNESCO, entre mer azur et nature préservée.
          </p>
        </div>

        {/* Galerie photos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16">
          {KERKOUANE_PHOTOS.map((photo) => (
            <div key={photo.src} className="relative h-56 rounded-2xl overflow-hidden shadow-md">
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                className="object-cover hover:scale-105 transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 33vw"
                unoptimized
              />
            </div>
          ))}
        </div>

        {/* Points forts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#0077b6]/10 text-[#0077b6] mb-4">
                <Icon size={22} />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#4a4e69] mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

"use client"

import { useState } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight, Grid2X2 } from "lucide-react"

interface Props {
  photos: string[]
  title: string
}

export default function PhotoGallery({ photos, title }: Props) {
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)

  function prev() {
    setLightbox((i) => (i === null ? null : (i - 1 + photos.length) % photos.length))
  }
  function next() {
    setLightbox((i) => (i === null ? null : (i + 1) % photos.length))
  }

  // Grille hero : première photo grande, 4 autres en carré
  const hero = photos[0]
  const thumbs = photos.slice(1, 5)

  return (
    <>
      {/* Hero grid (5 photos) */}
      <div className="relative">
        <div className="grid grid-cols-4 grid-rows-2 gap-1 h-[55vh]">
          {/* Photo principale */}
          <div
            className="col-span-2 row-span-2 relative overflow-hidden cursor-pointer"
            onClick={() => setLightbox(0)}
          >
            <Image
              src={hero}
              alt={`${title} – photo principale`}
              fill
              priority
              className="object-cover hover:scale-105 transition-transform duration-500"
              sizes="50vw"
            />
          </div>

          {/* 4 vignettes */}
          {thumbs.map((src, i) => (
            <div
              key={src}
              className="relative overflow-hidden cursor-pointer"
              onClick={() => setLightbox(i + 1)}
            >
              <Image
                src={src}
                alt={`${title} – photo ${i + 2}`}
                fill
                className="object-cover hover:scale-105 transition-transform duration-500"
                sizes="25vw"
              />
            </div>
          ))}
        </div>

        {/* Bouton "Toutes les photos" */}
        <button
          onClick={() => setShowAll(true)}
          className="absolute bottom-4 right-4 bg-white/90 backdrop-blur hover:bg-white text-[#4a4e69] font-semibold text-sm px-4 py-2 rounded-lg shadow flex items-center gap-2 transition"
        >
          <Grid2X2 size={15} />
          Toutes les photos ({photos.length})
        </button>
      </div>

      {/* Modal grille complète */}
      {showAll && (
        <div className="fixed inset-0 z-[200] bg-black/80 overflow-y-auto">
          <div className="max-w-5xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-white font-serif text-2xl font-bold">{title}</h2>
              <button
                onClick={() => setShowAll(false)}
                className="text-white hover:text-gray-300 transition"
              >
                <X size={28} />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {photos.map((src, i) => (
                <div
                  key={`${src}-${i}`}
                  className="relative h-52 overflow-hidden rounded-lg cursor-pointer"
                  onClick={() => { setShowAll(false); setLightbox(i) }}
                >
                  <Image
                    src={src}
                    alt={`${title} – photo ${i + 1}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); prev() }}
            className="absolute left-4 text-white hover:text-gray-300 bg-black/40 p-2 rounded-full"
          >
            <ChevronLeft size={32} />
          </button>

          <div
            className="relative w-full max-w-4xl h-[80vh] mx-16"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photos[lightbox]}
              alt={`${title} – photo ${lightbox + 1}`}
              fill
              className="object-contain"
              sizes="90vw"
            />
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); next() }}
            className="absolute right-4 text-white hover:text-gray-300 bg-black/40 p-2 rounded-full"
          >
            <ChevronRight size={32} />
          </button>

          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <X size={28} />
          </button>

          <p className="absolute bottom-4 text-white/60 text-sm">
            {lightbox + 1} / {photos.length}
          </p>
        </div>
      )}
    </>
  )
}

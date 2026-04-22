"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"
import Image from "next/image"

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll)
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={`fixed w-full top-0 z-50 transition-all duration-300 ${
        scrolled ? "glass-nav shadow-sm border-b border-gray-100" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-20">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo_DOA.png"
            alt="Dar Omi Aicha"
            width={44}
            height={44}
            className="rounded-full object-cover"
          />
          <span
            className={`font-serif text-2xl font-bold transition-colors ${
              scrolled ? "text-[#4a4e69]" : "text-white"
            }`}
          >
            Dar Omi Aicha
          </span>
        </Link>

        {/* Nav desktop */}
        <nav className="hidden md:flex gap-8 font-medium">
          {[
            { label: "Accueil", href: "/#accueil" },
            { label: "Nos logements", href: "/#logements" },
            { label: "La région", href: "/#region" },
            { label: "Contact", href: "/#contact" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`hover:text-[#0077b6] transition ${
                scrolled ? "text-gray-600" : "text-white/90"
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="/#logements"
            className="bg-[#0077b6] hover:bg-[#005f92] text-white px-5 py-2 rounded-full font-medium transition shadow-md"
          >
            Réserver
          </a>
        </div>

        {/* Mobile burger */}
        <button
          className={`md:hidden ${scrolled ? "text-[#4a4e69]" : "text-white"}`}
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden glass-nav border-t border-gray-100 px-6 py-4 space-y-3">
          {[
            { label: "Accueil", href: "/#accueil" },
            { label: "Nos logements", href: "/#logements" },
            { label: "La région", href: "/#region" },
            { label: "Contact", href: "/#contact" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block text-gray-700 hover:text-[#0077b6] font-medium"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <a
            href="/#logements"
            className="block w-full text-center bg-[#0077b6] text-white py-2 rounded-full font-medium mt-2"
            onClick={() => setOpen(false)}
          >
            Réserver
          </a>
        </div>
      )}
    </header>
  )
}

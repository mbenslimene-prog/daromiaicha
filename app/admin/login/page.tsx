"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Waves, Lock } from "lucide-react"

export default function AdminLogin() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push("/admin")
    } else {
      setError("Mot de passe incorrect.")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#4a4e69] px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Waves className="text-[#0077b6] w-7 h-7" />
          <span className="font-serif text-2xl font-bold text-[#4a4e69]">Admin</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0077b6]/40"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0077b6] hover:bg-[#005f92] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition"
          >
            {loading ? (
              <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5" />
            ) : (
              <>
                <Lock size={16} /> Se connecter
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

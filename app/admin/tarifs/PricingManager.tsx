"use client"

import { useState } from "react"
import { Plus, Trash2, Pencil, X, Check } from "lucide-react"
import type { Property } from "@/lib/types"
import type { PriceRule } from "@/lib/pricing"

interface Props {
  properties: Property[]
  initialRules: PriceRule[]
}

const EMPTY_FORM = {
  label: "",
  start_date: "",
  end_date: "",
  price_weekday: "",
  price_weekend: "",
}

export default function PricingManager({ properties, initialRules }: Props) {
  const [rules, setRules] = useState<PriceRule[]>(initialRules)
  const [selectedPropertyId, setSelectedPropertyId] = useState(properties[0]?.host_id ?? "")
  const [selectedDbId, setSelectedDbId] = useState("")
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const filteredRules = selectedDbId
    ? rules.filter((r) => r.property_id === selectedDbId)
    : rules

  async function loadRules(dbId: string) {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setError("")
    const res = await fetch(`/api/admin/price-rules?property_id=${dbId}`)
    if (res.ok) {
      const data = await res.json()
      setRules((prev) => [...prev.filter((r) => r.property_id !== dbId), ...data])
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDbId) { setError("Sélectionnez un logement."); return }
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/admin/price-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          property_id: selectedDbId,
          label: form.label,
          start_date: form.start_date,
          end_date: form.end_date,
          price_weekday: Number(form.price_weekday),
          price_weekend: Number(form.price_weekend),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRules((prev) => [...prev, data])
      setForm(EMPTY_FORM)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette règle de tarif ?")) return
    const res = await fetch(`/api/admin/price-rules?id=${id}`, { method: "DELETE" })
    if (res.ok) setRules((prev) => prev.filter((r) => r.id !== id))
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingId) return
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/admin/price-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          label: editForm.label,
          start_date: editForm.start_date,
          end_date: editForm.end_date,
          price_weekday: Number(editForm.price_weekday),
          price_weekend: Number(editForm.price_weekend),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRules((prev) => prev.map((r) => r.id === editingId ? data : r))
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur")
    } finally {
      setLoading(false)
    }
  }

  function startEdit(rule: PriceRule) {
    setEditingId(rule.id)
    setEditForm({
      label: rule.label,
      start_date: rule.start_date,
      end_date: rule.end_date,
      price_weekday: String(rule.price_weekday),
      price_weekend: String(rule.price_weekend),
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#4a4e69]">Gestion des tarifs</h1>
            <p className="text-gray-500 text-sm mt-1">Définissez des prix spéciaux par période</p>
          </div>
          <a href="/admin" className="text-sm text-[#0077b6] hover:underline">← Dashboard</a>
        </div>

        {/* Sélection du logement */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Logement</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {properties.map((p) => {
              const dbId = p.host_id ?? ""
              return (
                <button
                  key={p.id}
                  onClick={() => { setSelectedPropertyId(p.id); setSelectedDbId(dbId); loadRules(dbId) }}
                  className={`text-left px-4 py-3 rounded-xl border-2 transition ${
                    selectedPropertyId === p.id
                      ? "border-[#0077b6] bg-[#0077b6]/5 text-[#0077b6]"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                  }`}
                >
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Défaut : {p.price_per_night_weekday}€/nuit · {p.price_per_night_weekend}€ ven-sam
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Formulaire d'ajout */}
        {selectedDbId && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Plus size={16} className="text-[#0077b6]" /> Ajouter une règle tarifaire
            </h2>
            <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="sm:col-span-2 lg:col-span-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">Libellé</label>
                <input
                  type="text"
                  placeholder="Ex : Été 2026"
                  value={form.label}
                  onChange={(e) => setForm({ ...form, label: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0077b6]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Date début</label>
                <input
                  type="date"
                  required
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0077b6]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Date fin</label>
                <input
                  type="date"
                  required
                  value={form.end_date}
                  min={form.start_date ? (() => { const d = new Date(form.start_date); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10) })() : ""}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0077b6]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Prix semaine (€/nuit)</label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="Ex : 120"
                  value={form.price_weekday}
                  onChange={(e) => setForm({ ...form, price_weekday: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0077b6]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Prix week-end (€/nuit)</label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="Ex : 150"
                  value={form.price_weekend}
                  onChange={(e) => setForm({ ...form, price_weekend: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0077b6]/30"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0077b6] hover:bg-[#005f92] disabled:bg-gray-300 text-white font-semibold py-2 px-4 rounded-lg transition text-sm"
                >
                  {loading ? "Enregistrement…" : "Ajouter"}
                </button>
              </div>
            </form>
            {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
          </div>
        )}

        {/* Liste des règles */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-700">
              Règles actives
              {filteredRules.length > 0 && (
                <span className="ml-2 text-xs font-normal text-gray-400">({filteredRules.length})</span>
              )}
            </h2>
          </div>

          {filteredRules.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-400 text-sm">
              Aucune règle tarifaire. Sélectionnez un logement et ajoutez des règles.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left">Libellé</th>
                  <th className="px-6 py-3 text-left">Période</th>
                  <th className="px-6 py-3 text-right">Sem. (€)</th>
                  <th className="px-6 py-3 text-right">W-E (€)</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredRules
                  .sort((a, b) => a.start_date.localeCompare(b.start_date))
                  .map((rule) => (
                    <tr key={rule.id} className="hover:bg-gray-50 transition">
                      {editingId === rule.id ? (
                        <td colSpan={5} className="px-6 py-3">
                          <form onSubmit={handleEdit} className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end">
                            <input
                              type="text"
                              value={editForm.label}
                              onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                              className="border border-gray-200 rounded px-2 py-1 text-sm"
                              placeholder="Libellé"
                            />
                            <input
                              type="date"
                              required
                              value={editForm.start_date}
                              onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                              className="border border-gray-200 rounded px-2 py-1 text-sm"
                            />
                            <input
                              type="date"
                              required
                              value={editForm.end_date}
                              min={editForm.start_date ? (() => { const d = new Date(editForm.start_date); d.setDate(d.getDate() + 1); return d.toISOString().slice(0, 10) })() : ""}
                              onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                              className="border border-gray-200 rounded px-2 py-1 text-sm"
                            />
                            <input
                              type="number"
                              min="0"
                              required
                              value={editForm.price_weekday}
                              onChange={(e) => setEditForm({ ...editForm, price_weekday: e.target.value })}
                              className="border border-gray-200 rounded px-2 py-1 text-sm"
                              placeholder="Semaine"
                            />
                            <input
                              type="number"
                              min="0"
                              required
                              value={editForm.price_weekend}
                              onChange={(e) => setEditForm({ ...editForm, price_weekend: e.target.value })}
                              className="border border-gray-200 rounded px-2 py-1 text-sm"
                              placeholder="W-E"
                            />
                            <div className="col-span-2 sm:col-span-5 flex gap-2">
                              <button type="submit" disabled={loading} className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs">
                                <Check size={12} /> Enregistrer
                              </button>
                              <button type="button" onClick={() => setEditingId(null)} className="flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs">
                                <X size={12} /> Annuler
                              </button>
                            </div>
                          </form>
                        </td>
                      ) : (
                        <>
                          <td className="px-6 py-4 font-medium text-gray-700">{rule.label}</td>
                          <td className="px-6 py-4 text-gray-500">
                            {rule.start_date} → {rule.end_date}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-[#4a4e69]">{rule.price_weekday}€</td>
                          <td className="px-6 py-4 text-right font-semibold text-[#4a4e69]">{rule.price_weekend}€</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => startEdit(rule)}
                                className="p-1.5 rounded hover:bg-blue-50 text-[#0077b6] transition"
                                title="Modifier"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleDelete(rule.id)}
                                className="p-1.5 rounded hover:bg-red-50 text-red-400 transition"
                                title="Supprimer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { X } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

function Field({ label, value, onChange, type = 'text', required = false, placeholder = '' }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-text2 mb-1">
        {label} {required && <span className="text-red">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-bg border border-border2 text-text rounded-lg px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-green focus:ring-2 focus:ring-green-dim transition-all"
      />
    </div>
  )
}

export default function CreateRestaurantModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    restaurant_name: '',
    restaurant_phone: '',
    address: '',
    city: '',
    plan: 'trial',
    expiry_date: '',
    owner_name: '',
    owner_email: '',
    owner_phone: '',
    owner_password: '',
  })
  const [saving, setSaving] = useState(false)

  function set(key, val) { setForm((p) => ({ ...p, [key]: val })) }

  async function handleCreate() {
    if (!form.restaurant_name || !form.owner_name || !form.owner_email || !form.owner_password) {
      return toast.error('Restaurant name, owner name, email and password are required.')
    }
    setSaving(true)
    try {
      await api.post('/api/admin/restaurants', form)
      toast.success(`Restaurant "${form.restaurant_name}" created!`)
      onCreated()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create restaurant')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 overflow-y-auto py-8">
      <div className="bg-surface rounded-xl shadow-lg w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="font-bold font-display text-text">New Restaurant</h2>
            <p className="text-xs text-muted mt-0.5">Create a restaurant and its owner account</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors"><X size={18} /></button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Restaurant info */}
          <div>
            <p className="text-xs font-semibold text-text2 uppercase tracking-wide mb-3">Restaurant Details</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Field label="Restaurant Name" value={form.restaurant_name} onChange={(v) => set('restaurant_name', v)} required placeholder="Khan's Kitchen" />
              </div>
              <Field label="Phone" value={form.restaurant_phone} onChange={(v) => set('restaurant_phone', v)} placeholder="+91 98765 43210" />
              <Field label="City" value={form.city} onChange={(v) => set('city', v)} placeholder="Mumbai" />
              <div className="col-span-2">
                <Field label="Address" value={form.address} onChange={(v) => set('address', v)} placeholder="123, MG Road" />
              </div>
            </div>
          </div>

          {/* License */}
          <div>
            <p className="text-xs font-semibold text-text2 uppercase tracking-wide mb-3">License</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-text2 mb-1">Plan</label>
                <select
                  value={form.plan}
                  onChange={(e) => set('plan', e.target.value)}
                  className="w-full bg-bg border border-border2 text-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green transition-all"
                >
                  <option value="trial">Trial</option>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <Field label="Expiry Date" type="date" value={form.expiry_date} onChange={(v) => set('expiry_date', v)} />
            </div>
          </div>

          {/* Owner account */}
          <div>
            <p className="text-xs font-semibold text-text2 uppercase tracking-wide mb-3">Owner Account</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Owner Name" value={form.owner_name} onChange={(v) => set('owner_name', v)} required placeholder="John Doe" />
              <Field label="Owner Phone" value={form.owner_phone} onChange={(v) => set('owner_phone', v)} placeholder="+91 98765 43210" />
              <Field label="Owner Email" type="email" value={form.owner_email} onChange={(v) => set('owner_email', v)} required placeholder="owner@restaurant.com" />
              <Field label="Password" type="password" value={form.owner_password} onChange={(v) => set('owner_password', v)} required placeholder="Min 8 characters" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-text3 hover:text-text bg-surface2 rounded-lg transition-all">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="px-5 py-2 text-sm font-semibold text-white bg-green hover:bg-green2 rounded-lg transition-all hover:-translate-y-px disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create Restaurant'}
          </button>
        </div>
      </div>
    </div>
  )
}

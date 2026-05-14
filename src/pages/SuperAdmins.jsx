import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, ShieldCheck, CheckCircle, XCircle } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

function Field({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-text2 mb-1">{label}</label>
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

function AdminModal({ admin, onClose, onSaved }) {
  const isEdit = !!admin
  const [form, setForm] = useState({ name: admin?.name || '', email: admin?.email || '', password: '' })
  const [saving, setSaving] = useState(false)

  function set(k, v) { setForm((p) => ({ ...p, [k]: v })) }

  async function handleSave() {
    if (!isEdit && (!form.name || !form.email || !form.password))
      return toast.error('Name, email and password are required.')
    setSaving(true)
    try {
      if (isEdit) {
        await api.patch(`/api/admin/super-admins/${admin.id}`, { name: form.name, password: form.password || undefined })
        toast.success('Admin updated')
      } else {
        await api.post('/api/admin/users/super-admin', form)
        toast.success('Super admin created')
      }
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-surface rounded-xl shadow-lg w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-bold font-display text-text">{isEdit ? 'Edit Admin' : 'New Super Admin'}</h3>
          <button onClick={onClose} className="text-muted hover:text-text"><X size={18} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <Field label="Full Name" value={form.name} onChange={(v) => set('name', v)} placeholder="Jane Smith" />
          {!isEdit && <Field label="Email" type="email" value={form.email} onChange={(v) => set('email', v)} placeholder="admin@billbyte.com" />}
          <Field label={isEdit ? 'New Password (leave blank to keep)' : 'Password'} type="password" value={form.password} onChange={(v) => set('password', v)} placeholder="Min 8 characters" />
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-text3 hover:text-text bg-surface2 rounded-lg transition-all">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-semibold text-white bg-green hover:bg-green2 rounded-lg transition-all disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SuperAdmins() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const currentUser = useAuthStore((s) => s.user)

  async function load() {
    setLoading(true)
    try {
      const { data } = await api.get('/api/admin/super-admins')
      setAdmins(data)
    } catch { toast.error('Failed to load admins') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function toggleActive(admin) {
    try {
      await api.patch(`/api/admin/super-admins/${admin.id}`, { is_active: !admin.is_active })
      toast.success(admin.is_active ? 'Admin deactivated' : 'Admin activated')
      load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Action failed') }
  }

  async function handleDelete(admin) {
    if (!confirm(`Delete super admin "${admin.name}"? This cannot be undone.`)) return
    try {
      await api.delete(`/api/admin/super-admins/${admin.id}`)
      toast.success('Admin deleted')
      load()
    } catch (err) { toast.error(err.response?.data?.detail || 'Delete failed') }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display text-text">Super Admins</h1>
          <p className="text-xs text-muted mt-0.5">Manage admin console access</p>
        </div>
        <button
          onClick={() => setModal('create')}
          className="inline-flex items-center gap-2 bg-green hover:bg-green2 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all hover:-translate-y-px shadow-sm"
        >
          <Plus size={15} /> Add Admin
        </button>
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[500px]">
          <thead>
            <tr className="border-b border-border bg-surface2">
              <th className="text-left px-5 py-3 text-xs font-semibold text-text3 uppercase tracking-wide">Name</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-text3 uppercase tracking-wide">Email</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-text3 uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-text3 uppercase tracking-wide">Created</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-12 text-muted text-sm">Loading...</td></tr>
            ) : admins.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-muted text-sm">No admins found.</td></tr>
            ) : admins.map((a) => (
              <tr key={a.id} className="hover:bg-surface2 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-green-dim flex items-center justify-center flex-shrink-0">
                      <ShieldCheck size={13} className="text-green" />
                    </div>
                    <span className="font-semibold text-text">{a.name}</span>
                    {a.id === currentUser?.id && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-dim text-green">You</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3 text-text3">{a.email}</td>
                <td className="px-5 py-3">
                  {a.is_active
                    ? <span className="inline-flex items-center gap-1 text-green text-xs font-semibold"><CheckCircle size={12} /> Active</span>
                    : <span className="inline-flex items-center gap-1 text-red text-xs font-semibold"><XCircle size={12} /> Inactive</span>
                  }
                </td>
                <td className="px-5 py-3 text-text3 text-xs">
                  {a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}
                </td>
                <td className="px-5 py-3">
                  {a.id !== currentUser?.id && (
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => setModal(a)} className="p-1.5 rounded-lg bg-surface2 text-text3 hover:text-green hover:bg-green-dim transition-all" title="Edit">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => toggleActive(a)} className={`p-1.5 rounded-lg bg-surface2 transition-all ${a.is_active ? 'text-text3 hover:text-amber hover:bg-amber-dim' : 'text-text3 hover:text-green hover:bg-green-dim'}`} title={a.is_active ? 'Deactivate' : 'Activate'}>
                        {a.is_active ? <XCircle size={13} /> : <CheckCircle size={13} />}
                      </button>
                      <button onClick={() => handleDelete(a)} className="p-1.5 rounded-lg bg-surface2 text-text3 hover:text-red hover:bg-red-dim transition-all" title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {modal && (
        <AdminModal
          admin={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}

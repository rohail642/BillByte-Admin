import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, CheckCircle, XCircle, Megaphone } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

function AnnouncementModal({ ann, onClose, onSaved }) {
  const isEdit = !!ann
  const [form, setForm] = useState({
    title: ann?.title || '',
    body: ann?.body || '',
    is_active: ann?.is_active ?? true,
  })
  const [saving, setSaving] = useState(false)

  function set(k, v) { setForm((p) => ({ ...p, [k]: v })) }

  async function handleSave() {
    if (!form.title || !form.body) return toast.error('Title and body are required.')
    setSaving(true)
    try {
      if (isEdit) {
        await api.patch(`/api/admin/announcements/${ann.id}`, form)
        toast.success('Announcement updated')
      } else {
        await api.post('/api/admin/announcements', form)
        toast.success('Announcement created')
      }
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-surface rounded-xl shadow-lg w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-bold font-display text-text">{isEdit ? 'Edit Announcement' : 'New Announcement'}</h3>
          <button onClick={onClose} className="text-muted hover:text-text"><X size={18} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-text2 mb-1">Title</label>
            <input
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Scheduled maintenance on Sunday"
              className="w-full bg-bg border border-border2 text-text rounded-lg px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-green focus:ring-2 focus:ring-green-dim transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-text2 mb-1">Message</label>
            <textarea
              value={form.body}
              onChange={(e) => set('body', e.target.value)}
              rows={4}
              placeholder="Write your announcement here..."
              className="w-full bg-bg border border-border2 text-text rounded-lg px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-green focus:ring-2 focus:ring-green-dim transition-all resize-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_active" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="rounded" />
            <label htmlFor="is_active" className="text-sm text-text2">Active (visible to restaurants)</label>
          </div>
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

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const { data } = await api.get('/api/admin/announcements')
      setAnnouncements(data)
    } catch { toast.error('Failed to load announcements') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function toggleActive(ann) {
    try {
      await api.patch(`/api/admin/announcements/${ann.id}`, { is_active: !ann.is_active })
      toast.success(ann.is_active ? 'Announcement deactivated' : 'Announcement activated')
      load()
    } catch { toast.error('Action failed') }
  }

  async function handleDelete(ann) {
    if (!confirm(`Delete "${ann.title}"?`)) return
    try {
      await api.delete(`/api/admin/announcements/${ann.id}`)
      toast.success('Deleted')
      load()
    } catch { toast.error('Delete failed') }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display text-text">Announcements</h1>
          <p className="text-xs text-muted mt-0.5">Broadcast messages to all restaurant owners</p>
        </div>
        <button
          onClick={() => setModal('create')}
          className="inline-flex items-center gap-2 bg-green hover:bg-green2 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all hover:-translate-y-px shadow-sm"
        >
          <Plus size={15} /> New Announcement
        </button>
      </div>

      {loading ? (
        <p className="text-center py-12 text-muted text-sm">Loading...</p>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Megaphone size={32} className="text-muted" />
          <p className="text-sm text-muted">No announcements yet. Create one to broadcast to all restaurants.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className={`bg-surface border rounded-xl p-5 shadow-sm transition-all ${a.is_active ? 'border-border' : 'border-border opacity-60'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-text">{a.title}</p>
                    {a.is_active
                      ? <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-dim text-green"><CheckCircle size={9} /> Live</span>
                      : <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface2 text-muted"><XCircle size={9} /> Inactive</span>
                    }
                  </div>
                  <p className="text-sm text-text3 whitespace-pre-wrap">{a.body}</p>
                  <p className="text-[11px] text-muted mt-2">
                    {a.created_at ? new Date(a.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
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
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <AnnouncementModal
          ann={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load() }}
        />
      )}
    </div>
  )
}

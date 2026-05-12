import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2, CheckCircle, XCircle, Plus, Pencil, X, LogIn, Clock, AlertTriangle, Copy, Mail, BellOff, Bell, ToggleLeft, ToggleRight } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

const planColors = {
  trial: 'bg-amber-dim text-amber',
  starter: 'bg-blue-dim text-blue',
  pro: 'bg-purple-dim text-purple',
  enterprise: 'bg-green-dim text-green',
}

const PLANS = ['trial', 'starter', 'pro', 'enterprise']
const ROLES = ['owner', 'manager', 'cashier', 'waiter', 'kitchen']

// ── Input helper ─────────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = 'text', readOnly = false }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-text2 mb-1">{label}</label>
      <input
        type={type}
        value={value || ''}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={readOnly}
        className={`w-full border rounded-lg px-3 py-2 text-sm transition-all focus:outline-none ${
          readOnly
            ? 'bg-surface2 border-border text-text3 cursor-default'
            : 'bg-bg border-border2 text-text focus:border-green focus:ring-2 focus:ring-green-dim'
        }`}
      />
    </div>
  )
}

// ── Account modal ─────────────────────────────────────────────────────────────
function AccountModal({ restaurantId, account, defaultRole, onClose, onSaved }) {
  const isEdit = !!account
  const allowOwner = defaultRole === 'owner'
  const [form, setForm] = useState({
    name: account?.name || '',
    email: account?.email || '',
    phone: account?.phone || '',
    role: account?.role || defaultRole || 'cashier',
    password: '',
  })
  const [saving, setSaving] = useState(false)

  function set(key, val) { setForm((p) => ({ ...p, [key]: val })) }

  async function handleSave() {
    if (!form.name || !form.email) return toast.error('Name and email are required.')
    if (!isEdit && !form.password) return toast.error('Password is required.')
    setSaving(true)
    try {
      if (isEdit) {
        await api.patch(`/api/admin/restaurants/${restaurantId}/accounts/${account.id}`, form)
        toast.success('Account updated')
      } else {
        await api.post(`/api/admin/restaurants/${restaurantId}/accounts`, form)
        toast.success('Account created')
      }
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save account')
    } finally {
      setSaving(false)
    }
  }

  const roleOptions = allowOwner ? ROLES : ROLES.filter((r) => r !== 'owner')

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-surface rounded-xl shadow-lg w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h3 className="font-bold font-display text-text">{isEdit ? 'Edit Account' : 'New Account'}</h3>
          <button onClick={onClose} className="text-muted hover:text-text"><X size={18} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <Field label="Full Name" value={form.name} onChange={(v) => set('name', v)} />
          <Field label="Email" type="email" value={form.email} onChange={(v) => set('email', v)} />
          <Field label="Phone" value={form.phone} onChange={(v) => set('phone', v)} />
          <div>
            <label className="block text-xs font-semibold text-text2 mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
              className="w-full bg-bg border border-border2 text-text rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green transition-all"
            >
              {roleOptions.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
          <Field
            label={isEdit ? 'New Password (leave blank to keep current)' : 'Password'}
            type="password"
            value={form.password}
            onChange={(v) => set('password', v)}
          />
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-text3 hover:text-text bg-surface2 rounded-lg transition-all">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-white bg-green hover:bg-green2 rounded-lg transition-all disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── License history helpers ───────────────────────────────────────────────────
const planLabel = (p) => ({ trial: 'Trial', starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise' }[p] || (p || '—'))
const planCls   = (p) => ({ trial: 'bg-amber-dim text-amber', starter: 'bg-blue-dim text-blue', pro: 'bg-purple-dim text-purple', enterprise: 'bg-green-dim text-green' }[p] || 'bg-surface2 text-text3')
const fmtDate   = (s) => s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

function historyConfig(entry) {
  const d = entry.details || {}
  const changes = d.changes || {}
  const plan = d.plan || changes.plan?.to

  switch (entry.action) {
    case 'create_restaurant':
      return { dot: 'bg-green', planCls: 'bg-amber-dim text-amber', plan: 'Trial', label: 'Restaurant Registered', sub: 'Trial period started' }

    case 'update_license': {
      if (changes.plan) {
        return {
          dot: 'bg-purple', planCls: planCls(changes.plan.to), plan: planLabel(changes.plan.to),
          label: `Plan: ${planLabel(changes.plan.from)} → ${planLabel(changes.plan.to)}`,
          sub: changes.expiry_date ? `Expiry set to ${fmtDate(changes.expiry_date.to)}` : null,
        }
      }
      if (changes.expiry_date) {
        return {
          dot: 'bg-blue', planCls: planCls(plan), plan: planLabel(plan),
          label: 'Expiry updated',
          sub: `${fmtDate(changes.expiry_date.from)} → ${fmtDate(changes.expiry_date.to)}`,
        }
      }
      return { dot: 'bg-blue', planCls: planCls(plan), plan: planLabel(plan), label: 'License updated', sub: null }
    }

    case 'bulk_change_plan':
      return { dot: 'bg-purple', planCls: planCls(d.plan), plan: planLabel(d.plan), label: `Plan changed to ${planLabel(d.plan)}`, sub: null }

    case 'bulk_extend_trial': {
      const days = d.days || 14
      return {
        dot: 'bg-amber', planCls: planCls(plan), plan: planLabel(plan),
        label: `Trial extended +${days} day${days !== 1 ? 's' : ''}`,
        sub: d.new_expiry ? `New expiry: ${fmtDate(d.new_expiry)}` : null,
      }
    }

    case 'bulk_activate':
      return { dot: 'bg-green', planCls: 'bg-green-dim text-green', plan: 'Activated', label: 'Restaurant Activated', sub: null }

    case 'bulk_suspend':
      return { dot: 'bg-red', planCls: 'bg-red-dim text-red', plan: 'Suspended', label: 'Restaurant Suspended', sub: null }

    case 'restaurant_auto_deactivated':
      return { dot: 'bg-red', planCls: 'bg-red-dim text-red', plan: 'Expired', label: 'Auto-Deactivated', sub: 'Trial expired — access suspended' }

    default:
      return { dot: 'bg-surface3', planCls: 'bg-surface2 text-text3', plan: '—', label: entry.action.replace(/_/g, ' '), sub: null }
  }
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function RestaurantDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [tab, setTab] = useState('details')
  const [accountRole, setAccountRole] = useState('owner')
  const [accountModal, setAccountModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [impersonateModal, setImpersonateModal] = useState(null)
  const [activityLogs, setActivityLogs] = useState([])

  // Details form
  const [details, setDetails] = useState({})
  // License form
  const [license, setLicense] = useState({})
  // Modules form
  const [modules, setModules] = useState({ inventory: true, reports: true, crm: true, staff: true })
  const [savingModules, setSavingModules] = useState(false)
  // Notes
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  // License history
  const [licenseHistory, setLicenseHistory] = useState([])

  async function load() {
    try {
      const { data: d } = await api.get(`/api/admin/restaurants/${id}`)
      setData(d)
      setDetails({ name: d.name, phone: d.phone, address: d.address, city: d.city, gstin: d.gstin, fssai: d.fssai, gst_rate: d.gst_rate })
      setLicense({ plan: d.plan, expiry_date: d.trial_ends_at ? d.trial_ends_at.split('T')[0] : '' })
      setModules(d.enabled_modules || { inventory: true, reports: true, crm: true, staff: true })
      setNotes(d.notes || '')
    } catch {
      toast.error('Failed to load restaurant')
    }
  }

  useEffect(() => { load(); loadActivity(); loadLicenseHistory() }, [id])

  async function loadActivity() {
    try {
      const { data: d } = await api.get('/api/admin/activity-log', { params: { limit: 50 } })
      setActivityLogs(d.logs.filter((l) => l.target_id === Number(id)))
    } catch {}
  }

  async function loadLicenseHistory() {
    try {
      const { data: d } = await api.get(`/api/admin/restaurants/${id}/license-history`)
      setLicenseHistory(d)
    } catch {}
  }

  async function toggleActive() {
    const endpoint = data.is_active ? 'suspend' : 'activate'
    try {
      await api.patch(`/api/admin/restaurants/${id}/${endpoint}`)
      toast.success(data.is_active ? 'Restaurant suspended' : 'Restaurant activated')
      setData((d) => ({ ...d, is_active: !d.is_active }))
    } catch { toast.error('Action failed') }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${data.name}" permanently? This cannot be undone.`)) return
    try {
      await api.delete(`/api/admin/restaurants/${id}`)
      toast.success('Restaurant deleted')
      navigate('/restaurants')
    } catch { toast.error('Delete failed') }
  }

  async function saveDetails() {
    setSaving(true)
    try {
      await api.patch(`/api/admin/restaurants/${id}/details`, details)
      toast.success('Details saved')
      load()
    } catch { toast.error('Failed to save') } finally { setSaving(false) }
  }


  async function saveLicense() {
    setSaving(true)
    try {
      await api.patch(`/api/admin/restaurants/${id}/license`, license)
      toast.success('License updated')
      load()
      loadLicenseHistory()
    } catch { toast.error('Failed to update license') } finally { setSaving(false) }
  }

  async function saveNotes() {
    setSavingNotes(true)
    try {
      await api.patch(`/api/admin/restaurants/${id}/notes`, { notes })
      toast.success('Notes saved')
    } catch { toast.error('Failed to save notes') } finally { setSavingNotes(false) }
  }

  async function saveModules() {
    setSavingModules(true)
    try {
      await api.patch(`/api/admin/restaurants/${id}/modules`, modules)
      toast.success('Modules updated')
    } catch { toast.error('Failed to update modules') } finally { setSavingModules(false) }
  }

  async function toggleReminders() {
    try {
      const { data: res } = await api.patch(`/api/admin/restaurants/${id}/reminders-toggle`)
      setData((d) => ({ ...d, reminders_enabled: res.reminders_enabled }))
      toast.success(res.reminders_enabled ? 'Reminders enabled' : 'Reminders disabled')
    } catch { toast.error('Failed to update reminders') }
  }

  function buildMailto() {
    const owners = (data?.accounts || []).filter((a) => a.role === 'owner')
    if (!owners.length) return null
    const to = owners.map((o) => o.email).join(',')
    const expiryStr = data.trial_ends_at ? data.trial_ends_at.split('T')[0] : 'soon'
    const subject = encodeURIComponent(`BillByte License Renewal – ${data.name}`)
    const body = encodeURIComponent(
`Hi ${owners[0]?.name || 'there'},

This is a reminder that your BillByte subscription for ${data.name} is expiring on ${expiryStr}.

To continue using BillByte without interruption, please renew your license at the earliest.

Feel free to reply to this email or contact us directly.

Best regards,
BillByte Team`
    )
    return `mailto:${to}?subject=${subject}&body=${body}`
  }

  async function toggleAccountActive(user) {
    try {
      await api.patch(`/api/admin/restaurants/${id}/accounts/${user.id}`, { is_active: !user.is_active })
      toast.success(user.is_active ? 'Account deactivated' : 'Account activated')
      load()
    } catch { toast.error('Failed to update account') }
  }

  async function deleteAccount(userId) {
    if (!confirm('Delete this account permanently?')) return
    try {
      await api.delete(`/api/admin/restaurants/${id}/accounts/${userId}`)
      toast.success('Account deleted')
      load()
    } catch { toast.error('Delete failed') }
  }

  async function handleImpersonate() {
    try {
      const { data: d } = await api.post(`/api/admin/restaurants/${id}/impersonate`)
      setImpersonateModal(d)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Impersonate failed')
    }
  }

  if (!data) return <div className="flex items-center justify-center h-40 text-muted text-sm">Loading...</div>

  const accountsByRole = ROLES.reduce((acc, r) => {
    acc[r] = (data.accounts || []).filter((u) => u.role === r)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      {/* Back */}
      <button onClick={() => navigate('/restaurants')} className="inline-flex items-center gap-1.5 text-sm text-text3 hover:text-text transition-colors">
        <ArrowLeft size={15} /> Back to Restaurants
      </button>

      {/* Header */}
      <div className="bg-surface border border-border rounded-xl shadow-sm px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold font-display text-text">{data.name}</h1>
                <span className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${data.is_active ? 'bg-green-dim text-green' : 'bg-red-dim text-red'}`}>
                  {data.is_active ? 'Active' : 'Suspended'}
                </span>
                {data.expiry_status && data.expiry_status !== 'ok' && (
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    data.expiry_status === 'expired' ? 'bg-red-dim text-red' :
                    data.expiry_status === 'critical' ? 'bg-amber-dim text-amber' : 'bg-blue-dim text-blue'
                  }`}>
                    <Clock size={10} />
                    {data.expiry_status === 'expired' ? 'Trial Expired' :
                     data.days_left === 0 ? 'Expires Today' : `${data.days_left}d left`}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted mt-0.5">
                {data.city || 'No city'} · Created {data.created_at ? new Date(data.created_at).toLocaleDateString() : '—'}
                {data.total_orders > 0 && ` · ${data.total_orders} orders · ₹${Math.round(data.total_revenue).toLocaleString()} revenue`}
              </p>
              {data.onboarding && (
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-[10px] text-muted uppercase tracking-wide font-semibold">Onboarding</p>
                  <div className="flex items-center gap-1">
                    {[
                      { key: 'has_menu', label: 'Menu' },
                      { key: 'has_gstin', label: 'GSTIN' },
                      { key: 'has_address', label: 'Address' },
                      { key: 'has_tables', label: 'Tables' },
                      { key: 'has_integrations', label: 'Integrations' },
                    ].map(({ key, label }) => (
                      <span key={key} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${data.onboarding[key] ? 'bg-green-dim text-green' : 'bg-surface2 text-muted'}`}>
                        {label}
                      </span>
                    ))}
                    <span className="text-[10px] font-bold text-text3 ml-1">{data.onboarding.score}/5</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Reminders toggle */}
            <button
              onClick={toggleReminders}
              title={data.reminders_enabled ? 'Disable email reminders' : 'Enable email reminders'}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all ${
                data.reminders_enabled ? 'bg-green-dim text-green' : 'bg-surface2 text-text3'
              }`}
            >
              {data.reminders_enabled ? <Bell size={12} /> : <BellOff size={12} />}
              {data.reminders_enabled ? 'Reminders On' : 'Reminders Off'}
            </button>
            {/* Send reminder */}
            {data.reminders_enabled && buildMailto() && (
              <a
                href={buildMailto()}
                className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg bg-blue-dim text-blue hover:bg-blue/15 transition-all"
                title="Send expiry reminder email"
              >
                <Mail size={14} /> Send Reminder
              </a>
            )}
            <button
              onClick={handleImpersonate}
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg bg-purple-dim text-purple hover:bg-purple/15 transition-all"
              title="Login as owner"
            >
              <LogIn size={14} /> Impersonate
            </button>
            <button
              onClick={toggleActive}
              className={`text-sm font-semibold px-4 py-1.5 rounded-lg transition-all ${data.is_active ? 'bg-red-dim text-red hover:bg-red/15' : 'bg-green-dim text-green hover:bg-green-mid'}`}
            >
              {data.is_active ? 'Suspend' : 'Activate'}
            </button>
            <button
              onClick={handleDelete}
              className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-red-dim text-red hover:bg-red/15 transition-all inline-flex items-center gap-1.5"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {['details', 'license', 'modules', 'accounts', 'activity'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-semibold capitalize transition-all border-b-2 -mb-px ${
              tab === t ? 'border-green text-green' : 'border-transparent text-text3 hover:text-text'
            }`}
          >
            {t}{t === 'activity' && activityLogs.length > 0 ? ` (${activityLogs.length})` : ''}
          </button>
        ))}
      </div>

      {/* ── Details Tab ── */}
      {tab === 'details' && (
        <div className="bg-surface border border-border rounded-xl shadow-sm p-6 space-y-5">
          <p className="text-xs font-semibold text-text2 uppercase tracking-wide">Restaurant Information</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Restaurant Name" value={details.name} onChange={(v) => setDetails((p) => ({ ...p, name: v }))} />
            <Field label="Phone" value={details.phone} onChange={(v) => setDetails((p) => ({ ...p, phone: v }))} />
            <Field label="City" value={details.city} onChange={(v) => setDetails((p) => ({ ...p, city: v }))} />
            <Field label="GST Rate (%)" type="number" value={details.gst_rate} onChange={(v) => setDetails((p) => ({ ...p, gst_rate: v }))} />
            <div className="col-span-2">
              <Field label="Address" value={details.address} onChange={(v) => setDetails((p) => ({ ...p, address: v }))} />
            </div>
            <Field label="GSTIN" value={details.gstin} onChange={(v) => setDetails((p) => ({ ...p, gstin: v }))} />
            <Field label="FSSAI" value={details.fssai} onChange={(v) => setDetails((p) => ({ ...p, fssai: v }))} />
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={saveDetails} disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-green hover:bg-green2 rounded-lg transition-all disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Details'}
            </button>
          </div>

          {/* Internal Notes */}
          <div className="pt-2 border-t border-border space-y-3">
            <p className="text-xs font-semibold text-text2 uppercase tracking-wide">Internal Notes</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Private notes about this restaurant (not visible to the owner)..."
              className="w-full bg-bg border border-border2 text-text rounded-lg px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-green focus:ring-2 focus:ring-green-dim transition-all resize-none"
            />
            <div className="flex justify-end">
              <button onClick={saveNotes} disabled={savingNotes} className="px-4 py-1.5 text-sm font-semibold text-white bg-green hover:bg-green2 rounded-lg transition-all disabled:opacity-50">
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>

          {/* Owner Accounts */}
          <div className="pt-2 border-t border-border space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-text2 uppercase tracking-wide">Owner Accounts</p>
              <button
                onClick={() => setAccountModal({ type: 'create', role: 'owner' })}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-green hover:text-green2 bg-green-dim px-3 py-1.5 rounded-lg transition-all"
              >
                <Plus size={13} /> Add Owner
              </button>
            </div>
            {accountsByRole['owner'].length === 0 ? (
              <p className="text-sm text-muted py-2">No owner accounts yet.</p>
            ) : (
              <div className="space-y-2">
                {accountsByRole['owner'].map((owner) => (
                  <div key={owner.id} className="flex items-center gap-4 bg-surface2 rounded-xl px-4 py-3">
                    <div className="flex-1 grid grid-cols-3 gap-3">
                      <div>
                        <p className="text-[10px] font-semibold text-text3 uppercase tracking-wide mb-0.5">Name</p>
                        <p className="text-sm font-medium text-text">{owner.name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-text3 uppercase tracking-wide mb-0.5">Email</p>
                        <p className="text-sm text-text">{owner.email}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-text3 uppercase tracking-wide mb-0.5">Phone</p>
                        <p className="text-sm text-text">{owner.phone || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => toggleAccountActive(owner)}
                        title={owner.is_active ? 'Deactivate account' : 'Activate account'}
                        className={`p-1.5 rounded-lg transition-all ${owner.is_active ? 'text-green bg-green-dim hover:bg-green/20' : 'text-muted bg-surface2 hover:text-green hover:bg-green-dim'}`}
                      >
                        {owner.is_active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                      </button>
                      <button
                        onClick={() => setAccountModal(owner)}
                        className="p-1.5 rounded-lg bg-surface text-text3 hover:text-green hover:bg-green-dim transition-all"
                        title="Edit owner"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => deleteAccount(owner.id)}
                        className="p-1.5 rounded-lg bg-surface text-text3 hover:text-red hover:bg-red-dim transition-all"
                        title="Delete owner"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── License Tab ── */}
      {tab === 'license' && (
        <div className="bg-surface border border-border rounded-xl shadow-sm p-6 space-y-5">
          <p className="text-xs font-semibold text-text2 uppercase tracking-wide">License & Plan</p>

          <div>
            <label className="block text-xs font-semibold text-text2 mb-3">Plan Type</label>
            <div className="grid grid-cols-4 gap-3">
              {PLANS.map((p) => (
                <button
                  key={p}
                  onClick={() => setLicense((l) => ({ ...l, plan: p }))}
                  className={`py-3 rounded-xl border-2 text-sm font-bold capitalize transition-all ${
                    license.plan === p
                      ? 'border-green bg-green-dim text-green'
                      : 'border-border text-text3 hover:border-border2 hover:bg-surface2'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="License Start (Registration Date)" value={data.created_at ? data.created_at.split('T')[0] : ''} readOnly />
            <Field label="License Expiry" type="date" value={license.expiry_date} onChange={(v) => setLicense((l) => ({ ...l, expiry_date: v }))} />
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={saveLicense} disabled={saving} className="px-5 py-2 text-sm font-semibold text-white bg-green hover:bg-green2 rounded-lg transition-all disabled:opacity-50">
              {saving ? 'Saving...' : 'Update License'}
            </button>
          </div>

          {/* License History */}
          {licenseHistory.length > 0 && (
            <div className="pt-4 border-t border-border">
              <p className="text-xs font-semibold text-text2 uppercase tracking-wide mb-4">License History</p>
              <div className="relative">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
                <div className="space-y-0">
                  {[...licenseHistory].reverse().map((entry, i) => {
                    const cfg = historyConfig(entry)
                    return (
                      <div key={entry.id ?? i} className="relative flex gap-4 pb-5 last:pb-0">
                        <div className={`relative z-10 w-3.5 h-3.5 rounded-full flex-shrink-0 mt-1 border-2 border-surface ${cfg.dot}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2 flex-wrap">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${cfg.planCls}`}>
                                {cfg.plan}
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-text leading-snug">{cfg.label}</p>
                                {cfg.sub && <p className="text-[11px] text-muted mt-0.5">{cfg.sub}</p>}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-[11px] text-muted whitespace-nowrap">{fmtDate(entry.date)}</p>
                              {entry.by && entry.by !== 'System' && (
                                <p className="text-[10px] text-muted opacity-60">by {entry.by}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Modules Tab ── */}
      {tab === 'modules' && (
        <div className="bg-surface border border-border rounded-xl shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-sm font-bold text-text">Feature Modules</h2>
            <p className="text-xs text-muted mt-0.5">Control which sections this restaurant can access. Changes take effect on their next login.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'inventory', label: 'Inventory', desc: 'Stock management, low-stock alerts & expiry tracking', color: 'bg-orange-dim text-orange' },
              { key: 'reports',   label: 'Reports',   desc: 'Sales analytics, revenue reports & trends',           color: 'bg-purple-dim text-purple' },
              { key: 'crm',       label: 'CRM',       desc: 'Customer profiles, visit history & loyalty points',   color: 'bg-blue-dim text-blue' },
              { key: 'staff',     label: 'Staff',     desc: 'Team accounts, roles & access management',            color: 'bg-green-dim text-green' },
            ].map(({ key, label, desc, color }) => (
              <div
                key={key}
                onClick={() => setModules((m) => ({ ...m, [key]: !m[key] }))}
                className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  modules[key]
                    ? 'border-green bg-green-dim/30'
                    : 'border-border bg-surface2 opacity-60'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold ${color}`}>
                  {label[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text">{label}</p>
                  <p className="text-[11px] text-muted mt-0.5 leading-relaxed">{desc}</p>
                </div>
                <div className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors mt-0.5 ${modules[key] ? 'bg-green' : 'bg-surface3'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${modules[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <button
              onClick={saveModules}
              disabled={savingModules}
              className="px-5 py-2 text-sm font-semibold text-white bg-green hover:bg-green2 rounded-lg transition-all disabled:opacity-50"
            >
              {savingModules ? 'Saving…' : 'Save Modules'}
            </button>
          </div>
        </div>
      )}

      {/* ── Accounts Tab ── */}
      {tab === 'accounts' && (
        <div className="space-y-4">
          {/* Role sub-tabs */}
          <div className="flex gap-1">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setAccountRole(r)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                  accountRole === r ? 'bg-green text-white' : 'bg-surface border border-border text-text3 hover:bg-surface2'
                }`}
              >
                {r} ({accountsByRole[r].length})
              </button>
            ))}
          </div>

          <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <p className="text-xs font-semibold text-text2 uppercase tracking-wide capitalize">{accountRole} Accounts</p>
              <button
                onClick={() => setAccountModal({ type: 'create', role: accountRole })}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-green hover:text-green2 bg-green-dim px-3 py-1.5 rounded-lg transition-all"
              >
                <Plus size={13} /> Add {accountRole}
              </button>
            </div>

            {accountsByRole[accountRole].length === 0 ? (
              <p className="text-center py-10 text-muted text-sm">No {accountRole} accounts yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface2">
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-text3 uppercase tracking-wide">Name</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-text3 uppercase tracking-wide">Email</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-text3 uppercase tracking-wide">Phone</th>
                    <th className="text-left px-5 py-2.5 text-xs font-semibold text-text3 uppercase tracking-wide">Status</th>
                    <th className="px-5 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {accountsByRole[accountRole].map((u) => (
                    <tr key={u.id} className="hover:bg-surface2 transition-colors">
                      <td className="px-5 py-3 font-medium text-text">{u.name}</td>
                      <td className="px-5 py-3 text-text3">{u.email}</td>
                      <td className="px-5 py-3 text-text3">{u.phone || '—'}</td>
                      <td className="px-5 py-3">
                        {u.is_active
                          ? <span className="inline-flex items-center gap-1 text-green text-xs font-semibold"><CheckCircle size={12} /> Active</span>
                          : <span className="inline-flex items-center gap-1 text-red text-xs font-semibold"><XCircle size={12} /> Inactive</span>
                        }
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => toggleAccountActive(u)}
                            title={u.is_active ? 'Deactivate account' : 'Activate account'}
                            className={`p-1.5 rounded-lg transition-all ${u.is_active ? 'text-green bg-green-dim hover:bg-green/20' : 'text-muted bg-surface2 hover:text-green hover:bg-green-dim'}`}
                          >
                            {u.is_active ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                          </button>
                          <button
                            onClick={() => setAccountModal(u)}
                            className="p-1.5 rounded-lg bg-surface2 text-text3 hover:text-green hover:bg-green-dim transition-all"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => deleteAccount(u.id)}
                            className="p-1.5 rounded-lg bg-surface2 text-text3 hover:text-red hover:bg-red-dim transition-all"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── Activity Tab ── */}
      {tab === 'activity' && (
        <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <p className="text-xs font-semibold text-text2 uppercase tracking-wide">Activity Log</p>
          </div>
          {activityLogs.length === 0 ? (
            <p className="text-center py-10 text-muted text-sm">No activity recorded yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {activityLogs.map((l) => (
                <div key={l.id} className="flex items-start gap-3 px-5 py-3">
                  <div className="w-2 h-2 rounded-full bg-green mt-1.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text">
                      <span className="font-semibold">{l.admin_name || 'Admin'}</span>
                      {' '}<span className="text-text3">{l.action.replace(/_/g, ' ')}</span>
                    </p>
                    {l.details && Object.keys(l.details).length > 0 && (
                      <p className="text-[11px] text-muted mt-0.5">
                        {Object.entries(l.details).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                      </p>
                    )}
                  </div>
                  <p className="text-[11px] text-muted flex-shrink-0">
                    {new Date(l.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Account modal */}
      {accountModal && (
        <AccountModal
          restaurantId={id}
          account={accountModal.type === 'create' ? null : accountModal}
          defaultRole={accountModal.type === 'create' ? accountModal.role : accountModal.role}
          onClose={() => setAccountModal(null)}
          onSaved={() => { setAccountModal(null); load() }}
        />
      )}

      {/* Impersonate modal */}
      {impersonateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-surface rounded-xl shadow-lg w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-bold font-display text-text">Impersonate Restaurant</h3>
              <button onClick={() => setImpersonateModal(null)} className="text-muted hover:text-text"><X size={18} /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-sm text-text3">
                Accessing <span className="font-semibold text-text">{impersonateModal.restaurant_name}</span> as <span className="font-semibold text-text">{impersonateModal.admin_name}</span> ({impersonateModal.admin_email}) with full owner access.
              </p>
              <div className="bg-bg rounded-lg p-3 flex items-center gap-2">
                <code className="flex-1 text-xs text-text3 break-all font-mono">{impersonateModal.token}</code>
                <button
                  onClick={() => { navigator.clipboard.writeText(impersonateModal.token); toast.success('Token copied!') }}
                  className="p-1.5 rounded bg-surface2 text-text3 hover:text-green transition-all flex-shrink-0"
                >
                  <Copy size={13} />
                </button>
              </div>
              <p className="text-[11px] text-muted">Open the restaurant app, then run in browser console:</p>
              <code className="block text-[10px] bg-bg rounded p-2 text-text3 break-all font-mono">
                {`const s=JSON.parse(localStorage.getItem('bb_auth')||'{}');s.state={...s.state,token:'${impersonateModal.token}'};localStorage.setItem('bb_auth',JSON.stringify(s));location.reload()`}
              </code>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
              <button onClick={() => setImpersonateModal(null)} className="px-4 py-2 text-sm font-semibold text-text3 hover:text-text bg-surface2 rounded-lg transition-all">Close</button>
              <button
                onClick={() => {
                  window.open(`${import.meta.env.VITE_RESTAURANT_URL || 'http://localhost:3000'}?impersonate=${impersonateModal.token}`, '_blank')
                  setImpersonateModal(null)
                }}
                className="px-4 py-2 text-sm font-semibold text-white bg-green hover:bg-green2 rounded-lg transition-all"
              >
                Open Restaurant App
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

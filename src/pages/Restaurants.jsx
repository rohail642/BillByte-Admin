import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, CheckCircle, XCircle, ChevronRight, Download, Clock, Mail, Ghost } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import CreateRestaurantModal from '../components/CreateRestaurantModal'

const planColors = {
  trial:      'bg-amber-dim text-amber',
  starter:    'bg-blue-dim text-blue',
  pro:        'bg-purple-dim text-purple',
  enterprise: 'bg-green-dim text-green',
}

function ExpiryBadge({ status, daysLeft }) {
  if (!status || status === 'ok') return null
  const cfg = {
    expired:  { cls: 'bg-red-dim text-red',   label: 'Expired' },
    critical: { cls: 'bg-amber-dim text-amber', label: daysLeft === 0 ? 'Today' : `${daysLeft}d` },
    warning:  { cls: 'bg-blue-dim text-blue',   label: `${daysLeft}d` },
  }[status]
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.cls}`}>
      <Clock size={9} /> {cfg.label}
    </span>
  )
}

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([])
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [bulkAction, setBulkAction] = useState('')
  const [bulkPlan, setBulkPlan] = useState('starter')
  const [bulkDays, setBulkDays] = useState(14)
  const [bulking, setBulking] = useState(false)
  const [deadFilter, setDeadFilter] = useState(false)
  const navigate = useNavigate()

  async function fetchRestaurants() {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (planFilter) params.plan = planFilter
      if (statusFilter === 'active') params.is_active = true
      if (statusFilter === 'suspended') params.is_active = false
      if (deadFilter) params.dead = true
      const { data } = await api.get('/api/admin/restaurants', { params })
      setRestaurants(data)
      setSelected(new Set())
    } catch {
      toast.error('Failed to load restaurants')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRestaurants() }, [planFilter, statusFilter, deadFilter])

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === restaurants.length) setSelected(new Set())
    else setSelected(new Set(restaurants.map((r) => r.id)))
  }

  async function applyBulk() {
    if (!bulkAction) return toast.error('Select an action first.')
    if (selected.size === 0) return toast.error('Select at least one restaurant.')
    setBulking(true)
    try {
      const payload = { action: bulkAction, ids: Array.from(selected) }
      if (bulkAction === 'change_plan') payload.plan = bulkPlan
      if (bulkAction === 'extend_trial') payload.days = Number(bulkDays)
      await api.post('/api/admin/restaurants/bulk-action', payload)
      toast.success(`Applied "${bulkAction}" to ${selected.size} restaurant(s)`)
      fetchRestaurants()
      setBulkAction('')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Bulk action failed')
    } finally {
      setBulking(false)
    }
  }

  function buildBulkReminderMailto() {
    const targets = restaurants.filter(
      (r) => selected.has(r.id) && r.reminders_enabled && r.owner_email &&
        (r.expiry_status === 'expired' || r.expiry_status === 'critical' || r.expiry_status === 'warning')
    )
    if (!targets.length) return null
    const to = targets.map((r) => r.owner_email).join(',')
    const subject = encodeURIComponent('BillByte License Renewal Reminder')
    const body = encodeURIComponent(
      targets.map((r) => `${r.name} (${r.owner_email}) — ${r.expiry_status === 'expired' ? 'Expired' : `${r.days_left}d left`}`).join('\n')
    )
    return { href: `mailto:${to}?subject=${subject}&body=${body}`, count: targets.length }
  }

  async function exportCSV() {
    try {
      const resp = await api.get('/api/admin/restaurants/export', { responseType: 'blob' })
      const url = URL.createObjectURL(resp.data)
      const a = document.createElement('a')
      a.href = url
      a.download = 'restaurants.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Export failed')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display text-text">Restaurants</h1>
          <p className="text-xs text-muted mt-0.5">Manage all restaurants on the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg border border-border text-text3 hover:bg-surface2 transition-all"
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 bg-green hover:bg-green2 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all hover:-translate-y-px shadow-sm"
          >
            <Plus size={15} /> New Restaurant
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchRestaurants()}
            placeholder="Search name or owner email..."
            className="w-full bg-surface border border-border2 text-text rounded-lg pl-8 pr-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-green focus:ring-2 focus:ring-green-dim transition-all"
          />
        </div>
        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}
          className="bg-surface border border-border2 text-text2 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green transition-all">
          <option value="">All Plans</option>
          <option value="trial">Trial</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-surface border border-border2 text-text2 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green transition-all">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <button
          onClick={() => { setDeadFilter((v) => !v); setPlanFilter(''); setStatusFilter('') }}
          className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg border transition-all ${
            deadFilter ? 'bg-surface2 border-border2 text-text' : 'border-border2 text-muted hover:text-text hover:bg-surface2'
          }`}
        >
          <Ghost size={14} /> Dead Accounts
        </button>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-surface border border-green/30 rounded-xl">
          <span className="text-xs font-bold text-green">{selected.size} selected</span>
          <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)}
            className="bg-bg border border-border2 text-text rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-green transition-all">
            <option value="">Choose action...</option>
            <option value="activate">Activate</option>
            <option value="suspend">Suspend</option>
            <option value="change_plan">Change Plan</option>
            <option value="extend_trial">Extend Trial</option>
          </select>
          {bulkAction === 'change_plan' && (
            <select value={bulkPlan} onChange={(e) => setBulkPlan(e.target.value)}
              className="bg-bg border border-border2 text-text rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-green transition-all">
              <option value="trial">Trial</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          )}
          {bulkAction === 'extend_trial' && (
            <div className="flex items-center gap-1.5">
              <input type="number" value={bulkDays} onChange={(e) => setBulkDays(e.target.value)} min={1} max={365}
                className="w-16 bg-bg border border-border2 text-text rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-green transition-all" />
              <span className="text-xs text-muted">days</span>
            </div>
          )}
          <button onClick={applyBulk} disabled={bulking || !bulkAction}
            className="px-4 py-1.5 text-sm font-semibold text-white bg-green hover:bg-green2 rounded-lg transition-all disabled:opacity-50">
            {bulking ? 'Applying...' : 'Apply'}
          </button>
          {(() => {
            const mailto = buildBulkReminderMailto()
            return mailto ? (
              <a
                href={mailto.href}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold bg-blue-dim text-blue rounded-lg hover:bg-blue/15 transition-all"
              >
                <Mail size={13} /> Send Reminders ({mailto.count})
              </a>
            ) : null
          })()}
          <button onClick={() => setSelected(new Set())} className="text-xs text-muted hover:text-text transition-colors">Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface2">
              <th className="px-4 py-3">
                <input type="checkbox" checked={selected.size === restaurants.length && restaurants.length > 0}
                  onChange={toggleAll} className="rounded" />
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text3 uppercase tracking-wide">Restaurant</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text3 uppercase tracking-wide">Owner</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text3 uppercase tracking-wide">Plan</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text3 uppercase tracking-wide">Orders</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text3 uppercase tracking-wide">Revenue</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text3 uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-text3 uppercase tracking-wide">Expiry</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={9} className="text-center py-12 text-muted text-sm">Loading...</td></tr>
            ) : restaurants.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-12 text-muted text-sm">No restaurants found.</td></tr>
            ) : restaurants.map((r) => (
              <tr key={r.id} className={`hover:bg-surface2 transition-colors ${selected.has(r.id) ? 'bg-green-dim/30' : ''}`}>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} className="rounded" />
                </td>
                <td className="px-4 py-3 cursor-pointer" onClick={() => navigate(`/restaurants/${r.id}`)}>
                  <p className="font-semibold text-text">{r.name}</p>
                  <p className="text-[11px] text-muted">{r.city || '—'}</p>
                </td>
                <td className="px-4 py-3 cursor-pointer" onClick={() => navigate(`/restaurants/${r.id}`)}>
                  <p className="text-text3 text-xs">{r.owner_name || '—'}</p>
                  <p className="text-muted text-[11px]">{r.owner_email || '—'}</p>
                </td>
                <td className="px-4 py-3 cursor-pointer" onClick={() => navigate(`/restaurants/${r.id}`)}>
                  <span className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${planColors[r.plan] || 'bg-surface2 text-text3'}`}>
                    {r.plan}
                  </span>
                </td>
                <td className="px-4 py-3 text-text3 cursor-pointer" onClick={() => navigate(`/restaurants/${r.id}`)}>
                  {r.total_orders.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-text3 cursor-pointer" onClick={() => navigate(`/restaurants/${r.id}`)}>
                  ₹{r.total_revenue >= 1000 ? `${(r.total_revenue/1000).toFixed(1)}K` : Math.round(r.total_revenue)}
                </td>
                <td className="px-4 py-3 cursor-pointer" onClick={() => navigate(`/restaurants/${r.id}`)}>
                  {r.is_active
                    ? <span className="inline-flex items-center gap-1 text-green text-xs font-semibold"><CheckCircle size={12} /> Active</span>
                    : <span className="inline-flex items-center gap-1 text-red text-xs font-semibold"><XCircle size={12} /> Suspended</span>
                  }
                </td>
                <td className="px-4 py-3 cursor-pointer" onClick={() => navigate(`/restaurants/${r.id}`)}>
                  <ExpiryBadge status={r.expiry_status} daysLeft={r.days_left} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {r.reminders_enabled && r.owner_email && (r.expiry_status === 'expired' || r.expiry_status === 'critical' || r.expiry_status === 'warning') && (() => {
                      const subject = encodeURIComponent(`BillByte License Renewal – ${r.name}`)
                      const body = encodeURIComponent(`Hi ${r.owner_name || 'there'},\n\nThis is a reminder that your BillByte subscription for ${r.name} is expiring soon.\n\nPlease renew your license to continue without interruption.\n\nBest regards,\nBillByte Team`)
                      return (
                        <a
                          href={`mailto:${r.owner_email}?subject=${subject}&body=${body}`}
                          onClick={(e) => e.stopPropagation()}
                          title="Send reminder email"
                          className="text-muted hover:text-blue transition-colors"
                        >
                          <Mail size={13} />
                        </a>
                      )
                    })()}
                    <ChevronRight size={14} className="text-muted" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateRestaurantModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchRestaurants() }}
        />
      )}
    </div>
  )
}

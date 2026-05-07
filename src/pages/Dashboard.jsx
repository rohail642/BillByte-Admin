import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UtensilsCrossed, CheckCircle, Clock, XCircle, PauseCircle, Mail, CalendarPlus } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

const planColors = {
  trial:      'bg-amber-dim text-amber',
  starter:    'bg-blue-dim text-blue',
  pro:        'bg-purple-dim text-purple',
  enterprise: 'bg-green-dim text-green',
}

function StatCard({ icon: Icon, label, value, color, sub, delay = 0 }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-5 shadow-sm flex items-center gap-4" style={{ animationDelay: `${delay}ms` }}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs font-semibold text-text3 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-black font-display text-text">{value ?? '—'}</p>
        {sub && <p className="text-[10px] text-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function ExpiryBadge({ label, count, color }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${color}`}>
      <span className="text-sm font-semibold">{label}</span>
      <span className="text-2xl font-black font-display">{count ?? 0}</span>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [expiring, setExpiring] = useState([])
  const navigate = useNavigate()

  async function extendTrial(r, e) {
    e.stopPropagation()
    try {
      await api.post('/api/admin/restaurants/bulk-action', { action: 'extend_trial', ids: [r.id], days: 14 })
      toast.success(`Extended trial for ${r.name} by 14 days`)
      const { data } = await api.get('/api/admin/restaurants', { params: { expiring_in_days: 30 } })
      setExpiring(data.filter(x => x.expiry_status === 'critical' || x.expiry_status === 'warning' || x.expiry_status === 'expired'))
    } catch { toast.error('Failed to extend trial') }
  }

  function buildMailto(r) {
    if (!r.reminders_enabled || !r.owner_email) return null
    const subject = encodeURIComponent(`BillByte License Renewal – ${r.name}`)
    const body = encodeURIComponent(`Hi ${r.owner_name || 'there'},\n\nThis is a reminder that your BillByte subscription for ${r.name} is expiring soon.\n\nPlease renew your license to continue without interruption.\n\nBest regards,\nBillByte Team`)
    return `mailto:${r.owner_email}?subject=${subject}&body=${body}`
  }

  useEffect(() => {
    api.get('/api/admin/stats')
      .then((r) => setStats(r.data))
      .catch(() => toast.error('Failed to load stats'))

    api.get('/api/admin/restaurants', { params: { expiring_in_days: 30 } })
      .then((r) => setExpiring(r.data.filter(x => x.expiry_status === 'critical' || x.expiry_status === 'warning' || x.expiry_status === 'expired')))
      .catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold font-display text-text">Dashboard</h1>
        <p className="text-xs text-muted mt-0.5">Platform overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard icon={UtensilsCrossed} label="Restaurants" value={stats?.total_restaurants} color="bg-green-dim text-green" sub="total onboarded" />
        <StatCard icon={CheckCircle} label="Active" value={stats?.active_restaurants} color="bg-green-dim text-green" sub={`of ${stats?.total_restaurants ?? 0} total`} />
        <StatCard icon={PauseCircle} label="Inactive" value={stats ? (stats.total_restaurants - stats.active_restaurants) : '—'} color="bg-surface2 text-text3" sub="suspended or expired" />
        <StatCard icon={Clock} label="Expiring in 7d" value={stats?.expiring_in_7_days} color="bg-amber-dim text-amber" sub="need follow-up" />
        <StatCard icon={XCircle} label="Expired" value={stats?.expired_trials} color="bg-red-dim text-red" sub="awaiting renewal" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Plans */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-text2 uppercase tracking-wide mb-4">Restaurants by Plan</p>
          {stats?.restaurants_by_plan ? (
            <div className="space-y-2">
              {Object.entries(stats.restaurants_by_plan).map(([plan, count]) => (
                <div key={plan} className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${planColors[plan] || 'bg-surface2 text-text3'}`}>
                    {plan}
                  </span>
                  <span className="text-sm font-bold text-text">{count}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted">Loading...</p>}
        </div>

        {/* Trial expiry alerts */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-text2 uppercase tracking-wide mb-4">Trial Expiry Alerts</p>
          <div className="space-y-2">
            <ExpiryBadge label="Expired" count={stats?.expired_trials} color="border-red/30 bg-red-dim text-red" />
            <ExpiryBadge label="Expiring in 7 days" count={stats?.expiring_in_7_days} color="border-amber/30 bg-amber-dim text-amber" />
            <ExpiryBadge label="Expiring in 30 days" count={stats?.expiring_in_30_days} color="border-blue/30 bg-blue-dim text-blue" />
          </div>
        </div>

        {/* Expiring restaurants list */}
        <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
          <p className="text-xs font-semibold text-text2 uppercase tracking-wide mb-4">Needs Attention</p>
          {expiring.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 gap-2">
              <CheckCircle size={24} className="text-green" />
              <p className="text-sm text-muted">All trials are healthy</p>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {expiring.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface2 transition-all cursor-pointer"
                  onClick={() => navigate(`/restaurants/${r.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-text truncate">{r.name}</p>
                    <p className="text-[10px] text-muted">{r.city || 'No city'} · {r.plan}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    r.expiry_status === 'expired' ? 'bg-red-dim text-red' :
                    r.expiry_status === 'critical' ? 'bg-amber-dim text-amber' :
                    'bg-blue-dim text-blue'
                  }`}>
                    {r.expiry_status === 'expired' ? 'Expired' :
                     r.days_left === 0 ? 'Today' : `${r.days_left}d left`}
                  </span>
                  <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {buildMailto(r) && (
                      <a href={buildMailto(r)} title="Send reminder email"
                        className="p-1 rounded text-muted hover:text-blue hover:bg-blue-dim transition-all">
                        <Mail size={12} />
                      </a>
                    )}
                    <button onClick={(e) => extendTrial(r, e)} title="Extend trial by 14 days"
                      className="p-1 rounded text-muted hover:text-green hover:bg-green-dim transition-all">
                      <CalendarPlus size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

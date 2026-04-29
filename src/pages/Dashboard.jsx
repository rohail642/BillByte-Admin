import { useEffect, useState } from 'react'
import { UtensilsCrossed, Users, ShoppingBag, CheckCircle } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

const planColors = {
  trial:      'bg-amber-dim text-amber',
  starter:    'bg-blue-dim text-blue',
  pro:        'bg-purple-dim text-purple',
  enterprise: 'bg-green-dim text-green',
}

function StatCard({ icon: Icon, label, value, color, delay = 0 }) {
  return (
    <div
      className="bg-surface border border-border rounded-xl p-5 shadow-sm animate-fadeUp flex items-center gap-4"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs font-semibold text-text3 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-black font-display text-text">{value ?? '—'}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    api.get('/api/admin/stats')
      .then((r) => setStats(r.data))
      .catch(() => toast.error('Failed to load stats'))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold font-display text-text">Dashboard</h1>
        <p className="text-xs text-muted mt-0.5">Overview of all restaurants on the platform</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={UtensilsCrossed} label="Total Restaurants" value={stats?.total_restaurants} color="bg-green-dim text-green" delay={0} />
        <StatCard icon={CheckCircle} label="Active Restaurants" value={stats?.active_restaurants} color="bg-blue-dim text-blue" delay={60} />
        <StatCard icon={Users} label="Total Users" value={stats?.total_users} color="bg-purple-dim text-purple" delay={120} />
        <StatCard icon={ShoppingBag} label="Total Orders" value={stats?.total_orders} color="bg-orange-dim text-orange" delay={180} />
      </div>

      <div className="bg-surface border border-border rounded-xl p-5 shadow-sm animate-fadeUp" style={{ animationDelay: '240ms' }}>
        <p className="text-xs font-semibold text-text2 uppercase tracking-wide mb-4">Restaurants by Plan</p>
        {stats?.restaurants_by_plan ? (
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.restaurants_by_plan).map(([plan, count]) => (
              <span key={plan} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${planColors[plan] || 'bg-surface2 text-text3'}`}>
                {plan}: {count}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">Loading...</p>
        )}
      </div>
    </div>
  )
}

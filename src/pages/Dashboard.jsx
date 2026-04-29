import { useEffect, useState } from 'react'
import { UtensilsCrossed, Users, ShoppingBag, CheckCircle } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-gray-500 text-sm">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
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

  const planColors = {
    trial: 'bg-yellow-100 text-yellow-700',
    starter: 'bg-blue-100 text-blue-700',
    pro: 'bg-purple-100 text-purple-700',
    enterprise: 'bg-green-100 text-green-700',
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={UtensilsCrossed} label="Total Restaurants" value={stats?.total_restaurants} color="bg-indigo-500" />
        <StatCard icon={CheckCircle} label="Active Restaurants" value={stats?.active_restaurants} color="bg-green-500" />
        <StatCard icon={Users} label="Total Users" value={stats?.total_users} color="bg-blue-500" />
        <StatCard icon={ShoppingBag} label="Total Orders" value={stats?.total_orders} color="bg-orange-500" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Restaurants by Plan</h3>
        {stats?.restaurants_by_plan ? (
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.restaurants_by_plan).map(([plan, count]) => (
              <span key={plan} className={`px-4 py-1.5 rounded-full text-sm font-medium ${planColors[plan] || 'bg-gray-100 text-gray-700'}`}>
                {plan.charAt(0).toUpperCase() + plan.slice(1)}: {count}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm">Loading...</p>
        )}
      </div>
    </div>
  )
}

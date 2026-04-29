import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, CheckCircle, XCircle } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

const planBadge = {
  trial: 'bg-yellow-100 text-yellow-700',
  starter: 'bg-blue-100 text-blue-700',
  pro: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-green-100 text-green-700',
}

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([])
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  async function fetchRestaurants() {
    setLoading(true)
    try {
      const params = {}
      if (search) params.search = search
      if (planFilter) params.plan = planFilter
      const { data } = await api.get('/api/admin/restaurants', { params })
      setRestaurants(data)
    } catch {
      toast.error('Failed to load restaurants')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchRestaurants() }, [planFilter])

  async function toggleActive(r) {
    const endpoint = r.is_active
      ? `/api/admin/restaurants/${r.id}/suspend`
      : `/api/admin/restaurants/${r.id}/activate`
    try {
      await api.patch(endpoint)
      toast.success(r.is_active ? 'Restaurant suspended' : 'Restaurant activated')
      fetchRestaurants()
    } catch {
      toast.error('Action failed')
    }
  }

  async function changePlan(r, plan) {
    try {
      await api.patch(`/api/admin/restaurants/${r.id}/plan`, { plan })
      toast.success(`Plan updated to ${plan}`)
      fetchRestaurants()
    } catch {
      toast.error('Plan update failed')
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Restaurants</h2>

      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchRestaurants()}
            placeholder="Search by name..."
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Plans</option>
          <option value="trial">Trial</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Restaurant</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">City</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Plan</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400">Loading...</td></tr>
            ) : restaurants.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-400">No restaurants found.</td></tr>
            ) : restaurants.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 font-medium text-gray-900 cursor-pointer hover:text-indigo-600" onClick={() => navigate(`/restaurants/${r.id}`)}>
                  {r.name}
                </td>
                <td className="px-5 py-3 text-gray-500">{r.city || '—'}</td>
                <td className="px-5 py-3">
                  <select
                    value={r.plan}
                    onChange={(e) => changePlan(r, e.target.value)}
                    className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none ${planBadge[r.plan] || 'bg-gray-100 text-gray-700'}`}
                  >
                    <option value="trial">Trial</option>
                    <option value="starter">Starter</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </td>
                <td className="px-5 py-3">
                  {r.is_active ? (
                    <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle size={13} /> Active</span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-500 text-xs font-medium"><XCircle size={13} /> Suspended</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => toggleActive(r)}
                    className={`text-xs font-medium px-3 py-1 rounded-lg transition-colors ${
                      r.is_active
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {r.is_active ? 'Suspend' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

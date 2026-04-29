import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, CheckCircle, XCircle, ChevronRight } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import CreateRestaurantModal from '../components/CreateRestaurantModal'

const planColors = {
  trial:      'bg-amber-dim text-amber',
  starter:    'bg-blue-dim text-blue',
  pro:        'bg-purple-dim text-purple',
  enterprise: 'bg-green-dim text-green',
}

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([])
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display text-text">Restaurants</h1>
          <p className="text-xs text-muted mt-0.5">Manage all restaurants on the platform</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 bg-green hover:bg-green2 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-150 hover:-translate-y-px shadow-sm"
        >
          <Plus size={15} /> New Restaurant
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchRestaurants()}
            placeholder="Search restaurants..."
            className="w-full bg-surface border border-border2 text-text rounded-lg pl-8 pr-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-green focus:ring-2 focus:ring-green-dim transition-all"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="bg-surface border border-border2 text-text2 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green transition-all"
        >
          <option value="">All Plans</option>
          <option value="trial">Trial</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface2">
              <th className="text-left px-5 py-3 text-xs font-semibold text-text3 uppercase tracking-wide">Restaurant</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-text3 uppercase tracking-wide">City</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-text3 uppercase tracking-wide">Plan</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-text3 uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-text3 uppercase tracking-wide">Created</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-muted text-sm">Loading...</td></tr>
            ) : restaurants.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-muted text-sm">No restaurants found.</td></tr>
            ) : restaurants.map((r) => (
              <tr
                key={r.id}
                onClick={() => navigate(`/restaurants/${r.id}`)}
                className="hover:bg-surface2 transition-colors cursor-pointer"
              >
                <td className="px-5 py-3 font-semibold text-text">{r.name}</td>
                <td className="px-5 py-3 text-text3">{r.city || '—'}</td>
                <td className="px-5 py-3">
                  <span className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${planColors[r.plan] || 'bg-surface2 text-text3'}`}>
                    {r.plan}
                  </span>
                </td>
                <td className="px-5 py-3">
                  {r.is_active ? (
                    <span className="inline-flex items-center gap-1 text-green text-xs font-semibold"><CheckCircle size={12} /> Active</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red text-xs font-semibold"><XCircle size={12} /> Suspended</span>
                  )}
                </td>
                <td className="px-5 py-3 text-text3 text-xs">
                  {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3"><ChevronRight size={14} className="text-muted" /></td>
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

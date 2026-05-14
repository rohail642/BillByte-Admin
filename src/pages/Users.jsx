import { useEffect, useState } from 'react'
import { Search, CheckCircle, XCircle } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

const roleColors = {
  owner:   'bg-purple-dim text-purple',
  manager: 'bg-amber-dim text-amber',
  cashier: 'bg-blue-dim text-blue',
  waiter:  'bg-surface2 text-text3',
  kitchen: 'bg-orange-dim text-orange',
}

export default function Users() {
  const [users, setUsers] = useState([])
  const [roleFilter, setRoleFilter] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  async function fetchUsers() {
    setLoading(true)
    try {
      const params = {}
      if (roleFilter) params.role = roleFilter
      if (search) params.search = search
      const { data } = await api.get('/api/admin/users', { params })
      setUsers(data)
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [roleFilter])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold font-display text-text">Users</h1>
        <p className="text-xs text-muted mt-0.5">All staff accounts across all restaurants</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            placeholder="Search name, email or phone..."
            className="w-full bg-surface border border-border2 text-text rounded-lg pl-8 pr-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-green focus:ring-2 focus:ring-green-dim transition-all"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-surface border border-border2 text-text2 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green transition-all"
        >
          <option value="">All Roles</option>
          <option value="owner">Owner</option>
          <option value="manager">Manager</option>
          <option value="cashier">Cashier</option>
          <option value="waiter">Waiter</option>
          <option value="kitchen">Kitchen</option>
        </select>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 text-sm font-semibold bg-green hover:bg-green2 text-white rounded-lg transition-all"
        >
          Search
        </button>
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="border-b border-border bg-surface2">
              <th className="text-left px-5 py-3 text-xs font-semibold text-text3 uppercase tracking-wide">Name</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-text3 uppercase tracking-wide">Email</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-text3 uppercase tracking-wide">Phone</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-text3 uppercase tracking-wide">Role</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-text3 uppercase tracking-wide">Restaurant ID</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-text3 uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-text3 uppercase tracking-wide">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-muted text-sm">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-muted text-sm">No users found.</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="hover:bg-surface2 transition-colors">
                <td className="px-5 py-3 font-semibold text-text">{u.name}</td>
                <td className="px-5 py-3 text-text3">{u.email}</td>
                <td className="px-5 py-3 text-text3">{u.phone || '—'}</td>
                <td className="px-5 py-3">
                  <span className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${roleColors[u.role] || 'bg-surface2 text-text3'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3 text-text3 text-xs">{u.restaurant_id || '—'}</td>
                <td className="px-5 py-3">
                  {u.is_active
                    ? <span className="inline-flex items-center gap-1 text-green text-xs font-semibold"><CheckCircle size={12} /> Active</span>
                    : <span className="inline-flex items-center gap-1 text-red text-xs font-semibold"><XCircle size={12} /> Inactive</span>
                  }
                </td>
                <td className="px-5 py-3 text-text3 text-xs">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {!loading && (
          <div className="px-5 py-3 border-t border-border text-xs text-muted">
            {users.length} user{users.length !== 1 ? 's' : ''} found
          </div>
        )}
      </div>
    </div>
  )
}

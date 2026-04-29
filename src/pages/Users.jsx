import { useEffect, useState } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle } from 'lucide-react'

const roleColors = {
  owner:   'bg-green-dim text-green',
  manager: 'bg-blue-dim text-blue',
  cashier: 'bg-amber-dim text-amber',
  waiter:  'bg-purple-dim text-purple',
}

export default function Users() {
  const [users, setUsers] = useState([])
  const [roleFilter, setRoleFilter] = useState('')
  const [loading, setLoading] = useState(true)

  async function fetchUsers() {
    setLoading(true)
    try {
      const params = {}
      if (roleFilter) params.role = roleFilter
      const { data } = await api.get('/api/admin/users', { params })
      setUsers(data)
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [roleFilter])

  async function deactivate(user) {
    try {
      await api.patch(`/api/admin/users/${user.id}/deactivate`)
      toast.success(`${user.name} deactivated`)
      fetchUsers()
    } catch {
      toast.error('Failed to deactivate user')
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold font-display text-text">Users</h1>
        <p className="text-xs text-muted mt-0.5">All users across all restaurants</p>
      </div>

      <div>
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
        </select>
      </div>

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-5 py-3 text-xs font-semibold text-text3 uppercase tracking-wide">Name</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-text3 uppercase tracking-wide">Email</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-text3 uppercase tracking-wide">Role</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-text3 uppercase tracking-wide">Restaurant</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-text3 uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-text3 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-muted text-sm">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-muted text-sm">No users found.</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="hover:bg-surface2 transition-colors">
                <td className="px-5 py-3 font-semibold text-text">{u.name}</td>
                <td className="px-5 py-3 text-text3">{u.email}</td>
                <td className="px-5 py-3">
                  <span className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${roleColors[u.role] || 'bg-surface2 text-text3'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3 text-text3">{u.restaurant_id || '—'}</td>
                <td className="px-5 py-3">
                  {u.is_active ? (
                    <span className="inline-flex items-center gap-1 text-green text-xs font-semibold"><CheckCircle size={12} /> Active</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red text-xs font-semibold"><XCircle size={12} /> Inactive</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  {u.is_active && (
                    <button
                      onClick={() => deactivate(u)}
                      className="text-xs font-semibold px-3 py-1 rounded-lg bg-red-dim text-red hover:bg-red/15 transition-all duration-150"
                    >
                      Deactivate
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

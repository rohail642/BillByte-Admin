import { useEffect, useState } from 'react'
import api from '../lib/api'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle } from 'lucide-react'

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
      toast.success(`${user.email} deactivated`)
      fetchUsers()
    } catch {
      toast.error('Failed to deactivate user')
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Users</h2>

      <div className="mb-5">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Roles</option>
          <option value="owner">Owner</option>
          <option value="manager">Manager</option>
          <option value="cashier">Cashier</option>
          <option value="waiter">Waiter</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Name</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Email</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Role</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Restaurant</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Status</th>
              <th className="text-left px-5 py-3 font-semibold text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">No users found.</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900">{u.name}</td>
                <td className="px-5 py-3 text-gray-500">{u.email}</td>
                <td className="px-5 py-3 capitalize text-gray-700">{u.role}</td>
                <td className="px-5 py-3 text-gray-500">{u.restaurant_id || '—'}</td>
                <td className="px-5 py-3">
                  {u.is_active ? (
                    <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle size={13} /> Active</span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-500 text-xs font-medium"><XCircle size={13} /> Inactive</span>
                  )}
                </td>
                <td className="px-5 py-3">
                  {u.is_active && (
                    <button
                      onClick={() => deactivate(u)}
                      className="text-xs font-medium px-3 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
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

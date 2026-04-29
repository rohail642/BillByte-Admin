import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

export default function RestaurantDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)

  useEffect(() => {
    api.get(`/api/admin/restaurants/${id}`)
      .then((r) => setData(r.data))
      .catch(() => toast.error('Failed to load restaurant'))
  }, [id])

  if (!data) return <div className="text-gray-400 text-sm">Loading...</div>

  return (
    <div>
      <button onClick={() => navigate('/restaurants')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-5">
        <ArrowLeft size={16} /> Back to Restaurants
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{data.name}</h2>
          <p className="text-gray-500 text-sm">{data.city || 'No city'} · {data.phone || 'No phone'}</p>
        </div>
        <span className={`text-sm font-medium px-3 py-1 rounded-full ${data.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {data.is_active ? 'Active' : 'Suspended'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Plan</p>
          <p className="text-lg font-bold text-gray-900 capitalize">{data.plan}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Total Orders</p>
          <p className="text-lg font-bold text-gray-900">{data.total_orders}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">GST Rate</p>
          <p className="text-lg font-bold text-gray-900">{data.gst_rate}%</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Team Members</h3>
        {data.users?.length === 0 ? (
          <p className="text-gray-400 text-sm">No users found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100">
              <tr>
                <th className="text-left py-2 font-semibold text-gray-600">Name</th>
                <th className="text-left py-2 font-semibold text-gray-600">Email</th>
                <th className="text-left py-2 font-semibold text-gray-600">Role</th>
                <th className="text-left py-2 font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.users.map((u) => (
                <tr key={u.id}>
                  <td className="py-2 text-gray-900">{u.name}</td>
                  <td className="py-2 text-gray-500">{u.email}</td>
                  <td className="py-2 capitalize text-gray-700">{u.role}</td>
                  <td className="py-2">
                    {u.is_active ? (
                      <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle size={12} /> Active</span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-500 text-xs"><XCircle size={12} /> Inactive</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

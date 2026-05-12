import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import toast, { Toaster } from 'react-hot-toast'
import logoText from '../assets/logo-text.png'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      const detail = err.response?.data?.detail
      const message = Array.isArray(detail)
        ? detail.map((d) => d.msg).join(', ')
        : typeof detail === 'string'
        ? detail
        : err.message || 'Login failed'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center relative overflow-hidden">
      <Toaster position="top-center" toastOptions={{ style: { background: '#1c1917', color: '#fff', fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: '13px', fontWeight: '600', borderRadius: '100px', padding: '10px 18px' }, error: { iconTheme: { primary: '#dc2626', secondary: '#fff' } } }} />
      {/* Background decorative circles */}
      <div className="absolute top-[-120px] right-[-120px] w-[400px] h-[400px] rounded-full" style={{ background: 'rgba(22,163,74,0.05)' }} />
      <div className="absolute bottom-[-80px] left-[-80px] w-[300px] h-[300px] rounded-full" style={{ background: 'rgba(234,88,12,0.05)' }} />

      <div className="w-full max-w-sm mx-4 animate-fadeUp">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src={logoText} alt="BillByte" style={{ width: 160, mixBlendMode: 'multiply' }} />
        </div>

        {/* Admin badge */}
        <div className="flex justify-center mb-5">
          <span className="inline-flex items-center gap-1.5 bg-red-dim border border-red/20 text-red text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-red inline-block" />
            Admin Console — Authorized Access Only
          </span>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-xl shadow-md overflow-hidden">
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text2 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@billbyte.com"
                className="w-full bg-bg border border-border2 text-text rounded-lg px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-green focus:ring-2 focus:ring-[var(--green-dim)] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text2 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-bg border border-border2 text-text rounded-lg px-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-green focus:ring-2 focus:ring-[var(--green-dim)] transition-all"
              />
            </div>
            {error && (
              <p className="text-red-500 text-xs font-medium text-center -mt-1">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green hover:bg-green2 text-white font-semibold py-2 rounded-lg text-sm transition-all duration-150 hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted mt-5">
          Powered by BillByte Restaurant OS
        </p>
      </div>
    </div>
  )
}

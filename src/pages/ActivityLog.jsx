import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Search, X, ChevronRight, Clock } from 'lucide-react'
import api from '../lib/api'
import toast from 'react-hot-toast'

const actionColors = {
  suspend:             'bg-red-dim text-red',
  activate:            'bg-green-dim text-green',
  auto_deactivate:     'bg-red-dim text-red',
  create_restaurant:   'bg-blue-dim text-blue',
  delete_restaurant:   'bg-red-dim text-red',
  update_license:      'bg-purple-dim text-purple',
  update_details:      'bg-blue-dim text-blue',
  impersonate:         'bg-amber-dim text-amber',
  create_account:      'bg-green-dim text-green',
  delete_account:      'bg-red-dim text-red',
  update_account:      'bg-blue-dim text-blue',
  update_super_admin:  'bg-blue-dim text-blue',
  create_super_admin:  'bg-purple-dim text-purple',
  delete_super_admin:  'bg-red-dim text-red',
  bulk_suspend:        'bg-red-dim text-red',
  bulk_activate:       'bg-green-dim text-green',
  bulk_change_plan:    'bg-purple-dim text-purple',
  bulk_extend_trial:   'bg-blue-dim text-blue',
  create_announcement: 'bg-green-dim text-green',
  admin_login:         'bg-green-dim text-green',
  admin_logout:        'bg-surface2 text-text3',
}

const ALL_ACTIONS = Object.keys(actionColors).sort()

function ActionBadge({ action }) {
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full whitespace-nowrap ${actionColors[action] || 'bg-surface2 text-text3'}`}>
      {action.replace(/_/g, ' ')}
    </span>
  )
}

function DetailsBlock({ details }) {
  if (!details) return <span className="text-muted text-sm">—</span>

  if (details.changes && typeof details.changes === 'object') {
    const entries = Object.entries(details.changes)
    if (entries.length === 0) return <span className="text-muted text-sm">No changes recorded</span>
    return (
      <div className="space-y-1.5">
        {entries.map(([field, val]) => (
          <div key={field} className="flex items-start gap-2 text-sm">
            <span className="font-semibold text-text2 min-w-[120px]">{field}</span>
            {val === 'changed' ? (
              <span className="text-amber font-medium">password changed</span>
            ) : (
              <span className="flex items-center gap-1.5 flex-wrap">
                <span className="text-red line-through">{String(val.from ?? '—')}</span>
                <ChevronRight size={12} className="text-muted flex-shrink-0" />
                <span className="text-green font-medium">{String(val.to ?? '—')}</span>
              </span>
            )}
          </div>
        ))}
      </div>
    )
  }

  const entries = Object.entries(details).filter(([k]) => k !== 'note')
  if (details.note && entries.length === 0) {
    return <span className="text-sm text-muted">{details.note}</span>
  }
  return (
    <div className="space-y-1.5">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-start gap-2 text-sm">
          <span className="font-semibold text-text2 min-w-[120px]">{k}</span>
          <span className="text-text3">{String(v)}</span>
        </div>
      ))}
    </div>
  )
}

// ── Inline detail rows (compact, for table) ───────────────────────────────────
function DetailsCell({ details }) {
  if (!details) return <span className="text-muted">—</span>

  if (details.changes && typeof details.changes === 'object') {
    const entries = Object.entries(details.changes)
    if (entries.length === 0) return <span className="text-muted text-[11px]">No changes</span>
    return (
      <div className="space-y-0.5">
        {entries.map(([field, val]) => (
          <div key={field} className="text-[11px]">
            <span className="font-semibold text-text2">{field}:</span>{' '}
            {val === 'changed' ? (
              <span className="text-amber">password changed</span>
            ) : (
              <>
                <span className="text-red line-through">{String(val.from ?? '—')}</span>
                {' → '}
                <span className="text-green">{String(val.to ?? '—')}</span>
              </>
            )}
          </div>
        ))}
      </div>
    )
  }

  const entries = Object.entries(details).filter(([k]) => k !== 'note')
  if (details.note && entries.length === 0) return <span className="text-muted text-[11px]">{details.note}</span>
  return (
    <div className="text-[11px] text-muted space-y-0.5">
      {entries.map(([k, v]) => (
        <div key={k}><span className="font-semibold text-text3">{k}:</span> {String(v)}</div>
      ))}
    </div>
  )
}

// ── Detail modal ─────────────────────────────────────────────────────────────
function LogDetailModal({ log, onClose }) {
  const navigate = useNavigate()
  if (!log) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface border border-border rounded-2xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-border">
          <div className="space-y-1.5">
            <ActionBadge action={log.action} />
            <p className="text-lg font-bold font-display text-text mt-1">{log.target_name || '—'}</p>
            <p className="text-[11px] text-muted capitalize">{log.target_type}{log.target_id ? ` · ID ${log.target_id}` : ''}</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-text transition-colors mt-0.5">
            <X size={18} />
          </button>
        </div>

        {/* Meta */}
        <div className="px-6 py-4 border-b border-border grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[10px] font-semibold text-text3 uppercase tracking-wide mb-0.5">Admin</p>
            <p className="text-text font-medium">{log.admin_name || <span className="text-muted">system</span>}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-text3 uppercase tracking-wide mb-0.5">Time</p>
            <p className="text-text">
              {log.created_at
                ? new Date(log.created_at).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
                  })
                : '—'}
            </p>
          </div>
        </div>

        {/* Details */}
        <div className="px-6 py-4">
          <p className="text-[10px] font-semibold text-text3 uppercase tracking-wide mb-3">Details</p>
          <DetailsBlock details={log.details} />
        </div>

        {/* Footer */}
        {log.target_type === 'restaurant' && log.target_id && (
          <div className="px-6 py-3 border-t border-border flex justify-end">
            <button
              onClick={() => { onClose(); navigate(`/restaurants/${log.target_id}`) }}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-green hover:text-green2 transition-colors"
            >
              View Restaurant <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ActivityLog() {
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [offset, setOffset] = useState(0)
  const [running, setRunning] = useState(false)
  const [selectedLog, setSelectedLog] = useState(null)

  // filters
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const LIMIT = 50

  const load = useCallback(async (off = 0) => {
    setLoading(true)
    try {
      const params = { limit: LIMIT, offset: off }
      if (search)       params.search    = search
      if (actionFilter) params.action    = actionFilter
      if (dateFrom)     params.date_from = dateFrom
      if (dateTo)       params.date_to   = dateTo
      const { data } = await api.get('/api/admin/activity-log', { params })
      setLogs(data.logs)
      setTotal(data.total)
      setOffset(off)
    } catch { toast.error('Failed to load activity log') }
    finally { setLoading(false) }
  }, [search, actionFilter, dateFrom, dateTo])

  useEffect(() => { load(0) }, [actionFilter, dateFrom, dateTo])

  function clearFilters() {
    setSearch('')
    setActionFilter('')
    setDateFrom('')
    setDateTo('')
  }

  const hasFilters = search || actionFilter || dateFrom || dateTo

  async function runExpiryCheck() {
    setRunning(true)
    try {
      const { data } = await api.post('/api/admin/maintenance/expire-trials')
      if (data.deactivated > 0) {
        toast.success(`Deactivated ${data.deactivated} expired restaurant(s): ${data.restaurants.join(', ')}`)
      } else {
        toast.success('No expired restaurants found.')
      }
      load(0)
    } catch { toast.error('Expiry check failed') }
    finally { setRunning(false) }
  }

  return (
    <div className="space-y-5">
      {selectedLog && <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-display text-text">Activity Log</h1>
          <p className="text-xs text-muted mt-0.5">{total} total actions recorded</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={runExpiryCheck}
            disabled={running}
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg border border-border text-text3 hover:bg-surface2 disabled:opacity-50 transition-all"
          >
            <RefreshCw size={13} className={running ? 'animate-spin' : ''} />
            Run Expiry Check
          </button>
          <button onClick={() => load(offset)} className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg border border-border text-text3 hover:bg-surface2 transition-all">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load(0)}
            placeholder="Search admin or restaurant…"
            className="w-full bg-surface border border-border2 text-text rounded-lg pl-8 pr-3 py-2 text-sm placeholder:text-muted focus:outline-none focus:border-green focus:ring-2 focus:ring-green-dim transition-all"
          />
        </div>

        {/* Action filter */}
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-surface border border-border2 text-text2 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green transition-all"
        >
          <option value="">All Actions</option>
          {ALL_ACTIONS.map(a => (
            <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
          ))}
        </select>

        {/* Date range */}
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-surface border border-border2 text-text2 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green transition-all"
          />
          <span className="text-muted text-xs">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-surface border border-border2 text-text2 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green transition-all"
          />
        </div>

        {/* Search button */}
        <button
          onClick={() => load(0)}
          className="px-4 py-2 text-sm font-semibold bg-green hover:bg-green2 text-white rounded-lg transition-all"
        >
          Search
        </button>

        {hasFilters && (
          <button onClick={clearFilters} className="inline-flex items-center gap-1 text-xs text-muted hover:text-text transition-colors px-2">
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface2">
              <th className="text-left px-5 py-3 text-xs font-semibold text-text3 uppercase tracking-wide w-36">Time</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-text3 uppercase tracking-wide w-28">Admin</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-text3 uppercase tracking-wide w-40">Action</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-text3 uppercase tracking-wide w-36">Target</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-text3 uppercase tracking-wide">Details</th>
              <th className="px-5 py-3 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-muted text-sm">Loading...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-muted text-sm">No activity found.</td></tr>
            ) : logs.map((l) => (
              <tr
                key={l.id}
                onClick={() => setSelectedLog(l)}
                className="hover:bg-surface2 transition-colors align-top cursor-pointer"
              >
                <td className="px-5 py-3 text-xs text-muted whitespace-nowrap">
                  {l.created_at
                    ? new Date(l.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })
                    : '—'}
                </td>
                <td className="px-5 py-3 text-sm font-medium text-text">{l.admin_name || <span className="text-muted">system</span>}</td>
                <td className="px-5 py-3">
                  <ActionBadge action={l.action} />
                </td>
                <td className="px-5 py-3">
                  <p className="text-sm text-text">{l.target_name || '—'}</p>
                  <p className="text-[10px] text-muted capitalize">{l.target_type}</p>
                </td>
                <td className="px-5 py-3">
                  <DetailsCell details={l.details} />
                </td>
                <td className="px-5 py-3 text-muted">
                  <Clock size={13} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {total > LIMIT && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border">
            <p className="text-xs text-muted">Showing {offset + 1}–{Math.min(offset + LIMIT, total)} of {total}</p>
            <div className="flex gap-2">
              <button onClick={() => load(offset - LIMIT)} disabled={offset === 0}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface2 text-text3 hover:bg-surface3 disabled:opacity-40 transition-all">
                Previous
              </button>
              <button onClick={() => load(offset + LIMIT)} disabled={offset + LIMIT >= total}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface2 text-text3 hover:bg-surface3 disabled:opacity-40 transition-all">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

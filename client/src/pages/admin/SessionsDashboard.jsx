import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import {
  HiOutlineDesktopComputer, HiOutlineDeviceMobile, HiOutlineGlobeAlt,
  HiOutlineShieldCheck, HiOutlineShieldExclamation, HiOutlineTrash,
  HiOutlineUserGroup, HiOutlineSearch, HiOutlineClock
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { sanitizeSearchQuery, validateSessionHistoryFilters } from '../../utils/validation';

const SessionsDashboard = () => {
  const [activeTab, setActiveTab] = useState('active'); 

  
  const [activeSessions, setActiveSessions] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [inactiveSessions, setInactiveSessions] = useState([]);

  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({ status: '', search: '' });
  const [errors, setErrors] = useState({});

  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0); // Force re-renders for relative times
  const { socket } = useSocket();

  // ── Periodic Re-render for Timers ──
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000); // every minute
    return () => clearInterval(timer);
  }, []);

  // ── Fetch Data ──
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, page, filters]);

  // ── Periodic Sync / Auto Refresh ──
  useEffect(() => {
    // Auto-refresh the explicit lists every 30s to keep states perfectly aligned
    const syncTimer = setInterval(() => {
      // Only do silent background re-fetches if on first page to not reset user views
      if (page === 1) fetchData(true);
    }, 30000);
    return () => clearInterval(syncTimer);
  }, [activeTab, page, filters]);

  const fetchData = async (silent = false) => {
    const validationErrors = validateSessionHistoryFilters(filters);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      if (!silent) setLoading(false);
      return;
    }

    setErrors({});
    if (!silent) setLoading(true);
    try {
      if (activeTab === 'active') {
        const res = await api.get('/admin/sessions/active');
        setActiveSessions(res.data.sessions);
      } else if (activeTab === 'inactive') {
        const res = await api.get('/admin/sessions/inactive', { params: { page, limit: 20 } });
        setInactiveSessions(res.data.sessions);
        setTotalPages(res.data.totalPages);
        setTotalCount(res.data.total);
      } else if (activeTab === 'history') {
        const params = { page, limit: 20 };
        if (filters.status) params.status = filters.status;
        if (filters.search) params.search = filters.search;

        const res = await api.get('/admin/sessions/login-logs', { params });
        setHistoryLogs(res.data.logs);
        setTotalPages(res.data.totalPages);
        setTotalCount(res.data.total);
      }
    } catch (err) {
      toast.error('Failed to load session data');
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    if (!socket) return;

    const handleNewLogin = (sessionData) => {

      if (activeTab === 'active') {
        setActiveSessions(prev => [sessionData, ...prev]);
        toast.success(`New login from ${sessionData.user?.email || 'a user'}`, { icon: '🟢' });
      }

      if (activeTab === 'history') {
        if (page === 1) {
          fetchData();
        } else {
          toast('New login activity recorded', { icon: '🔄' });
        }
      }
    };

    const handleFailedLogin = (data) => {
      if (activeTab === 'history') {
        fetchData();
      } else {
        toast.error(`Failed login attempt for ${data.email}`, { icon: '🚨' });
      }
    };

    const handleSessionTerminated = (sessionId) => {
      if (activeTab === 'active') {
        setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
      }
    };

    const handleSessionInactive = (sessionData) => {
      if (activeTab === 'active') {
        setActiveSessions(prev => prev.filter(s => s.id !== sessionData.id));
      } else if (activeTab === 'inactive') {
        setInactiveSessions(prev => [sessionData, ...prev]);
      }
    };

    socket.on('new-login', handleNewLogin);
    socket.on('failed-login', handleFailedLogin);
    socket.on('session-terminated', handleSessionTerminated);
    socket.on('session-inactive', handleSessionInactive);

    return () => {
      socket.off('new-login', handleNewLogin);
      socket.off('failed-login', handleFailedLogin);
      socket.off('session-terminated', handleSessionTerminated);
      socket.off('session-inactive', handleSessionInactive);
    };
  }, [socket, activeTab]);


  const handleTerminate = async (sessionId) => {
    if (!window.confirm('Are you sure you want to terminate this session? The user will be logged out instantly.')) return;

    try {
      await api.delete(`/admin/sessions/${sessionId}`);
      toast.success('Session terminated');
      setActiveSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err) {
      toast.error('Failed to terminate session');
    }
  };

  const handleFilterChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;
    if (name === 'search') {
      value = sanitizeSearchQuery(value, 100);
    }
    setFilters(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setPage(1);
  };


  const getDeviceIcon = (deviceType) => {
    return deviceType === 'mobile' || deviceType === 'tablet'
      ? <HiOutlineDeviceMobile className="text-dark-500" size={18} />
      : <HiOutlineDesktopComputer className="text-dark-500" size={18} />;
  };

  const formatTimeAgo = (date) => {
    const min = Math.floor((new Date() - new Date(date)) / 60000);
    if (min < 1) return 'Just now';
    if (min < 60) return `${min}m ago`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="space-y-6">


      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Device & Security</h1>
          <p className="text-dark-500 text-sm">Monitor active sessions and login audit trails</p>
        </div>
      </div>


      <div className="border-b border-dark-200">
        <nav className="-mb-px flex space-x-6">
          <button
            onClick={() => { setActiveTab('active'); setPage(1); }}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'active'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-dark-500 hover:text-dark-700 hover:border-dark-300'
              }`}
          >
            Active Devices ({activeSessions.length || 0})
          </button>
          <button
            onClick={() => { setActiveTab('history'); setPage(1); }}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'history'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-dark-500 hover:text-dark-700 hover:border-dark-300'
              }`}
          >
            Login History & Auth Logs
          </button>
          <button
            onClick={() => { setActiveTab('inactive'); setPage(1); }}
            className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'inactive'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-dark-500 hover:text-dark-700 hover:border-dark-300'
              }`}
          >
            Offline Sessions
          </button>
        </nav>
      </div>


      <div className="bg-white rounded-xl shadow-sm border border-dark-100 overflow-hidden min-h-[500px] relative">


        {activeTab === 'history' && (
          <div className="p-4 border-b border-dark-100 bg-dark-50/50 flex flex-wrap gap-4">
            <div className="relative">
              <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search email..."
                className="pl-9 pr-3 py-2 rounded-lg border border-dark-200 bg-white text-sm w-64"
              />
              {errors.search && <p className="mt-1 text-xs text-red-600">{errors.search}</p>}
            </div>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="px-3 py-2 rounded-lg border border-dark-200 bg-white text-sm"
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
            {errors.status && <p className="self-center text-xs text-red-600">{errors.status}</p>}
          </div>
        )}


        {loading && (
          <div className="absolute inset-x-0 top-16 bottom-0 bg-white/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-dark-50 text-dark-500 font-medium border-b border-dark-100">
              <tr>
                {activeTab === 'active' && (
                  <>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Device / Browser</th>
                    <th className="px-5 py-3">IP Address</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </>
                )}
                {activeTab === 'inactive' && (
                  <>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Device / Browser</th>
                    <th className="px-5 py-3">Logged In</th>
                    <th className="px-5 py-3">Logged Out</th>
                  </>
                )}
                {activeTab === 'history' && (
                  <>
                    <th className="px-5 py-3">Timestamp</th>
                    <th className="px-5 py-3">User / Email</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Device</th>
                    <th className="px-5 py-3">IP Address</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-50">

              {activeTab === 'active' && activeSessions.map(session => {
                const idleMins = Math.floor((new Date() - new Date(session.lastActiveAt)) / 60000);
                const isIdle = idleMins >= 10;

                return (
                  <tr key={session.id} className={`hover:bg-dark-50 transition-colors ${isIdle ? 'bg-yellow-50/30' : ''}`}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                          {session.user?.name.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-dark-900">{session.user?.name}</p>
                          <p className="text-xs text-dark-400">{session.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {getDeviceIcon(session.deviceInfo?.device)}
                        <div>
                          <p className="text-dark-800 font-medium">{session.deviceInfo?.os || 'Unknown OS'}</p>
                          <p className="text-xs text-dark-400">{session.deviceInfo?.browser || 'Unknown Browser'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-dark-600 text-xs">
                      {session.ipAddress}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex w-max items-center px-2 py-0.5 rounded text-xs font-medium border ${isIdle ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-green-100 text-green-800 border-green-200'}`}>
                          {isIdle ? `Idle for ${idleMins}m` : 'Active'}
                        </span>
                        <span className="text-xs text-dark-400 flex items-center gap-1">
                          <HiOutlineClock size={12} /> logged in {formatTimeAgo(session.loginAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleTerminate(session.id)}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                        title="Force Logout"
                      >
                        <HiOutlineTrash size={16} /> Terminate
                      </button>
                    </td>
                  </tr>
                );
              })}


              {activeTab === 'inactive' && inactiveSessions.map(session => (
                <tr key={session.id} className="hover:bg-dark-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-dark-900">{session.user?.name}</p>
                    <p className="text-xs text-dark-400">{session.user?.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-dark-800">{session.deviceInfo?.os} • {session.deviceInfo?.browser}</p>
                  </td>
                  <td className="px-5 py-3 text-dark-500 text-xs">
                    {new Date(session.loginAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-dark-500 text-xs">
                    {session.logoutAt ? new Date(session.logoutAt).toLocaleString() : 'Timeout / Expired'}
                  </td>
                </tr>
              ))}


              {activeTab === 'history' && historyLogs.map(log => (
                <tr key={log.id} className="hover:bg-dark-50 transition-colors">
                  <td className="px-5 py-3 text-dark-500 text-xs font-mono">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-dark-900">{log.user?.name || 'Unknown User'}</p>
                    <p className="text-xs text-dark-500">{log.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    {log.status === 'success' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                        <HiOutlineShieldCheck size={14} /> Success
                      </span>
                    ) : (
                      <div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                          <HiOutlineShieldExclamation size={14} /> Failed
                        </span>
                        <p className="text-[10px] text-red-500 mt-1 capitalize">{log.reason}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-dark-800 text-xs">{log.deviceInfo?.os} / {log.deviceInfo?.browser}</p>
                  </td>
                  <td className="px-5 py-3 font-mono text-dark-600 text-xs">
                    {log.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>


          {!loading && activeTab === 'active' && activeSessions.length === 0 && (
            <div className="p-12 text-center text-dark-400">No active sessions found.</div>
          )}
          {!loading && activeTab === 'history' && historyLogs.length === 0 && (
            <div className="p-12 text-center text-dark-400">No login records found matching criteria.</div>
          )}
          {!loading && activeTab === 'inactive' && inactiveSessions.length === 0 && (
            <div className="p-12 text-center text-dark-400">No inactive sessions to display.</div>
          )}
        </div>


        {(activeTab === 'history' || activeTab === 'inactive') && (
          <div className="absolute bottom-0 inset-x-0 p-4 border-t border-dark-100 bg-dark-50/50 flex justify-between items-center text-sm">
            <span className="text-dark-500">Total Records: {totalCount}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 bg-white border border-dark-200 rounded disabled:opacity-50"
              >
                Prev
              </button>
              <span className="px-2 py-1">Page {page} of {totalPages || 1}</span>
              <button
                disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 bg-white border border-dark-200 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default SessionsDashboard;

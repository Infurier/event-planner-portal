import { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import { 
  HiOutlinePlay, HiOutlinePause, HiOutlineDownload, 
  HiOutlineSearch, HiOutlineDocumentSearch, HiX
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { sanitizeSearchQuery, validateAdminLogFilters } from '../../utils/validation';

const LogsDashboard = () => {
  const [logs, setLogs] = useState([]);
  const [dbLogs, setDbLogs] = useState([]);
  const [totalDbLogs, setTotalDbLogs] = useState(0);
  const [loading, setLoading] = useState(true);
  
  
  const [filters, setFilters] = useState({
    level: '',
    search: '',
    startDate: '', // Format: YYYY-MM-DD
    endDate: ''    // Format: YYYY-MM-DD
  });
  const [errors, setErrors] = useState({});
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);

  // Settings
  const [isLiveStreamOn, setIsLiveStreamOn] = useState(true);
  
  // Real-time integration
  const { liveLogs } = useSocket();
  const endOfListRef = useRef(null);

  // Modal
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  // Combine live stream logs + DB logs when in live mode, or just DB logs when searching/paginating
  useEffect(() => {
    // If we're paginating past page 1 or explicitly searching/filtering by date, we disable the pure visual live stream mode 
    
    const isHistoricalQuery = page > 1 || filters.startDate || filters.endDate || filters.search;
    
    if (isLiveStreamOn && !isHistoricalQuery) {
      
      const liveIds = new Set(liveLogs.map(l => l.id));
      const filteredDb = dbLogs.filter(l => !liveIds.has(l.id));
      
      
      const filteredLive = filters.level 
        ? liveLogs.filter(l => l.level === filters.level)
        : liveLogs;

      setLogs([...filteredLive, ...filteredDb]);
    } else {
      setLogs(dbLogs);
    }
  }, [liveLogs, dbLogs, isLiveStreamOn, page, filters]);

  
  useEffect(() => {
    
    const syncTimer = setInterval(() => {
      if (page === 1) {
        fetchLogs(true); 
      }
    }, 30000);
    return () => clearInterval(syncTimer);
  }, [page, filters]);

  const fetchLogs = async (silent = false) => {
    const validationErrors = validateAdminLogFilters(filters);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      if (!silent) setLoading(false);
      return;
    }

    setErrors({});
    try {
      if (!silent) setLoading(true);
      
      
      const params = { page, limit };
      if (filters.level) params.level = filters.level;
      if (filters.search) params.search = filters.search;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const res = await api.get('/admin/logs', { params });
      setDbLogs(res.data.logs);
      setTotalDbLogs(res.data.total);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    const validationErrors = validateAdminLogFilters(filters);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the highlighted filters before exporting.');
      return;
    }

    setErrors({});
    try {
      
      const params = {};
      if (filters.level) params.level = filters.level;
      if (filters.search) params.search = filters.search;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await api.get('/admin/logs/export', { 
        params,
        responseType: 'blob' 
      });
      
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `system_logs_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Logs exported successfully');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export logs');
    }
  };

  const handleFilterChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;

    if (name === 'search') {
      value = sanitizeSearchQuery(value, 120);
    }

    setFilters(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setPage(1); 
  };

  
  const getLevelColor = (level) => {
    switch(level) {
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'warn': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200 font-bold';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">System Logs</h1>
          <p className="text-dark-500 text-sm">Real-time application monitoring & diagnostics</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {}
          <button 
            onClick={() => setIsLiveStreamOn(!isLiveStreamOn)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              isLiveStreamOn 
                ? 'bg-green-100 text-green-700 border border-green-200 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
            }`}
          >
            {isLiveStreamOn ? (
              <><HiOutlinePause size={16} /> <span>Live Stream Active</span> <span className="flex h-2 w-2 relative mx-1"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span></>
            ) : (
              <><HiOutlinePlay size={16} /> <span>Live Stream Paused</span></>
            )}
          </button>
          
          <button 
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-dark-200 bg-white text-dark-700 hover:bg-dark-50 transition-colors text-sm font-medium"
          >
            <HiOutlineDownload size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {}
      <div className="bg-white p-4 rounded-xl border border-dark-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-dark-500 uppercase tracking-wider mb-1">Search</label>
          <div className="relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
            <input 
              type="text" 
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Message, route, stack..." 
              className="pl-9 pr-3 py-2 w-full rounded-lg border border-dark-200 bg-dark-50 focus:bg-white text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
            />
          </div>
          {errors.search && <p className="mt-1 text-xs text-red-600">{errors.search}</p>}
        </div>
        
        <div>
          <label className="block text-xs font-semibold text-dark-500 uppercase tracking-wider mb-1">Level</label>
          <select 
            name="level"
            value={filters.level}
            onChange={handleFilterChange}
            className="w-full px-3 py-2 rounded-lg border border-dark-200 bg-dark-50 focus:bg-white text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
          >
            <option value="">All Levels</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
            <option value="critical">Critical</option>
          </select>
          {errors.level && <p className="mt-1 text-xs text-red-600">{errors.level}</p>}
        </div>

        <div>
           <label className="block text-xs font-semibold text-dark-500 uppercase tracking-wider mb-1">Start Date</label>
           <input 
              type="date" 
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 rounded-lg border border-dark-200 bg-dark-50 focus:bg-white text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
            />
           {errors.startDate && <p className="mt-1 text-xs text-red-600">{errors.startDate}</p>}
        </div>

        <div>
           <label className="block text-xs font-semibold text-dark-500 uppercase tracking-wider mb-1">End Date</label>
           <input 
              type="date" 
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 rounded-lg border border-dark-200 bg-dark-50 focus:bg-white text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
            />
           {errors.endDate && <p className="mt-1 text-xs text-red-600">{errors.endDate}</p>}
        </div>
      </div>

      {}
      <div className="bg-white rounded-xl border border-dark-100 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-dark-50/50 border-b border-dark-100 text-dark-500 font-medium">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Method / Route</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-50">
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-dark-400">
                    <div className="flex flex-col items-center gap-2">
                      <HiOutlineDocumentSearch size={32} />
                      <p>No logs found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-dark-50/50 transition-colors">
                  <td className="px-4 py-3 text-dark-500 font-mono text-xs">
                    {new Date(log.createdAt || log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getLevelColor(log.level)}`}>
                      {log.level.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {log.method && log.route ? (
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <span className="font-semibold text-dark-700">{log.method}</span>
                        <span className="text-dark-400">{log.route.length > 30 ? log.route.substring(0, 30) + '...' : log.route}</span>
                        {log.statusCode && (
                          <span className={`ml-1 ${log.statusCode >= 400 ? 'text-red-500' : 'text-green-500'}`}>
                            {log.statusCode}
                          </span>
                        )}
                        {log.responseTime && <span className="text-dark-400">({log.responseTime}ms)</span>}
                      </div>
                    ) : (
                      <span className="text-dark-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 truncate max-w-md text-dark-800">
                    {log.message}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={() => setSelectedLog(log)}
                      className="text-primary-600 hover:text-primary-700 font-medium text-xs hover:underline"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {}
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10 min-h-[300px]">
            <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
          </div>
        )}

        {}
        <div className="mt-auto p-4 border-t border-dark-100 bg-dark-50/30 flex items-center justify-between text-sm">
          <span className="text-dark-500">
            Showing latest {logs.length} of {totalDbLogs} logs in database
          </span>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 bg-white border border-dark-200 rounded-lg hover:bg-dark-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Previous
            </button>
            <span className="text-dark-600 font-medium px-2">Page {page} of {totalPages}</span>
            <button 
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 bg-white border border-dark-200 rounded-lg hover:bg-dark-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {}
      {selectedLog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pb-20 sm:pb-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedLog(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-scale-up">
            
            <div className="flex items-start justify-between p-5 border-b border-dark-100 bg-dark-50/50 rounded-t-2xl">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getLevelColor(selectedLog.level)}`}>
                    {selectedLog.level.toUpperCase()}
                  </span>
                  <span className="text-dark-500 font-mono text-xs">
                    {new Date(selectedLog.createdAt || selectedLog.timestamp).toISOString()}
                  </span>
                  <span className="text-dark-400 font-mono text-xs">
                    ID: {selectedLog.id}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-dark-900 break-words">{selectedLog.message}</h3>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="p-1.5 text-dark-400 hover:bg-dark-100 hover:text-dark-700 rounded-lg transition-colors"
              >
                <HiX size={20} />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-white">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-xs font-bold text-dark-400 uppercase tracking-wider mb-2">Request Info</h4>
                  <div className="bg-dark-50 rounded-xl p-3 space-y-2 font-mono text-sm border border-dark-100">
                    <p><span className="text-dark-400 select-none">Method:</span> <span className="font-semibold">{selectedLog.method || '-'}</span></p>
                    <p><span className="text-dark-400 select-none">Route:</span> {selectedLog.route || '-'}</p>
                    <p><span className="text-dark-400 select-none">Status:</span> 
                      {selectedLog.statusCode ? (
                        <span className={selectedLog.statusCode >= 400 ? 'text-red-500 font-bold' : 'text-green-500 font-bold'}> {selectedLog.statusCode}</span>
                      ) : ' -'}
                    </p>
                    <p><span className="text-dark-400 select-none">Response Time:</span> {selectedLog.responseTime ? `${selectedLog.responseTime}ms` : '-'}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-xs font-bold text-dark-400 uppercase tracking-wider mb-2">Context Info</h4>
                  <div className="bg-dark-50 rounded-xl p-3 space-y-2 font-mono text-sm border border-dark-100">
                    <p><span className="text-dark-400 select-none">Environment:</span> {selectedLog.environment || 'development'}</p>
                    <p><span className="text-dark-400 select-none">User ID:</span> {selectedLog.userId || 'Anonymous'}</p>
                    <p><span className="text-dark-400 select-none">Request ID:</span> <span className="text-xs">{selectedLog.requestId || '-'}</span></p>
                  </div>
                </div>
              </div>

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-dark-400 uppercase tracking-wider mb-2">Metadata</h4>
                  <div className="bg-dark-900 rounded-xl p-4 overflow-x-auto border border-dark-800">
                    <pre className="text-xs font-mono text-blue-300">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {selectedLog.stack && (
                <div>
                  <h4 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2">Stack Trace</h4>
                  <div className="bg-[#1e1e1e] rounded-xl p-4 overflow-x-auto border border-red-900/30">
                    <pre className="text-xs font-mono text-red-300 leading-relaxed whitespace-pre-wrap">
                      {selectedLog.stack}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-dark-100 flex justify-end bg-dark-50/50 rounded-b-2xl">
              <button onClick={() => setSelectedLog(null)} className="btn-secondary">Close Details</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LogsDashboard;

import { useState, useEffect } from 'react';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineBell, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineExclamation } from 'react-icons/hi';
import { getApiErrorMessage } from '../utils/validation';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    API.get('/notifications').then(r => {
      setNotifications(r.data.notifications || []);
      setUnread(r.data.unreadCount || 0);
    }).catch(() => {});
  }, []);

  const markRead = async (id) => {
    await API.put(`/notifications/${id}/read`);
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnread(Math.max(0, unread - 1));
  };

  const markAll = async () => {
    await API.put('/notifications/read-all');
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    setUnread(0);
  };

  const handleBudgetAction = async (id, action) => {
    setProcessing(id);
    try {
      const { data } = await API.put(`/notifications/${id}/budget-action`, { action });
      toast.success(data.message);
      setNotifications(notifications.map(n =>
        n.id === id ? { ...n, actionStatus: action, isRead: true } : n
      ));
      setUnread(Math.max(0, unread - 1));
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Action failed'));
    } finally {
      setProcessing(null);
    }
  };

  const getNotificationIcon = (type, actionStatus) => {
    if (type === 'budget') {
      if (actionStatus === 'accepted') return { icon: '✅', color: 'text-emerald-500' };
      if (actionStatus === 'rejected') return { icon: '❌', color: 'text-red-500' };
      return { icon: '⚠️', color: 'text-amber-500' };
    }
    return { icon: '', color: '' };
  };

  const getNotificationStyle = (n) => {
    if (n.type === 'budget' && n.actionStatus === 'pending' && !n.isRead) {
      return 'border-l-4 border-amber-500 bg-amber-50/40';
    }
    if (!n.isRead) {
      return 'border-l-4 border-primary-500 bg-primary-50/30';
    }
    return '';
  };

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-header mb-0">Notifications {unread > 0 && <span className="text-sm text-primary-600">({unread} unread)</span>}</h1>
        {unread > 0 && <button onClick={markAll} className="text-primary-600 text-sm font-medium">Mark all as read</button>}
      </div>
      {notifications.length === 0 ? (
        <div className="card text-center py-12">
          <HiOutlineBell size={48} className="mx-auto text-dark-300 mb-3" />
          <p className="text-dark-400">No notifications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map(n => {
            const { icon, color } = getNotificationIcon(n.type, n.actionStatus);
            const isBudgetPending = n.type === 'budget' && n.actionStatus === 'pending';

            return (
              <div key={n.id}
                onClick={() => !n.isRead && !isBudgetPending && markRead(n.id)}
                className={`card transition-all ${isBudgetPending ? '' : 'cursor-pointer'} ${getNotificationStyle(n)}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {icon && <span className={`${color}`}>{icon}</span>}
                      <h3 className="font-semibold text-dark-800 text-sm">{n.title}</h3>
                      {n.type === 'budget' && n.actionStatus && n.actionStatus !== 'pending' && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          n.actionStatus === 'accepted' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {n.actionStatus === 'accepted' ? 'Approved' : 'Rejected'}
                        </span>
                      )}
                    </div>
                    <p className="text-dark-500 text-sm mt-1">{n.message}</p>
                  </div>
                  {!n.isRead && !isBudgetPending && <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2"></span>}
                </div>

                {/* Budget Approval Actions */}
                {isBudgetPending && (
                  <div className="mt-4 pt-3 border-t border-amber-200 flex items-center gap-3">
                    <HiOutlineExclamation size={18} className="text-amber-600 flex-shrink-0" />
                    <span className="text-xs text-amber-700 font-medium flex-1">Action required — approve or reject this over-budget booking</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleBudgetAction(n.id, 'accepted'); }}
                      disabled={processing === n.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      <HiOutlineCheckCircle size={16} />
                      Accept
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleBudgetAction(n.id, 'rejected'); }}
                      disabled={processing === n.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                      <HiOutlineXCircle size={16} />
                      Reject
                    </button>
                  </div>
                )}

                <p className="text-xs text-dark-400 mt-2">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default Notifications;

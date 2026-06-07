import { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineBriefcase, HiOutlineChevronDown, HiOutlineChevronUp } from 'react-icons/hi';

const STATUS_TABS = ['all', 'pending', 'confirmed', 'completed', 'rejected', 'cancelled'];
const PAYMENT_OPTIONS = ['unpaid', 'partially_paid', 'paid'];

const BookingRequests = () => {
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/bookings/vendor').then(r => setBookings(r.data.bookings || [])).catch(() => { }).finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/bookings/${id}/status`, { status });
      setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
      toast.success(`Booking ${status}`);
    } catch { toast.error('Failed'); }
  };

  const updatePayment = async (id, paymentStatus) => {
    try {
      await API.put(`/bookings/${id}/payment`, { paymentStatus });
      setBookings(bookings.map(b => b.id === id ? { ...b, paymentStatus } : b));
      toast.success('Payment status updated');
    } catch { toast.error('Failed'); }
  };

  const filtered = activeTab === 'all' ? bookings : bookings.filter(b => b.status === activeTab);
  const counts = STATUS_TABS.reduce((acc, t) => { acc[t] = t === 'all' ? bookings.length : bookings.filter(b => b.status === t).length; return acc; }, {});

  const paymentBadge = (ps) => {
    const map = { paid: 'bg-emerald-100 text-emerald-700', partially_paid: 'bg-amber-100 text-amber-700', unpaid: 'bg-red-50 text-red-600' };
    return <span className={`badge text-xs ${map[ps] || map.unpaid}`}>{(ps || 'unpaid').replace('_', ' ')}</span>;
  };

  if (loading) return <div className="animate-pulse text-dark-400">Loading...</div>;

  return (
    <div className="animate-fade-in">
      <h1 className="page-header">Booking Requests</h1>


      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
        {STATUS_TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all capitalize
              ${activeTab === tab ? 'bg-primary-600 text-white shadow-md' : 'bg-white text-dark-600 hover:bg-dark-100'}`}>
            {tab} {counts[tab] > 0 && <span className="ml-1 opacity-75">({counts[tab]})</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <HiOutlineBriefcase size={48} className="mx-auto text-dark-300 mb-3" />
          <p className="text-dark-400">No {activeTab !== 'all' ? activeTab : ''} bookings.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(b => (
            <div key={b.id} className={`card transition-all ${b.status === 'pending' ? 'border-l-4 border-amber-400' : ''}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-primary-100 rounded-xl flex items-center justify-center text-primary-700 font-bold flex-shrink-0">
                    {b.user?.name?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-dark-800">{b.user?.name}</h3>
                    <p className="text-xs text-dark-400">{b.user?.email}</p>
                    <p className="text-sm text-dark-500 mt-0.5">{b.service?.name} • {new Date(b.bookingDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-dark-900">₹{Number(b.amount).toLocaleString()}</p>
                    <div className="flex gap-2 mt-1">
                      <span className={`badge-${b.status}`}>{b.status}</span>
                      {paymentBadge(b.paymentStatus)}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {b.status === 'pending' && (
                      <>
                        <button onClick={() => updateStatus(b.id, 'confirmed')} className="text-emerald-600 text-xs font-semibold hover:underline">Accept</button>
                        <button onClick={() => updateStatus(b.id, 'rejected')} className="text-red-500 text-xs font-semibold hover:underline">Reject</button>
                      </>
                    )}
                    {b.status === 'confirmed' && (
                      <button onClick={() => updateStatus(b.id, 'completed')} className="text-primary-600 text-xs font-semibold hover:underline">Complete</button>
                    )}
                  </div>
                  <button onClick={() => setExpandedId(expandedId === b.id ? null : b.id)} className="text-dark-400 hover:text-dark-600">
                    {expandedId === b.id ? <HiOutlineChevronUp size={20} /> : <HiOutlineChevronDown size={20} />}
                  </button>
                </div>
              </div>


              {expandedId === b.id && (
                <div className="mt-4 pt-4 border-t border-dark-100 space-y-3 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-dark-50 rounded-lg p-3">
                      <p className="text-xs text-dark-400 mb-1">Event Details</p>
                      <p className="font-medium text-dark-800">{b.event?.name}</p>
                      <p className="text-dark-500">{b.event?.type} • {b.event?.location}</p>
                      <p className="text-dark-500">{b.event?.guestCount} guests • {new Date(b.event?.date).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-dark-50 rounded-lg p-3">
                      <p className="text-xs text-dark-400 mb-1">Client Contact</p>
                      <p className="font-medium text-dark-800">{b.user?.name}</p>
                      <p className="text-dark-500">{b.user?.email}</p>
                      {b.user?.phone && <p className="text-dark-500">📞 {b.user.phone}</p>}
                    </div>
                    <div className="bg-dark-50 rounded-lg p-3">
                      <p className="text-xs text-dark-400 mb-1">Payment Status</p>
                      <select className="select-field mt-1 text-sm"
                        value={b.paymentStatus || 'unpaid'}
                        onChange={e => updatePayment(b.id, e.target.value)}>
                        {PAYMENT_OPTIONS.map(p => <option key={p} value={p}>{p.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                  </div>
                  {b.notes && (
                    <div className="bg-dark-50 rounded-lg p-3 text-sm">
                      <p className="text-xs text-dark-400 mb-1">Client Notes</p>
                      <p className="text-dark-600">{b.notes}</p>
                    </div>
                  )}
                  {(b.status === 'confirmed' || b.status === 'completed') && (
                    <div className="bg-primary-50 rounded-lg p-3 text-sm flex items-center justify-between">
                      <div>
                        <p className="text-xs text-primary-500 mb-1">Service Agreement Contract</p>
                        <p className="text-primary-700 font-medium">Contract auto-generated on confirmation</p>
                      </div>
                      <div className="flex gap-2">
                        <a href={`/api/contracts/${b.id}/view?token=${localStorage.getItem('token')}`} target="_blank" rel="noopener noreferrer"
                          className="text-primary-600 text-xs font-semibold hover:underline">📄 View</a>
                        <a href={`/api/contracts/${b.id}/download?token=${localStorage.getItem('token')}`}
                          className="text-emerald-600 text-xs font-semibold hover:underline">⬇ Download</a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default BookingRequests;

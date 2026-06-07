import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineBriefcase, HiStar } from 'react-icons/hi';
import { extractFieldErrors, getApiErrorMessage, sanitizePlainText, validateReviewForm } from '../../utils/validation';

const STATUS_TABS = ['all', 'pending', 'confirmed', 'completed', 'rejected', 'cancelled'];

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewErrors, setReviewErrors] = useState({});

  useEffect(() => {
    API.get('/bookings/client').then(r => setBookings(r.data.bookings || [])).catch(() => { }).finally(() => setLoading(false));
  }, []);

  const cancelBooking = async (id) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await API.delete(`/bookings/${id}`);
      setBookings(bookings.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
      toast.success('Booking cancelled');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to cancel'); }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    const validationErrors = validateReviewForm(reviewForm);
    if (Object.keys(validationErrors).length > 0) {
      setReviewErrors(validationErrors);
      toast.error('Please fix the highlighted fields.');
      return;
    }

    try {
      await API.post('/reviews', {
        vendorId: reviewModal.vendorId,
        bookingId: reviewModal.id,
        rating: reviewForm.rating,
        comment: sanitizePlainText(reviewForm.comment)
      });
      toast.success('Review submitted!');
      setReviewModal(null);
      setReviewForm({ rating: 5, comment: '' });
      setReviewErrors({});
    } catch (err) {
      setReviewErrors((prev) => ({ ...prev, ...extractFieldErrors(err) }));
      toast.error(getApiErrorMessage(err, 'Failed'));
    }
  };

  const isReviewValid = Object.keys(validateReviewForm(reviewForm)).length === 0;

  const filtered = activeTab === 'all' ? bookings : bookings.filter(b => b.status === activeTab);
  const counts = STATUS_TABS.reduce((acc, t) => { acc[t] = t === 'all' ? bookings.length : bookings.filter(b => b.status === t).length; return acc; }, {});

  const paymentBadge = (ps) => {
    const map = { paid: 'bg-emerald-100 text-emerald-700', partially_paid: 'bg-amber-100 text-amber-700', unpaid: 'bg-red-50 text-red-600' };
    return <span className={`badge text-xs ${map[ps] || map.unpaid}`}>{(ps || 'unpaid').replace('_', ' ')}</span>;
  };

  if (loading) return <div className="animate-pulse text-dark-400">Loading...</div>;

  return (
    <div className="animate-fade-in">
      <h1 className="page-header">My Bookings</h1>


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
            <div key={b.id} className="card hover:border-primary-200 transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-accent-500 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                    {b.vendor?.user?.name?.charAt(0) || 'V'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-dark-800">{b.service?.name}</h3>
                    <p className="text-sm text-dark-500">{b.vendor?.user?.name || b.vendor?.businessName}</p>
                    <p className="text-xs text-dark-400 mt-0.5">Event: {b.event?.name} • {new Date(b.bookingDate).toLocaleDateString()}</p>
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
                      <button onClick={() => cancelBooking(b.id)} className="text-red-500 text-xs font-semibold hover:underline">Cancel</button>
                    )}
                    {(b.status === 'confirmed' || b.status === 'completed') && (
                      <>
                        <a href={`/api/contracts/${b.id}/view?token=${localStorage.getItem('token')}`} target="_blank" rel="noopener noreferrer" className="text-primary-600 text-xs font-semibold hover:underline">📄 View Contract</a>
                        <a href={`/api/contracts/${b.id}/download?token=${localStorage.getItem('token')}`} className="text-emerald-600 text-xs font-semibold hover:underline">⬇ Download</a>
                      </>
                    )}
                    {b.status === 'completed' && (
                      <button onClick={() => { setReviewModal(b); setReviewErrors({}); setReviewForm({ rating: 5, comment: '' }); }} className="text-primary-600 text-xs font-semibold hover:underline">⭐ Review</button>
                    )}
                    {b.vendor?.user?.phone && (
                      <a href={`tel:${b.vendor.user.phone}`} className="text-dark-400 text-xs hover:text-primary-600">📞 Contact</a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}


      {reviewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setReviewModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-slide-up" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-dark-900 mb-1">Leave a Review</h2>
            <p className="text-sm text-dark-500 mb-4">for {reviewModal.service?.name}</p>
            <form onSubmit={submitReview} className="space-y-4">
              <div>
                <label className="label">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" onClick={() => { setReviewForm({ ...reviewForm, rating: n }); if (reviewErrors.rating) setReviewErrors((prev) => ({ ...prev, rating: '' })); }}>
                      <HiStar size={32} className={n <= reviewForm.rating ? 'text-amber-400' : 'text-dark-200'} />
                    </button>
                  ))}
                </div>
                {reviewErrors.rating && <p className="text-xs text-red-600 mt-1">{reviewErrors.rating}</p>}
              </div>
              <div>
                <label className="label">Comment</label>
                <textarea className="input-field" rows={3} placeholder="How was your experience?"
                  value={reviewForm.comment} onChange={e => { setReviewForm({ ...reviewForm, comment: e.target.value }); if (reviewErrors.comment) setReviewErrors((prev) => ({ ...prev, comment: '' })); }} />
                {reviewErrors.comment && <p className="text-xs text-red-600 mt-1">{reviewErrors.comment}</p>}
              </div>
              {reviewErrors.bookingId && <p className="text-xs text-red-600">{reviewErrors.bookingId}</p>}
              {reviewErrors.form && <p className="text-xs text-red-600">{reviewErrors.form}</p>}
              <div className="flex gap-3">
                <button type="submit" disabled={!isReviewValid} className="btn-primary flex-1 disabled:opacity-50">Submit Review</button>
                <button type="button" onClick={() => setReviewModal(null)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;

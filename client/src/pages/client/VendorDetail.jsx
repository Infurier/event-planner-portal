import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineStar, HiOutlineLocationMarker, HiOutlinePhone, HiStar, HiOutlineCheck, HiOutlineCalendar, HiOutlineExclamation, HiOutlineChatAlt2 } from 'react-icons/hi';
import { extractFieldErrors, getApiErrorMessage, isFutureOrTodayDate, sanitizePlainText, validateBookingRequest, validateReviewForm } from '../../utils/validation';

const TIER_CONFIG = {
  basic: { label: 'Basic', color: 'bg-dark-100 text-dark-700 border-dark-200', ring: 'ring-dark-200' },
  standard: { label: 'Standard', color: 'bg-primary-50 text-primary-700 border-primary-200', ring: 'ring-primary-300' },
  premium: { label: 'Premium', color: 'bg-amber-50 text-amber-700 border-amber-200', ring: 'ring-amber-300' }
};

const STEPS = ['Select Package', 'Select Event', 'Check Availability', 'Confirm Booking'];

const VendorDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [events, setEvents] = useState([]);
  const [similarVendors, setSimilarVendors] = useState([]);
  const [loading, setLoading] = useState(true);


  const [bookingStep, setBookingStep] = useState(0); 
  const [selectedService, setSelectedService] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [notes, setNotes] = useState('');
  const [availability, setAvailability] = useState(null); // null, true, false
  const [checkingAvail, setCheckingAvail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingErrors, setBookingErrors] = useState({});
  const [messagingVendor, setMessagingVendor] = useState(false);

  // Review
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewErrors, setReviewErrors] = useState({});

  useEffect(() => {
    API.get(`/vendors/${id}`).then(r => setVendor(r.data.vendor)).catch(() => { }).finally(() => setLoading(false));
    API.get(`/vendors/${id}/similar`).then(r => setSimilarVendors(r.data.vendors || [])).catch(() => { });
    if (user?.role === 'client') {
      API.get('/events').then(r => setEvents(r.data.events || [])).catch(() => { });
    }
  }, [id, user]);

  
  const selectPackage = (svc) => {
    setSelectedService(svc);
    setBookingStep(2);
    setAvailability(null);
    setBookingDate('');
    setBookingErrors({});
  };

  // Step 3: Check Availability
  const checkAvail = async () => {
    const nextErrors = {};
    if (!bookingDate) {
      nextErrors.bookingDate = 'Please select a booking date.';
    } else if (!isFutureOrTodayDate(bookingDate)) {
      nextErrors.bookingDate = 'Booking date cannot be in the past.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setBookingErrors((prev) => ({ ...prev, ...nextErrors }));
      toast.error(nextErrors.bookingDate);
      return;
    }

    setCheckingAvail(true);
    try {
      const { data } = await API.get(`/vendors/${id}/availability?date=${bookingDate}`);
      setAvailability(data.available);
      if (data.available) setBookingStep(4);
    } catch (err) { toast.error(getApiErrorMessage(err, 'Failed to check availability')); }
    finally { setCheckingAvail(false); }
  };

  
  const submitBooking = async () => {
    const validationErrors = validateBookingRequest({ selectedEvent, selectedService, bookingDate, notes });
    if (availability !== true) {
      validationErrors.bookingDate = validationErrors.bookingDate || 'Please confirm availability before booking.';
    }

    if (Object.keys(validationErrors).length > 0) {
      setBookingErrors(validationErrors);
      toast.error('Please fix the highlighted booking details.');
      return;
    }

    setSubmitting(true);
    try {
      await API.post('/bookings', {
        eventId: selectedEvent.id,
        serviceId: selectedService.id,
        vendorId: vendor.id,
        amount: selectedService.price,
        bookingDate,
        notes: sanitizePlainText(notes)
      });
      toast.success('🎉 Booking request sent! The vendor will review it soon.');
      resetBooking();
    } catch (err) {
      setBookingErrors((prev) => ({ ...prev, ...extractFieldErrors(err) }));
      toast.error(getApiErrorMessage(err, 'Booking failed'));
    } finally { setSubmitting(false); }
  };

  const resetBooking = () => {
    setBookingStep(0); setSelectedService(null); setSelectedEvent(null);
    setBookingDate(''); setNotes(''); setAvailability(null); setBookingErrors({});
  };

  const handleReview = async (e) => {
    e.preventDefault();
    const validationErrors = validateReviewForm(reviewForm);
    if (Object.keys(validationErrors).length > 0) {
      setReviewErrors(validationErrors);
      toast.error('Please fix the highlighted review fields.');
      return;
    }

    try {
      await API.post('/reviews', { vendorId: Number(id), rating: reviewForm.rating, comment: sanitizePlainText(reviewForm.comment) });
      toast.success('Review submitted!');
      setReviewForm({ rating: 5, comment: '' });
      setReviewErrors({});
      const r = await API.get(`/vendors/${id}`);
      setVendor(r.data.vendor);
    } catch (err) {
      setReviewErrors((prev) => ({ ...prev, ...extractFieldErrors(err) }));
      toast.error(getApiErrorMessage(err, 'Review failed'));
    }
  };

  if (loading) return <div className="animate-pulse text-dark-400">Loading...</div>;
  if (!vendor) return <div className="text-dark-400">Vendor not found.</div>;

  const handleMessageVendor = async () => {
    if (!vendor?.userId) return;
    setMessagingVendor(true);
    try {
      const { data } = await API.post('/messages/conversations/find-or-create', {
        vendorUserId: vendor.userId
      });
      navigate(`/messages?conversation=${data.conversationId}`);
    } catch {
      toast.error('Failed to start conversation');
    } finally {
      setMessagingVendor(false);
    }
  };

  
  const tiers = ['basic', 'standard', 'premium'];
  const servicesByTier = tiers.reduce((acc, tier) => {
    acc[tier] = (vendor.services || []).filter(s => (s.packageTier || 'standard') === tier);
    return acc;
  }, {});
  const hasServices = (vendor.services || []).length > 0;
  const bookingValidation = validateBookingRequest({ selectedEvent, selectedService, bookingDate, notes });
  const isBookingValid = Object.keys(bookingValidation).length === 0;
  const isReviewValid = Object.keys(validateReviewForm(reviewForm)).length === 0;

  return (
    <div className="animate-fade-in max-w-5xl">
      <Link to="/vendors" className="text-sm text-primary-600 hover:underline mb-4 block">← Back to Vendors</Link>

      {}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-accent-500 rounded-2xl flex items-center justify-center text-white font-bold text-3xl flex-shrink-0 shadow-lg">
            {vendor.businessName?.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-dark-900">{vendor.businessName}</h1>
                <span className="badge bg-primary-50 text-primary-700 mt-1">{vendor.category?.name}</span>
              </div>
              <div className="flex items-center gap-1 text-amber-500">
                <HiStar size={22} />
                <span className="font-bold text-lg">{vendor.rating || '0.0'}</span>
                <span className="text-sm text-dark-400">({vendor.totalReviews || 0})</span>
              </div>
            </div>
            <p className="text-dark-500 mt-3">{vendor.description || 'Premium service provider'}</p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-dark-500">
              {vendor.city && <span className="flex items-center gap-1"><HiOutlineLocationMarker /> {vendor.address || vendor.city}</span>}
              {vendor.phone && <span className="flex items-center gap-1"><HiOutlinePhone /> {vendor.phone}</span>}
            </div>
            {user?.role === 'client' && (
              <button
                onClick={handleMessageVendor}
                disabled={messagingVendor}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl text-sm font-medium hover:from-primary-600 hover:to-primary-700 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
              >
                <HiOutlineChatAlt2 size={18} />
                {messagingVendor ? 'Opening...' : 'Message Vendor'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Portfolio Gallery */}
          {(vendor.portfolioImages || []).length > 0 && (
            <div className="card">
              <h2 className="font-bold text-dark-900 mb-4 text-lg">📸 Portfolio</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {vendor.portfolioImages.map((img, i) => {
                  const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
                  return (
                    <div key={i} className="aspect-square rounded-xl overflow-hidden border border-dark-200 hover:shadow-lg transition-shadow">
                      <img src={`${apiBase}${img}`} alt={`${vendor.businessName} portfolio ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {}<div className="card">
            <h2 className="font-bold text-dark-900 mb-4 text-lg">Service Packages</h2>
            {!hasServices ? (
              <p className="text-dark-400 text-sm">No services listed yet.</p>
            ) : (
              <div className="space-y-4">
                {tiers.map(tier => {
                  const services = servicesByTier[tier];
                  if (!services.length) return null;
                  const cfg = TIER_CONFIG[tier];
                  return services.map(s => (
                    <div key={s.id} className={`p-5 rounded-xl border-2 ${cfg.ring} border-transparent hover:border-current transition-all ${selectedService?.id === s.id ? `${cfg.ring} ring-2` : ''
                      }`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${cfg.color}`}>{cfg.label}</span>
                          <h3 className="font-bold text-dark-900 text-lg mt-2">{s.name}</h3>
                        </div>
                        <p className="text-2xl font-bold text-primary-600">₹{Number(s.price).toLocaleString()}</p>
                      </div>
                      {s.description && <p className="text-sm text-dark-500 mb-3">{s.description}</p>}
                      {s.duration && <p className="text-sm text-dark-500 mb-3">⏱ Duration: {s.duration}</p>}
                      {(s.includedItems || []).length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-semibold text-dark-700 mb-2">Included:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                            {s.includedItems.map((item, i) => (
                              <span key={i} className="flex items-center gap-2 text-sm text-dark-600">
                                <HiOutlineCheck className="text-emerald-500 flex-shrink-0" size={16} /> {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {user?.role === 'client' && (
                        <button onClick={() => selectPackage(s)}
                          className={`btn-sm w-full ${selectedService?.id === s.id ? 'btn-secondary' : 'btn-primary'}`}>
                          {selectedService?.id === s.id ? '✓ Selected' : 'Select Package'}
                        </button>
                      )}
                    </div>
                  ));
                })}
              </div>
            )}
          </div>

          {}
          {bookingStep >= 2 && user?.role === 'client' && (
            <div className="card border-2 border-primary-200">
              {}
              <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                {STEPS.map((label, i) => (
                  <div key={i} className="flex items-center gap-2 flex-shrink-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold
                      ${bookingStep > i + 1 ? 'bg-emerald-500 text-white' : bookingStep === i + 1 ? 'bg-primary-600 text-white' : 'bg-dark-100 text-dark-400'}`}>
                      {bookingStep > i + 1 ? '✓' : i + 1}
                    </div>
                    <span className={`text-xs font-medium ${bookingStep >= i + 1 ? 'text-dark-800' : 'text-dark-400'}`}>{label}</span>
                    {i < STEPS.length - 1 && <div className={`w-8 h-0.5 ${bookingStep > i + 1 ? 'bg-emerald-400' : 'bg-dark-200'}`} />}
                  </div>
                ))}
              </div>

              {}
              <div className="mb-5">
                <label className="label">Select Event for this Booking *</label>
                <select className="select-field" value={selectedEvent?.id || ''}
                  onChange={e => {
                    setSelectedEvent(events.find(ev => ev.id == e.target.value) || null);
                    if (bookingErrors.selectedEvent) {
                      setBookingErrors((prev) => ({ ...prev, selectedEvent: '' }));
                    }
                  }}>
                  <option value="">Choose your event...</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.name} — {new Date(ev.date).toLocaleDateString()} ({ev.type})</option>
                  ))}
                </select>
                {bookingErrors.selectedEvent && <p className="text-xs text-red-600 mt-1">{bookingErrors.selectedEvent}</p>}
                {selectedEvent && (
                  <div className="mt-2 p-3 bg-dark-50 rounded-lg text-sm text-dark-600">
                    📍 {selectedEvent.location} • 👥 {selectedEvent.guestCount} guests • 💰 Budget: ₹{Number(selectedEvent.budget || 0).toLocaleString()}
                  </div>
                )}
              </div>

              {/* Step 3: Check Availability */}
              <div className="mb-5">
                <label className="label flex items-center gap-2"><HiOutlineCalendar /> Booking Date *</label>
                <div className="flex gap-3">
                  <input type="date" min={new Date().toISOString().split('T')[0]} className="input-field flex-1" value={bookingDate}
                    onChange={e => {
                      setBookingDate(e.target.value);
                      setAvailability(null);
                      setBookingStep(3);
                      if (bookingErrors.bookingDate) {
                        setBookingErrors((prev) => ({ ...prev, bookingDate: '' }));
                      }
                    }} />
                  <button onClick={checkAvail} disabled={checkingAvail || !bookingDate}
                    className="btn-secondary disabled:opacity-50 whitespace-nowrap">
                    {checkingAvail ? 'Checking...' : 'Check Availability'}
                  </button>
                </div>
                {bookingErrors.bookingDate && <p className="text-xs text-red-600 mt-1">{bookingErrors.bookingDate}</p>}
                {availability === false && (
                  <div className="mt-3 p-4 bg-red-50 rounded-xl border border-red-200">
                    <p className="flex items-center gap-2 text-red-700 font-semibold text-sm">
                      <HiOutlineExclamation size={18} /> Vendor unavailable on this date
                    </p>
                    <p className="text-sm text-red-600 mt-1">Try a different date, or consider similar vendors below.</p>
                  </div>
                )}
                {availability === true && (
                  <p className="mt-2 text-emerald-600 text-sm font-medium flex items-center gap-1">
                    <HiOutlineCheck /> Available on {new Date(bookingDate).toLocaleDateString()}
                  </p>
                )}
              </div>

              {}
              {bookingStep === 4 && selectedEvent && (
                <div className="border-t border-dark-100 pt-5">
                  <h3 className="font-bold text-dark-900 mb-4">📋 Booking Summary</h3>
                  <div className="bg-dark-50 rounded-xl p-4 space-y-3 text-sm mb-4">
                    <div className="flex justify-between"><span className="text-dark-500">Vendor</span><span className="font-medium text-dark-800">{vendor.businessName}</span></div>
                    <div className="flex justify-between"><span className="text-dark-500">Package</span><span className="font-medium text-dark-800">{selectedService.name} ({(selectedService.packageTier || 'standard')})</span></div>
                    <div className="flex justify-between"><span className="text-dark-500">Event</span><span className="font-medium text-dark-800">{selectedEvent.name}</span></div>
                    <div className="flex justify-between"><span className="text-dark-500">Event Date</span><span className="font-medium text-dark-800">{new Date(selectedEvent.date).toLocaleDateString()}</span></div>
                    <div className="flex justify-between"><span className="text-dark-500">Booking Date</span><span className="font-medium text-dark-800">{new Date(bookingDate).toLocaleDateString()}</span></div>
                    <div className="flex justify-between"><span className="text-dark-500">Location</span><span className="font-medium text-dark-800">{selectedEvent.location}</span></div>
                    <hr className="border-dark-200" />
                    <div className="flex justify-between text-base"><span className="font-semibold text-dark-800">Total Cost</span><span className="font-bold text-primary-600">₹{Number(selectedService.price).toLocaleString()}</span></div>
                  </div>
                  <div className="mb-4">
                    <label className="label">Additional Notes (optional)</label>
                    <textarea className="input-field" rows={2} placeholder="Special requests, preferences..."
                      value={notes} onChange={e => {
                        setNotes(e.target.value);
                        if (bookingErrors.notes) {
                          setBookingErrors((prev) => ({ ...prev, notes: '' }));
                        }
                      }} />
                    {bookingErrors.notes && <p className="text-xs text-red-600 mt-1">{bookingErrors.notes}</p>}
                  </div>
                  {(bookingErrors.amount || bookingErrors.form) && (
                    <p className="text-xs text-red-600 mb-3">{bookingErrors.amount || bookingErrors.form}</p>
                  )}
                  <div className="flex gap-3">
                    <button onClick={submitBooking} disabled={submitting || !isBookingValid || availability !== true} className="btn-primary flex-1 disabled:opacity-50">
                      {submitting ? 'Sending Request...' : '✓ Confirm Booking'}
                    </button>
                    <button onClick={resetBooking} className="btn-secondary">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {}
          {availability === false && similarVendors.length > 0 && (
            <div className="card">
              <h2 className="font-bold text-dark-900 mb-4">Similar Vendors</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {similarVendors.map(sv => (
                  <Link key={sv.id} to={`/vendors/${sv.id}`} className="p-4 bg-dark-50 rounded-xl hover:bg-dark-100 transition-colors flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-accent-500 rounded-xl flex items-center justify-center text-white font-bold">{sv.businessName?.charAt(0)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-dark-800 truncate">{sv.businessName}</p>
                      <div className="flex items-center gap-2 text-sm text-dark-400">
                        <span className="flex items-center gap-0.5 text-amber-500"><HiStar size={14} /> {sv.rating || 0}</span>
                        <span>•</span>
                        <span>{sv.services?.length ? `From ₹${Math.min(...sv.services.map(s => Number(s.price))).toLocaleString()}` : 'Contact'}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {}
          <div className="card">
            <h2 className="font-bold text-dark-900 mb-4">Customer Reviews ({vendor.totalReviews || 0})</h2>
            {(vendor.reviews || []).length === 0 ? (
              <p className="text-dark-400 text-sm">No reviews yet. Be the first to share your experience!</p>
            ) : (
              <div className="space-y-4">
                {vendor.reviews.map(r => (
                  <div key={r.id} className="p-4 bg-dark-50 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm">{r.user?.name?.charAt(0)}</div>
                      <div>
                        <p className="font-medium text-dark-800 text-sm">{r.user?.name}</p>
                        <div className="flex text-amber-400">{[...Array(5)].map((_, i) => <HiStar key={i} size={14} className={i < r.rating ? '' : 'text-dark-200'} />)}</div>
                      </div>
                    </div>
                    {r.comment && <p className="text-sm text-dark-600">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {}
        {user?.role === 'client' && (
          <div className="card h-fit sticky top-6">
            <h2 className="font-bold text-dark-900 mb-4">Leave a Review</h2>
            <form onSubmit={handleReview} className="space-y-4">
              <div>
                <label className="label">Rating</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button" onClick={() => {
                      setReviewForm({ ...reviewForm, rating: n });
                      if (reviewErrors.rating) {
                        setReviewErrors((prev) => ({ ...prev, rating: '' }));
                      }
                    }}>
                      <HiStar size={28} className={n <= reviewForm.rating ? 'text-amber-400' : 'text-dark-200'} />
                    </button>
                  ))}
                </div>
                {reviewErrors.rating && <p className="text-xs text-red-600 mt-1">{reviewErrors.rating}</p>}
              </div>
              <div>
                <label className="label">Comment</label>
                <textarea className="input-field" rows={3} placeholder="Share your experience..."
                  value={reviewForm.comment} onChange={e => {
                    setReviewForm({ ...reviewForm, comment: e.target.value });
                    if (reviewErrors.comment) {
                      setReviewErrors((prev) => ({ ...prev, comment: '' }));
                    }
                  }} />
                {reviewErrors.comment && <p className="text-xs text-red-600 mt-1">{reviewErrors.comment}</p>}
              </div>
              {reviewErrors.form && <p className="text-xs text-red-600">{reviewErrors.form}</p>}
              <button type="submit" disabled={!isReviewValid} className="btn-primary w-full disabled:opacity-50">Submit Review</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDetail;

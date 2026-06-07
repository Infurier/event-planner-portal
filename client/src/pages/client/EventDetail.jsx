


import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../../api/axios';
import { HiOutlineCalendar, HiOutlineLocationMarker, HiOutlineUsers, HiOutlineCurrencyDollar } from 'react-icons/hi';

const EventDetail = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/events/${id}`).then(r => setEvent(r.data.event)).catch(() => { }).finally(() => setLoading(false));
  }, [id]);

  const toggleChecklist = async (index) => {
    const updated = [...event.checklist];
    updated[index].completed = !updated[index].completed;
    try {
      await API.put(`/events/${id}/checklist`, { checklist: updated });
      setEvent({ ...event, checklist: updated });
    } catch { }
  };

  if (loading) return <div className="animate-pulse text-dark-400">Loading...</div>;
  if (!event) return <div className="text-dark-400">Event not found.</div>;

  const totalBookingAmount = (event.bookings || []).reduce((s, b) => s + Number(b.amount || 0), 0);

  return (
    <div className="animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/dashboard/events" className="text-sm text-primary-600 hover:underline mb-2 block">← Back to Events</Link>
          <h1 className="text-2xl font-bold text-dark-900">{event.name}</h1>
        </div>
        <span className={`badge-${event.status}`}>{event.status}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="font-bold text-dark-900 mb-4">Event Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-dark-600"><HiOutlineCalendar /> {new Date(event.date).toLocaleDateString()}</div>
              <div className="flex items-center gap-2 text-dark-600"><HiOutlineLocationMarker /> {event.location}</div>
              <div className="flex items-center gap-2 text-dark-600"><HiOutlineUsers /> {event.guestCount} guests</div>
              <div className="flex items-center gap-2 text-dark-600"><HiOutlineCurrencyDollar /> Budget: ₹{Number(event.budget || 0).toLocaleString()}</div>
            </div>
            {event.description && <p className="text-dark-500 text-sm mt-4">{event.description}</p>}
          </div>


          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-dark-900">Booked Services</h2>
              <Link to="/vendors" className="text-sm text-primary-600 hover:underline">+ Add Service</Link>
            </div>
            {(event.bookings || []).length === 0 ? (
              <p className="text-dark-400 text-sm">No services booked yet.</p>
            ) : (
              <div className="space-y-3">
                {event.bookings.map(bk => (
                  <div key={bk.id} className="flex items-center justify-between p-3 bg-dark-50 rounded-xl">
                    <div>
                      <p className="font-medium text-dark-800">{bk.service?.name}</p>
                      <p className="text-xs text-dark-400">{bk.vendor?.businessName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-dark-800">₹{Number(bk.amount).toLocaleString()}</p>
                      <span className={`badge-${bk.status} text-xs`}>{bk.status}</span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-3 border-t border-dark-100 font-bold text-dark-900">
                  <span>Total</span>
                  <span>₹{totalBookingAmount.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>
        </div>


        <div className="card h-fit">
          <h2 className="font-bold text-dark-900 mb-4">Checklist</h2>
          <div className="space-y-2">
            {(event.checklist || []).map((item, i) => (
              <label key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-50 cursor-pointer transition-colors">
                <input type="checkbox" checked={item.completed} onChange={() => toggleChecklist(i)}
                  className="w-5 h-5 rounded border-dark-300 text-primary-600 focus:ring-primary-400" />
                <span className={`text-sm ${item.completed ? 'line-through text-dark-400' : 'text-dark-700'}`}>{item.task}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-dark-400 mt-3">
            {(event.checklist || []).filter(c => c.completed).length} / {(event.checklist || []).length} completed
          </p>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;

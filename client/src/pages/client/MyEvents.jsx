import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { HiOutlineCalendar, HiOutlineLocationMarker, HiOutlineUsers } from 'react-icons/hi';

const MyEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/events').then(r => setEvents(r.data.events || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const deleteEvent = async (id) => {
    if (!confirm('Delete this event?')) return;
    try {
      await API.delete(`/events/${id}`);
      setEvents(events.filter(e => e.id !== id));
    } catch {}
  };

  if (loading) return <div className="animate-pulse text-dark-400">Loading events...</div>;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-header mb-0">My Events</h1>
        <Link to="/dashboard/create-event" className="btn-primary">+ New Event</Link>
      </div>
      {events.length === 0 ? (
        <div className="card text-center py-12">
          <HiOutlineCalendar size={48} className="mx-auto text-dark-300 mb-4" />
          <p className="text-dark-500 mb-4">No events yet</p>
          <Link to="/dashboard/create-event" className="btn-primary">Create Your First Event</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map(ev => (
            <div key={ev.id} className="card hover:-translate-y-1 transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className={`badge-${ev.status}`}>{ev.status}</span>
                <span className="text-xs text-dark-400">{ev.type}</span>
              </div>
              <h3 className="font-bold text-dark-900 text-lg mb-2">{ev.name}</h3>
              <div className="space-y-1.5 text-sm text-dark-500 mb-4">
                <p className="flex items-center gap-2"><HiOutlineCalendar size={16} /> {new Date(ev.date).toLocaleDateString()}</p>
                <p className="flex items-center gap-2"><HiOutlineLocationMarker size={16} /> {ev.location}</p>
                <p className="flex items-center gap-2"><HiOutlineUsers size={16} /> {ev.guestCount} guests</p>
              </div>
              {ev.budget > 0 && <p className="text-sm font-semibold text-primary-600 mb-4">Budget: ₹{Number(ev.budget).toLocaleString()}</p>}
              <div className="flex gap-2">
                <Link to={`/dashboard/events/${ev.id}`} className="btn-primary btn-sm flex-1 text-center">View</Link>
                <button onClick={() => deleteEvent(ev.id)} className="btn-danger btn-sm">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyEvents;

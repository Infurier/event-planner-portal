import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { HiOutlineCalendar, HiOutlineBriefcase, HiOutlineCurrencyDollar, HiOutlineCheckCircle } from 'react-icons/hi';

const ClientDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ events: 0, bookings: 0, spent: 0 });
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [evRes, bkRes] = await Promise.all([
          API.get('/events'), API.get('/bookings/client')
        ]);
        const ev = evRes.data.events || [];
        const bk = bkRes.data.bookings || [];
        setEvents(ev.slice(0, 5));
        setBookings(bk.slice(0, 5));
        setStats({
          events: ev.length,
          bookings: bk.length,
          spent: bk.filter(b => b.status !== 'cancelled').reduce((s, b) => s + Number(b.amount || 0), 0)
        });
      } catch { }
    };
    load();
  }, []);

  const statCards = [
    { label: 'My Events', value: stats.events, icon: HiOutlineCalendar, color: 'bg-primary-100 text-primary-600' },
    { label: 'Total Bookings', value: stats.bookings, icon: HiOutlineBriefcase, color: 'bg-accent-100 text-accent-600' },
    { label: 'Total Spent', value: `₹${stats.spent.toLocaleString()}`, icon: HiOutlineCurrencyDollar, color: 'bg-emerald-100 text-emerald-600' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-dark-900">Welcome, {user?.name}! 👋</h1>
          <p className="text-dark-500 mt-1">Here's what's happening with your events</p>
        </div>
        <Link to="/dashboard/create-event" className="btn-primary">+ Create Event</Link>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
              <Icon size={24} />
            </div>
            <div>
              <p className="text-sm text-dark-500">{label}</p>
              <p className="text-2xl font-bold text-dark-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-dark-900">Upcoming Events</h2>
            <Link to="/dashboard/events" className="text-sm text-primary-600 font-medium hover:underline">View all</Link>
          </div>
          {events.length === 0 ? (
            <p className="text-dark-400 text-sm py-4">No events yet. <Link to="/dashboard/create-event" className="text-primary-600">Create one!</Link></p>
          ) : (
            <div className="space-y-3">
              {events.map(ev => (
                <Link key={ev.id} to={`/dashboard/events/${ev.id}`}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-dark-50 transition-colors">
                  <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600">
                    <HiOutlineCalendar size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-dark-800 truncate">{ev.name}</p>
                    <p className="text-xs text-dark-400">{new Date(ev.date).toLocaleDateString()} • {ev.type}</p>
                  </div>
                  <span className={`badge-${ev.status}`}>{ev.status}</span>
                </Link>
              ))}
            </div>
          )}
        </div>


        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-dark-900">Recent Bookings</h2>
            <Link to="/dashboard/bookings" className="text-sm text-primary-600 font-medium hover:underline">View all</Link>
          </div>
          {bookings.length === 0 ? (
            <p className="text-dark-400 text-sm py-4">No bookings yet. <Link to="/vendors" className="text-primary-600">Browse vendors!</Link></p>
          ) : (
            <div className="space-y-3">
              {bookings.map(bk => (
                <div key={bk.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-dark-50 transition-colors">
                  <div className="w-10 h-10 bg-accent-50 rounded-lg flex items-center justify-center text-accent-600">
                    <HiOutlineBriefcase size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-dark-800 truncate">{bk.service?.name || 'Service'}</p>
                    <p className="text-xs text-dark-400">₹{Number(bk.amount).toLocaleString()} • {bk.vendor?.user?.name || 'Vendor'}</p>
                  </div>
                  <span className={`badge-${bk.status}`}>{bk.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;

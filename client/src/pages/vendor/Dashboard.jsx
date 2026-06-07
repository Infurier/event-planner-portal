import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { HiOutlineBriefcase, HiOutlineCurrencyDollar, HiOutlineStar, HiOutlineCalendar } from 'react-icons/hi';

const VendorDashboard = () => {
  const [stats, setStats] = useState({ bookings: 0, revenue: 0, rating: 0, upcoming: 0 });
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [bkRes, vRes] = await Promise.all([
          API.get('/bookings/vendor'), API.get('/vendors/my-profile')
        ]);
        const bk = bkRes.data.bookings || [];
        const v = vRes.data.vendor;
        setBookings(bk.slice(0, 5));
        setStats({
          bookings: bk.length,
          revenue: bk.filter(b => b.status === 'completed').reduce((s, b) => s + Number(b.amount || 0), 0),
          rating: v?.rating || 0,
          upcoming: bk.filter(b => b.status === 'confirmed').length
        });
      } catch {}
    };
    load();
  }, []);

  return (
    <div className="animate-fade-in">
      <h1 className="page-header">Vendor Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        {[
          { label: 'Total Bookings', value: stats.bookings, icon: HiOutlineBriefcase, color: 'bg-primary-100 text-primary-600' },
          { label: 'Revenue', value: `₹${stats.revenue.toLocaleString()}`, icon: HiOutlineCurrencyDollar, color: 'bg-emerald-100 text-emerald-600' },
          { label: 'Rating', value: stats.rating, icon: HiOutlineStar, color: 'bg-amber-100 text-amber-600' },
          { label: 'Upcoming', value: stats.upcoming, icon: HiOutlineCalendar, color: 'bg-accent-100 text-accent-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}><Icon size={24} /></div>
            <div><p className="text-sm text-dark-500">{label}</p><p className="text-2xl font-bold">{value}</p></div>
          </div>
        ))}
      </div>
      <div className="card">
        <h2 className="font-bold text-dark-900 mb-4">Recent Booking Requests</h2>
        {bookings.length === 0 ? <p className="text-dark-400 text-sm">No bookings yet.</p> : (
          <div className="space-y-3">
            {bookings.map(b => (
              <div key={b.id} className="flex items-center justify-between p-3 bg-dark-50 rounded-xl">
                <div>
                  <p className="font-medium text-dark-800">{b.user?.name}</p>
                  <p className="text-xs text-dark-400">{b.service?.name} • {b.event?.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{Number(b.amount).toLocaleString()}</p>
                  <span className={`badge-${b.status}`}>{b.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default VendorDashboard;

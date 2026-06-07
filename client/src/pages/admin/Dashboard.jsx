import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { HiOutlineUsers, HiOutlineOfficeBuilding, HiOutlineBriefcase, HiOutlineCalendar, HiOutlineCurrencyDollar } from 'react-icons/hi';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  useEffect(() => { API.get('/admin/analytics').then(r => setData(r.data)).catch(() => {}); }, []);
  if (!data) return <div className="animate-pulse text-dark-400">Loading analytics...</div>;

  const { stats, monthlyBookings, popularCategories, recentBookings } = data;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const barData = {
    labels: (monthlyBookings || []).map(m => months[m.month - 1] || m.month),
    datasets: [{ label: 'Bookings', data: (monthlyBookings || []).map(m => m.count), backgroundColor: '#4c6ef5', borderRadius: 8 }]
  };

  const donutData = {
    labels: (popularCategories || []).map(c => c.category?.name),
    datasets: [{ data: (popularCategories || []).map(c => c.vendorCount), backgroundColor: ['#4c6ef5','#e64980','#40c057','#fab005','#7950f2'] }]
  };

  return (
    <div className="animate-fade-in">
      <h1 className="page-header">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
        {[
          { label: 'Users', value: stats.totalUsers, icon: HiOutlineUsers, color: 'bg-primary-100 text-primary-600' },
          { label: 'Vendors', value: stats.totalVendors, icon: HiOutlineOfficeBuilding, color: 'bg-accent-100 text-accent-600' },
          { label: 'Bookings', value: stats.totalBookings, icon: HiOutlineBriefcase, color: 'bg-emerald-100 text-emerald-600' },
          { label: 'Events', value: stats.totalEvents, icon: HiOutlineCalendar, color: 'bg-amber-100 text-amber-600' },
          { label: 'Revenue', value: `₹${Number(stats.totalRevenue).toLocaleString()}`, icon: HiOutlineCurrencyDollar, color: 'bg-violet-100 text-violet-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}><Icon size={24} /></div>
            <div><p className="text-xs text-dark-500">{label}</p><p className="text-xl font-bold">{value}</p></div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card"><h2 className="font-bold mb-4">Monthly Bookings</h2><Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} /></div>
        <div className="card"><h2 className="font-bold mb-4">Popular Categories</h2><div className="max-w-xs mx-auto"><Doughnut data={donutData} /></div></div>
      </div>
      <div className="card">
        <h2 className="font-bold mb-4">Recent Bookings</h2>
        <div className="space-y-2">
          {(recentBookings || []).map(b => (
            <div key={b.id} className="flex justify-between items-center p-3 bg-dark-50 rounded-xl text-sm">
              <span className="font-medium">{b.user?.name}</span>
              <span className="text-dark-500">{b.service?.name}</span>
              <span className="font-semibold">₹{Number(b.amount).toLocaleString()}</span>
              <span className={`badge-${b.status}`}>{b.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;

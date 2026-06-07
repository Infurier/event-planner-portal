import { useState, useEffect } from 'react';
import API from '../../api/axios';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  useEffect(() => { API.get('/admin/bookings').then(r => setBookings(r.data.bookings || [])).catch(() => {}); }, []);

  return (
    <div className="animate-fade-in">
      <h1 className="page-header">All Bookings</h1>
      <div className="table-container">
        <table>
          <thead><tr><th>Client</th><th>Vendor</th><th>Service</th><th>Event</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>
            {bookings.map(b => (
              <tr key={b.id}>
                <td>{b.user?.name}</td>
                <td>{b.vendor?.businessName}</td>
                <td>{b.service?.name}</td>
                <td>{b.event?.name}</td>
                <td className="font-semibold">₹{Number(b.amount).toLocaleString()}</td>
                <td>{new Date(b.bookingDate).toLocaleDateString()}</td>
                <td><span className={`badge-${b.status}`}>{b.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default AdminBookings;

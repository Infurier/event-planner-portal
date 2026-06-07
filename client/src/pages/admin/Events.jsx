import { useState, useEffect } from 'react';
import API from '../../api/axios';

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  useEffect(() => { API.get('/admin/events').then(r => setEvents(r.data.events || [])).catch(() => {}); }, []);

  return (
    <div className="animate-fade-in">
      <h1 className="page-header">Event Monitoring</h1>
      <div className="table-container">
        <table>
          <thead><tr><th>Event</th><th>User</th><th>Type</th><th>Date</th><th>Location</th><th>Guests</th><th>Status</th></tr></thead>
          <tbody>
            {events.map(e => (
              <tr key={e.id}>
                <td className="font-medium">{e.name}</td>
                <td>{e.user?.name}</td>
                <td>{e.type}</td>
                <td>{new Date(e.date).toLocaleDateString()}</td>
                <td>{e.location}</td>
                <td>{e.guestCount}</td>
                <td><span className={`badge-${e.status}`}>{e.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default AdminEvents;

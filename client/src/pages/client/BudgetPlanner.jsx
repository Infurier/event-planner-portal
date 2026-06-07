import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { HiOutlineCurrencyDollar } from 'react-icons/hi';

const BudgetPlanner = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    API.get('/events').then(r => setEvents(r.data.events || [])).catch(() => { });
    API.get('/bookings/client').then(r => setBookings(r.data.bookings || [])).catch(() => { });
  }, []);

  const eventBookings = selectedEvent ? bookings.filter(b => b.eventId == selectedEvent && b.status !== 'cancelled') : bookings.filter(b => b.status !== 'cancelled');
  const totalSpent = eventBookings.reduce((s, b) => s + Number(b.amount || 0), 0);
  const currentEvent = events.find(e => e.id == selectedEvent);
  const budget = currentEvent ? Number(currentEvent.budget || 0) : events.reduce((s, e) => s + Number(e.budget || 0), 0);
  const remaining = budget - totalSpent;
  const percentUsed = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;

  return (
    <div className="animate-fade-in max-w-3xl">
      <h1 className="page-header">Budget Planner</h1>

      <div className="card mb-6">
        <label className="label">Select Event (or view all)</label>
        <select className="select-field" value={selectedEvent} onChange={e => setSelectedEvent(e.target.value)}>
          <option value="">All Events</option>
          {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
        </select>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="stat-card">
          <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600">
            <HiOutlineCurrencyDollar size={24} />
          </div>
          <div>
            <p className="text-sm text-dark-500">Total Budget</p>
            <p className="text-2xl font-bold text-dark-900">₹{budget.toLocaleString()}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className={`w-12 h-12 ${remaining >= 0 ? 'bg-emerald-100' : 'bg-red-100'} rounded-xl flex items-center justify-center ${remaining >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            <HiOutlineCurrencyDollar size={24} />
          </div>
          <div>
            <p className="text-sm text-dark-500">Spent</p>
            <p className="text-2xl font-bold text-dark-900">₹{totalSpent.toLocaleString()}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className={`w-12 h-12 ${remaining >= 0 ? 'bg-blue-100' : 'bg-red-100'} rounded-xl flex items-center justify-center ${remaining >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            <HiOutlineCurrencyDollar size={24} />
          </div>
          <div>
            <p className="text-sm text-dark-500">Remaining</p>
            <p className={`text-2xl font-bold ${remaining >= 0 ? 'text-dark-900' : 'text-red-600'}`}>₹{remaining.toLocaleString()}</p>
          </div>
        </div>
      </div>


      {budget > 0 && (
        <div className="card mb-6">
          <div className="flex justify-between mb-2 text-sm font-medium">
            <span className="text-dark-600">Budget Used</span>
            <span className={percentUsed > 90 ? 'text-red-600' : 'text-dark-600'}>{percentUsed.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-dark-100 rounded-full h-4 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${percentUsed > 90 ? 'bg-red-500' : percentUsed > 60 ? 'bg-yellow-500' : 'bg-primary-500'}`}
              style={{ width: `${percentUsed}%` }} />
          </div>
        </div>
      )}

      {remaining < 0 && (
        <div className="card mb-6 border-2 border-red-300 bg-red-50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600 flex-shrink-0">
              <HiOutlineCurrencyDollar size={22} />
            </div>
            <div>
              <h3 className="font-bold text-red-800">⚠️ Budget Exceeded</h3>
              <p className="text-sm text-red-700 mt-1">
                You've exceeded your budget by <span className="font-bold">₹{Math.abs(remaining).toLocaleString()}</span>.
                Review your bookings and consider cancelling pending ones to stay within budget.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="font-bold text-dark-900 mb-4">Expense Breakdown</h2>
        {eventBookings.length === 0 ? (
          <p className="text-dark-400 text-sm">No expenses recorded.</p>
        ) : (
          <div className="space-y-3">
            {eventBookings.map(b => (
              <div key={b.id} className="flex items-center justify-between p-3 bg-dark-50 rounded-xl">
                <div>
                  <p className="font-medium text-dark-800">{b.service?.name}</p>
                  <p className="text-xs text-dark-400">{b.event?.name} • {b.vendor?.user?.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-dark-800">₹{Number(b.amount).toLocaleString()}</p>
                  <span className={`badge-${b.status} text-xs`}>{b.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetPlanner;

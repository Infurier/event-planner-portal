import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { extractFieldErrors, getApiErrorMessage, sanitizePlainText, validateEventForm } from '../../utils/validation';

const CreateEvent = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', type: 'Wedding', date: '', location: '', guestCount: '', budget: '', description: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const minDate = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateEventForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the highlighted fields.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        name: sanitizePlainText(form.name),
        location: sanitizePlainText(form.location),
        description: sanitizePlainText(form.description)
      };

      await API.post('/events', payload);
      toast.success('Event created!');
      navigate('/dashboard/events');
    } catch (err) {
      setErrors((prev) => ({ ...prev, ...extractFieldErrors(err) }));
      toast.error(getApiErrorMessage(err, 'Failed to create event'));
    } finally {
      setLoading(false);
    }
  };

  const update = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: '' }));
    }
  };

  const isFormValid = Object.keys(validateEventForm(form)).length === 0;

  return (
    <div className="animate-fade-in max-w-2xl">
      <h1 className="page-header">Create New Event</h1>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Event Name *</label>
              <input className="input-field" required placeholder="My Wedding Reception"
                value={form.name} onChange={e => update('name', e.target.value)} />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="label">Event Type *</label>
                <select className="select-field" value={form.type} onChange={e => update('type', e.target.value)}>
                {['Wedding', 'Birthday', 'Corporate', 'Party', 'Conference', 'Other'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {errors.type && <p className="text-xs text-red-600 mt-1">{errors.type}</p>}
              </div>
              <div>
                <label className="label">Event Date *</label>
                <input type="date" className="input-field" required min={minDate}
                  value={form.date} onChange={e => update('date', e.target.value)} />
                {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
              </div>
            </div>
            <div>
              <label className="label">Location *</label>
              <input className="input-field" required placeholder="City or venue address"
                value={form.location} onChange={e => update('location', e.target.value)} />
              {errors.location && <p className="text-xs text-red-600 mt-1">{errors.location}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="label">Guest Count</label>
                <input type="number" className="input-field" placeholder="150" min="0" step="1"
                  value={form.guestCount} onChange={e => update('guestCount', e.target.value)} />
                {errors.guestCount && <p className="text-xs text-red-600 mt-1">{errors.guestCount}</p>}
              </div>
              <div>
                <label className="label">Budget (₹)</label>
                <input type="number" className="input-field" placeholder="500000" min="0" step="0.01"
                  value={form.budget} onChange={e => update('budget', e.target.value)} />
                {errors.budget && <p className="text-xs text-red-600 mt-1">{errors.budget}</p>}
              </div>
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input-field" rows={3} placeholder="Additional details about your event..."
                value={form.description} onChange={e => update('description', e.target.value)} />
              {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading || !isFormValid} className="btn-primary disabled:opacity-50">
                {loading ? 'Creating...' : 'Create Event'}
              </button>
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;

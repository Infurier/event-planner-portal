import { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { extractFieldErrors, getApiErrorMessage, sanitizeDecimalInput, sanitizePlainText, validateServiceForm } from '../../utils/validation';

const MyServices = () => {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', price: '' });
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => { load(); }, []);
  const load = () => API.get('/services/my-services').then(r => setServices(r.data.services || [])).catch(() => {});

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateServiceForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the highlighted fields.');
      return;
    }

    try {
      const payload = {
        ...form,
        name: sanitizePlainText(form.name),
        description: sanitizePlainText(form.description),
        price: sanitizeDecimalInput(form.price)
      };

      if (editing) { await API.put(`/services/${editing}`, payload); toast.success('Updated!'); }
      else { await API.post('/services', payload); toast.success('Added!'); }
      setForm({ name: '', description: '', price: '' }); setErrors({}); setEditing(null); setShowForm(false); load();
    } catch (err) {
      setErrors((prev) => ({ ...prev, ...extractFieldErrors(err) }));
      toast.error(getApiErrorMessage(err, 'Failed'));
    }
  };

  const startEdit = (s) => { setForm({ name: s.name, description: s.description || '', price: s.price }); setErrors({}); setEditing(s.id); setShowForm(true); };
  const deleteService = async (id) => { if (!confirm('Delete?')) return; await API.delete(`/services/${id}`); load(); };
  const isFormValid = Object.keys(validateServiceForm(form)).length === 0;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-header mb-0">My Services</h1>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setErrors({}); setForm({ name: '', description: '', price: '' }); }} className="btn-primary">
          {showForm ? 'Cancel' : '+ Add Service'}
        </button>
      </div>
      {showForm && (
        <div className="card mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Service Name</label>
              <input className="input-field" required value={form.name} onChange={e => updateField('name', e.target.value)} />
              {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input-field" rows={2} value={form.description} onChange={e => updateField('description', e.target.value)} />
              {errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}
            </div>
            <div>
              <label className="label">Price (₹)</label>
              <input type="number" min="0.01" step="0.01" className="input-field" required value={form.price} onChange={e => updateField('price', e.target.value)} />
              {errors.price && <p className="text-xs text-red-600 mt-1">{errors.price}</p>}
            </div>
            {errors.form && <p className="text-xs text-red-600">{errors.form}</p>}
            <button type="submit" disabled={!isFormValid} className="btn-primary disabled:opacity-50">{editing ? 'Update' : 'Add'} Service</button>
          </form>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {services.map(s => (
          <div key={s.id} className="card">
            <h3 className="font-bold text-dark-900 mb-1">{s.name}</h3>
            <p className="text-sm text-dark-500 mb-3">{s.description || 'No description'}</p>
            <p className="text-xl font-bold text-primary-600 mb-3">₹{Number(s.price).toLocaleString()}</p>
            <div className="flex gap-2">
              <button onClick={() => startEdit(s)} className="btn-secondary btn-sm flex-1">Edit</button>
              <button onClick={() => deleteService(s.id)} className="btn-danger btn-sm">Delete</button>
            </div>
          </div>
        ))}
      </div>
      {services.length === 0 && !showForm && <div className="card text-center py-8"><p className="text-dark-400">No services yet. Add your first service!</p></div>}
    </div>
  );
};
export default MyServices;

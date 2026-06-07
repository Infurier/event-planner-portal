import { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { extractFieldErrors, getApiErrorMessage, sanitizePlainText, validateCategoryForm } from '../../utils/validation';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', icon: '' });
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => { load(); }, []);
  const load = () => API.get('/categories').then(r => setCategories(r.data.categories || [])).catch(() => {});

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateCategoryForm(form);
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
        icon: sanitizePlainText(form.icon)
      };

      if (editing) { await API.put(`/categories/${editing}`, payload); } else { await API.post('/categories', payload); }
      toast.success(editing ? 'Updated!' : 'Created!');
      setForm({ name: '', description: '', icon: '' }); setErrors({}); setEditing(null); setShowForm(false); load();
    } catch (err) {
      setErrors((prev) => ({ ...prev, ...extractFieldErrors(err) }));
      toast.error(getApiErrorMessage(err, 'Failed'));
    }
  };

  const startEdit = (c) => { setForm({ name: c.name, description: c.description || '', icon: c.icon || '' }); setErrors({}); setEditing(c.id); setShowForm(true); };
  const remove = async (id) => { if (!confirm('Delete?')) return; await API.delete(`/categories/${id}`); load(); };
  const isFormValid = Object.keys(validateCategoryForm(form)).length === 0;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-header mb-0">Categories</h1>
        <button onClick={() => { setShowForm(!showForm); setEditing(null); setErrors({}); setForm({ name: '', description: '', icon: '' }); }} className="btn-primary">{showForm ? 'Cancel' : '+ Add'}</button>
      </div>
      {showForm && (
        <div className="card mb-6">
          <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1"><label className="label">Icon (emoji)</label><input className="input-field" placeholder="🏛️" value={form.icon} onChange={e => updateField('icon', e.target.value)} />{errors.icon && <p className="text-xs text-red-600 mt-1">{errors.icon}</p>}</div>
            <div className="flex-1"><label className="label">Name *</label><input className="input-field" required value={form.name} onChange={e => updateField('name', e.target.value)} />{errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}</div>
            <div className="flex-1"><label className="label">Description</label><input className="input-field" value={form.description} onChange={e => updateField('description', e.target.value)} />{errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}</div>
            {errors.form && <p className="text-xs text-red-600 md:self-center">{errors.form}</p>}
            <button type="submit" disabled={!isFormValid} className="btn-primary disabled:opacity-50">{editing ? 'Update' : 'Add'}</button>
          </form>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {categories.map(c => (
          <div key={c.id} className="card text-center">
            <span className="text-4xl">{c.icon}</span>
            <h3 className="font-bold text-dark-900 mt-2">{c.name}</h3>
            <p className="text-sm text-dark-400">{c.description}</p>
            <div className="flex gap-2 mt-3 justify-center">
              <button onClick={() => startEdit(c)} className="text-primary-600 text-sm font-medium">Edit</button>
              <button onClick={() => remove(c.id)} className="text-red-500 text-sm font-medium">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default AdminCategories;

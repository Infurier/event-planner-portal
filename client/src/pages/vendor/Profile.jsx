import { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlinePhotograph, HiOutlineTrash, HiOutlineUpload } from 'react-icons/hi';
import { extractFieldErrors, getApiErrorMessage, sanitizePlainText, validateVendorProfileForm } from '../../utils/validation';

const VendorProfile = () => {
  const [vendor, setVendor] = useState(null);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ businessName: '', description: '', phone: '', address: '', city: '', categoryId: '' });
  const [errors, setErrors] = useState({});
  const [portfolioImages, setPortfolioImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    API.get('/vendors/my-profile').then(r => {
      const v = r.data.vendor;
      setVendor(v);
      if (v) {
        setForm({ businessName: v.businessName || '', description: v.description || '', phone: v.phone || '', address: v.address || '', city: v.city || '', categoryId: v.categoryId || '' });
        setPortfolioImages(v.portfolioImages || []);
      }
    }).catch(() => {});
    API.get('/categories').then(r => setCategories(r.data.categories || [])).catch(() => {});
  }, []);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateVendorProfileForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the highlighted fields.');
      return;
    }

    try {
      const payload = {
        ...form,
        businessName: sanitizePlainText(form.businessName),
        description: sanitizePlainText(form.description),
        phone: sanitizePlainText(form.phone),
        address: sanitizePlainText(form.address),
        city: sanitizePlainText(form.city)
      };

      await API.put('/vendors/profile', payload);
      toast.success('Profile updated!');
    } catch (err) {
      setErrors((prev) => ({ ...prev, ...extractFieldErrors(err) }));
      toast.error(getApiErrorMessage(err, 'Failed'));
    }
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (portfolioImages.length + files.length > 10) {
      toast.error(`You can upload up to 10 images total. You have ${portfolioImages.length} currently.`);
      return;
    }

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    setUploading(true);
    try {
      const { data } = await API.post('/vendors/upload-portfolio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPortfolioImages(data.portfolioImages || []);
      toast.success('Images uploaded!');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Upload failed'));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleImageDelete = async (index) => {
    try {
      const { data } = await API.delete(`/vendors/portfolio/${index}`);
      setPortfolioImages(data.portfolioImages || []);
      toast.success('Image removed.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete'));
    }
  };

  const isFormValid = Object.keys(validateVendorProfileForm(form)).length === 0;
  const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  if (!vendor) return <div className="text-dark-400">Loading...</div>;

  return (
    <div className="animate-fade-in max-w-2xl">
      <h1 className="page-header">Vendor Profile</h1>
      {!vendor.isApproved && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-yellow-800 text-sm">
          ⏳ Your account is pending admin approval. You'll be visible to clients once approved.
        </div>
      )}
      <div className="card mb-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">Business Name</label><input className="input-field" value={form.businessName} onChange={e => updateField('businessName', e.target.value)} />{errors.businessName && <p className="text-xs text-red-600 mt-1">{errors.businessName}</p>}</div>
          <div><label className="label">Category</label>
            <select className="select-field" value={form.categoryId} onChange={e => updateField('categoryId', e.target.value)}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {errors.categoryId && <p className="text-xs text-red-600 mt-1">{errors.categoryId}</p>}
          </div>
          <div><label className="label">Description</label><textarea className="input-field" rows={3} value={form.description} onChange={e => updateField('description', e.target.value)} />{errors.description && <p className="text-xs text-red-600 mt-1">{errors.description}</p>}</div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Phone</label><input className="input-field" value={form.phone} onChange={e => updateField('phone', e.target.value)} />{errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}</div>
            <div><label className="label">City</label><input className="input-field" value={form.city} onChange={e => updateField('city', e.target.value)} />{errors.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}</div>
          </div>
          <div><label className="label">Address</label><input className="input-field" value={form.address} onChange={e => updateField('address', e.target.value)} />{errors.address && <p className="text-xs text-red-600 mt-1">{errors.address}</p>}</div>
          {errors.form && <p className="text-xs text-red-600">{errors.form}</p>}
          <button type="submit" disabled={!isFormValid} className="btn-primary disabled:opacity-50">Save Changes</button>
        </form>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-dark-900 flex items-center gap-2">
            <HiOutlinePhotograph size={20} /> Portfolio Images
          </h2>
          <span className="text-sm text-dark-400">{portfolioImages.length}/10 uploaded</span>
        </div>

        {portfolioImages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {portfolioImages.map((img, index) => (
              <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-dark-200">
                <img
                  src={`${apiBase}${img}`}
                  alt={`Portfolio ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleImageDelete(index)}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                >
                  <HiOutlineTrash size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {portfolioImages.length < 10 && (
          <label className={`flex items-center justify-center gap-2 p-4 border-2 border-dashed border-dark-200 rounded-xl cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <HiOutlineUpload size={20} className="text-dark-400" />
            <span className="text-sm text-dark-500 font-medium">
              {uploading ? 'Uploading...' : 'Click to upload images (max 5 at a time)'}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploading}
            />
          </label>
        )}
        <p className="text-xs text-dark-400 mt-2">Supported: JPG, PNG, WebP, GIF. Max 5MB each.</p>
      </div>
    </div>
  );
};
export default VendorProfile;

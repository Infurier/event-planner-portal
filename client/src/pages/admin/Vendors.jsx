import { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';

const AdminVendors = () => {
  const [vendors, setVendors] = useState([]);
  useEffect(() => { API.get('/admin/vendors').then(r => setVendors(r.data.vendors || [])).catch(() => {}); }, []);

  const approve = async (id) => {
    try {
      const { data } = await API.put(`/admin/vendors/${id}/approve`);
      setVendors(vendors.map(v => v.id === id ? data.vendor : v));
      toast.success(data.message);
    } catch { toast.error('Failed'); }
  };

  const remove = async (id) => {
    if (!confirm('Remove this vendor?')) return;
    try { await API.delete(`/admin/vendors/${id}`); setVendors(vendors.filter(v => v.id !== id)); toast.success('Removed'); } catch { toast.error('Failed'); }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="page-header">Vendor Management</h1>
      <div className="table-container">
        <table>
          <thead><tr><th>Business</th><th>Owner</th><th>Category</th><th>Rating</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {vendors.map(v => (
              <tr key={v.id}>
                <td className="font-medium">{v.businessName}</td>
                <td>{v.user?.name}<br/><span className="text-xs text-dark-400">{v.user?.email}</span></td>
                <td>{v.category?.name}</td>
                <td>⭐ {v.rating || 0}</td>
                <td><span className={`badge ${v.isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>{v.isApproved ? 'Approved' : 'Pending'}</span></td>
                <td>
                  <div className="flex gap-2">
                    <button onClick={() => approve(v.id)} className={`text-sm font-medium ${v.isApproved ? 'text-yellow-600' : 'text-emerald-600'}`}>{v.isApproved ? 'Unapprove' : 'Approve'}</button>
                    <button onClick={() => remove(v.id)} className="text-red-500 text-sm font-medium">Remove</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default AdminVendors;

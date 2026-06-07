import { useState, useEffect } from 'react';
import API from '../../api/axios';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  useEffect(() => { API.get('/admin/users').then(r => setUsers(r.data.users || [])).catch(() => {}); }, []);

  const toggle = async (id) => {
    try {
      const { data } = await API.put(`/admin/users/${id}/status`);
      setUsers(users.map(u => u.id === id ? data.user : u));
      toast.success(data.message);
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="animate-fade-in">
      <h1 className="page-header">User Management</h1>
      <div className="table-container">
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td className="font-medium">{u.name}</td><td>{u.email}</td>
                <td><span className="badge bg-primary-50 text-primary-700">{u.role}</span></td>
                <td>{u.phone || '-'}</td>
                <td><span className={`badge ${u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{u.isActive ? 'Active' : 'Inactive'}</span></td>
                <td><button onClick={() => toggle(u.id)} className={`text-sm font-medium ${u.isActive ? 'text-red-500' : 'text-emerald-600'}`}>{u.isActive ? 'Deactivate' : 'Activate'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default AdminUsers;

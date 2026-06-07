import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/layout/Navbar';
import toast from 'react-hot-toast';
import { extractFieldErrors, getApiErrorMessage, validateLoginForm } from '../../utils/validation';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverMessage, setServerMessage] = useState('');
  const [messageType, setMessageType] = useState('error');
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    if (serverMessage) {
      setServerMessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateLoginForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the highlighted fields.');
      return;
    }

    setLoading(true);
    setServerMessage('');
    try {
      const data = await login(form.email.trim().toLowerCase(), form.password);
      toast.success('Welcome back!');
      const role = data.user.role;
      navigate(role === 'admin' ? '/admin' : role === 'vendor' ? '/vendor' : '/dashboard');
    } catch (err) {
      const fieldErrors = extractFieldErrors(err);
      const status = err?.response?.status;
      const message = getApiErrorMessage(err, '');

      if (!err?.response) {
        setServerMessage('Unable to connect to the server. Please check your internet connection and try again.');
        setMessageType('network');
        toast.error('Connection error');
      } else if (status === 403 && message.toLowerCase().includes('deactivated')) {
        setServerMessage(message);
        setMessageType('warning');
        toast.error(message);
      } else if (status === 401) {
        setErrors({ email: 'Invalid email or password.', password: 'Invalid email or password.' });
        setServerMessage('The email or password you entered is incorrect. Please try again.');
        setMessageType('error');
        toast.error('Invalid credentials');
      } else {
        setErrors((prev) => ({ ...prev, ...fieldErrors }));
        setServerMessage(message || 'Login failed. Please try again.');
        setMessageType('error');
        toast.error(message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = Object.keys(validateLoginForm(form)).length === 0;

  const messageBannerStyles = {
    error: 'bg-red-50 border-red-200 text-red-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    network: 'bg-blue-50 border-blue-200 text-blue-700'
  };

  const messageBannerIcons = {
    error: '❌',
    warning: '⚠️',
    network: '🔌'
  };

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="card-glass p-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-hero-pattern rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">EP</span>
              </div>
              <h1 className="text-2xl font-bold text-dark-900">Welcome Back</h1>
              <p className="text-dark-500 text-sm mt-1">Sign in to your account</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Email</label>
                <input type="email" className={`input-field ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`} placeholder="you@example.com" required
                  value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
                {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" className={`input-field ${errors.password ? 'border-red-500 focus:border-red-500' : ''}`} placeholder="Enter your password" required
                  value={form.password} onChange={(e) => handleChange('password', e.target.value)} />
                {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
              </div>

              {serverMessage && (
                <div className={`p-3 rounded-xl border text-sm flex items-start gap-2 ${messageBannerStyles[messageType]}`}>
                  <span className="flex-shrink-0 mt-0.5">{messageBannerIcons[messageType]}</span>
                  <p>{serverMessage}</p>
                </div>
              )}

              <button type="submit" disabled={loading || !isFormValid} className="btn-primary w-full py-3 text-base disabled:opacity-50">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            <p className="text-center text-sm text-dark-500 mt-6">
              Don't have an account? <Link to="/register" className="text-primary-600 font-semibold hover:underline">Sign Up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

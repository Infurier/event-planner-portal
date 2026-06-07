import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../../api/axios';
import Navbar from '../../components/layout/Navbar';
import { useAuth } from '../../context/AuthContext';
import {
  EMAIL_PROVIDER_OPTIONS,
  buildIndianPhoneNumber,
  buildRegisterEmail,
  extractFieldErrors,
  extractIndianPhoneDigits,
  extractPhoneDisplayDigits,
  formatIndianPhoneDisplay,
  getApiErrorMessage,
  getPasswordStrength,
  normalizeFullName,
  sanitizeEmailDomainInput,
  sanitizeEmailUsernameInput,
  sanitizeFullNameInput,
  validateRegisterForm
} from '../../utils/validation';

const NAVIGATION_KEYS = new Set([
  'Backspace',
  'Delete',
  'Tab',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End'
]);

const safeRole = (role) => (role === 'vendor' ? 'vendor' : 'client');

const removeErrorKeys = (state, fields) => {
  const nextState = { ...state };
  let changed = false;

  fields.forEach((field) => {
    if (field in nextState) {
      delete nextState[field];
      changed = true;
    }
  });

  return changed ? nextState : state;
};

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: '',
    emailUsername: '',
    emailProvider: 'gmail.com',
    emailCustomDomain: '',
    password: '',
    confirmPassword: '',
    phone: buildIndianPhoneNumber(''),
    role: safeRole(searchParams.get('role')),
    businessName: '',
    categoryId: ''
  });
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [interactionErrors, setInteractionErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get('/categories').then((response) => {
      setCategories(response.data.categories || []);
    }).catch(() => {});
  }, []);

  const validationErrors = validateRegisterForm(form);
  const isFormValid = Object.keys(validationErrors).length === 0;
  const passwordStrength = getPasswordStrength(form.password);
  const phoneDigits = extractIndianPhoneDigits(form.phone);
  const emailPreview = buildRegisterEmail(form);

  const clearFeedback = (fields) => {
    setServerErrors((prev) => removeErrorKeys(prev, fields));
    setInteractionErrors((prev) => removeErrorKeys(prev, fields));
  };

  const setInteractionMessage = (field, message) => {
    setInteractionErrors((prev) => {
      if (!message) {
        return removeErrorKeys(prev, [field]);
      }

      return { ...prev, [field]: message };
    });
  };

  const markTouched = (fields) => {
    setTouched((prev) => {
      const nextTouched = { ...prev };
      fields.forEach((field) => {
        nextTouched[field] = true;
      });
      return nextTouched;
    });
  };

  const getFieldError = (field) => {
    if (serverErrors[field]) return serverErrors[field];
    if (interactionErrors[field]) return interactionErrors[field];
    if ((submitAttempted || touched[field]) && validationErrors[field]) return validationErrors[field];
    return '';
  };

  const getInputClassName = (field, baseClass = 'input-field') =>
    getFieldError(field)
      ? `${baseClass} border-red-500 focus:border-red-500 focus:ring-red-100`
      : baseClass;

  const blockInvalidInput = (event, field, message) => {
    event.preventDefault();
    markTouched([field]);
    setInteractionMessage(field, message);
  };

  const isShortcutKey = (event) => event.ctrlKey || event.metaKey || event.altKey;

  const handleNameChange = (value) => {
    const sanitizedValue = sanitizeFullNameInput(value);

    setForm((prev) => ({ ...prev, name: sanitizedValue }));
    markTouched(['name']);
    clearFeedback(['name', 'form']);

    if (/[^A-Za-z ]/.test(value)) {
      setInteractionMessage('name', 'Only alphabets are allowed.');
      return;
    }

    setInteractionMessage('name', '');
  };

  const handleEmailUsernameChange = (value) => {
    const sanitizedValue = sanitizeEmailUsernameInput(value);

    setForm((prev) => ({ ...prev, emailUsername: sanitizedValue }));
    markTouched(['email']);
    clearFeedback(['email', 'form']);

    if (/[^A-Za-z0-9._]/.test(value)) {
      setInteractionMessage('email', 'Special characters not allowed.');
      return;
    }

    if (value.startsWith('.') || value.includes('..')) {
      setInteractionMessage('email', 'Invalid email format.');
      return;
    }

    setInteractionMessage('email', '');
  };

  const handleEmailProviderChange = (value) => {
    const nextProvider = value === 'custom' ? 'custom' : value.toLowerCase();

    setForm((prev) => ({
      ...prev,
      emailProvider: nextProvider,
      emailCustomDomain: nextProvider === 'custom' ? prev.emailCustomDomain : ''
    }));
    markTouched(['email']);
    clearFeedback(['email', 'form']);
    setInteractionMessage('email', '');
  };

  const handleEmailDomainChange = (value) => {
    const sanitizedValue = sanitizeEmailDomainInput(value);

    setForm((prev) => ({ ...prev, emailCustomDomain: sanitizedValue }));
    markTouched(['email']);
    clearFeedback(['email', 'form']);

    if (/[^A-Za-z0-9.-]/.test(value)) {
      setInteractionMessage('email', 'Invalid email format.');
      return;
    }

    if (value.startsWith('.') || value.includes('..')) {
      setInteractionMessage('email', 'Invalid email format.');
      return;
    }

    setInteractionMessage('email', '');
  };

  const handlePasswordChange = (value) => {
    setForm((prev) => ({ ...prev, password: value }));
    markTouched(form.confirmPassword ? ['password', 'confirmPassword'] : ['password']);
    clearFeedback(['password', 'confirmPassword', 'form']);
  };

  const handleConfirmPasswordChange = (value) => {
    setForm((prev) => ({ ...prev, confirmPassword: value }));
    markTouched(['confirmPassword']);
    clearFeedback(['confirmPassword', 'form']);
  };

  const handlePhoneChange = (value) => {
    const digits = extractPhoneDisplayDigits(value);

    setForm((prev) => ({ ...prev, phone: buildIndianPhoneNumber(digits) }));
    markTouched(['phone']);
    clearFeedback(['phone', 'form']);
    setInteractionMessage('phone', '');
  };

  const handleGenericChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    markTouched([field]);
    clearFeedback([field, 'form']);
  };

  const handleRoleChange = (role) => {
    setForm((prev) => ({ ...prev, role: safeRole(role) }));
    markTouched(['role']);
    clearFeedback(['role', 'businessName', 'categoryId', 'form']);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitAttempted(true);

    const currentValidationErrors = validateRegisterForm(form);
    if (Object.keys(currentValidationErrors).length > 0) {
      setTouched((prev) => ({
        ...prev,
        name: true,
        email: true,
        password: true,
        confirmPassword: true,
        phone: true,
        businessName: form.role === 'vendor' ? true : prev.businessName,
        categoryId: form.role === 'vendor' ? true : prev.categoryId
      }));
      toast.error('Please fix the highlighted fields.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: normalizeFullName(form.name),
        email: buildRegisterEmail(form),
        password: form.password,
        phone: buildIndianPhoneNumber(extractIndianPhoneDigits(form.phone)),
        role: form.role
      };

      if (form.role === 'vendor') {
        payload.businessName = form.businessName.trim();
        payload.categoryId = form.categoryId;
      }

      await register(payload);
      toast.success('Account created!');
      navigate(form.role === 'vendor' ? '/vendor' : '/dashboard');
    } catch (error) {
      const fieldErrors = extractFieldErrors(error);
      const fallbackMessage = getApiErrorMessage(error, 'Registration failed');

      setServerErrors(Object.keys(fieldErrors).length > 0 ? fieldErrors : { form: fallbackMessage });
      toast.error(fallbackMessage);
    } finally {
      setLoading(false);
    }
  };

  const formError = serverErrors.form;
  const passwordToneClass =
    passwordStrength.label === 'Strong'
      ? 'text-emerald-600'
      : passwordStrength.label === 'Medium'
        ? 'text-amber-600'
        : 'text-red-600';
  const phoneFieldError = getFieldError('phone');
  const emailFieldError = getFieldError('email');

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="card-glass p-8">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-hero-pattern">
                <span className="text-xl font-bold text-white">EP</span>
              </div>
              <h1 className="text-2xl font-bold text-dark-900">Create Account</h1>
              <p className="mt-1 text-sm text-dark-500">Join EventPro today</p>
            </div>

            <div className="mb-6 flex rounded-xl bg-dark-100 p-1">
              {['client', 'vendor'].map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleChange(role)}
                  className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                    form.role === role ? 'bg-white text-primary-700 shadow-sm' : 'text-dark-500'
                  }`}
                >
                  {role === 'client' ? 'Client' : 'Vendor'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="label" htmlFor="register-name">Full Name</label>
                <input
                  id="register-name"
                  type="text"
                  className={getInputClassName('name')}
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  onBlur={() => {
                    markTouched(['name']);
                    setForm((prev) => ({ ...prev, name: normalizeFullName(prev.name) }));
                  }}
                  onKeyDown={(event) => {
                    if (isShortcutKey(event) || NAVIGATION_KEYS.has(event.key)) return;
                    if (!/^[A-Za-z ]$/.test(event.key)) {
                      blockInvalidInput(event, 'name', 'Only alphabets are allowed.');
                    }
                  }}
                  maxLength={50}
                  autoComplete="name"
                  aria-invalid={Boolean(getFieldError('name'))}
                  aria-describedby={getFieldError('name') ? 'register-name-error' : undefined}
                />
                {getFieldError('name') && (
                  <p id="register-name-error" className="mt-1 text-xs text-red-600" role="alert" aria-live="polite">
                    {getFieldError('name')}
                  </p>
                )}
              </div>

              <div>
                <label className="label" htmlFor="register-email-username">Email</label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
                  <div className="relative">
                    <input
                      id="register-email-username"
                      type="text"
                      className={getInputClassName('email', 'input-field pr-10')}
                      placeholder="john.doe"
                      value={form.emailUsername}
                      onChange={(event) => handleEmailUsernameChange(event.target.value)}
                      onBlur={() => markTouched(['email'])}
                      onKeyDown={(event) => {
                        if (isShortcutKey(event) || NAVIGATION_KEYS.has(event.key)) return;
                        if (!/^[A-Za-z0-9._]$/.test(event.key)) {
                          blockInvalidInput(event, 'email', 'Special characters not allowed.');
                          return;
                        }

                        if (event.key === '.' && (!form.emailUsername || form.emailUsername.endsWith('.'))) {
                          blockInvalidInput(event, 'email', 'Invalid email format.');
                        }
                      }}
                      maxLength={64}
                      autoComplete="username"
                      aria-invalid={Boolean(emailFieldError)}
                      aria-describedby={emailFieldError ? 'register-email-error' : 'register-email-preview'}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-semibold text-dark-400">
                      @
                    </span>
                  </div>
                  <select
                    className={getInputClassName('email', 'select-field')}
                    value={form.emailProvider}
                    onChange={(event) => handleEmailProviderChange(event.target.value)}
                    onBlur={() => markTouched(['email'])}
                    aria-label="Email provider"
                    aria-invalid={Boolean(emailFieldError)}
                    aria-describedby={emailFieldError ? 'register-email-error' : 'register-email-preview'}
                  >
                    {EMAIL_PROVIDER_OPTIONS.map((provider) => (
                      <option key={provider.value} value={provider.value}>
                        {provider.label}
                      </option>
                    ))}
                  </select>
                </div>

                {form.emailProvider === 'custom' && (
                  <input
                    id="register-email-domain"
                    type="text"
                    className={`${getInputClassName('email')} mt-3`}
                    placeholder="yourdomain.com"
                    value={form.emailCustomDomain}
                    onChange={(event) => handleEmailDomainChange(event.target.value)}
                    onBlur={() => markTouched(['email'])}
                    onKeyDown={(event) => {
                      if (isShortcutKey(event) || NAVIGATION_KEYS.has(event.key)) return;
                      if (!/^[A-Za-z0-9.-]$/.test(event.key)) {
                        blockInvalidInput(event, 'email', 'Invalid email format.');
                        return;
                      }

                      if (event.key === '.' && (!form.emailCustomDomain || form.emailCustomDomain.endsWith('.'))) {
                        blockInvalidInput(event, 'email', 'Invalid email format.');
                      }
                    }}
                    maxLength={255}
                    autoComplete="off"
                    aria-invalid={Boolean(emailFieldError)}
                    aria-describedby={emailFieldError ? 'register-email-error' : 'register-email-preview'}
                  />
                )}

                <p id="register-email-preview" className="mt-1 text-xs text-dark-500">
                  {emailPreview || 'Your email address will be built here as you type.'}
                </p>
                {emailFieldError && (
                  <p id="register-email-error" className="mt-1 text-xs text-red-600" role="alert" aria-live="polite">
                    {emailFieldError}
                  </p>
                )}
              </div>

              <div>
                <label className="label" htmlFor="register-password">Password</label>
                <input
                  id="register-password"
                  type="password"
                  className={getInputClassName('password')}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  value={form.password}
                  onChange={(event) => handlePasswordChange(event.target.value)}
                  onBlur={() => markTouched(['password'])}
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  aria-invalid={Boolean(getFieldError('password'))}
                  aria-describedby={getFieldError('password') ? 'register-password-error' : 'register-password-strength'}
                />
                <div id="register-password-strength" className="mt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-dark-500">Strength</span>
                    <span className={`font-semibold ${passwordToneClass}`}>{passwordStrength.label}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-dark-100">
                    <div
                      className={`h-full transition-all ${passwordStrength.toneClass}`}
                      style={{ width: form.password ? `${passwordStrength.percentage}%` : '0%' }}
                    />
                  </div>
                </div>
                {getFieldError('password') && (
                  <p id="register-password-error" className="mt-1 text-xs text-red-600" role="alert" aria-live="polite">
                    {getFieldError('password')}
                  </p>
                )}
              </div>

              <div>
                <label className="label" htmlFor="register-confirm-password">Confirm Password</label>
                <input
                  id="register-confirm-password"
                  type="password"
                  className={getInputClassName('confirmPassword')}
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={(event) => handleConfirmPasswordChange(event.target.value)}
                  onBlur={() => markTouched(['confirmPassword'])}
                  minLength={8}
                  maxLength={128}
                  autoComplete="new-password"
                  aria-invalid={Boolean(getFieldError('confirmPassword'))}
                  aria-describedby={getFieldError('confirmPassword') ? 'register-confirm-password-error' : undefined}
                />
                {getFieldError('confirmPassword') && (
                  <p
                    id="register-confirm-password-error"
                    className="mt-1 text-xs text-red-600"
                    role="alert"
                    aria-live="polite"
                  >
                    {getFieldError('confirmPassword')}
                  </p>
                )}
              </div>

              <div>
                <label className="label" htmlFor="register-phone">Phone Number</label>
                <div
                  className={`flex items-center rounded-xl border bg-white transition ${
                    phoneFieldError
                      ? 'border-red-500 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100'
                      : 'border-dark-200 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-100'
                  }`}
                >
                  <span className="border-r border-dark-200 px-4 py-3 text-sm font-semibold text-dark-600">+91</span>
                  <input
                    id="register-phone"
                    type="tel"
                    inputMode="numeric"
                    className="w-full bg-transparent px-4 py-3 text-sm outline-none"
                    placeholder="98765 43210"
                    value={formatIndianPhoneDisplay(phoneDigits)}
                    onChange={(event) => handlePhoneChange(event.target.value)}
                    onBlur={() => markTouched(['phone'])}
                    onKeyDown={(event) => {
                      if (isShortcutKey(event) || NAVIGATION_KEYS.has(event.key)) return;
                      if (!/^\d$/.test(event.key)) {
                        blockInvalidInput(event, 'phone', 'Enter a valid 10-digit mobile number.');
                        return;
                      }

                      if (phoneDigits.length >= 10) {
                        blockInvalidInput(event, 'phone', 'Enter a valid 10-digit mobile number.');
                      }
                    }}
                    maxLength={11}
                    autoComplete="tel-national"
                    aria-invalid={Boolean(phoneFieldError)}
                    aria-describedby={phoneFieldError ? 'register-phone-error' : 'register-phone-help'}
                  />
                </div>
                <p id="register-phone-help" className="mt-1 text-xs text-dark-500">
                  Enter exactly 10 digits. The country code is fixed to India.
                </p>
                {phoneFieldError && (
                  <p id="register-phone-error" className="mt-1 text-xs text-red-600" role="alert" aria-live="polite">
                    {phoneFieldError}
                  </p>
                )}
              </div>

              {form.role === 'vendor' && (
                <>
                  <div>
                    <label className="label" htmlFor="register-business-name">Business Name</label>
                    <input
                      id="register-business-name"
                      type="text"
                      className={getInputClassName('businessName')}
                      placeholder="Your business name"
                      value={form.businessName}
                      onChange={(event) => handleGenericChange('businessName', event.target.value)}
                      onBlur={() => markTouched(['businessName'])}
                      maxLength={200}
                      aria-invalid={Boolean(getFieldError('businessName'))}
                      aria-describedby={getFieldError('businessName') ? 'register-business-name-error' : undefined}
                    />
                    {getFieldError('businessName') && (
                      <p
                        id="register-business-name-error"
                        className="mt-1 text-xs text-red-600"
                        role="alert"
                        aria-live="polite"
                      >
                        {getFieldError('businessName')}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="label" htmlFor="register-category">Service Category</label>
                    <select
                      id="register-category"
                      className={getInputClassName('categoryId', 'select-field')}
                      value={form.categoryId}
                      onChange={(event) => handleGenericChange('categoryId', event.target.value)}
                      onBlur={() => markTouched(['categoryId'])}
                      aria-invalid={Boolean(getFieldError('categoryId'))}
                      aria-describedby={getFieldError('categoryId') ? 'register-category-error' : undefined}
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </option>
                      ))}
                    </select>
                    {getFieldError('categoryId') && (
                      <p id="register-category-error" className="mt-1 text-xs text-red-600" role="alert" aria-live="polite">
                        {getFieldError('categoryId')}
                      </p>
                    )}
                  </div>
                </>
              )}

              {formError && <p className="text-xs text-red-600">{formError}</p>}

              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="btn-primary w-full py-3 text-base disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-dark-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary-600 hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9()\-\s]{7,20}$/;
const FULL_NAME_REGEX = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
const EMAIL_USERNAME_REGEX = /^(?!.*\.\.)(?!\.)(?!.*\.$)[A-Za-z0-9._]+$/;
const EMAIL_DOMAIN_REGEX = /^(?!.*\.\.)(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;
const SAFE_FILTER_TEXT_REGEX = /^[A-Za-z0-9@&/.,'()_ -]*$/;
const SAFE_CITY_REGEX = /^[A-Za-z.' -]*$/;
const LOG_LEVELS = ['info', 'warn', 'error', 'critical'];
const LOGIN_ACTIVITY_STATUSES = ['success', 'failed'];

export const EMAIL_PROVIDER_OPTIONS = [
  { value: 'gmail.com', label: 'gmail.com' },
  { value: 'outlook.com', label: 'outlook.com' },
  { value: 'yahoo.com', label: 'yahoo.com' },
  { value: 'custom', label: 'Custom domain' }
];

export const INDIA_COUNTRY_CODE = '+91';

const sanitizeText = (value) =>
  String(value ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .trim();

export const sanitizePlainText = (value) => sanitizeText(value);

export const sanitizeFilterText = (value, maxLength = 100) =>
  String(value ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);

export const sanitizeCityInput = (value, maxLength = 80) =>
  String(value ?? '')
    .replace(/[^A-Za-z.' -]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);

export const sanitizeIntegerInput = (value, maxLength = 6) =>
  String(value ?? '')
    .replace(/\D+/g, '')
    .slice(0, maxLength);

export const sanitizeDecimalInput = (value, { maxIntegerDigits = 9, decimalPlaces = 2 } = {}) => {
  const rawValue = String(value ?? '').replace(/[^\d.]/g, '');
  const [integerPart = '', decimalPart = ''] = rawValue.split('.');
  const safeInteger = integerPart.slice(0, maxIntegerDigits);
  const safeDecimal = decimalPart.slice(0, decimalPlaces);

  if (!rawValue.includes('.')) {
    return safeInteger;
  }

  return `${safeInteger}.${safeDecimal}`;
};

export const sanitizeSearchQuery = (value, maxLength = 100) => {
  const sanitized = sanitizeFilterText(value, maxLength);
  return SAFE_FILTER_TEXT_REGEX.test(sanitized) ? sanitized : sanitized.replace(/[^A-Za-z0-9@&/.,'()_ -]+/g, '');
};

const isValidDateString = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '');

const validateDateRange = (startDate, endDate, errors, startField, endField) => {
  if (startDate && !isValidDateString(startDate)) {
    errors[startField] = 'Start date must be a valid date.';
  }

  if (endDate && !isValidDateString(endDate)) {
    errors[endField] = 'End date must be a valid date.';
  }

  if (!errors[startField] && !errors[endField] && startDate && endDate && startDate > endDate) {
    errors[endField] = 'End date must be on or after the start date.';
  }
};

export const normalizeFullName = (value) => sanitizeText(value).replace(/\s+/g, ' ');

export const sanitizeFullNameInput = (value) =>
  String(value ?? '')
    .replace(/[^A-Za-z ]+/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^\s+/g, '')
    .slice(0, 50);

export const sanitizeEmailUsernameInput = (value) => {
  const rawValue = String(value ?? '').toLowerCase().replace(/\s+/g, '');
  let sanitized = '';

  for (const char of rawValue) {
    if (/[a-z0-9_]/.test(char)) {
      sanitized += char;
      continue;
    }

    if (char === '.') {
      if (!sanitized || sanitized.endsWith('.')) {
        continue;
      }

      sanitized += char;
    }
  }

  return sanitized.slice(0, 64);
};

export const sanitizeEmailDomainInput = (value) => {
  const rawValue = String(value ?? '').toLowerCase().replace(/\s+/g, '');
  let sanitized = '';

  for (const char of rawValue) {
    if (/[a-z0-9-]/.test(char)) {
      sanitized += char;
      continue;
    }

    if (char === '.') {
      if (!sanitized || sanitized.endsWith('.')) {
        continue;
      }

      sanitized += char;
    }
  }

  return sanitized.slice(0, 255);
};

export const getRegisterEmailDomain = (form) => {
  const selectedProvider = String(form.emailProvider || 'gmail.com').toLowerCase();

  if (selectedProvider === 'custom') {
    return sanitizeEmailDomainInput(form.emailCustomDomain);
  }

  return selectedProvider;
};

export const buildRegisterEmail = (form) => {
  const username = sanitizeEmailUsernameInput(form.emailUsername);
  const domain = getRegisterEmailDomain(form);

  if (!username || !domain) {
    return '';
  }

  return `${username}@${domain}`.toLowerCase();
};

export const extractIndianPhoneDigits = (value) => {
  const raw = String(value ?? '');
  const hasCountryCode = raw.startsWith('+91') || raw.startsWith('0091');
  const digits = raw.replace(/\D/g, '');

  if (hasCountryCode) {
    if (digits === '91') return '';
    if (digits.startsWith('91')) return digits.slice(2, 12);
  }

  return digits.slice(0, 10);
};

export const extractPhoneDisplayDigits = (value) => {
  return String(value ?? '').replace(/\D/g, '').slice(0, 10);
};

export const buildIndianPhoneNumber = (digits) => `${INDIA_COUNTRY_CODE}${String(digits || '').slice(0, 10)}`;

export const formatIndianPhoneDisplay = (digits) => {
  const cleanDigits = String(digits || '').replace(/\D/g, '').slice(0, 10);

  if (cleanDigits.length <= 5) {
    return cleanDigits;
  }

  return `${cleanDigits.slice(0, 5)} ${cleanDigits.slice(5)}`;
};

export const getPasswordStrength = (value) => {
  const password = String(value || '');
  let score = 0;

  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[a-z]/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) {
    return { label: 'Weak', toneClass: 'bg-red-500', percentage: 33 };
  }

  if (score <= 3) {
    return { label: 'Medium', toneClass: 'bg-amber-500', percentage: 66 };
  }

  return { label: 'Strong', toneClass: 'bg-emerald-500', percentage: 100 };
};

export const validateVendorMarketplaceFilters = (filters) => {
  const errors = {};
  const search = sanitizeSearchQuery(filters.search);
  const city = sanitizeCityInput(filters.city);
  const minPrice = String(filters.minPrice || '').trim();
  const maxPrice = String(filters.maxPrice || '').trim();
  const availabilityDate = String(filters.availabilityDate || '').trim();
  const minRating = String(filters.minRating || '').trim();

  if (search && !SAFE_FILTER_TEXT_REGEX.test(search)) {
    errors.search = 'Search contains unsupported characters.';
  } else if (search.length > 100) {
    errors.search = 'Search must be 100 characters or fewer.';
  }

  if (city && !SAFE_CITY_REGEX.test(city)) {
    errors.city = 'City can contain only letters, spaces, apostrophes, periods, and hyphens.';
  }

  if (minPrice) {
    const parsedMin = Number(minPrice);
    if (!Number.isFinite(parsedMin) || parsedMin < 0) {
      errors.minPrice = 'Minimum price must be 0 or greater.';
    }
  }

  if (maxPrice) {
    const parsedMax = Number(maxPrice);
    if (!Number.isFinite(parsedMax) || parsedMax < 0) {
      errors.maxPrice = 'Maximum price must be 0 or greater.';
    }
  }

  if (!errors.minPrice && !errors.maxPrice && minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
    errors.maxPrice = 'Maximum price must be greater than or equal to minimum price.';
  }

  if (minRating) {
    const parsedRating = Number(minRating);
    if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      errors.minRating = 'Minimum rating must be between 1 and 5.';
    }
  }

  if (availabilityDate) {
    if (!isValidDateString(availabilityDate)) {
      errors.availabilityDate = 'Availability date must be a valid date.';
    } else if (!isFutureOrTodayDate(availabilityDate)) {
      errors.availabilityDate = 'Availability date cannot be in the past.';
    }
  }

  return errors;
};

export const buildVendorMarketplaceParams = (filters) => {
  const nextParams = {};
  const normalized = {
    category: String(filters.category || '').trim(),
    search: sanitizeSearchQuery(filters.search),
    city: sanitizeCityInput(filters.city),
    minPrice: sanitizeDecimalInput(filters.minPrice),
    maxPrice: sanitizeDecimalInput(filters.maxPrice),
    minRating: String(filters.minRating || '').trim(),
    availabilityDate: String(filters.availabilityDate || '').trim()
  };

  Object.entries(normalized).forEach(([key, value]) => {
    if (value !== '') {
      nextParams[key] = value;
    }
  });

  return nextParams;
};

export const validateAdminLogFilters = (filters) => {
  const errors = {};
  const search = sanitizeSearchQuery(filters.search, 120);

  if (search && !SAFE_FILTER_TEXT_REGEX.test(search)) {
    errors.search = 'Search contains unsupported characters.';
  }

  if (filters.level && !LOG_LEVELS.includes(filters.level)) {
    errors.level = 'Please choose a valid log level.';
  }

  validateDateRange(filters.startDate, filters.endDate, errors, 'startDate', 'endDate');

  return errors;
};

export const validateSessionHistoryFilters = (filters) => {
  const errors = {};
  const search = sanitizeSearchQuery(filters.search, 100);

  if (search && !SAFE_FILTER_TEXT_REGEX.test(search)) {
    errors.search = 'Search contains unsupported characters.';
  }

  if (filters.status && !LOGIN_ACTIVITY_STATUSES.includes(filters.status)) {
    errors.status = 'Please choose a valid login status.';
  }

  validateDateRange(filters.startDate, filters.endDate, errors, 'startDate', 'endDate');

  return errors;
};

const getRegisterEmailError = (form) => {
  const username = sanitizeEmailUsernameInput(form.emailUsername);
  const domain = getRegisterEmailDomain(form);
  const selectedProvider = String(form.emailProvider || 'gmail.com').toLowerCase();

  if (!username) {
    return 'Email username is required.';
  }

  if (!EMAIL_USERNAME_REGEX.test(username)) {
    return 'Invalid email format.';
  }

  if (!selectedProvider) {
    return 'Email provider is required.';
  }

  if (selectedProvider === 'custom') {
    if (!domain) {
      return 'Email domain is required.';
    }

    if (!EMAIL_DOMAIN_REGEX.test(domain)) {
      return 'Invalid email format.';
    }
  }

  const email = buildRegisterEmail(form);
  if (!email || !EMAIL_REGEX.test(email)) {
    return 'Invalid email format.';
  }

  return '';
};

export const isStrongPassword = (value) => /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(String(value || ''));

export const isFutureOrTodayDate = (value) => {
  if (!isValidDateString(value)) return false;
  const selectedDate = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selectedDate >= today;
};

export const extractFieldErrors = (error) => error?.response?.data?.errors || {};

export const getApiErrorMessage = (error, fallback) => error?.response?.data?.message || fallback;

export const validateLoginForm = (form) => {
  const errors = {};
  const email = sanitizeText(form.email).toLowerCase();

  if (!email) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_REGEX.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (!form.password) {
    errors.password = 'Password is required.';
  }

  return errors;
};

export const validateRegisterForm = (form) => {
  const errors = {};
  const name = normalizeFullName(form.name);
  const phoneDigits = extractIndianPhoneDigits(form.phone);
  const businessName = sanitizeText(form.businessName);

  if (!name) {
    errors.name = 'Full name is required.';
  } else if (name.length < 2) {
    errors.name = 'Full name must be at least 2 characters.';
  } else if (name.length > 50) {
    errors.name = 'Full name must be 50 characters or fewer.';
  } else if (!FULL_NAME_REGEX.test(name)) {
    errors.name = 'Only alphabets are allowed.';
  }

  const emailError = getRegisterEmailError(form);
  if (emailError) {
    errors.email = emailError;
  }

  if (!form.password) {
    errors.password = 'Password is required.';
  } else if (!isStrongPassword(form.password)) {
    errors.password = 'Use at least 8 characters, including 1 uppercase letter and 1 number.';
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.';
  } else if (form.confirmPassword !== form.password) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  if (phoneDigits.length !== 10) {
    errors.phone = 'Enter a valid 10-digit mobile number.';
  }

  if (form.role === 'vendor') {
    if (!businessName) {
      errors.businessName = 'Business name is required for vendors.';
    } else if (businessName.length < 2) {
      errors.businessName = 'Business name must be at least 2 characters.';
    }

    if (!String(form.categoryId || '').trim()) {
      errors.categoryId = 'Please choose a service category.';
    }
  }

  return errors;
};

export const validateEventForm = (form) => {
  const errors = {};
  const name = sanitizeText(form.name);
  const location = sanitizeText(form.location);
  const description = sanitizeText(form.description);

  if (!name) {
    errors.name = 'Event name is required.';
  } else if (name.length < 3) {
    errors.name = 'Event name must be at least 3 characters.';
  }

  if (!form.type) {
    errors.type = 'Event type is required.';
  }

  if (!form.date) {
    errors.date = 'Event date is required.';
  } else if (!isFutureOrTodayDate(form.date)) {
    errors.date = 'Event date cannot be in the past.';
  }

  if (!location) {
    errors.location = 'Location is required.';
  } else if (location.length < 3) {
    errors.location = 'Location must be at least 3 characters.';
  }

  if (form.guestCount !== '' && form.guestCount !== null && form.guestCount !== undefined) {
    const guestCount = Number(form.guestCount);
    if (!Number.isInteger(guestCount) || guestCount < 0) {
      errors.guestCount = 'Guest count must be a whole number greater than or equal to 0.';
    }
  }

  if (form.budget !== '' && form.budget !== null && form.budget !== undefined) {
    const budget = Number(form.budget);
    if (!Number.isFinite(budget) || budget < 0) {
      errors.budget = 'Budget must be a number greater than or equal to 0.';
    }
  }

  if (description.length > 2000) {
    errors.description = 'Description must be 2000 characters or fewer.';
  }

  return errors;
};

export const validateServiceForm = (form) => {
  const errors = {};
  const name = sanitizeText(form.name);
  const description = sanitizeText(form.description);
  const price = Number(form.price);

  if (!name) {
    errors.name = 'Service name is required.';
  } else if (name.length < 2) {
    errors.name = 'Service name must be at least 2 characters.';
  }

  if (form.price === '' || form.price === null || form.price === undefined) {
    errors.price = 'Price is required.';
  } else if (!Number.isFinite(price) || price <= 0) {
    errors.price = 'Price must be greater than 0.';
  }

  if (description.length > 2000) {
    errors.description = 'Description must be 2000 characters or fewer.';
  }

  return errors;
};

export const validateVendorProfileForm = (form) => {
  const errors = {};
  const businessName = sanitizeText(form.businessName);
  const description = sanitizeText(form.description);
  const phone = sanitizeText(form.phone);
  const address = sanitizeText(form.address);
  const city = sanitizeText(form.city);

  if (!businessName) {
    errors.businessName = 'Business name is required.';
  } else if (businessName.length < 2) {
    errors.businessName = 'Business name must be at least 2 characters.';
  }

  if (!String(form.categoryId || '').trim()) {
    errors.categoryId = 'Category is required.';
  }

  if (phone && !PHONE_REGEX.test(phone)) {
    errors.phone = 'Enter a valid phone number.';
  }

  if (description.length > 2000) {
    errors.description = 'Description must be 2000 characters or fewer.';
  }

  if (address.length > 500) {
    errors.address = 'Address must be 500 characters or fewer.';
  }

  if (city.length > 100) {
    errors.city = 'City must be 100 characters or fewer.';
  }

  return errors;
};

export const validateCategoryForm = (form) => {
  const errors = {};
  const name = sanitizeText(form.name);
  const description = sanitizeText(form.description);
  const icon = String(form.icon || '').trim();

  if (!name) {
    errors.name = 'Category name is required.';
  } else if (name.length < 2) {
    errors.name = 'Category name must be at least 2 characters.';
  }

  if (description.length > 500) {
    errors.description = 'Description must be 500 characters or fewer.';
  }

  if (icon.length > 50) {
    errors.icon = 'Icon must be 50 characters or fewer.';
  }

  return errors;
};

export const validateBookingRequest = ({ selectedEvent, selectedService, bookingDate, notes }) => {
  const errors = {};
  const sanitizedNotes = sanitizeText(notes);

  if (!selectedService?.id) {
    errors.selectedService = 'Please select a package first.';
  }

  if (!selectedEvent?.id) {
    errors.selectedEvent = 'Please select an event.';
  }

  if (!bookingDate) {
    errors.bookingDate = 'Please select a booking date.';
  } else if (!isFutureOrTodayDate(bookingDate)) {
    errors.bookingDate = 'Booking date cannot be in the past.';
  }

  if (sanitizedNotes.length > 2000) {
    errors.notes = 'Notes must be 2000 characters or fewer.';
  }

  return errors;
};

export const validateReviewForm = (form) => {
  const errors = {};
  const rating = Number(form.rating);
  const comment = sanitizeText(form.comment);

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    errors.rating = 'Please choose a rating between 1 and 5.';
  }

  if (comment.length > 1000) {
    errors.comment = 'Comment must be 1000 characters or fewer.';
  }

  return errors;
};

export const validateChecklistTask = (task) => {
  const sanitized = sanitizeText(task);

  if (!sanitized) {
    return 'Task name is required.';
  }

  if (sanitized.length > 120) {
    return 'Task name must be 120 characters or fewer.';
  }

  return '';
};

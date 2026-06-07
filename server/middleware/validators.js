const logger = require('../utils/logger');

const PUBLIC_ROLES = ['client', 'vendor'];
const EVENT_TYPES = ['Wedding', 'Birthday', 'Corporate', 'Party', 'Conference', 'Other'];
const EVENT_STATUSES = ['planning', 'confirmed', 'completed', 'cancelled'];
const BOOKING_STATUSES = ['pending', 'confirmed', 'rejected', 'completed', 'cancelled'];
const PAYMENT_STATUSES = ['unpaid', 'partially_paid', 'paid'];
const SERVICE_TIERS = ['basic', 'standard', 'premium'];
const LOG_LEVELS = ['info', 'warn', 'error', 'critical'];
const LOGIN_ACTIVITY_STATUSES = ['success', 'failed'];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9()\-\s]{7,20}$/;
const FULL_NAME_REGEX = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
const REGISTER_EMAIL_LOCAL_REGEX = /^(?!.*\.\.)(?!\.)(?!.*\.$)[A-Za-z0-9._]+$/;
const REGISTER_EMAIL_DOMAIN_REGEX = /^(?!.*\.\.)(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,24}$/;
const INDIA_PHONE_REGEX = /^\+91\d{10}$/;
const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
const ASSET_PATH_REGEX = /^\/[A-Za-z0-9/_\-.]+$/;

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object || {}, key);

const stripHtml = (value) =>
  String(value)
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '');

const sanitizeText = (value, { allowNewLines = false } = {}) => {
  if (value === undefined || value === null) return '';

  let sanitized = stripHtml(value).replace(/\u0000/g, '');

  if (allowNewLines) {
    sanitized = sanitized
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((line) => line.trim())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n');
  } else {
    sanitized = sanitized.replace(/\s+/g, ' ');
  }

  return sanitized.trim();
};

const normalizeEmail = (value) => sanitizeText(value).toLowerCase();

const normalizeRegisterEmail = (value) => {
  const email = normalizeEmail(value);

  if (!EMAIL_REGEX.test(email)) {
    return null;
  }

  const [localPart, domainPart, ...rest] = email.split('@');
  if (!localPart || !domainPart || rest.length > 0) {
    return null;
  }

  if (!REGISTER_EMAIL_LOCAL_REGEX.test(localPart)) {
    return null;
  }

  if (!REGISTER_EMAIL_DOMAIN_REGEX.test(domainPart)) {
    return null;
  }

  return `${localPart}@${domainPart}`;
};

const normalizeIndianPhone = (value) => {
  const digits = String(value ?? '').replace(/\D/g, '');

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }

  return null;
};

const isBlank = (value) =>
  value === undefined ||
  value === null ||
  (typeof value === 'string' && sanitizeText(value) === '');

const parseInteger = (value) => {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const normalized = String(value).trim();
  if (!/^-?\d+$/.test(normalized)) return null;
  const parsed = Number.parseInt(normalized, 10);
  return Number.isInteger(parsed) ? parsed : null;
};

const parseDecimal = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const normalized = String(value).trim();
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const isValidDateString = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00`);
  return !Number.isNaN(parsed.getTime());
};

const isPastDate = (value) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${value}T00:00:00`) < today;
};

const isValidAssetReference = (value) => URL_REGEX.test(value) || ASSET_PATH_REGEX.test(value);

const setError = (errors, field, message) => {
  if (!errors[field]) {
    errors[field] = message;
  }
};

const logValidationFailure = (req, errors, message) => {
  try {
    logger.warn({
      message: 'Validation failed',
      route: req.originalUrl,
      method: req.method,
      statusCode: 400,
      userId: req.user?.id,
      metadata: {
        reason: message,
        fields: Object.keys(errors),
        errors,
        ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'Unknown',
        userAgent: req.headers['user-agent'] || 'Unknown'
      }
    });
  } catch (error) {
    console.error('Validation logger warning:', error.message);
  }
};

const sendValidationError = (req, res, errors, message = 'Please correct the highlighted fields.') => {
  logValidationFailure(req, errors, message);
  return res.status(400).json({ message, errors });
};

const sanitizeStringField = (
  source,
  target,
  errors,
  field,
  {
    label = field,
    required = false,
    min = 0,
    max = 255,
    allowEmpty = false,
    allowNewLines = false,
    pattern,
    patternMessage
  } = {}
) => {
  if (!hasOwn(source, field)) {
    if (required) setError(errors, field, `${label} is required.`);
    return;
  }

  const sanitized = sanitizeText(source[field], { allowNewLines });

  if (!sanitized) {
    if (required && !allowEmpty) {
      setError(errors, field, `${label} is required.`);
      return;
    }

    if (allowEmpty) {
      target[field] = '';
    }
    return;
  }

  if (sanitized.length < min) {
    setError(errors, field, `${label} must be at least ${min} characters.`);
    return;
  }

  if (sanitized.length > max) {
    setError(errors, field, `${label} must be ${max} characters or fewer.`);
    return;
  }

  if (pattern && !pattern.test(sanitized)) {
    setError(errors, field, patternMessage || `${label} is invalid.`);
    return;
  }

  target[field] = sanitized;
};

const sanitizePasswordField = (
  source,
  target,
  errors,
  field,
  { label = field, required = false, min = 0, max = 255, pattern, patternMessage } = {}
) => {
  if (!hasOwn(source, field)) {
    if (required) setError(errors, field, `${label} is required.`);
    return;
  }

  if (typeof source[field] !== 'string') {
    setError(errors, field, `${label} is invalid.`);
    return;
  }

  const rawValue = source[field];

  if (!rawValue) {
    if (required) setError(errors, field, `${label} is required.`);
    return;
  }

  if (rawValue.length < min) {
    setError(errors, field, `${label} must be at least ${min} characters.`);
    return;
  }

  if (rawValue.length > max) {
    setError(errors, field, `${label} must be ${max} characters or fewer.`);
    return;
  }

  if (pattern && !pattern.test(rawValue)) {
    setError(errors, field, patternMessage || `${label} is invalid.`);
    return;
  }

  target[field] = rawValue;
};

const sanitizeDateStringField = (source, target, errors, field, { label = field, required = false } = {}) => {
  if (!hasOwn(source, field)) {
    if (required) setError(errors, field, `${label} is required.`);
    return;
  }

  const value = sanitizeText(source[field]);
  if (!value) {
    if (required) setError(errors, field, `${label} is required.`);
    return;
  }

  if (!isValidDateString(value)) {
    setError(errors, field, `${label} must be a valid date.`);
    return;
  }

  target[field] = value;
};

const sanitizeEnumField = (source, target, errors, field, allowedValues, { label = field, required = false } = {}) => {
  if (!hasOwn(source, field)) {
    if (required) setError(errors, field, `${label} is required.`);
    return;
  }

  const value = sanitizeText(source[field]);
  if (!value) {
    if (required) setError(errors, field, `${label} is required.`);
    return;
  }

  if (!allowedValues.includes(value)) {
    setError(errors, field, `${label} must be one of: ${allowedValues.join(', ')}.`);
    return;
  }

  target[field] = value;
};

const sanitizeIntegerField = (
  source,
  target,
  errors,
  field,
  { label = field, required = false, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = {}
) => {
  if (!hasOwn(source, field)) {
    if (required) setError(errors, field, `${label} is required.`);
    return;
  }

  if (isBlank(source[field])) {
    if (required) setError(errors, field, `${label} is required.`);
    return;
  }

  const parsed = parseInteger(source[field]);
  if (parsed === null) {
    setError(errors, field, `${label} must be a whole number.`);
    return;
  }

  if (parsed < min || parsed > max) {
    setError(errors, field, `${label} must be between ${min} and ${max}.`);
    return;
  }

  target[field] = parsed;
};

const sanitizeDecimalField = (
  source,
  target,
  errors,
  field,
  { label = field, required = false, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = {}
) => {
  if (!hasOwn(source, field)) {
    if (required) setError(errors, field, `${label} is required.`);
    return;
  }

  if (isBlank(source[field])) {
    if (required) setError(errors, field, `${label} is required.`);
    return;
  }

  const parsed = parseDecimal(source[field]);
  if (parsed === null) {
    setError(errors, field, `${label} must be a valid number.`);
    return;
  }

  if (parsed < min || parsed > max) {
    setError(errors, field, `${label} must be between ${min} and ${max}.`);
    return;
  }

  target[field] = parsed;
};

const sanitizeDateField = (source, target, errors, field, { label = field, required = false, allowToday = true } = {}) => {
  if (!hasOwn(source, field)) {
    if (required) setError(errors, field, `${label} is required.`);
    return;
  }

  const value = sanitizeText(source[field]);
  if (!value) {
    if (required) setError(errors, field, `${label} is required.`);
    return;
  }

  if (!isValidDateString(value)) {
    setError(errors, field, `${label} must be a valid date.`);
    return;
  }

  if (isPastDate(value)) {
    setError(errors, field, `${label} cannot be in the past.`);
    return;
  }

  if (!allowToday) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(`${value}T00:00:00`) <= today) {
      setError(errors, field, `${label} must be a future date.`);
      return;
    }
  }

  target[field] = value;
};

const sanitizeAssetField = (source, target, errors, field, { label = field, allowEmpty = false } = {}) => {
  if (!hasOwn(source, field)) return;

  const value = sanitizeText(source[field]);
  if (!value) {
    if (allowEmpty) target[field] = '';
    return;
  }

  if (!isValidAssetReference(value)) {
    setError(errors, field, `${label} must be a valid URL or uploaded file path.`);
    return;
  }

  target[field] = value;
};

const sanitizeStringArrayField = (
  source,
  target,
  errors,
  field,
  { label = field, maxItems = 20, maxLength = 255, assetReferences = false } = {}
) => {
  if (!hasOwn(source, field)) return;

  if (!Array.isArray(source[field])) {
    setError(errors, field, `${label} must be an array.`);
    return;
  }

  if (source[field].length > maxItems) {
    setError(errors, field, `${label} cannot have more than ${maxItems} items.`);
    return;
  }

  const sanitized = [];

  for (const item of source[field]) {
    const cleanItem = sanitizeText(item);

    if (!cleanItem) continue;
    if (cleanItem.length > maxLength) {
      setError(errors, field, `${label} entries must be ${maxLength} characters or fewer.`);
      return;
    }
    if (assetReferences && !isValidAssetReference(cleanItem)) {
      setError(errors, field, `${label} contains an invalid URL or file path.`);
      return;
    }

    sanitized.push(cleanItem);
  }

  target[field] = sanitized;
};

const sanitizeChecklistField = (source, target, errors, field) => {
  if (!hasOwn(source, field)) {
    setError(errors, field, 'Checklist is required.');
    return;
  }

  if (!Array.isArray(source[field])) {
    setError(errors, field, 'Checklist must be an array.');
    return;
  }

  if (source[field].length > 50) {
    setError(errors, field, 'Checklist cannot contain more than 50 items.');
    return;
  }

  const sanitizedChecklist = [];

  for (const item of source[field]) {
    const task = sanitizeText(item?.task);
    const completed = typeof item?.completed === 'boolean' ? item.completed : false;

    if (!task) {
      setError(errors, field, 'Checklist items must include a task name.');
      return;
    }

    if (task.length > 120) {
      setError(errors, field, 'Checklist tasks must be 120 characters or fewer.');
      return;
    }

    sanitizedChecklist.push({ task, completed });
  }

  target[field] = sanitizedChecklist;
};

const validateBody = (validator) => (req, res, next) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const result = validator(body, req);

  if (Object.keys(result.errors).length > 0) {
    return sendValidationError(req, res, result.errors, result.message);
  }

  req.body = result.value;
  return next();
};

const validateQuery = (validator) => (req, res, next) => {
  const query = req.query && typeof req.query === 'object' ? req.query : {};
  const result = validator(query, req);

  if (Object.keys(result.errors).length > 0) {
    return sendValidationError(req, res, result.errors, result.message);
  }

  req.query = result.value;
  return next();
};

const validateParamId = (paramName = 'id', label = 'ID') => (req, res, next) => {
  const parsed = parseInteger(req.params?.[paramName]);

  if (parsed === null || parsed <= 0) {
    return sendValidationError(req, res, { [paramName]: `${label} must be a positive integer.` });
  }

  req.params[paramName] = parsed;
  return next();
};

const validateIdParam = validateParamId;

const validateAvailabilityQuery = (req, res, next) => {
  const errors = {};
  const value = {};

  sanitizeDateField(req.query || {}, value, errors, 'date', { label: 'Availability date', required: true });

  if (Object.keys(errors).length > 0) {
    return sendValidationError(req, res, errors);
  }

  req.query = value;
  return next();
};

const applyPaginationDefaults = (source, target, errors, { defaultPage = 1, defaultLimit = 50, maxLimit = 100 } = {}) => {
  if (hasOwn(source, 'page')) {
    sanitizeIntegerField(source, target, errors, 'page', { label: 'Page', min: 1, max: 100000 });
  } else {
    target.page = defaultPage;
  }

  if (hasOwn(source, 'limit')) {
    sanitizeIntegerField(source, target, errors, 'limit', { label: 'Limit', min: 1, max: maxLimit });
  } else {
    target.limit = defaultLimit;
  }
};

const validateVendorSearchQuery = validateQuery((query) => {
  const errors = {};
  const value = {};

  if (hasOwn(query, 'category')) {
    sanitizeIntegerField(query, value, errors, 'category', { label: 'Category', min: 1 });
  }

  sanitizeStringField(query, value, errors, 'city', {
    label: 'City',
    max: 80,
    allowEmpty: true,
    pattern: /^[A-Za-z.' -]+$/,
    patternMessage: 'City can contain only letters, spaces, apostrophes, periods, and hyphens.'
  });
  sanitizeStringField(query, value, errors, 'search', {
    label: 'Search',
    max: 100,
    allowEmpty: true
  });
  sanitizeDecimalField(query, value, errors, 'minPrice', { label: 'Minimum price', min: 0, max: 1000000000 });
  sanitizeDecimalField(query, value, errors, 'maxPrice', { label: 'Maximum price', min: 0, max: 1000000000 });
  sanitizeDecimalField(query, value, errors, 'minRating', { label: 'Minimum rating', min: 1, max: 5 });

  if (hasOwn(query, 'availabilityDate')) {
    sanitizeDateField(query, value, errors, 'availabilityDate', { label: 'Availability date' });
  }

  if (!errors.minPrice && !errors.maxPrice && value.minPrice !== undefined && value.maxPrice !== undefined && value.minPrice > value.maxPrice) {
    setError(errors, 'maxPrice', 'Maximum price must be greater than or equal to minimum price.');
  }

  return { errors, value };
});

const validateLogsQuery = validateQuery((query) => {
  const errors = {};
  const value = {};

  applyPaginationDefaults(query, value, errors, { defaultLimit: 50, maxLimit: 100 });
  sanitizeEnumField(query, value, errors, 'level', LOG_LEVELS, { label: 'Level' });
  sanitizeIntegerField(query, value, errors, 'userId', { label: 'User ID', min: 1 });
  sanitizeStringField(query, value, errors, 'search', { label: 'Search', max: 120, allowEmpty: true });
  sanitizeDateStringField(query, value, errors, 'startDate', { label: 'Start date' });
  sanitizeDateStringField(query, value, errors, 'endDate', { label: 'End date' });

  if (!errors.startDate && !errors.endDate && value.startDate && value.endDate && value.startDate > value.endDate) {
    setError(errors, 'endDate', 'End date must be on or after the start date.');
  }

  return { errors, value };
});

const validateLogExportQuery = validateQuery((query) => {
  const errors = {};
  const value = {};

  sanitizeEnumField(query, value, errors, 'level', LOG_LEVELS, { label: 'Level' });
  sanitizeStringField(query, value, errors, 'search', { label: 'Search', max: 120, allowEmpty: true });
  sanitizeDateStringField(query, value, errors, 'startDate', { label: 'Start date' });
  sanitizeDateStringField(query, value, errors, 'endDate', { label: 'End date' });

  if (!errors.startDate && !errors.endDate && value.startDate && value.endDate && value.startDate > value.endDate) {
    setError(errors, 'endDate', 'End date must be on or after the start date.');
  }

  return { errors, value };
});

const validateSessionInactiveQuery = validateQuery((query) => {
  const errors = {};
  const value = {};

  applyPaginationDefaults(query, value, errors, { defaultLimit: 50, maxLimit: 100 });

  return { errors, value };
});

const validateLoginLogsQuery = validateQuery((query) => {
  const errors = {};
  const value = {};

  applyPaginationDefaults(query, value, errors, { defaultLimit: 50, maxLimit: 100 });
  sanitizeEnumField(query, value, errors, 'status', LOGIN_ACTIVITY_STATUSES, { label: 'Status' });
  sanitizeStringField(query, value, errors, 'search', { label: 'Search', max: 100, allowEmpty: true });
  sanitizeDateStringField(query, value, errors, 'startDate', { label: 'Start date' });
  sanitizeDateStringField(query, value, errors, 'endDate', { label: 'End date' });

  if (!errors.startDate && !errors.endDate && value.startDate && value.endDate && value.startDate > value.endDate) {
    setError(errors, 'endDate', 'End date must be on or after the start date.');
  }

  return { errors, value };
});

const validateRegister = validateBody((body) => {
  const errors = {};
  const value = {};

  sanitizeStringField(body, value, errors, 'name', {
    label: 'Full name',
    required: true,
    min: 2,
    max: 50,
    pattern: FULL_NAME_REGEX,
    patternMessage: 'Only alphabets are allowed.'
  });
  sanitizePasswordField(body, value, errors, 'password', {
    label: 'Password',
    required: true,
    min: 8,
    max: 128,
    pattern: /^(?=.*[A-Z])(?=.*\d).{8,}$/,
    patternMessage: 'Password must be at least 8 characters and include at least 1 uppercase letter and 1 number.'
  });

  if (!hasOwn(body, 'email') || isBlank(body.email)) {
    setError(errors, 'email', 'Email is required.');
  } else {
    const email = normalizeRegisterEmail(body.email);
    if (!email) {
      setError(errors, 'email', 'Invalid email format.');
    } else {
      value.email = email;
    }
  }

  if (!hasOwn(body, 'phone') || isBlank(body.phone)) {
    setError(errors, 'phone', 'Enter a valid 10-digit mobile number.');
  } else {
    const phone = normalizeIndianPhone(body.phone);

    if (!phone || !INDIA_PHONE_REGEX.test(phone)) {
      setError(errors, 'phone', 'Enter a valid 10-digit mobile number.');
    } else {
      value.phone = phone;
    }
  }

  if (hasOwn(body, 'role') && !isBlank(body.role)) {
    sanitizeEnumField(body, value, errors, 'role', PUBLIC_ROLES, { label: 'Role', required: true });
  } else {
    value.role = 'client';
  }

  if (value.role === 'vendor') {
    sanitizeStringField(body, value, errors, 'businessName', {
      label: 'Business name',
      required: true,
      min: 2,
      max: 200
    });
    sanitizeIntegerField(body, value, errors, 'categoryId', {
      label: 'Category',
      required: true,
      min: 1
    });
  }

  return { errors, value };
});

const validateLogin = validateBody((body) => {
  const errors = {};
  const value = {};

  if (!hasOwn(body, 'email') || isBlank(body.email)) {
    setError(errors, 'email', 'Email is required.');
  } else {
    const email = normalizeEmail(body.email);
    if (!EMAIL_REGEX.test(email)) {
      setError(errors, 'email', 'Email must be a valid email address.');
    } else {
      value.email = email;
    }
  }

  sanitizePasswordField(body, value, errors, 'password', {
    label: 'Password',
    required: true,
    min: 1,
    max: 128
  });

  return { errors, value };
});

const validateRefreshToken = validateBody((body) => {
  const errors = {};
  const value = {};

  sanitizeStringField(body, value, errors, 'refreshToken', {
    label: 'Refresh token',
    required: true,
    min: 10,
    max: 3000
  });

  return { errors, value };
});

const validateLogout = validateBody((body) => {
  const errors = {};
  const value = {};

  if (hasOwn(body, 'refreshToken')) {
    sanitizeStringField(body, value, errors, 'refreshToken', {
      label: 'Refresh token',
      max: 3000,
      allowEmpty: true
    });
  }

  return { errors, value };
});

const validateUpdateProfile = validateBody((body) => {
  const errors = {};
  const value = {};

  sanitizeStringField(body, value, errors, 'name', { label: 'Full name', min: 2, max: 100 });
  sanitizeStringField(body, value, errors, 'phone', {
    label: 'Phone number',
    max: 20,
    allowEmpty: true,
    pattern: PHONE_REGEX,
    patternMessage: 'Phone number must be a valid phone number.'
  });
  sanitizeAssetField(body, value, errors, 'avatar', { label: 'Avatar', allowEmpty: true });

  if (Object.keys(value).length === 0 && Object.keys(errors).length === 0) {
    setError(errors, 'form', 'Please provide at least one field to update.');
  }

  return { errors, value };
});

const validateChangePassword = validateBody((body) => {
  const errors = {};
  const value = {};

  sanitizePasswordField(body, value, errors, 'currentPassword', {
    label: 'Current password',
    required: true,
    min: 1,
    max: 128
  });
  sanitizePasswordField(body, value, errors, 'newPassword', {
    label: 'New password',
    required: true,
    min: 8,
    max: 128,
    pattern: /^(?=.*[A-Z])(?=.*\d).{8,}$/,
    patternMessage: 'New password must be at least 8 characters and include at least 1 uppercase letter and 1 number.'
  });

  if (!errors.newPassword && value.currentPassword === value.newPassword) {
    setError(errors, 'newPassword', 'New password must be different from the current password.');
  }

  return { errors, value };
});

const validateCreateEvent = validateBody((body) => {
  const errors = {};
  const value = {};

  sanitizeStringField(body, value, errors, 'name', { label: 'Event name', required: true, min: 3, max: 200 });
  sanitizeEnumField(body, value, errors, 'type', EVENT_TYPES, { label: 'Event type', required: true });
  sanitizeDateField(body, value, errors, 'date', { label: 'Event date', required: true });
  sanitizeStringField(body, value, errors, 'location', {
    label: 'Location',
    required: true,
    min: 3,
    max: 500
  });
  sanitizeIntegerField(body, value, errors, 'guestCount', { label: 'Guest count', min: 0, max: 100000 });
  sanitizeDecimalField(body, value, errors, 'budget', { label: 'Budget', min: 0, max: 1000000000 });
  sanitizeStringField(body, value, errors, 'description', {
    label: 'Description',
    max: 2000,
    allowEmpty: true,
    allowNewLines: true
  });

  return { errors, value };
});

const validateUpdateEvent = validateBody((body) => {
  const errors = {};
  const value = {};

  sanitizeStringField(body, value, errors, 'name', { label: 'Event name', min: 3, max: 200 });
  sanitizeEnumField(body, value, errors, 'type', EVENT_TYPES, { label: 'Event type' });
  sanitizeDateField(body, value, errors, 'date', { label: 'Event date' });
  sanitizeStringField(body, value, errors, 'location', { label: 'Location', min: 3, max: 500 });
  sanitizeIntegerField(body, value, errors, 'guestCount', { label: 'Guest count', min: 0, max: 100000 });
  sanitizeDecimalField(body, value, errors, 'budget', { label: 'Budget', min: 0, max: 1000000000 });
  sanitizeStringField(body, value, errors, 'description', {
    label: 'Description',
    max: 2000,
    allowEmpty: true,
    allowNewLines: true
  });
  sanitizeEnumField(body, value, errors, 'status', EVENT_STATUSES, { label: 'Status' });

  if (Object.keys(value).length === 0 && Object.keys(errors).length === 0) {
    setError(errors, 'form', 'Please provide at least one field to update.');
  }

  return { errors, value };
});

const validateChecklistUpdate = validateBody((body) => {
  const errors = {};
  const value = {};

  sanitizeChecklistField(body, value, errors, 'checklist');

  return { errors, value };
});

const validateCreateBooking = validateBody((body) => {
  const errors = {};
  const value = {};

  sanitizeIntegerField(body, value, errors, 'eventId', { label: 'Event', required: true, min: 1 });
  sanitizeIntegerField(body, value, errors, 'serviceId', { label: 'Service', required: true, min: 1 });
  sanitizeIntegerField(body, value, errors, 'vendorId', { label: 'Vendor', required: true, min: 1 });
  sanitizeDecimalField(body, value, errors, 'amount', { label: 'Amount', required: true, min: 0.01, max: 1000000000 });
  sanitizeDateField(body, value, errors, 'bookingDate', { label: 'Booking date', required: true });
  sanitizeStringField(body, value, errors, 'notes', {
    label: 'Notes',
    max: 2000,
    allowEmpty: true,
    allowNewLines: true
  });

  return { errors, value };
});

const validateBookingStatusUpdate = validateBody((body) => {
  const errors = {};
  const value = {};

  sanitizeEnumField(body, value, errors, 'status', BOOKING_STATUSES, { label: 'Status', required: true });

  return { errors, value };
});

const validatePaymentStatusUpdate = validateBody((body) => {
  const errors = {};
  const value = {};

  sanitizeEnumField(body, value, errors, 'paymentStatus', PAYMENT_STATUSES, {
    label: 'Payment status',
    required: true
  });

  return { errors, value };
});

const validateServicePayload = (isCreate = false) =>
  validateBody((body) => {
    const errors = {};
    const value = {};

    sanitizeStringField(body, value, errors, 'name', {
      label: 'Service name',
      required: isCreate,
      min: 2,
      max: 200
    });
    sanitizeStringField(body, value, errors, 'description', {
      label: 'Description',
      max: 2000,
      allowEmpty: true,
      allowNewLines: true
    });
    sanitizeDecimalField(body, value, errors, 'price', {
      label: 'Price',
      required: isCreate,
      min: 0.01,
      max: 1000000000
    });
    sanitizeEnumField(body, value, errors, 'packageTier', SERVICE_TIERS, { label: 'Package tier' });
    sanitizeStringField(body, value, errors, 'duration', {
      label: 'Duration',
      max: 100,
      allowEmpty: true
    });
    sanitizeStringArrayField(body, value, errors, 'includedItems', {
      label: 'Included items',
      maxItems: 25,
      maxLength: 120
    });
    sanitizeStringArrayField(body, value, errors, 'images', {
      label: 'Images',
      maxItems: 15,
      maxLength: 500,
      assetReferences: true
    });

    if (hasOwn(body, 'isActive')) {
      if (typeof body.isActive !== 'boolean') {
        setError(errors, 'isActive', 'Active status must be true or false.');
      } else {
        value.isActive = body.isActive;
      }
    }

    if (!isCreate && Object.keys(value).length === 0 && Object.keys(errors).length === 0) {
      setError(errors, 'form', 'Please provide at least one field to update.');
    }

    return { errors, value };
  });

const validateCreateReview = validateBody((body) => {
  const errors = {};
  const value = {};

  sanitizeIntegerField(body, value, errors, 'vendorId', { label: 'Vendor', required: true, min: 1 });
  sanitizeIntegerField(body, value, errors, 'bookingId', { label: 'Booking', min: 1 });
  sanitizeIntegerField(body, value, errors, 'rating', { label: 'Rating', required: true, min: 1, max: 5 });
  sanitizeStringField(body, value, errors, 'comment', {
    label: 'Comment',
    max: 1000,
    allowEmpty: true,
    allowNewLines: true
  });

  return { errors, value };
});

const validateCategoryPayload = (isCreate = false) =>
  validateBody((body) => {
    const errors = {};
    const value = {};

    sanitizeStringField(body, value, errors, 'name', {
      label: 'Category name',
      required: isCreate,
      min: 2,
      max: 100
    });
    sanitizeStringField(body, value, errors, 'description', {
      label: 'Description',
      max: 500,
      allowEmpty: true
    });
    sanitizeStringField(body, value, errors, 'icon', {
      label: 'Icon',
      max: 50,
      allowEmpty: true
    });

    if (!isCreate && Object.keys(value).length === 0 && Object.keys(errors).length === 0) {
      setError(errors, 'form', 'Please provide at least one field to update.');
    }

    return { errors, value };
  });

const validateVendorProfile = validateBody((body) => {
  const errors = {};
  const value = {};

  sanitizeStringField(body, value, errors, 'businessName', {
    label: 'Business name',
    min: 2,
    max: 200
  });
  sanitizeStringField(body, value, errors, 'description', {
    label: 'Description',
    max: 2000,
    allowEmpty: true,
    allowNewLines: true
  });
  sanitizeStringField(body, value, errors, 'phone', {
    label: 'Phone number',
    max: 20,
    allowEmpty: true,
    pattern: PHONE_REGEX,
    patternMessage: 'Phone number must be a valid phone number.'
  });
  sanitizeStringField(body, value, errors, 'address', {
    label: 'Address',
    max: 500,
    allowEmpty: true,
    allowNewLines: true
  });
  sanitizeStringField(body, value, errors, 'city', {
    label: 'City',
    max: 100,
    allowEmpty: true
  });
  sanitizeIntegerField(body, value, errors, 'categoryId', { label: 'Category', min: 1 });
  sanitizeStringArrayField(body, value, errors, 'portfolioImages', {
    label: 'Portfolio images',
    maxItems: 20,
    maxLength: 500,
    assetReferences: true
  });

  if (Object.keys(value).length === 0 && Object.keys(errors).length === 0) {
    setError(errors, 'form', 'Please provide at least one field to update.');
  }

  return { errors, value };
});

const validateClientLog = validateBody((body) => {
  const errors = {};
  const value = {};

  sanitizeEnumField(body, value, errors, 'level', LOG_LEVELS, { label: 'Log level' });
  sanitizeStringField(body, value, errors, 'message', {
    label: 'Message',
    required: true,
    min: 3,
    max: 1000,
    allowNewLines: true
  });
  sanitizeStringField(body, value, errors, 'stack', {
    label: 'Stack',
    max: 10000,
    allowEmpty: true,
    allowNewLines: true
  });
  sanitizeStringField(body, value, errors, 'route', {
    label: 'Route',
    max: 300,
    allowEmpty: true
  });

  if (hasOwn(body, 'metadata')) {
    if (!body.metadata || typeof body.metadata !== 'object' || Array.isArray(body.metadata)) {
      setError(errors, 'metadata', 'Metadata must be an object.');
    } else {
      const metadataSize = JSON.stringify(body.metadata).length;
      if (metadataSize > 10000) {
        setError(errors, 'metadata', 'Metadata must be 10KB or smaller.');
      } else {
      value.metadata = body.metadata;
      }
    }
  }

  if (!value.level) {
    value.level = 'error';
  }

  return { errors, value };
});

module.exports = {
  validateAvailabilityQuery,
  validateBody,
  validateChangePassword,
  validateCategoryCreate: validateCategoryPayload(true),
  validateCategoryUpdate: validateCategoryPayload(false),
  validateChecklistUpdate,
  validateClientLog,
  validateCreateBooking,
  validateCreateEvent,
  validateCreateReview,
  validateIdParam,
  validateInactiveSessionsQuery: validateSessionInactiveQuery,
  validateLogin,
  validateLoginLogsQuery,
  validateLogExportQuery,
  validateLogout,
  validateLogsQuery,
  validatePaymentStatusUpdate,
  validateRefreshToken,
  validateRegister,
  validateServiceCreate: validateServicePayload(true),
  validateServiceUpdate: validateServicePayload(false),
  validateUpdateEvent,
  validateUpdateProfile,
  validateVendorSearchQuery,
  validateVendorProfile,
  validateBookingStatusUpdate
};

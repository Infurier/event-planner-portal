import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import { HiOutlineSearch, HiOutlineStar, HiOutlineLocationMarker, HiOutlineCalendar } from 'react-icons/hi';
import {
  buildVendorMarketplaceParams,
  sanitizeCityInput,
  sanitizeDecimalInput,
  sanitizeSearchQuery,
  validateVendorMarketplaceFilters
} from '../../utils/validation';

const VendorMarketplace = () => {
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ category: '', search: '', city: '', minPrice: '', maxPrice: '', minRating: '', availabilityDate: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const minDate = new Date().toISOString().split('T')[0];

  const filterErrors = validateVendorMarketplaceFilters(filters);
  const isFilterValid = Object.keys(filterErrors).length === 0;

  const fetchVendors = async () => {
    const validationErrors = validateVendorMarketplaceFilters(filters);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const params = buildVendorMarketplaceParams(filters);
      const { data } = await API.get('/vendors', { params });
      setVendors(data.vendors || []);
    } catch { } finally { setLoading(false); }
  };

  useEffect(() => {
    API.get('/categories').then(r => setCategories(r.data.categories || [])).catch(() => { });
    fetchVendors();
  }, []);

  useEffect(() => { fetchVendors(); }, [filters.category, filters.minRating]);

  const handleSearch = (e) => { e.preventDefault(); fetchVendors(); };
  const updateFilter = (key, val) => {
    let nextValue = val;

    if (key === 'search') nextValue = sanitizeSearchQuery(val);
    if (key === 'city') nextValue = sanitizeCityInput(val);
    if (key === 'minPrice' || key === 'maxPrice') nextValue = sanitizeDecimalInput(val);

    setFilters(prev => ({ ...prev, [key]: nextValue }));
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };
  const clearFilters = () => {
    setFilters({ category: '', search: '', city: '', minPrice: '', maxPrice: '', minRating: '', availabilityDate: '' });
    setErrors({});
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="page-header mb-0">Vendor Marketplace</h1>
        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="text-sm text-dark-500 hover:text-primary-600 font-medium">
            Clear all filters ({activeFilterCount})
          </button>
        )}
      </div>


      <div className="card mb-4">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={20} />
            <input className="input-field pl-10" placeholder="Search vendors by name..."
              value={filters.search} onChange={e => updateFilter('search', e.target.value)} />
            {errors.search && <p className="mt-1 text-xs text-red-600">{errors.search}</p>}
          </div>
          <select className="select-field md:w-48" value={filters.category} onChange={e => updateFilter('category', e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          <input className="input-field md:w-36" placeholder="City" value={filters.city}
            onChange={e => updateFilter('city', e.target.value)} />
          <button type="submit" disabled={!isFilterValid} className="btn-primary disabled:opacity-50">Search</button>
        </form>
        {errors.city && <p className="mt-2 text-xs text-red-600">{errors.city}</p>}


        <button onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-primary-600 font-medium mt-3 hover:underline">
          {showAdvanced ? '▲ Hide' : '▼ Show'} Advanced Filters
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-dark-100">
            <div>
              <label className="label">Min Price (₹)</label>
              <input type="number" className="input-field" placeholder="0" value={filters.minPrice}
                onChange={e => updateFilter('minPrice', e.target.value)} />
              {errors.minPrice && <p className="mt-1 text-xs text-red-600">{errors.minPrice}</p>}
            </div>
            <div>
              <label className="label">Max Price (₹)</label>
              <input type="number" className="input-field" placeholder="500000" value={filters.maxPrice}
                onChange={e => updateFilter('maxPrice', e.target.value)} />
              {errors.maxPrice && <p className="mt-1 text-xs text-red-600">{errors.maxPrice}</p>}
            </div>
            <div>
              <label className="label">Min Rating</label>
              <select className="select-field" value={filters.minRating} onChange={e => updateFilter('minRating', e.target.value)}>
                <option value="">Any Rating</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
                <option value="2">2+ Stars</option>
              </select>
              {errors.minRating && <p className="mt-1 text-xs text-red-600">{errors.minRating}</p>}
            </div>
            <div>
              <label className="label">Available On</label>
              <input type="date" min={minDate} className="input-field" value={filters.availabilityDate}
                onChange={e => updateFilter('availabilityDate', e.target.value)} />
              {errors.availabilityDate && <p className="mt-1 text-xs text-red-600">{errors.availabilityDate}</p>}
            </div>
            <div className="md:col-span-4">
              <button onClick={fetchVendors} disabled={!isFilterValid} className="btn-secondary btn-sm disabled:opacity-50">Apply Filters</button>
            </div>
          </div>
        )}
      </div>


      <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
        <button onClick={() => updateFilter('category', '')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${!filters.category ? 'bg-primary-600 text-white shadow-md' : 'bg-white text-dark-600 hover:bg-dark-100'}`}>
          All
        </button>
        {categories.map(c => (
          <button key={c.id} onClick={() => updateFilter('category', c.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filters.category == c.id ? 'bg-primary-600 text-white shadow-md' : 'bg-white text-dark-600 hover:bg-dark-100'}`}>
            {c.icon} {c.name}
          </button>
        ))}
      </div>


      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => <div key={i} className="card animate-pulse h-52 bg-dark-50" />)}
        </div>
      ) : vendors.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-xl font-semibold text-dark-500 mb-2">No vendors found</p>
          <p className="text-dark-400 text-sm mb-4">Try adjusting your search or filters</p>
          <button onClick={clearFilters} className="btn-secondary btn-sm">Reset Filters</button>
        </div>
      ) : (
        <>
          <p className="text-sm text-dark-400 mb-4">{vendors.length} vendor{vendors.length > 1 ? 's' : ''} found</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {vendors.map(v => (
              <Link key={v.id} to={`/vendors/${v.id}`} className="card hover:-translate-y-1 transition-all group">
                <div className="flex items-start justify-between mb-3">
                  {(v.portfolioImages || []).length > 0 ? (
                    <div className="w-14 h-14 rounded-xl overflow-hidden shadow-lg flex-shrink-0">
                      <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}${v.portfolioImages[0]}`}
                        alt={v.businessName} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-accent-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {v.businessName?.charAt(0)}
                    </div>
                  )}
                  <span className="badge bg-primary-50 text-primary-700 text-xs">{v.category?.name}</span>
                </div>
                <h3 className="font-bold text-dark-900 text-lg group-hover:text-primary-600 transition-colors">{v.businessName}</h3>
                {v.city && <p className="text-sm text-dark-400 flex items-center gap-1 mt-1"><HiOutlineLocationMarker size={14} /> {v.city}</p>}
                <p className="text-sm text-dark-500 mt-2 line-clamp-2">{v.description || 'Premium service provider'}</p>

                {/* Package tiers preview */}
                {v.services?.length > 0 && (
                  <div className="flex gap-1.5 mt-3">
                    {[...new Set(v.services.map(s => s.packageTier || 'standard'))].map(tier => (
                      <span key={tier} className={`text-xs px-2 py-0.5 rounded-full capitalize ${tier === 'premium' ? 'bg-amber-100 text-amber-700' :
                          tier === 'basic' ? 'bg-dark-100 text-dark-600' :
                            'bg-primary-50 text-primary-700'
                        }`}>{tier}</span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-dark-100">
                  <div className="flex items-center gap-1 text-amber-500">
                    <HiOutlineStar size={16} />
                    <span className="font-semibold text-sm">{v.rating || '0.0'}</span>
                    <span className="text-xs text-dark-400">({v.totalReviews || 0})</span>
                  </div>
                  <span className="text-sm font-semibold text-primary-600">
                    {v.services?.length ? `From ₹${Math.min(...v.services.map(s => Number(s.price))).toLocaleString()}` : 'Contact for pricing'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default VendorMarketplace;

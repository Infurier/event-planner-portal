import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { HiStar } from 'react-icons/hi';

const VendorReviews = () => {
  const [vendor, setVendor] = useState(null);
  useEffect(() => { API.get('/vendors/my-profile').then(r => setVendor(r.data.vendor)).catch(() => {}); }, []);

  if (!vendor) return <div className="text-dark-400">Loading...</div>;
  const reviews = vendor.reviews || [];

  return (
    <div className="animate-fade-in">
      <h1 className="page-header">Reviews</h1>
      <div className="card mb-6 flex items-center gap-6">
        <div className="text-center">
          <p className="text-4xl font-bold text-dark-900">{vendor.rating || '0.0'}</p>
          <div className="flex text-amber-400 mt-1">{[...Array(5)].map((_, i) => <HiStar key={i} size={16} className={i < Math.round(vendor.rating) ? '' : 'text-dark-200'} />)}</div>
          <p className="text-xs text-dark-400 mt-1">{vendor.totalReviews} reviews</p>
        </div>
      </div>
      {reviews.length === 0 ? <div className="card py-8 text-center text-dark-400">No reviews yet.</div> : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className="card">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold">{r.user?.name?.charAt(0)}</div>
                <div><p className="font-medium">{r.user?.name}</p>
                  <div className="flex text-amber-400">{[...Array(5)].map((_, i) => <HiStar key={i} size={14} className={i < r.rating ? '' : 'text-dark-200'} />)}</div>
                </div>
              </div>
              {r.comment && <p className="text-dark-600 text-sm">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default VendorReviews;

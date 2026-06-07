import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/layout/Navbar';
import { useState, useEffect } from 'react';
import API from '../api/axios';
import { HiOutlineCalendar, HiOutlineShoppingBag, HiOutlineClipboardCheck, HiOutlineStar, HiOutlineShieldCheck, HiOutlineLightningBolt, HiOutlineLocationMarker, HiStar, HiOutlineArrowRight } from 'react-icons/hi';

const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [topVendors, setTopVendors] = useState([]);
  const [stats, setStats] = useState({ vendors: 0, events: 0, bookings: 0 });

  useEffect(() => {
    API.get('/categories').then(r => setCategories(r.data.categories || [])).catch(() => { });
    API.get('/vendors').then(r => {
      const v = r.data.vendors || [];
      setTopVendors(v.slice(0, 6));
      setStats(s => ({ ...s, vendors: v.length }));
    }).catch(() => { });
  }, []);

  const features = [
    { icon: HiOutlineCalendar, title: 'Create Events', desc: 'Plan weddings, birthdays, corporate events with ease', color: 'from-primary-500 to-primary-700', link: user ? '/dashboard/create-event' : '/register' },
    { icon: HiOutlineShoppingBag, title: 'Browse Vendors', desc: 'Discover top-rated venues, caterers, photographers & more', color: 'from-accent-500 to-accent-700', link: '/vendors' },
    { icon: HiOutlineClipboardCheck, title: 'Smart Bookings', desc: 'Book services, track status, manage everything in one place', color: 'from-emerald-500 to-emerald-700', link: user ? '/dashboard/bookings' : '/register' },
    { icon: HiOutlineStar, title: 'Ratings & Reviews', desc: 'Make informed decisions with real client reviews', color: 'from-amber-500 to-amber-700', link: '/vendors' },
    { icon: HiOutlineLightningBolt, title: 'Budget Planner', desc: 'Stay on budget with our smart expense tracker', color: 'from-violet-500 to-violet-700', link: user ? '/dashboard/budget' : '/register' },
    { icon: HiOutlineShieldCheck, title: 'Verified Vendors', desc: 'All vendors are admin-verified for quality assurance', color: 'from-rose-500 to-rose-700', link: '/vendors' },
  ];

  const eventTypes = [
    { label: '🎊 Weddings', type: 'Wedding' },
    { label: '🎂 Birthdays', type: 'Birthday' },
    { label: '🏢 Corporate', type: 'Corporate' },
    { label: '🎉 Parties', type: 'Party' },
    { label: '📋 Conferences', type: 'Conference' },
  ];

  const handleEventTypeClick = (type) => {
    if (user?.role === 'client') {
      navigate('/dashboard/create-event', { state: { eventType: type } });
    } else {
      navigate('/register');
    }
  };

  const getDashboardLink = () => {
    if (!user) return '/register';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'vendor') return '/vendor';
    return '/dashboard';
  };

  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />


      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-hero-pattern opacity-95"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0gMTAwIDAgTCAwIDAgMCAxMDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36 text-center">
          <div className="animate-fade-in">
            <span className="inline-block px-4 py-1.5 bg-white/20 backdrop-blur-md text-white text-sm font-medium rounded-full mb-6">
              ✨ #1 Event Planning Platform
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6">
              Plan Your Perfect<br />
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">Event Today</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8">
              Connect with premium event service providers. From venue to catering, photography to decoration — everything at your fingertips.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link to={getDashboardLink()} className="btn-primary text-lg px-8 py-3.5">
                  Go to Dashboard →
                </Link>
              ) : (
                <>
                  <Link to="/register" className="bg-white text-primary-700 font-bold py-3.5 px-8 rounded-xl text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl active:scale-95">
                    Get Started Free
                  </Link>
                  <Link to="/login" className="border-2 border-white/30 text-white font-semibold py-3.5 px-8 rounded-xl text-lg hover:bg-white/10 transition-all backdrop-blur-sm">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>


          <div className="flex flex-wrap gap-3 justify-center mt-12 animate-slide-up">
            {eventTypes.map(({ label, type }) => (
              <button key={type} onClick={() => handleEventTypeClick(type)}
                className="px-4 py-2 bg-white/15 backdrop-blur-sm text-white rounded-full text-sm font-medium hover:bg-white/25 transition-all cursor-pointer active:scale-95">
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="absolute -bottom-1 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none"><path d="M0 120L60 105C120 90 240 60 360 52.5C480 45 600 60 720 67.5C840 75 960 75 1080 67.5C1200 60 1320 45 1380 37.5L1440 30V120H0Z" fill="#f8f9fa" /></svg>
        </div>
      </section>


      {categories.length > 0 && (
        <section className="py-16 px-4 max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-dark-900 mb-3">Browse by Category</h2>
            <p className="text-dark-500">Find the perfect service provider for every aspect of your event</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map(c => (
              <Link key={c.id} to={`/vendors?category=${c.id}`}
                onClick={(e) => { e.preventDefault(); navigate(user ? `/vendors` : '/login'); }}
                className="card text-center group hover:-translate-y-1 transition-all cursor-pointer">
                <span className="text-4xl mb-2 block group-hover:scale-110 transition-transform">{c.icon}</span>
                <h3 className="font-bold text-dark-800">{c.name}</h3>
                <p className="text-xs text-dark-400 mt-1">{c.description}</p>
              </Link>
            ))}
          </div>
        </section>
      )}


      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-dark-900 mb-4">Everything You Need to Plan</h2>
          <p className="text-dark-500 text-lg max-w-2xl mx-auto">Our all-in-one platform simplifies event planning from start to finish</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc, color, link }) => (
            <Link key={title} to={link}
              className="card group cursor-pointer hover:-translate-y-1 transition-all duration-300">
              <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon size={24} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-dark-900 mb-2 group-hover:text-primary-600 transition-colors">{title}</h3>
              <p className="text-dark-500 text-sm leading-relaxed">{desc}</p>
              <span className="text-primary-600 text-sm font-medium mt-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {user ? 'Go now' : 'Get started'} <HiOutlineArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      </section>


      {topVendors.length > 0 && (
        <section className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-dark-900">Top Rated Vendors</h2>
                <p className="text-dark-500 mt-2">Handpicked service providers with excellent reviews</p>
              </div>
              <Link to={user ? '/vendors' : '/login'} className="btn-secondary hidden md:flex items-center gap-2">
                View All <HiOutlineArrowRight size={16} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {topVendors.map(v => (
                <Link key={v.id} to={user ? `/vendors/${v.id}` : '/login'}
                  className="card hover:-translate-y-1 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-accent-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md">
                      {v.businessName?.charAt(0)}
                    </div>
                    <span className="badge bg-primary-50 text-primary-700 text-xs">{v.category?.name}</span>
                  </div>
                  <h3 className="font-bold text-dark-900 text-lg group-hover:text-primary-600 transition-colors">{v.businessName}</h3>
                  {v.city && <p className="text-sm text-dark-400 flex items-center gap-1 mt-1"><HiOutlineLocationMarker size={14} /> {v.city}</p>}
                  <p className="text-sm text-dark-500 mt-2 line-clamp-2">{v.description || 'Premium service provider'}</p>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-dark-100">
                    <div className="flex items-center gap-1 text-amber-500">
                      <HiStar size={16} />
                      <span className="font-semibold text-sm">{v.rating || '0.0'}</span>
                      <span className="text-xs text-dark-400">({v.totalReviews || 0})</span>
                    </div>
                    <span className="text-sm font-semibold text-primary-600">
                      {v.services?.length ? `From ₹${Math.min(...v.services.map(s => Number(s.price))).toLocaleString()}` : 'Contact'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8 md:hidden">
              <Link to={user ? '/vendors' : '/login'} className="btn-secondary">View All Vendors →</Link>
            </div>
          </div>
        </section>
      )}


      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-dark-900 mb-4">How It Works</h2>
          <p className="text-dark-500 text-lg">Start planning your event in three simple steps</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '1', title: 'Create Your Event', desc: 'Set up your event with date, location, guest count and budget', link: user?.role === 'client' ? '/dashboard/create-event' : '/register', emoji: '📝' },
            { step: '2', title: 'Browse & Book Vendors', desc: 'Find, compare and book verified vendors for every service', link: user ? '/vendors' : '/register', emoji: '🔍' },
            { step: '3', title: 'Track & Manage', desc: 'Monitor bookings, manage budget and checklists in your dashboard', link: user ? getDashboardLink() : '/register', emoji: '📊' }
          ].map(({ step, title, desc, link, emoji }) => (
            <Link key={step} to={link} className="text-center group cursor-pointer">
              <div className="w-20 h-20 mx-auto bg-primary-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-primary-100 group-hover:scale-110 transform transition-all duration-300">
                <span className="text-3xl">{emoji}</span>
              </div>
              <div className="w-8 h-8 mx-auto bg-primary-600 text-white rounded-full flex items-center justify-center font-bold mb-3 -mt-2">{step}</div>
              <h3 className="text-lg font-bold text-dark-900 mb-2 group-hover:text-primary-600 transition-colors">{title}</h3>
              <p className="text-dark-500 text-sm">{desc}</p>
            </Link>
          ))}
        </div>
      </section>


      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="bg-hero-pattern rounded-3xl p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <span className="text-4xl mb-4 block">🎉</span>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Planning an Event?</h2>
              <p className="text-white/80 mb-6">Create your event and find the best vendors for every service you need</p>
              <Link to={user?.role === 'client' ? '/dashboard/create-event' : '/register'}
                className="bg-white text-primary-700 font-bold py-3 px-8 rounded-xl hover:bg-gray-100 transition-all shadow-lg inline-block">
                {user?.role === 'client' ? 'Create Event →' : 'Start Planning →'}
              </Link>
            </div>
          </div>


          <div className="bg-gradient-to-br from-dark-800 to-dark-900 rounded-3xl p-10 text-center relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-4xl mb-4 block">💼</span>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Are You a Vendor?</h2>
              <p className="text-white/70 mb-6">List your services, receive bookings and grow your event business</p>
              <Link to={user?.role === 'vendor' ? '/vendor' : '/register?role=vendor'}
                className="bg-accent-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-accent-600 transition-all shadow-lg inline-block">
                {user?.role === 'vendor' ? 'Go to Dashboard →' : 'Join as Vendor →'}
              </Link>
            </div>
          </div>
        </div>
      </section>


      <footer className="bg-dark-900 text-dark-400 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-hero-pattern rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">EP</span>
                </div>
                <span className="text-white font-bold text-lg">Event Planner Portal</span>
              </div>
              <p className="text-sm leading-relaxed">Your trusted platform for seamless event planning. Connect with verified vendors and create unforgettable experiences.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">For Clients</h4>
              <div className="space-y-2 text-sm">
                <Link to={user?.role === 'client' ? '/dashboard/create-event' : '/register'} className="block hover:text-white transition-colors">Create Event</Link>
                <Link to={user ? '/vendors' : '/login'} className="block hover:text-white transition-colors">Browse Vendors</Link>
                <Link to={user?.role === 'client' ? '/dashboard/bookings' : '/register'} className="block hover:text-white transition-colors">My Bookings</Link>
                <Link to={user?.role === 'client' ? '/dashboard/budget' : '/register'} className="block hover:text-white transition-colors">Budget Planner</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">For Vendors</h4>
              <div className="space-y-2 text-sm">
                <Link to={user?.role === 'vendor' ? '/vendor' : '/register?role=vendor'} className="block hover:text-white transition-colors">Vendor Dashboard</Link>
                <Link to={user?.role === 'vendor' ? '/vendor/services' : '/register?role=vendor'} className="block hover:text-white transition-colors">Manage Services</Link>
                <Link to={user?.role === 'vendor' ? '/vendor/bookings' : '/register?role=vendor'} className="block hover:text-white transition-colors">Booking Requests</Link>
                <Link to={user?.role === 'vendor' ? '/vendor/reviews' : '/register?role=vendor'} className="block hover:text-white transition-colors">My Reviews</Link>
              </div>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Quick Links</h4>
              <div className="space-y-2 text-sm">
                <Link to={user ? getDashboardLink() : '/login'} className="block hover:text-white transition-colors">Dashboard</Link>
                <Link to="/login" className="block hover:text-white transition-colors">Sign In</Link>
                <Link to="/register" className="block hover:text-white transition-colors">Create Account</Link>
                <Link to="/register?role=vendor" className="block hover:text-white transition-colors">Join as Vendor</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-dark-700 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">© 2026 Event Planner Portal. All rights reserved.</p>
            <div className="flex gap-6 text-sm">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <Link to={user ? '/vendors' : '/login'} className="hover:text-white transition-colors">Vendors</Link>
              <Link to="/register" className="hover:text-white transition-colors">Get Started</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

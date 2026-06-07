import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useState } from 'react';
import { HiMenu, HiX, HiBell, HiOutlineSearch, HiOutlineChatAlt2 } from 'react-icons/hi';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { unreadCount, setUnreadCount, unreadMessages } = useSocket();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'vendor') return '/vendor';
    return '/dashboard';
  };

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-dark-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-1">
        <div className="flex justify-between items-center h-14 sm:h-16">

          <Link to="/" className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-hero-pattern rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs sm:text-sm">EP</span>
            </div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent truncate">
              Event Planner Portal
            </span>
          </Link>


          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            <Link to="/" className="text-dark-600 hover:text-primary-600 font-medium transition-colors">Home</Link>
            <Link to="/vendors" className="text-dark-600 hover:text-primary-600 font-medium transition-colors">Vendors</Link>
            {user ? (
              <>
                <Link to={getDashboardLink()} className="text-dark-600 hover:text-primary-600 font-medium transition-colors">Dashboard</Link>
                <Link to="/messages" className="relative text-dark-600 hover:text-primary-600 transition-colors p-2">
                  <HiOutlineChatAlt2 size={22} />
                  {unreadMessages > 0 && (
                    <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                  )}
                </Link>
                <Link to="/notifications" onClick={() => setUnreadCount(0)} className="relative text-dark-600 hover:text-primary-600 transition-colors p-2">
                  <HiBell size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                  )}
                </Link>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-700 font-semibold text-sm">{user.name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <span className="text-sm font-medium text-dark-700 hidden lg:inline">{user.name}</span>
                </div>
                <button onClick={handleLogout} className="btn-secondary btn-sm">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary btn-sm">Login</Link>
                <Link to="/register" className="btn-primary btn-sm">Sign Up</Link>
              </>
            )}
          </div>


          <div className="flex md:hidden items-center gap-1">
            {user && (
              <>
                <Link to="/messages" className="relative p-2.5 text-dark-600 hover:text-primary-600 touch-target">
                  <HiOutlineChatAlt2 size={22} />
                  {unreadMessages > 0 && (
                    <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                  )}
                </Link>
                <Link to="/notifications" onClick={() => setUnreadCount(0)} className="relative p-2.5 text-dark-600 hover:text-primary-600 touch-target">
                <HiBell size={22} />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
              </Link>
              </>
            )}
            <button className="p-2.5 text-dark-600 touch-target" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <HiX size={24} /> : <HiMenu size={24} />}
            </button>
          </div>
        </div>


        {menuOpen && (
          <div className="md:hidden py-3 space-y-1 animate-slide-up border-t border-dark-100">
            <Link to="/" className="block px-3 py-3 text-dark-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl font-medium touch-target" onClick={() => setMenuOpen(false)}>Home</Link>
            <Link to="/vendors" className="block px-3 py-3 text-dark-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl font-medium touch-target" onClick={() => setMenuOpen(false)}>Vendors</Link>
            {user ? (
              <>
                <Link to={getDashboardLink()} className="block px-3 py-3 text-dark-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl font-medium touch-target" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                <div className="flex items-center gap-3 px-3 py-3">
                  <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-700 font-semibold">{user.name?.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-dark-800 text-sm">{user.name}</p>
                    <p className="text-xs text-dark-400">{user.email}</p>
                  </div>
                </div>
                <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="btn-danger btn-sm w-full mt-2">Logout</button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary btn-sm text-center">Login</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary btn-sm text-center">Sign Up</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

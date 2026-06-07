import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useState } from 'react';
import {
  HiOutlineViewGrid, HiOutlineCalendar, HiOutlineShoppingBag,
  HiOutlineClipboardList, HiOutlineCurrencyDollar, HiOutlineCheckCircle,
  HiOutlineStar, HiOutlineBell, HiOutlineCog, HiOutlineUsers,
  HiOutlineOfficeBuilding, HiOutlineChartBar, HiOutlineTag,
  HiOutlineBriefcase, HiOutlineDocumentText, HiOutlineShieldCheck, HiX,
  HiOutlineChatAlt2
} from 'react-icons/hi';

const Sidebar = () => {
  const { user } = useAuth();
  const { unreadMessages } = useSocket();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const clientLinks = [
    { to: '/dashboard', icon: HiOutlineViewGrid, label: 'Dashboard' },
    { to: '/dashboard/events', icon: HiOutlineCalendar, label: 'My Events' },
    { to: '/dashboard/create-event', icon: HiOutlineClipboardList, label: 'Create Event' },
    { to: '/vendors', icon: HiOutlineShoppingBag, label: 'Browse Vendors' },
    { to: '/dashboard/bookings', icon: HiOutlineBriefcase, label: 'My Bookings' },
    { to: '/dashboard/budget', icon: HiOutlineCurrencyDollar, label: 'Budget' },
    { to: '/dashboard/checklist', icon: HiOutlineCheckCircle, label: 'Checklist' },
    { to: '/messages', icon: HiOutlineChatAlt2, label: 'Messages', badge: true },
    { to: '/notifications', icon: HiOutlineBell, label: 'Notifications' },
  ];

  const vendorLinks = [
    { to: '/vendor', icon: HiOutlineViewGrid, label: 'Dashboard' },
    { to: '/vendor/profile', icon: HiOutlineCog, label: 'Profile' },
    { to: '/vendor/services', icon: HiOutlineTag, label: 'Services' },
    { to: '/vendor/bookings', icon: HiOutlineBriefcase, label: 'Bookings' },
    { to: '/vendor/reviews', icon: HiOutlineStar, label: 'Reviews' },
    { to: '/messages', icon: HiOutlineChatAlt2, label: 'Messages', badge: true },
    { to: '/notifications', icon: HiOutlineBell, label: 'Notifications' },
  ];

  const adminLinks = [
    { to: '/admin', icon: HiOutlineViewGrid, label: 'Dashboard' },
    { to: '/admin/users', icon: HiOutlineUsers, label: 'Users' },
    { to: '/admin/vendors', icon: HiOutlineOfficeBuilding, label: 'Vendors' },
    { to: '/admin/events', icon: HiOutlineCalendar, label: 'Events' },
    { to: '/admin/categories', icon: HiOutlineTag, label: 'Categories' },
    { to: '/admin/bookings', icon: HiOutlineBriefcase, label: 'Bookings' },
    { to: '/admin/analytics', icon: HiOutlineChartBar, label: 'Analytics' },
    { to: '/admin/sessions', icon: HiOutlineShieldCheck, label: 'Sessions & Security' },
    { to: '/admin/logs', icon: HiOutlineDocumentText, label: 'System Logs' },
  ];

  const links = user?.role === 'admin' ? adminLinks : user?.role === 'vendor' ? vendorLinks : clientLinks;


  const bottomLinks = links.slice(0, 5);


  const closeMobile = () => setMobileOpen(false);

  return (
    <>

      <aside className="w-64 min-h-screen bg-white border-r border-dark-100 p-4 hidden lg:block flex-shrink-0">
        <div className="mb-6 px-4 pt-2">
          <p className="text-xs uppercase tracking-wider text-dark-400 font-semibold">
            {user?.role === 'admin' ? 'Admin Panel' : user?.role === 'vendor' ? 'Vendor Panel' : 'Client Panel'}
          </p>
        </div>
        <nav className="space-y-1">
          {links.map(({ to, icon: Icon, label, badge }) => (
            <NavLink
              key={to} to={to}
              end={to === '/dashboard' || to === '/vendor' || to === '/admin'}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{label}</span>
              {badge && unreadMessages > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-dark-100 z-50 safe-area-bottom">
        <div className="flex justify-around items-center h-16">
          {bottomLinks.map(({ to, icon: Icon, label }) => {
            
            const needsEnd = ['/dashboard', '/vendor', '/admin'].includes(to);
            return (
              <NavLink
                key={to} to={to}
                end={needsEnd}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-0.5 min-w-[3rem] py-1 touch-target transition-transform duration-150 active:scale-90 ${isActive ? 'text-primary-600' : 'text-dark-400'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={22} className={`transition-colors duration-200 ${isActive ? 'text-primary-600' : 'text-dark-400'}`} />
                    <span className={`text-[10px] font-medium transition-colors duration-200 ${isActive ? 'text-primary-600' : 'text-dark-400'}`}>{label}</span>
                    {isActive && <span className="w-1 h-1 rounded-full bg-primary-600 mt-0.5" />}
                  </>
                )}
              </NavLink>
            );
          })}
          {}
          {links.length > 5 && (
            <button
              onClick={() => setMobileOpen(true)}
              className="flex flex-col items-center justify-center gap-0.5 min-w-[3rem] py-1 touch-target"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-dark-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="5" cy="12" r="1.5" fill="currentColor" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                <circle cx="19" cy="12" r="1.5" fill="currentColor" />
              </svg>
              <span className="text-[10px] font-medium text-dark-400">More</span>
            </button>
          )}
        </div>
      </nav>

      {}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/50" onClick={closeMobile} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl animate-slide-in-right safe-area-top">
            <div className="flex items-center justify-between p-4 border-b border-dark-100">
              <p className="text-sm uppercase tracking-wider text-dark-400 font-semibold">
                {user?.role === 'admin' ? 'Admin Panel' : user?.role === 'vendor' ? 'Vendor Panel' : 'Client Panel'}
              </p>
              <button onClick={closeMobile} className="p-2 text-dark-500 touch-target">
                <HiX size={24} />
              </button>
            </div>
            <nav className="p-3 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 60px)' }}>
              {links.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to} to={to}
                  end={to === '/dashboard' || to === '/vendor' || to === '/admin'}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                  onClick={closeMobile}
                >
                  <Icon size={20} />
                  <span>{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;

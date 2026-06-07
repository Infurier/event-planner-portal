import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { Outlet } from 'react-router-dom';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-dark-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-full overflow-x-hidden pb-20 lg:pb-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';

export default function DashboardShell({ navItems, roleLabel, basePath }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-[var(--color-light)]">
      <aside className="hidden w-64 flex-col border-r border-black/5 bg-white md:flex">
        <div className="flex items-center gap-2 px-6 py-6">
          <span className="text-xl font-extrabold text-[var(--color-dark)]">Rurify</span>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[var(--color-dark)] text-white'
                    : 'text-gray-600 hover:bg-[var(--color-sand)] hover:text-[var(--color-dark)]'
                }`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-black/5 p-4">
          <p className="truncate text-sm font-semibold text-[var(--color-dark)]">{user?.name}</p>
          <p className="truncate text-xs text-gray-400">{roleLabel}</p>
          <button
            onClick={handleLogout}
            className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Log out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-black/5 bg-white px-4 py-3 md:px-8">
          <span className="text-lg font-bold text-[var(--color-dark)] md:hidden">Rurify</span>
          <div className="hidden md:block" />
          <div className="flex items-center gap-3">
            <NotificationBell basePath={basePath} />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8">
          <Outlet />
        </main>
        <nav className="flex justify-around border-t border-black/5 bg-white py-2 md:hidden">
          {navItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `flex flex-col items-center px-2 py-1 text-xs ${isActive ? 'text-[var(--color-accent)]' : 'text-gray-500'}`}
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}

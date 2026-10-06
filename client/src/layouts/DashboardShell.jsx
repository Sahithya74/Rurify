import { Suspense, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Spinner from '../components/ui/Spinner';
import { useAuth } from '../context/AuthContext';
import NotificationBell from '../components/NotificationBell';

const MOBILE_TABS = 4;

export default function DashboardShell({ navItems, roleLabel, basePath }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive ? 'bg-[var(--color-dark)] text-white' : 'text-gray-600 hover:bg-[var(--color-sand)] hover:text-[var(--color-dark)]'
    }`;

  return (
    <div className="flex min-h-screen bg-[var(--color-light)]">
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-black/5 bg-white md:flex">
        <div className="flex items-center gap-2 px-6 py-6">
          <span className="text-xl font-extrabold text-[var(--color-dark)]">Rurify</span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
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

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-black/5 bg-white px-4 py-3 md:px-8">
          <span className="text-lg font-bold text-[var(--color-dark)] md:hidden">Rurify</span>
          <div className="hidden md:block" />
          <div className="flex items-center gap-1">
            <NotificationBell basePath={basePath} />
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-dark)] hover:bg-[var(--color-sand)] md:hidden"
              aria-label="Menu"
              aria-expanded={menuOpen}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </header>

        {menuOpen && (
          <div className="fixed inset-0 top-[65px] z-40 overflow-y-auto bg-white px-4 py-4 md:hidden">
            <p className="px-3 text-sm font-semibold text-[var(--color-dark)]">{user?.name}</p>
            <p className="mb-3 px-3 text-xs text-gray-400">{roleLabel}</p>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={navLinkClass}
                  onClick={() => setMenuOpen(false)}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <button
              onClick={handleLogout}
              className="mt-4 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-medium text-gray-600"
            >
              Log out
            </button>
          </div>
        )}

        <main className="flex-1 px-4 pt-6 pb-24 md:px-8 md:pb-8">
          <Suspense fallback={<Spinner />}>
            <Outlet />
          </Suspense>
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-black/5 bg-white py-2 md:hidden">
          {navItems.slice(0, MOBILE_TABS).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center px-2 py-1 text-xs ${isActive ? 'text-[var(--color-accent)]' : 'text-gray-500'}`
              }
            >
              <span>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
          <button onClick={() => setMenuOpen(true)} className="flex flex-col items-center px-2 py-1 text-xs text-gray-500">
            <span>&#8943;</span>
            More
          </button>
        </nav>
      </div>
    </div>
  );
}

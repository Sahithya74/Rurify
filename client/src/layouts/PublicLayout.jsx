import { Link, Outlet, useLocation } from 'react-router-dom';
import { Suspense, useState } from 'react';
import Spinner from '../components/ui/Spinner';

export default function PublicLayout() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isLanding = location.pathname === '/';

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-light)]">
      <header
        className={`sticky top-0 z-40 border-b border-black/5 backdrop-blur ${
          isLanding ? 'bg-[var(--color-light)]/80' : 'bg-white'
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="text-xl font-extrabold text-[var(--color-dark)]">
            Rurify
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-[var(--color-text-soft)] md:flex">
            <Link to="/how-it-works" className="hover:text-[var(--color-dark)]">How it works</Link>
            <Link to="/about" className="hover:text-[var(--color-dark)]">About</Link>
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <Link to="/login" className="text-sm font-semibold text-[var(--color-dark)]">
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:brightness-95"
            >
              Get started
            </Link>
          </div>
          <button className="md:hidden" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        {menuOpen && (
          <div className="flex flex-col gap-3 border-t border-black/5 px-5 py-4 md:hidden">
            <Link to="/how-it-works" onClick={() => setMenuOpen(false)}>How it works</Link>
            <Link to="/about" onClick={() => setMenuOpen(false)}>About</Link>
            <Link to="/login" onClick={() => setMenuOpen(false)}>Log in</Link>
            <Link to="/register" onClick={() => setMenuOpen(false)} className="font-semibold text-[var(--color-accent)]">
              Get started
            </Link>
          </div>
        )}
      </header>

      <main className="flex-1">
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </main>

      <footer className="border-t border-black/5 bg-[var(--color-dark)] px-5 py-10 text-[var(--color-accent-soft)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm md:flex-row">
          <p className="font-semibold text-white">Rurify</p>
          <p className="text-center">
            Rural retail supply-connectivity &amp; demand intelligence platform.
          </p>
          <p>&copy; {new Date().getFullYear()} Rurify</p>
        </div>
      </footer>
    </div>
  );
}

import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';

const nav = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/kyc/queue', label: 'KYC Queue' },
  { to: '/audit', label: 'Audit Log' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-daret-dark flex flex-col">
      <header className="border-b border-daret-border bg-daret-card/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="text-daret-green font-semibold text-lg">Daret Backoffice</Link>
            <nav className="flex gap-4">
              {nav.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`text-sm font-medium transition ${
                    location.pathname.startsWith(to)
                      ? 'text-daret-green'
                      : 'text-daret-muted hover:text-daret-fg'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-daret-muted">{user?.email ?? '—'}</span>
            <button
              onClick={logout}
              className="text-sm text-daret-muted hover:text-daret-fg"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}

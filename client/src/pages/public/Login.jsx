import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../services/api';
import Button from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Field';

const ROLE_HOME = { retailer: '/retailer', vendor: '/vendor', admin: '/admin' };

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form);
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      const redirectTo = location.state?.from?.pathname || ROLE_HOME[user.role] || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'Invalid email or password'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-[var(--color-dark)]">Log in to Rurify</h1>
        <p className="mt-1 text-sm text-gray-500">Access your retailer, vendor, or admin dashboard.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Field label="Email">
            <Input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="********"
            />
          </Field>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full" loading={loading}>
            Log in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          New to Rurify?{' '}
          <Link to="/register" className="font-semibold text-[var(--color-accent)]">
            Create an account
          </Link>
        </p>

        <div className="mt-6 rounded-lg bg-[var(--color-sand)] p-4 text-xs text-[var(--color-text-soft)]">
          <p className="font-semibold">Demo accounts (password: Demo@1234)</p>
          <p className="mt-1">retailer1@rurify.demo &middot; vendor1@rurify.demo &middot; admin@rurify.demo</p>
        </div>
      </div>
    </div>
  );
}

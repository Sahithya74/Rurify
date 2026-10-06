import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiErrorMessage } from '../../services/api';
import * as catalogService from '../../services/catalog';
import Button from '../../components/ui/Button';
import { Field, Input, Select } from '../../components/ui/Field';

const ROLE_HOME = { retailer: '/retailer', vendor: '/vendor' };

export default function Register() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    role: 'retailer',
    name: '',
    email: '',
    password: '',
    phone: '',
    shopName: '',
    businessName: '',
    address: '',
    regionId: '',
    lat: '',
    lng: '',
  });

  useEffect(() => {
    catalogService
      .listRegions()
      .then((data) => {
        setRegions(data);
        if (data.length > 0) {
          setForm((f) => ({ ...f, regionId: data[0].id, lat: data[0].lat, lng: data[0].lng }));
        }
      })
      .catch(() => {});
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Location is not available in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setForm((f) => ({ ...f, lat: pos.coords.latitude.toFixed(5), lng: pos.coords.longitude.toFixed(5) })),
      () => toast.error('Could not access your location.')
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register({ ...form, lat: Number(form.lat), lng: Number(form.lng), regionId: Number(form.regionId) });
      toast.success('Account created! Welcome to Rurify.');
      navigate(ROLE_HOME[user.role] || '/', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create your account'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-[var(--color-dark)]">Join Rurify</h1>
        <p className="mt-1 text-sm text-gray-500">Register as a local retailer or a wholesale vendor.</p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          {['retailer', 'vendor'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setForm({ ...form, role: r })}
              className={`rounded-xl border-2 px-4 py-3 text-sm font-semibold capitalize transition-colors ${
                form.role === r
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-dark)]'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {r === 'retailer' ? 'I am a Retailer' : 'I am a Vendor'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Your name">
              <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
          </div>

          <Field label="Email">
            <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>

          {form.role === 'retailer' ? (
            <Field label="Shop name">
              <Input required value={form.shopName} onChange={(e) => setForm({ ...form, shopName: e.target.value })} />
            </Field>
          ) : (
            <Field label="Business name">
              <Input required value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} />
            </Field>
          )}

          <Field label="Address">
            <Input required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>

          <Field label="Region">
            <Select required value={form.regionId} onChange={(e) => setForm({ ...form, regionId: e.target.value })}>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}, {r.state}
                </option>
              ))}
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Latitude">
              <Input type="number" step="any" required value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
            </Field>
            <Field label="Longitude">
              <Input type="number" step="any" required value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
            </Field>
          </div>
          <button type="button" onClick={useMyLocation} className="text-xs font-semibold text-[var(--color-accent)]">
            Use my current location
          </button>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" className="w-full" loading={loading}>
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[var(--color-accent)]">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

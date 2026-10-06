import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as authService from '../../services/auth';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';

export default function ProfilePage() {
  const { user } = useAuth();
  const [me, setMe] = useState(null);

  useEffect(() => {
    authService.fetchMe().then(setMe).catch(() => {});
  }, []);

  if (!me) return <Spinner />;

  const profile = me.Retailer || me.Vendor;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-dark)]">Profile</h1>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-[var(--color-dark)]">{me.name}</p>
            <p className="text-sm text-gray-500">{me.email}</p>
          </div>
          <Badge color="orange">{user?.role}</Badge>
        </div>

        {profile && (
          <div className="border-t border-gray-100 pt-4 text-sm">
            <p className="font-semibold text-[var(--color-dark)]">{profile.shopName || profile.businessName}</p>
            <p className="mt-1 text-gray-500">{profile.address}</p>
            <div className="mt-3 flex gap-2">
              <Badge color={profile.verified ? 'green' : 'gray'}>{profile.verified ? 'Verified' : 'Pending verification'}</Badge>
            </div>
          </div>
        )}

        {me.phone && <p className="border-t border-gray-100 pt-4 text-sm text-gray-500">Phone: {me.phone}</p>}
      </Card>
    </div>
  );
}

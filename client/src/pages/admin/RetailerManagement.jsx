import { useEffect, useState } from 'react';
import * as adminService from '../../services/admin';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';

export default function RetailerManagement() {
  const toast = useToast();
  const [retailers, setRetailers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState({});

  const load = () => adminService.listRetailers().then(setRetailers).finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);

  const toggleVerified = async (retailer) => {
    await adminService.verifyRetailer(retailer.id, !retailer.verified);
    toast.success(`${retailer.shopName} ${!retailer.verified ? 'verified' : 'unverified'}`);
    load();
  };

  const loadActivity = async (retailer) => {
    if (activity[retailer.id]) {
      setActivity((a) => ({ ...a, [retailer.id]: undefined }));
      return;
    }
    const data = await adminService.getRetailerActivity(retailer.id);
    setActivity((a) => ({ ...a, [retailer.id]: data }));
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-dark)]">Retailers</h1>

      <div className="space-y-3">
        {retailers.map((r) => (
          <Card key={r.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-[var(--color-dark)]">{r.shopName}</h3>
                <p className="text-sm text-gray-500">{r.address}</p>
                <p className="text-xs text-gray-400">{r.User?.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge color={r.verified ? 'green' : 'gray'}>{r.verified ? 'Verified' : 'Unverified'}</Badge>
                <button className="text-sm font-semibold text-[var(--color-accent)]" onClick={() => loadActivity(r)}>
                  {activity[r.id] ? 'Hide' : 'Activity'}
                </button>
                <button className="text-sm font-semibold text-[var(--color-dark)]" onClick={() => toggleVerified(r)}>
                  {r.verified ? 'Unverify' : 'Verify'}
                </button>
              </div>
            </div>
            {activity[r.id] && (
              <div className="mt-4 grid grid-cols-3 gap-4 border-t border-gray-100 pt-4 text-sm">
                <p>Searches: <b>{activity[r.id].searchCount}</b></p>
                <p>Requirements: <b>{activity[r.id].requirementCount}</b></p>
                <p>Orders: <b>{activity[r.id].orderCount}</b></p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

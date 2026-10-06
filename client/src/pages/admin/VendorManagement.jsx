import { useEffect, useState } from 'react';
import * as adminService from '../../services/admin';
import { useToast } from '../../context/ToastContext';
import Card from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import Badge from '../../components/ui/Badge';

export default function VendorManagement() {
  const toast = useToast();
  const [vendors, setVendors] = useState(null);
  const [loading, setLoading] = useState(true);
  const [performance, setPerformance] = useState({});

  const load = () => adminService.listVendors().then(setVendors).finally(() => setLoading(false));
  useEffect(load, []);

  const toggleVerified = async (vendor) => {
    await adminService.verifyVendor(vendor.id, !vendor.verified);
    toast.success(`${vendor.businessName} ${!vendor.verified ? 'verified' : 'unverified'}`);
    load();
  };

  const loadPerformance = async (vendor) => {
    if (performance[vendor.id]) {
      setPerformance((p) => ({ ...p, [vendor.id]: undefined }));
      return;
    }
    const data = await adminService.getVendorPerformance(vendor.id);
    setPerformance((p) => ({ ...p, [vendor.id]: data }));
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-dark)]">Vendors</h1>

      <div className="space-y-3">
        {vendors.map((v) => (
          <Card key={v.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-[var(--color-dark)]">{v.businessName}</h3>
                <p className="text-sm text-gray-500">{v.address}</p>
                <p className="text-xs text-gray-400">{v.User?.email} &middot; Reliability {v.reliabilityScore}/100</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge color={v.verified ? 'green' : 'gray'}>{v.verified ? 'Verified' : 'Unverified'}</Badge>
                <button className="text-sm font-semibold text-[var(--color-accent)]" onClick={() => loadPerformance(v)}>
                  {performance[v.id] ? 'Hide' : 'Performance'}
                </button>
                <button className="text-sm font-semibold text-[var(--color-dark)]" onClick={() => toggleVerified(v)}>
                  {v.verified ? 'Unverify' : 'Verify'}
                </button>
              </div>
            </div>
            {performance[v.id] && (
              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-sm sm:grid-cols-4">
                <p>Orders: <b>{performance[v.id].totalOrders}</b></p>
                <p>Completed: <b>{performance[v.id].completedOrders}</b></p>
                <p>Fulfillment: <b>{performance[v.id].fulfillmentRate}%</b></p>
                <p>Active products: <b>{performance[v.id].activeProducts}</b></p>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

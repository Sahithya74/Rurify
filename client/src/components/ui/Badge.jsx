const CLASSIFICATION_STYLES = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-orange-100 text-orange-700',
  VERY_HIGH: 'bg-red-100 text-red-700',
};

const ORDER_STATUS_STYLES = {
  PENDING: 'bg-gray-100 text-gray-700',
  ACCEPTED: 'bg-blue-100 text-blue-700',
  REJECTED: 'bg-red-100 text-red-700',
  PROCESSING: 'bg-amber-100 text-amber-700',
  READY: 'bg-teal-100 text-teal-700',
  OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-gray-200 text-gray-500',
};

export function ClassificationBadge({ classification }) {
  const style = CLASSIFICATION_STYLES[classification] || CLASSIFICATION_STYLES.LOW;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {classification?.replace('_', ' ') || 'LOW'}
    </span>
  );
}

export function StatusBadge({ status }) {
  const style = ORDER_STATUS_STYLES[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

export default function Badge({ children, color = 'gray' }) {
  const colors = {
    gray: 'bg-gray-100 text-gray-700',
    green: 'bg-emerald-100 text-emerald-700',
    orange: 'bg-orange-100 text-orange-700',
    red: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${colors[color]}`}>
      {children}
    </span>
  );
}

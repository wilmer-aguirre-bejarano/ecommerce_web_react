import type { ComplaintStatus, OrderStatus } from '../types/database';

const orderStyles: Record<OrderStatus, string> = {
  pendiente: 'text-bg-warning',
  pagado: 'text-bg-info',
  enviado: 'text-bg-primary',
  completado: 'text-bg-success',
  cancelado: 'text-bg-danger',
};

const complaintStyles: Record<ComplaintStatus, string> = {
  enviada: 'text-bg-warning',
  'en revisión': 'text-bg-info',
  resuelta: 'text-bg-success',
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`badge ${orderStyles[status]}`}>{status}</span>;
}

export function ComplaintStatusBadge({ status }: { status: ComplaintStatus }) {
  return <span className={`badge ${complaintStyles[status]}`}>{status}</span>;
}

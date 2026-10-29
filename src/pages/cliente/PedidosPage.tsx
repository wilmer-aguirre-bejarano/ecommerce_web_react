import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { PackageSearch } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../lib/cart';
import { useAuth } from '../../hooks/useAuth';
import { OrderStatusBadge } from '../../components/StatusBadge';
import type { Order, OrderItem, SellerProfile } from '../../types/database';

interface PedidoConDetalle extends Order {
  order_items: OrderItem[];
  seller_profiles: Pick<SellerProfile, 'id' | 'business_name'> | null;
}

export default function PedidosPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<PedidoConDetalle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;

    supabase
      .from('orders')
      .select('*, order_items(*), seller_profiles(id, business_name)')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (!error) setOrders((data ?? []) as PedidoConDetalle[]);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  return (
    <div className="space-y-6">
      <header className="card card-body flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted">Cliente</p>
          <h1 className="page-title">Mis pedidos</h1>
        </div>
        <Link to="/cliente/quejas/nueva" className="btn btn-primary">
          Interponer queja
        </Link>
      </header>

      {loading && (
        <div className="alert alert-info">Cargando pedidos...</div>
      )}

      {!loading && orders.length === 0 && (
        <div className="alert alert-secondary">
          <PackageSearch className="h-6 w-6" />
          <p className="mt-2">Aún no tienes pedidos.</p>
          <Link to="/tienda" className="btn btn-primary mt-3">
            Ir a la tienda
          </Link>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="card">
              <header className="card-header flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link
                    to={`/cliente/pedidos/${order.id}`}
                    className="font-semibold text-slate-900 hover:text-slate-700"
                  >
                    {order.order_number}
                  </Link>
                  <p className="text-xs text-muted">
                    {order.seller_profiles?.business_name ?? `Vendedor #${order.seller_id}`} ·{' '}
                    {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <OrderStatusBadge status={order.status} />
                  <span className="text-base font-semibold text-slate-900">
                    {formatPrice(Number(order.total))}
                  </span>
                </div>
              </header>

              <ul className="divide-y divide-slate-100">
                {order.order_items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <span className="min-w-0 truncate text-slate-700">
                      {item.quantity} × {item.product_name}
                    </span>
                    <span className="shrink-0 font-medium text-slate-900">
                      {formatPrice(Number(item.subtotal))}
                    </span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
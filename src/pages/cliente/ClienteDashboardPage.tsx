import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowRight, CircleDollarSign, FileWarning, PackageSearch } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../lib/cart';
import { useAuth } from '../../hooks/useAuth';
import { OrderStatusBadge } from '../../components/StatusBadge';
import type { Order, OrderItem, SellerProfile } from '../../types/database';

interface PedidoConDetalle extends Order {
  order_items: OrderItem[];
  seller_profiles: Pick<SellerProfile, 'id' | 'business_name'> | null;
}

export default function ClienteDashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<PedidoConDetalle[]>([]);

  useEffect(() => {
    if (!user) return;
    let active = true;

    supabase
      .from('orders')
      .select('*, order_items(*), seller_profiles(id, business_name)')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data, error }) => {
        if (!active) return;
        if (error) return;
        setOrders((data ?? []) as PedidoConDetalle[]);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const totalOrders = orders.length;
  const pendientes = orders.filter((order) => order.status === 'pendiente').length;
  const gastado = orders
    .filter((order) => order.status !== 'cancelado')
    .reduce((sum, order) => sum + Number(order.total), 0);

  const stats = [
    { icon: PackageSearch, label: 'Pedidos recientes', value: String(totalOrders) },
    { icon: FileWarning, label: 'Pendientes', value: String(pendientes) },
    { icon: CircleDollarSign, label: 'Total invertido', value: formatPrice(gastado) },
  ];

  return (
    <div className="space-y-6">
      <header className="card card-body">
        <p className="text-sm uppercase tracking-wide text-muted">Cliente</p>
        <h1 className="page-title">Mi panel, {user?.name ?? ''}</h1>
        <p className="text-sm text-muted">
          Hoy es {format(new Date(), 'PP')} · rol: {user?.role ?? 'cliente'}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <article key={stat.label} className="stat-card">
            <span className="stat-icon text-bg-primary">
              <stat.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm text-muted">{stat.label}</p>
              <p className="text-xl font-semibold">{stat.value}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="card">
        <header className="card-header flex items-center justify-between">
          <h2 className="font-medium">Últimos pedidos</h2>
          <Link
            to="/cliente/pedidos"
            className="flex items-center gap-1 text-sm text-muted hover:text-slate-900"
          >
            Ver todos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        {orders.length === 0 ? (
          <div className="alert alert-secondary m-3">Aún no tienes pedidos.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {orders.map((order) => (
              <li key={order.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <Link
                    to={`/cliente/pedidos/${order.id}`}
                    className="block truncate text-sm font-medium text-slate-900 hover:text-slate-700"
                  >
                    {order.order_number}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {order.seller_profiles?.business_name ?? `Vendedor #${order.seller_id}`} ·{' '}
                    {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <OrderStatusBadge status={order.status} />
                  <span className="text-sm font-semibold text-slate-900">
                    {formatPrice(Number(order.total))}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { CircleDollarSign, Package, ShoppingBasket, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../lib/cart';
import { useAuth } from '../../hooks/useAuth';
import type { Order, OrderItem, User } from '../../types/database';

interface OrderWithDetails extends Order {
  order_items: OrderItem[];
  users: Pick<User, 'id' | 'name' | 'email'> | null;
}

export default function VendedorDashboardPage() {
  const { user, sellerProfile } = useAuth();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [complaintCount, setComplaintCount] = useState(0);
  const [totalSales, setTotalSales] = useState(0);

  useEffect(() => {
    if (!sellerProfile) return;
    let active = true;

    const load = async () => {
      const [ordersRes, productsRes, complaintsRes] = await Promise.all([
        supabase
          .from('orders')
          .select('*, order_items(*), users(id, name, email)')
          .eq('seller_id', sellerProfile.id)
          .order('created_at', { ascending: false }),
        supabase.from('products').select('id').eq('seller_id', sellerProfile.id),
        supabase.from('complaints').select('id').eq('seller_id', sellerProfile.id),
      ]);

      if (!active) return;
      const orderData = (ordersRes.data ?? []) as OrderWithDetails[];
      setOrders(orderData.slice(0, 8));
      setProductCount(productsRes.data?.length ?? 0);
      setComplaintCount(complaintsRes.data?.length ?? 0);
      const sum = orderData.reduce((acc, o) => acc + Number(o.total), 0);
      setTotalSales(sum);
    };

    void load();
    return () => {
      active = false;
    };
  }, [sellerProfile]);

  if (!sellerProfile) {
    return (
      <div className="alert alert-warning">
        Completa tu perfil de vendedor para acceder al panel.
      </div>
    );
  }

  const stats = [
    { icon: ShoppingBasket, label: 'Pedidos recibidos', value: orders.length },
    { icon: Package, label: 'Total productos', value: productCount },
    { icon: CircleDollarSign, label: 'Ventas (suma total pedidos)', value: formatPrice(totalSales) },
    { icon: AlertTriangle, label: 'Quejas recibidas', value: complaintCount },
  ];

  return (
    <div className="space-y-6">
      <header className="card card-body">
        <p className="text-sm uppercase tracking-wide text-muted">Vendedor</p>
        <h1 className="page-title">
          {sellerProfile?.business_name ?? user?.name ?? 'Mi negocio'}
        </h1>
        <p className="text-sm text-muted">
          Panel de ventas · {format(new Date(), 'PP')}
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label} className="stat-card">
            <span className="stat-icon text-bg-success">
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
          <h2 className="font-medium">Últimos 8 pedidos con cliente</h2>
          <Link to="/vendedor/pedidos" className="text-sm text-muted hover:text-slate-900">
            Ver todos
          </Link>
        </header>
        <div className="overflow-x-auto">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>N° Orden</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="font-medium">{o.order_number}</td>
                  <td>
                    {o.users?.name || o.full_name}
                    <span className="block text-xs text-muted">{o.users?.email || o.email}</span>
                  </td>
                  <td>{formatPrice(Number(o.total))}</td>
                  <td>{o.status}</td>
                  <td className="text-muted">{format(new Date(o.created_at), 'dd/MM/yyyy HH:mm')}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    No hay pedidos aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

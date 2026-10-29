import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../lib/cart';
import { OrderStatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import type { Order, OrderItem, OrderStatus, User } from '../../types/database';

interface PedidoConDetalle extends Order {
  order_items: OrderItem[];
  users: Pick<User, 'id' | 'name' | 'email'> | null;
}

const statuses: OrderStatus[] = ['pendiente', 'pagado', 'enviado', 'completado', 'cancelado'];

export default function VendedorPedidosPage() {
  const { sellerProfile } = useAuth();
  const [orders, setOrders] = useState<PedidoConDetalle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    if (!sellerProfile) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*), users(id, name, email)')
      .eq('seller_id', sellerProfile.id)
      .order('created_at', { ascending: false });
    if (!error) setOrders((data ?? []) as PedidoConDetalle[]);
    setLoading(false);
  };

  useEffect(() => {
    void fetch();
  }, [sellerProfile]);

  const handleStatusChange = async (orderId: number, status: OrderStatus) => {
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Estado actualizado');
    void fetch();
  };

  if (!sellerProfile) {
    return (
      <div className="alert alert-warning">
        Tu perfil de vendedor aún no está completo.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="card card-body">
        <p className="text-sm uppercase tracking-wide text-muted">Vendedor</p>
        <h1 className="page-title">Pedidos recibidos</h1>
      </header>

      {loading && (
        <div className="alert alert-info">Cargando...</div>
      )}

      {!loading && orders.length === 0 && (
        <div className="alert alert-secondary">
          No hay pedidos aún.
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="overflow-x-auto card">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>N° Orden</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Cambiar estado</th>
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
                  <td>
                    <OrderStatusBadge status={o.status} />
                  </td>
                  <td className="text-muted">{format(new Date(o.created_at), 'dd/MM/yyyy HH:mm')}</td>
                  <td>
                    <select
                      className="form-select max-w-[10rem]"
                      value={o.status}
                      onChange={(e) => void handleStatusChange(o.id, e.target.value as OrderStatus)}
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

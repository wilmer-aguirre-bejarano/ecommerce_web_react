import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import type { Order, OrderItem } from '../../../types/database';

interface OrderWithDetails extends Order {
  client_name?: string;
  seller_name?: string;
  items?: OrderItem[];
}

const STATUS_OPTIONS = ['pendiente', 'pagado', 'enviado', 'completado', 'cancelado'];

export default function AdminPedidosPage() {
  const [pedidos, setPedidos] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('');

  async function fetchPedidos() {
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus) {
        query = query.eq('status', filterStatus);
      }

      const { data } = await query;
      const orders = (data ?? []) as Order[];

      const clientIds = [...new Set(orders.map((o) => o.client_id))];
      const sellerIds = [...new Set(orders.map((o) => o.seller_id))];

      const { data: clients } = await supabase
        .from('users')
        .select('id, name')
        .in('id', clientIds);
      const clientMap = new Map<number, string>();
      (clients ?? []).forEach((c: any) => clientMap.set(c.id, c.name));

      const { data: sellers } = await supabase
        .from('seller_profiles')
        .select('id, business_name, user_id')
        .in('id', sellerIds);
      const sellerMap = new Map<number, string>();
      (sellers ?? []).forEach((s: any) => sellerMap.set(s.id, s.business_name));

      setPedidos(
        orders.map((o) => ({
          ...o,
          client_name: clientMap.get(o.client_id) ?? o.full_name,
          seller_name: sellerMap.get(o.seller_id) ?? '',
        })),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPedidos();
  }, [filterStatus]);

  async function fetchOrderDetail(order: OrderWithDetails) {
    try {
      const { data: items } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id)
        .order('id', { ascending: true });
      setSelectedOrder({ ...order, items: (items ?? []) as OrderItem[] });
      setShowDetail(true);
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  async function updateStatus(orderId: number, status: string) {
    try {
      const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
      if (error) throw error;
      toast.success('Estado actualizado');
      fetchPedidos();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: status as any });
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  return (
    <div className="space-y-6">
      <header className="card card-body">
        <p className="text-sm uppercase tracking-wide text-muted">Admin</p>
        <h1 className="page-title">Pedidos globales</h1>
        <p className="text-sm text-muted">Lista de todos los pedidos del sistema</p>
      </header>

      <div className="card card-body">
        <div className="flex items-center gap-4">
          <label className="form-label mb-0">Filtrar por estado:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-select max-w-[12rem]"
          >
            <option value="">Todos</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="card">
        {loading ? (
          <div className="alert alert-info m-3">Cargando pedidos...</div>
        ) : pedidos.length === 0 ? (
          <div className="alert alert-secondary m-3">No hay pedidos</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>N° Pedido</th>
                  <th>Cliente</th>
                  <th>Vendedor</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium">{p.order_number}</td>
                    <td>{p.client_name}</td>
                    <td>{p.seller_name}</td>
                    <td>S/ {Number(p.total).toFixed(2)}</td>
                    <td>
                      <select
                        value={p.status}
                        onChange={(e) => updateStatus(p.id, e.target.value)}
                        className="form-select max-w-[10rem]"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {p.created_at
                        ? format(parseISO(p.created_at), 'dd/MM/yyyy HH:mm', { locale: es })
                        : '-'}
                    </td>
                    <td>
                      <div className="flex justify-end">
                        <button
                          onClick={() => fetchOrderDetail(p)}
                          className="btn btn-outline-secondary btn-sm"
                        >
                          <Eye className="h-3 w-3" />
                          Ver detalle
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showDetail && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="card card-body max-h-[90vh] w-full max-w-3xl overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Pedido {selectedOrder.order_number}
              </h2>
              <button onClick={() => setShowDetail(false)} className="text-slate-500 hover:text-slate-900">
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-4 text-sm">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <span className="text-slate-500">Cliente:</span> {selectedOrder.client_name}
                </div>
                <div>
                  <span className="text-slate-500">Email:</span> {selectedOrder.email}
                </div>
                <div>
                  <span className="text-slate-500">Teléfono:</span> {selectedOrder.phone || '-'}
                </div>
                <div>
                  <span className="text-slate-500">Dirección:</span> {selectedOrder.address}
                </div>
                <div>
                  <span className="text-slate-500">Vendedor:</span> {selectedOrder.seller_name}
                </div>
                <div>
                  <span className="text-slate-500">Total:</span> S/ {Number(selectedOrder.total).toFixed(2)}
                </div>
                <div>
                  <span className="text-slate-500">Estado:</span> {selectedOrder.status}
                </div>
                <div>
                  <span className="text-slate-500">Método de pago:</span> {selectedOrder.payment_method}
                </div>
              </div>
              {selectedOrder.notes && (
                <div>
                  <span className="text-slate-500">Notas:</span> {selectedOrder.notes}
                </div>
              )}
              <div>
                <h3 className="font-medium">Items</h3>
                <div className="mt-2 overflow-x-auto">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Precio</th>
                        <th>Cantidad</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedOrder.items ?? []).map((item) => (
                        <tr key={item.id}>
                          <td>{item.product_name}</td>
                          <td>S/ {Number(item.price).toFixed(2)}</td>
                          <td>{item.quantity}</td>
                          <td>S/ {Number(item.subtotal).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

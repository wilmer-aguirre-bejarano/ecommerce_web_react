import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ArrowLeft, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../lib/cart';
import { useAuth } from '../../hooks/useAuth';
import { OrderStatusBadge } from '../../components/StatusBadge';
import type { Order, OrderItem, SellerProfile } from '../../types/database';

interface PedidoConDetalle extends Order {
  order_items: OrderItem[];
  seller_profiles: SellerProfile | null;
}

type Status = 'loading' | 'ready' | 'notfound' | 'error';

export default function PedidoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<PedidoConDetalle | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    if (!user) return;
    const orderId = Number(id);
    if (!Number.isInteger(orderId)) {
      setStatus('notfound');
      return;
    }

    let active = true;

    supabase
      .from('orders')
      .select('*, order_items(*), seller_profiles(*)')
      .eq('id', orderId)
      .eq('client_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setStatus('error');
          return;
        }
        const row = (data ?? null) as PedidoConDetalle | null;
        if (!row) {
          setStatus('notfound');
          return;
        }
        setOrder(row);
        setStatus('ready');
      });

    return () => {
      active = false;
    };
  }, [id, user]);

  if (status === 'loading') {
    return <div className="alert alert-info">Cargando pedido...</div>;
  }

  if (status === 'notfound') {
    return (
      <div className="alert alert-warning">
        El pedido no existe o no te pertenece.
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="alert alert-danger">
        No se pudo cargar el pedido.
      </div>
    );
  }

  if (!order) return null;

  const seller = order.seller_profiles;
  const qrPayload = seller?.qr_payload ?? `PAGO|${seller?.business_name ?? 'Vendedor'}`;

  return (
    <div className="space-y-6">
      <header className="card card-body">
        <Link
          to="/cliente/pedidos"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a mis pedidos
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted">Pedido</p>
            <h1 className="page-title">{order.order_number}</h1>
            <p className="text-sm text-muted">
              {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm')} ·{' '}
              {order.seller_profiles?.business_name ?? `Vendedor #${order.seller_id}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <OrderStatusBadge status={order.status} />
            <span className="text-xl font-semibold text-slate-900">
              {formatPrice(Number(order.total))}
            </span>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <section className="card">
            <header className="card-header">
              <h2 className="text-sm font-semibold">Artículos</h2>
            </header>
            <ul className="divide-y divide-slate-100">
              {order.order_items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">{item.product_name}</p>
                    <p className="text-xs text-muted">
                      {formatPrice(Number(item.price))} c/u
                    </p>
                  </div>
                  <span className="shrink-0 font-medium text-slate-900">
                    {item.quantity} × {formatPrice(Number(item.subtotal))}
                  </span>
                </li>
              ))}
            </ul>
            <div className="card-footer flex items-center justify-between">
              <span className="text-sm text-muted">Total</span>
              <span className="text-lg font-semibold text-slate-900">
                {formatPrice(Number(order.total))}
              </span>
            </div>
          </section>

          <section className="card">
            <header className="card-header">
              <h2 className="text-sm font-semibold">Datos de entrega</h2>
            </header>
            <dl className="grid gap-3 px-5 py-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase text-slate-400">Cliente</dt>
                <dd className="mt-0.5 font-medium text-slate-900">{order.full_name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-400">Correo</dt>
                <dd className="mt-0.5 text-slate-700">{order.email}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-400">Teléfono</dt>
                <dd className="mt-0.5 text-slate-700">{order.phone ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase text-slate-400">Método de pago</dt>
                <dd className="mt-0.5 text-slate-700">{order.payment_method === 'qr' ? 'QR' : order.payment_method}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase text-slate-400">Dirección</dt>
                <dd className="mt-0.5 text-slate-700">{order.address}</dd>
              </div>
              {order.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase text-slate-400">Notas</dt>
                  <dd className="mt-0.5 text-slate-700">{order.notes}</dd>
                </div>
              )}
            </dl>
          </section>
        </div>

        <aside className="card card-body h-fit">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <QrCode className="h-4 w-4" />
            Pago al vendedor
          </div>
          <div className="mt-3 border rounded p-3 bg-white">
            <QRCodeSVG value={qrPayload} size={160} className="h-auto w-full" />
          </div>
          <p className="mt-3 text-xs text-muted">
            Escanea el QR para pagar a{' '}
            <span className="font-medium text-slate-700">
              {seller?.business_name ?? 'vendedor'}
            </span>
            . El pedido se confirmará cuando el vendedor lo valide.
          </p>
          <Link to="/cliente/quejas/nueva" className="btn btn-outline-secondary btn-block mt-4">
            Reportar un problema con este pedido
          </Link>
        </aside>
      </div>
    </div>
  );
}
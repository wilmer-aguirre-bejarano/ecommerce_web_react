import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import type { SellerProfile } from '../../types/database';

interface PedidoParaQueja {
  id: number;
  order_number: string;
  seller_id: number;
  created_at: string;
  seller_profiles: Pick<SellerProfile, 'id' | 'business_name'> | null;
}

const quejaSchema = z.object({
  order_id: z.coerce.number().int('Selecciona un pedido').min(1, 'Selecciona un pedido'),
  subject: z.string().min(5, 'El asunto debe tener al menos 5 caracteres'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
});

type QuejaForm = z.infer<typeof quejaSchema>;

const inputClass = 'form-control';

export default function QuejaNuevaPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<PedidoParaQueja[]>([]);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<QuejaForm>({
    defaultValues: { order_id: 0, subject: '', description: '' },
  });

  const orderOptions = useMemo(
    () =>
      orders.map((order) => ({
        id: order.id,
        seller: order.seller_profiles?.business_name ?? `Vendedor #${order.seller_id}`,
        number: order.order_number,
        date: format(new Date(order.created_at), 'dd/MM/yyyy'),
      })),
    [orders],
  );

  useEffect(() => {
    if (!user) return;
    let active = true;

    supabase
      .from('orders')
      .select('id, order_number, seller_id, created_at, seller_profiles(id, business_name)')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (!error) setOrders((data ?? []) as unknown as PedidoParaQueja[]);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const onSubmit = async (values: QuejaForm) => {
    const parsed = quejaSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === 'order_id' || field === 'subject' || field === 'description') {
          setError(field, { message: issue.message });
        }
      }
      return;
    }

    const order = orders.find((entry) => entry.id === parsed.data.order_id);
    if (!order) {
      toast.error('Selecciona un pedido válido');
      return;
    }

    const { error } = await supabase.from('complaints').insert({
      client_id: user!.id,
      seller_id: order.seller_id,
      order_id: order.id,
      subject: parsed.data.subject,
      description: parsed.data.description,
      status: 'enviada',
      pdf_path: null,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Queja registrada. El PDF estará disponible próximamente.');
    navigate('/cliente/quejas');
  };

  return (
    <div className="max-w-2xl">
      <Link
        to="/cliente/quejas"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a mis quejas
      </Link>

      <header className="card card-body mt-3">
        <p className="text-sm uppercase tracking-wide text-muted">Cliente</p>
        <h1 className="page-title">Nueva queja</h1>
      </header>

      <form
        className="card card-body space-y-4 mt-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div>
          <label htmlFor="order_id" className="form-label">
            Pedido
          </label>
          {loading ? (
            <p className="form-text">Cargando tus pedidos...</p>
          ) : orderOptions.length === 0 ? (
            <div className="alert alert-warning mb-0">
              No tienes pedidos para reclamar.
            </div>
          ) : (
            <select
              id="order_id"
              className={`form-select${errors.order_id ? ' is-invalid' : ''}`}
              {...register('order_id')}
            >
              <option value={0}>Selecciona un pedido</option>
              {orderOptions.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.number} · {order.seller} · {order.date}
                </option>
              ))}
            </select>
          )}
          {errors.order_id && (
            <div className="invalid-feedback">{errors.order_id.message}</div>
          )}
        </div>

        <div>
          <label htmlFor="subject" className="form-label">
            Asunto
          </label>
          <input
            id="subject"
            className={`${inputClass}${errors.subject ? ' is-invalid' : ''}`}
            {...register('subject')}
          />
          {errors.subject && (
            <div className="invalid-feedback">{errors.subject.message}</div>
          )}
        </div>

        <div>
          <label htmlFor="description" className="form-label">
            Descripción
          </label>
          <textarea
            id="description"
            rows={5}
            className={`${inputClass}${errors.description ? ' is-invalid' : ''}`}
            {...register('description')}
          />
          {errors.description && (
            <div className="invalid-feedback">{errors.description.message}</div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || loading || orders.length === 0}
          className="btn btn-primary"
        >
          {isSubmitting ? 'Guardando...' : 'Enviar queja'}
        </button>
      </form>
    </div>
  );
}
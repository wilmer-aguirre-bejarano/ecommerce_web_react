import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { clear, formatPrice } from '../../lib/cart';
import { generateOrderNumber, randomPassword } from '../../lib/orders';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';

const checkoutSchema = z.object({
  fullName: z.string().min(3, 'Ingresa tu nombre completo'),
  email: z.email('Ingresa un correo válido'),
  phone: z.string().min(6, 'Ingresa un teléfono válido'),
  address: z.string().min(5, 'Ingresa tu dirección de envío'),
  notes: z.string().optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

const inputClass = 'form-control';

export default function CheckoutPage() {
  const cart = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutForm>({
    defaultValues: {
      fullName: user?.name ?? '',
      email: user?.email ?? '',
      phone: '',
      address: '',
      notes: '',
    },
  });

  const findClientId = async (email: string, fullName: string): Promise<number> => {
    const { data: existing } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      if (existing.role !== 'cliente') {
        throw new Error('Ese correo pertenece a otra cuenta. Usa otro correo.');
      }
      return Number(existing.id);
    }

    const password = randomPassword();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: fullName, role: 'cliente' } },
    });
    if (signUpError) throw new Error(signUpError.message);

    const { error: insertError } = await supabase.from('users').insert({
      name: fullName,
      email,
      password: 'managed-by-supabase',
      role: 'cliente',
      account_created_by_system: true,
    });
    if (insertError) throw new Error(insertError.message);

    const { data: created } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (!created) throw new Error('No se pudo crear la cuenta del cliente');
    return Number(created.id);
  };

  const onSubmit = async (values: CheckoutForm) => {
    const parsed = checkoutSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === 'fullName' || field === 'email' || field === 'phone' || field === 'address') {
          setError(field, { message: issue.message });
        }
      }
      return;
    }

    if (cart.items.length === 0) {
      toast.error('Tu carrito está vacío');
      navigate('/tienda');
      return;
    }

    try {
      const clientId = await findClientId(parsed.data.email, parsed.data.fullName);
      const sellerIds = Object.keys(cart.bySeller).map(Number);

      for (const sellerId of sellerIds) {
        const items = cart.bySeller[sellerId] ?? [];
        const total = items.reduce(
          (sum, item) => sum + Number(item.price) * item.quantity,
          0,
        );
        const orderNumber = await generateOrderNumber();

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            order_number: orderNumber,
            client_id: clientId,
            seller_id: sellerId,
            total,
            status: 'pendiente',
            full_name: parsed.data.fullName,
            email: parsed.data.email,
            phone: parsed.data.phone,
            address: parsed.data.address,
            payment_method: 'qr',
            notes: parsed.data.notes || null,
          })
          .select('id')
          .single();
        if (orderError) throw new Error(orderError.message);

        const orderId = Number(order.id);
        const { error: itemsError } = await supabase.from('order_items').insert(
          items.map((item) => ({
            order_id: orderId,
            product_id: item.product_id,
            product_name: item.name,
            price: Number(item.price),
            quantity: item.quantity,
            subtotal: Number(item.price) * item.quantity,
          })),
        );
        if (itemsError) throw new Error(itemsError.message);
      }

      clear();
      toast.success('Pedido(s) registrado(s). Paga con el QR del vendedor.');
      navigate('/cliente/pedidos');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo procesar el pedido');
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="wrapper page-section">
        <h1 className="page-title">Checkout</h1>
        <div className="alert alert-secondary mt-4">
          No hay productos en el carrito.
        </div>
        <Link to="/tienda" className="btn btn-primary mt-4">
          Ir a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="wrapper page-section">
      <h1 className="page-title">Checkout</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <form
          className="card card-body space-y-4"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div>
            <label htmlFor="fullName" className="form-label">
              Nombre completo
            </label>
            <input
              id="fullName"
              className={`${inputClass}${errors.fullName ? ' is-invalid' : ''}`}
              {...register('fullName')}
            />
            {errors.fullName && (
              <div className="invalid-feedback">{errors.fullName.message}</div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className="form-label">
                Correo
              </label>
              <input
                id="email"
                type="email"
                className={`${inputClass}${errors.email ? ' is-invalid' : ''}`}
                {...register('email')}
              />
              {errors.email && (
                <div className="invalid-feedback">{errors.email.message}</div>
              )}
            </div>
            <div>
              <label htmlFor="phone" className="form-label">
                Teléfono
              </label>
              <input
                id="phone"
                className={`${inputClass}${errors.phone ? ' is-invalid' : ''}`}
                {...register('phone')}
              />
              {errors.phone && (
                <div className="invalid-feedback">{errors.phone.message}</div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="address" className="form-label">
              Dirección
            </label>
            <input
              id="address"
              className={`${inputClass}${errors.address ? ' is-invalid' : ''}`}
              {...register('address')}
            />
            {errors.address && (
              <div className="invalid-feedback">{errors.address.message}</div>
            )}
          </div>

          <div>
            <label htmlFor="notes" className="form-label">
              Notas
            </label>
            <textarea id="notes" rows={3} className={inputClass} {...register('notes')} />
          </div>

          <div className="alert alert-info">
            Se genera un pedido por vendedor y se paga con su código QR. El stock se
            descuenta cuando el vendedor confirma el pedido.
          </div>

          <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-block">
            {isSubmitting ? 'Procesando...' : 'Confirmar pedido'}
          </button>
        </form>

        <aside className="card card-body h-fit">
          <h2 className="text-sm font-semibold text-slate-900">Resumen</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {cart.items.map((item) => (
              <li
                key={item.product_id}
                className="flex items-center justify-between gap-3 text-slate-600"
              >
                <span className="truncate">
                  {item.quantity} × {item.name}
                </span>
                <span className="shrink-0 font-medium text-slate-900">
                  {formatPrice(Number(item.price) * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
            <span className="text-sm text-slate-500">Total</span>
            <span className="text-lg font-semibold text-slate-900">
              {formatPrice(cart.total)}
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}
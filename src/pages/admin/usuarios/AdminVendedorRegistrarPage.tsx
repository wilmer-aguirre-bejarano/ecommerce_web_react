import { } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';

interface FormData {
  name: string;
  email: string;
  password: string;
  business_name: string;
  description: string;
  phone: string;
  address: string;
}

const inputClass = 'form-control';
const textareaClass = 'form-control';

export default function AdminVendedorRegistrarPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      business_name: '',
      description: '',
      phone: '',
      address: '',
    },
  });

  const onSubmit = async (values: FormData) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { name: values.name, role: 'vendedor' },
        },
      });

      if (authError) throw authError;

      let userId: number | null = null;

      if (authData.user) {
        const { data: publicUser } = await supabase
          .from('users')
          .select('id')
          .eq('email', values.email)
          .single();
        if (publicUser?.id) {
          userId = publicUser.id;
        }
      }

      if (!userId) {
        const { data: publicUserCreated, error: insertError } = await supabase
          .from('users')
          .insert({
            name: values.name,
            email: values.email,
            password: values.password,
            role: 'vendedor',
            account_created_by_system: false,
          })
          .select('id')
          .single();

        if (insertError) throw insertError;
        userId = publicUserCreated.id;
      }

      const qrPayload = 'PAGO|' + values.business_name + '|' + values.email;
      const { error: profileError } = await supabase.from('seller_profiles').insert({
        user_id: userId,
        business_name: values.business_name,
        description: values.description || null,
        phone: values.phone || null,
        address: values.address || null,
        qr_payload: qrPayload,
      });

      if (profileError) throw profileError;

      toast.success('Vendedor registrado correctamente');
      reset();
      navigate('/admin/vendedores');
    } catch (error: any) {
      toast.error(error.message || 'Error al registrar vendedor');
    }
  };

  return (
    <div className="max-w-2xl">
      <header className="card card-body">
        <p className="text-sm uppercase tracking-wide text-muted">Admin</p>
        <h1 className="page-title">Registrar Vendedor</h1>
        <p className="text-sm text-muted">
          Crear usuario con rol vendedor y su perfil de vendedor
        </p>
      </header>

      <form
        className="card card-body space-y-4 mt-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Datos de usuario</h2>
          <div>
            <label htmlFor="name" className="form-label">
              Nombre completo
            </label>
            <input
              id="name"
              className={inputClass}
              {...register('name', { required: 'El nombre es obligatorio' })}
            />
          </div>
          <div>
            <label htmlFor="email" className="form-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              className={inputClass}
              {...register('email', { required: 'El email es obligatorio' })}
            />
          </div>
          <div>
            <label htmlFor="password" className="form-label">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              className={inputClass}
              {...register('password', { required: 'La contraseña es obligatoria' })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Datos del vendedor</h2>
          <div>
            <label htmlFor="business_name" className="form-label">
              Nombre del negocio
            </label>
            <input
              id="business_name"
              className={inputClass}
              {...register('business_name', { required: 'El nombre del negocio es obligatorio' })}
            />
          </div>
          <div>
            <label htmlFor="description" className="form-label">
              Descripción
            </label>
            <textarea
              id="description"
              rows={3}
              className={textareaClass}
              {...register('description')}
            />
          </div>
          <div>
            <label htmlFor="phone" className="form-label">
              Teléfono
            </label>
            <input id="phone" className={inputClass} {...register('phone')} />
          </div>
          <div>
            <label htmlFor="address" className="form-label">
              Dirección
            </label>
            <textarea
              id="address"
              rows={2}
              className={textareaClass}
              {...register('address')}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={isSubmitting} className="btn btn-primary">
            {isSubmitting ? 'Registrando...' : 'Registrar vendedor'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/vendedores')}
            className="btn btn-outline-secondary"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}




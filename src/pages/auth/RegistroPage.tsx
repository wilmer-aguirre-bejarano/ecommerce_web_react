/**
 * Vista: RegistroPage.tsx
 * Descripción: Formulario/Componente con lógica de autenticación y validación
 * Notas: Usa react-hook-form + zod
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { roleHomePath } from '../../lib/roles';
import type { SignUpInput } from '../../context/AuthContext';

const registerSchema = z.object({
  name: z.string().min(3, 'Ingresa tu nombre completo'),
  email: z.string().email('Ingresa un correo vÃ¡lido'),
  password: z.string().min(6, 'La contraseÃ±a debe tener al menos 6 caracteres'),
  role: z.enum(['cliente', 'vendedor'], 'Selecciona un tipo de cuenta'),
  businessName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegistroPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'cliente',
      businessName: '',
      phone: '',
      address: '',
    },
  });

  const currentRole = watch('role');

  const onSubmit = async (values: RegisterForm) => {
    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field && (field === 'name' || field === 'email' || field === 'password' || field === 'role')) {
          setError(field as keyof RegisterForm, { message: issue.message });
        } else if (field === 'businessName') {
          setError('businessName', { message: issue.message });
        }
      }
      return;
    }

    if (parsed.data.role === 'vendedor' && !parsed.data.businessName?.trim()) {
      setError('businessName', { message: 'Ingresa el nombre de tu negocio' });
      return;
    }

    setServerError(null);
    const input: SignUpInput = {
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
      role: parsed.data.role,
      businessName: parsed.data.businessName?.trim() || undefined,
      phone: parsed.data.phone?.trim() || undefined,
      address: parsed.data.address?.trim() || undefined,
    };

    const { error, role } = await signUp(input);

    if (error) {
      setServerError(error);
      toast.error(error);
      return;
    }

    toast.success('Cuenta creada correctamente');
    navigate(roleHomePath(role), { replace: true });
  };

  return (
    <div className="wrapper page-section">
      <div className="mx-auto" style={{ maxWidth: '640px' }}>
        <div className="card">
          <div className="card-header d-flex align-items-center gap-2">
            <i className="bi bi-person-plus text-primary" />
            <span>Crear cuenta</span>
          </div>
          <div className="card-body">
            <p className="text-muted mb-4">RegÃ­strate para realizar compras en la tienda.</p>

            <form className="row g-3" onSubmit={handleSubmit(onSubmit)} noValidate>
              <fieldset className="col-12">
                <legend className="form-label mb-2">Tipo de cuenta</legend>
                <div className="d-flex flex-wrap gap-2">
                  <label className={`btn ${currentRole === 'cliente' ? 'btn-primary' : 'btn-outline-secondary'}`}>
                    <input type="radio" value="cliente" className="d-none" {...register('role')} />
                    <i className="bi bi-person" /> Cliente
                  </label>
                  <label className={`btn ${currentRole === 'vendedor' ? 'btn-primary' : 'btn-outline-secondary'}`}>
                    <input type="radio" value="vendedor" className="d-none" {...register('role')} />
                    <i className="bi bi-shop" /> Vendedor
                  </label>
                </div>
                {errors.role && <div className="invalid-feedback d-block">{errors.role.message}</div>}
              </fieldset>

              <div className="col-md-6">
                <label htmlFor="name" className="form-label">Nombre completo</label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  className={`form-control${errors.name ? ' is-invalid' : ''}`}
                  {...register('name')}
                  placeholder="Tu nombre completo"
                />
                {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
              </div>

              <div className="col-md-6">
                <label htmlFor="email" className="form-label">Correo electrÃ³nico</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`form-control${errors.email ? ' is-invalid' : ''}`}
                  {...register('email')}
                  placeholder="correo@ejemplo.com"
                />
                {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
              </div>

              <div className="col-12">
                <label htmlFor="password" className="form-label">ContraseÃ±a</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  className={`form-control${errors.password ? ' is-invalid' : ''}`}
                  {...register('password')}
                  placeholder="MÃ­nimo 6 caracteres"
                />
                {errors.password && <div className="invalid-feedback">{errors.password.message}</div>}
              </div>

              {currentRole === 'vendedor' && (
                <div className="col-12">
                  <div className="alert alert-light border mb-0">
                    <h6 className="mb-3 d-flex align-items-center gap-2">
                      <i className="bi bi-shop" /> Datos del negocio
                    </h6>
                    <div className="row g-3">
                      <div className="col-12">
                        <label htmlFor="businessName" className="form-label">Nombre del negocio *</label>
                        <input
                          id="businessName"
                          className={`form-control${errors.businessName ? ' is-invalid' : ''}`}
                          {...register('businessName')}
                          placeholder="Nombre comercial"
                        />
                        {errors.businessName && <div className="invalid-feedback">{errors.businessName.message}</div>}
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="phone" className="form-label">TelÃ©fono</label>
                        <input
                          id="phone"
                          type="tel"
                          className="form-control"
                          {...register('phone')}
                          placeholder="Ej. +51 999 999 999"
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="address" className="form-label">DirecciÃ³n</label>
                        <input
                          id="address"
                          className="form-control"
                          {...register('address')}
                          placeholder="DirecciÃ³n del negocio"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {serverError && (
                <div className="col-12">
                  <div className="alert alert-danger d-flex align-items-center" role="alert">
                    <i className="bi bi-exclamation-triangle me-2" />
                    {serverError}
                  </div>
                </div>
              )}

              <div className="col-12 mt-4">
                <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-block btn-lg">
                  {isSubmitting ? (
                    <>
                      <i className="bi bi-arrow-clockwise bi-spin" /> Creando cuenta...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-person-plus" /> Crear cuenta
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="text-center text-muted mt-4">
              Â¿Ya tienes cuenta?{' '}
              <Link to="/login" className="fw-semibold">Inicia sesiÃ³n</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Vista: LoginPage.tsx
 * Descripción: Formulario/Componente con lógica de autenticación y validación
 * Notas: Usa react-hook-form + zod
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { roleHomePath } from '../../lib/roles';

const loginSchema = z.object({
  email: z.email('Ingresa un correo vÃ¡lido'),
  password: z.string().min(6, 'La contraseÃ±a debe tener al menos 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const state = location.state as { from?: string } | null;
  const from = state?.from;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginForm) => {
    const parsed = loginSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === 'email' || field === 'password') {
          setError(field, { message: issue.message });
        }
      }
      return;
    }

    setServerError(null);
    const { error, role } = await signIn(parsed.data.email, parsed.data.password);

    if (error) {
      setServerError(error);
      toast.error(error);
      return;
    }

    toast.success('SesiÃ³n iniciada');
    navigate(from && from !== '/' ? from : roleHomePath(role), { replace: true });
  };

  return (
    <div className="wrapper page-section">
      <div className="mx-auto" style={{ maxWidth: '440px' }}>
        <div className="card">
          <div className="card-header d-flex align-items-center gap-2">
            <i className="bi bi-box-arrow-in-right text-primary" />
            <span>Iniciar sesiÃ³n</span>
          </div>
          <div className="card-body">
            <p className="text-muted mb-4">Ingresa con tu correo y contraseÃ±a.</p>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="mb-3">
                <label htmlFor="email" className="form-label">
                  Correo electrÃ³nico
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`form-control${errors.email ? ' is-invalid' : ''}`}
                  {...register('email')}
                  placeholder="correo@ejemplo.com"
                />
                {errors.email && (
                  <div className="invalid-feedback">{errors.email.message}</div>
                )}
              </div>

              <div className="mb-3">
                <label htmlFor="password" className="form-label">
                  ContraseÃ±a
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className={`form-control${errors.password ? ' is-invalid' : ''}`}
                  {...register('password')}
                  placeholder="MÃ­nimo 6 caracteres"
                />
                {errors.password && (
                  <div className="invalid-feedback">{errors.password.message}</div>
                )}
              </div>

              {serverError && (
                <div className="alert alert-danger d-flex align-items-center" role="alert">
                  <i className="bi bi-exclamation-triangle me-2" />
                  {serverError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary btn-block"
              >
                {isSubmitting ? (
                  <>
                    <i className="bi bi-arrow-clockwise bi-spin" />
                    Ingresando...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right" />
                    Ingresar
                  </>
                )}
              </button>
            </form>
          </div>
          <div className="card-footer text-center">
            Â¿No tienes cuenta?{' '}
            <Link to="/registro" className="fw-semibold">
              RegÃ­strate aquÃ­
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';

interface ConfigForm {
  site_name: string;
  currency: string;
}

const inputClass = 'form-control';

export default function AdminConfiguracionPage() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ConfigForm>({
    defaultValues: { site_name: '', currency: 'PEN' },
  });

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['site_name', 'currency'])
      .then(({ data }) => {
        const rows = (data ?? []) as { key: string; value: string | null }[];
        const next: ConfigForm = { site_name: '', currency: 'PEN' };
        for (const row of rows) {
          if (row.key === 'site_name') next.site_name = row.value ?? '';
          if (row.key === 'currency') next.currency = row.value ?? '';
        }
        reset(next);
      });
  }, [reset]);

  const onSubmit = async (values: ConfigForm) => {
    const { error } = await supabase.from('site_settings').upsert(
      [
        { key: 'site_name', value: values.site_name },
        { key: 'currency', value: values.currency },
      ],
      { onConflict: 'key' },
    );

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Configuración guardada');
  };

  return (
    <div className="max-w-2xl">
      <header className="card card-body">
        <p className="text-sm uppercase tracking-wide text-muted">Admin</p>
        <h1 className="page-title">Configuración</h1>
        <p className="text-sm text-muted">
          Ajustes generales del sitio (tabla site_settings).
        </p>
      </header>

      <form
        className="card card-body space-y-4 mt-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div>
          <label htmlFor="site_name" className="form-label">
            Nombre del sitio
          </label>
          <input id="site_name" className={inputClass} {...register('site_name')} />
        </div>

        <div>
          <label htmlFor="currency" className="form-label">
            Moneda
          </label>
          <input id="currency" className={inputClass} {...register('currency')} />
        </div>

        <button type="submit" disabled={isSubmitting} className="btn btn-primary">
          {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}

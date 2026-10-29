import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

const schema = z.object({
  business_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const inputClass = 'form-control';

export default function VendedorPerfilPage() {
  const { user, sellerProfile, refresh } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qrPayload, setQrPayload] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(sellerProfile?.logo ?? null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      business_name: sellerProfile?.business_name ?? '',
      description: sellerProfile?.description ?? '',
      phone: sellerProfile?.phone ?? '',
      address: sellerProfile?.address ?? '',
    },
  });

  useEffect(() => {
    const sp = sellerProfile;
    if (sp) {
      reset({
        business_name: sp.business_name ?? '',
        description: sp.description ?? '',
        phone: sp.phone ?? '',
        address: sp.address ?? '',
      });
      setQrPayload(sp.qr_payload ?? `PAGO|${sp.business_name}|${user?.email ?? ''}`);
      setLogoUrl(sp.logo ?? null);
    } else {
      setQrPayload(`PAGO|${user?.name ?? 'Mi negocio'}|${user?.email ?? ''}`);
    }
    setLoading(false);
  }, [sellerProfile, user, reset]);

  const onSubmit = async (values: FormValues) => {
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof FormValues;
        if (field === 'business_name') {
          setError(field, { message: issue.message });
        }
      }
      return;
    }

    if (!sellerProfile || !user) {
      toast.error('No se encontró tu perfil de vendedor');
      return;
    }

    setSaving(true);
    let logoPath: string | null = sellerProfile.logo ?? null;

    try {
      if (logoFile) {
        const ext = logoFile.name.split('.').pop() || 'png';
        const fileName = `${Date.now()}.${ext}`;
        const filePath = `logos/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, logoFile, {
          upsert: true,
        });
        if (uploadError) throw uploadError;
        logoPath = filePath;
        setLogoUrl(logoPath);
      }

      const newQr = `PAGO|${parsed.data.business_name}|${user.email}`;
      setQrPayload(newQr);

      const { error: updateError } = await supabase
        .from('seller_profiles')
        .update({
          business_name: parsed.data.business_name,
          description: parsed.data.description || null,
          phone: parsed.data.phone || null,
          address: parsed.data.address || null,
          logo: logoPath,
          qr_payload: newQr,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sellerProfile.id);

      if (updateError) throw updateError;
      await refresh();
      toast.success('Perfil actualizado');
    } catch (e: any) {
      toast.error(e?.message || 'Error al guardar');
    } finally {
      setSaving(false);
      setLogoFile(null);
    }
  };

  if (loading) {
    return <div className="alert alert-info">Cargando...</div>;
  }

  if (!sellerProfile) {
    return (
      <div className="alert alert-warning">
        Tu perfil de vendedor aún no está completo.
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <header className="card card-body">
        <p className="text-sm uppercase tracking-wide text-muted">Vendedor</p>
        <h1 className="page-title">Mi perfil</h1>
      </header>

      <form
        className="card card-body space-y-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div>
          <label htmlFor="business_name" className="form-label">
            Nombre del negocio
          </label>
          <input
            id="business_name"
            className={`${inputClass}${errors.business_name ? ' is-invalid' : ''}`}
            {...register('business_name')}
          />
          {errors.business_name && (
            <div className="invalid-feedback">{errors.business_name.message}</div>
          )}
        </div>

        <div>
          <label htmlFor="description" className="form-label">
            Descripción
          </label>
          <textarea id="description" rows={3} className={inputClass} {...register('description')} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
            <input id="address" className={inputClass} {...register('address')} />
          </div>
        </div>

        <div>
          <label htmlFor="logo" className="form-label">
            Logo
          </label>
          <input
            id="logo"
            type="file"
            accept="image/*"
            className="mt-1 block w-full text-sm text-muted"
            onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
          />
          {logoUrl && (
            <p className="form-text">Logo actual: {logoUrl}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>

      <section className="card card-body flex flex-wrap items-center gap-6">
        <div className="border rounded p-3 bg-white">
          <QRCodeSVG value={qrPayload} size={128} />
        </div>
        <div>
          <h2 className="font-medium">QR de pago actual</h2>
          <p className="mt-1 text-sm text-muted">
            Payload: <code className="rounded bg-slate-100 px-1">{qrPayload}</code>
          </p>
        </div>
      </section>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';

interface SiteSetting {
  key: string;
  value: string | null;
}

interface FormData {
  institution_name: string;
  about: string;
  address: string;
  phone: string;
  email: string;
  facebook: string;
  twitter: string;
  instagram: string;
}

const inputClass = 'form-control';
const textareaClass = 'form-control';

export default function AdminPortadaSiteSettingsPage() {
  const [formData, setFormData] = useState<FormData>({
    institution_name: '',
    about: '',
    address: '',
    phone: '',
    email: '',
    facebook: '',
    twitter: '',
    instagram: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase.from('site_settings').select('*');
      const settings = (data ?? []) as SiteSetting[];
      const next = { ...formData };
      settings.forEach((s) => {
        if (s.key in next) {
          (next as any)[s.key] = s.value ?? '';
        }
      });
      setFormData(next);
    }
    fetchSettings();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const settings = [
        { key: 'institution_name', value: formData.institution_name },
        { key: 'about', value: formData.about },
        { key: 'address', value: formData.address },
        { key: 'phone', value: formData.phone },
        { key: 'email', value: formData.email },
        { key: 'facebook', value: formData.facebook },
        { key: 'twitter', value: formData.twitter },
        { key: 'instagram', value: formData.instagram },
      ];
      const { error } = await supabase
        .from('site_settings')
        .upsert(settings, { onConflict: 'key' });
      if (error) throw error;
      toast.success('Configuración guardada');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field: keyof FormData, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="space-y-6">
      <header className="card card-body">
        <p className="text-sm uppercase tracking-wide text-muted">Admin / Portada</p>
        <h1 className="page-title">Site Settings</h1>
      </header>

      <form onSubmit={handleSubmit} className="card card-body space-y-4">
        <div>
          <label className="form-label">Nombre de la institución</label>
          <input
            value={formData.institution_name}
            onChange={(e) => handleChange('institution_name', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="form-label">Acerca de</label>
          <textarea
            value={formData.about}
            onChange={(e) => handleChange('about', e.target.value)}
            className={textareaClass}
            rows={4}
          />
        </div>
        <div>
          <label className="form-label">Dirección</label>
          <input
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="form-label">Teléfono</label>
            <input
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="form-label">Facebook</label>
            <input
              value={formData.facebook}
              onChange={(e) => handleChange('facebook', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="form-label">Twitter</label>
            <input
              value={formData.twitter}
              onChange={(e) => handleChange('twitter', e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="form-label">Instagram</label>
            <input
              value={formData.instagram}
              onChange={(e) => handleChange('instagram', e.target.value)}
              className={inputClass}
            />
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { publicImageUrl } from '../../../lib/images';

interface Promotion {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
  discount_badge: string | null;
  active: boolean;
  created_at: string;
}

const inputClass = 'form-control';
const textareaClass = 'form-control';

export default function AdminPortadaPromocionesPage() {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountBadge, setDiscountBadge] = useState('');
  const [active, setActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function fetchPromos() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });
      setPromos((data ?? []) as Promotion[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPromos();
  }, []);

  function resetForm() {
    setEditing(null);
    setTitle('');
    setDescription('');
    setDiscountBadge('');
    setActive(true);
    setImageFile(null);
    setShowForm(false);
  }

  function handleEdit(p: Promotion) {
    setEditing(p);
    setTitle(p.title);
    setDescription(p.description ?? '');
    setDiscountBadge(p.discount_badge ?? '');
    setActive(p.active);
    setImageFile(null);
    setShowForm(true);
  }

  async function handleUpload(file: File): Promise<string | null> {
    const fileExt = file.name.split('.').pop();
    const fileName = Date.now() + '-' + Math.random().toString(36).substring(2) + '.' + fileExt;
    const filePath = 'promociones/' + fileName;

    const { error } = await supabase.storage.from('uploads').upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (error) {
      toast.error(error.message);
      return null;
    }
    return filePath;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      let imagePath = editing?.image ?? null;

      if (imageFile) {
        const uploaded = await handleUpload(imageFile);
        if (!uploaded) return;
        imagePath = uploaded;
      }

      if (editing) {
        const { error } = await supabase
          .from('promotions')
          .update({
            title,
            description: description || null,
            image: imagePath,
            discount_badge: discountBadge || null,
            active,
          })
          .eq('id', editing.id);
        if (error) throw error;
        toast.success('Promoción actualizada');
      } else {
        const { error } = await supabase.from('promotions').insert({
          title,
          description: description || null,
          image: imagePath,
          discount_badge: discountBadge || null,
          active,
        });
        if (error) throw error;
        toast.success('Promoción creada');
      }
      resetForm();
      fetchPromos();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('¿Eliminar esta promoción?')) return;
    try {
      await supabase.from('promotions').delete().eq('id', id);
      toast.success('Promoción eliminada');
      fetchPromos();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  return (
    <div className="space-y-6">
      <header className="card card-body">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted">Admin / Portada</p>
            <h1 className="page-title">Promociones</h1>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            <Plus className="h-4 w-4" />
            {showForm ? 'Cancelar' : 'Agregar promoción'}
          </button>
        </div>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} className="card card-body space-y-4">
          <h2 className="text-lg font-medium">
            {editing ? 'Editar promoción' : 'Nueva promoción'}
          </h2>
          <div>
            <label className="form-label">Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className="form-label">Descripción</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className={textareaClass} rows={3} />
          </div>
          <div>
            <label className="form-label">Badge de descuento</label>
            <input value={discountBadge} onChange={(e) => setDiscountBadge(e.target.value)} className={inputClass} placeholder="ej. 20% OFF" />
          </div>
          <div>
            <label className="form-label">Imagen (subir)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="block w-full text-sm"
            />
            {editing?.image && !imageFile && (
              <div className="mt-2">
                <img src={publicImageUrl(editing.image) || undefined} alt="preview" className="h-20 rounded border" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            <label className="form-label mb-0">Activa</label>
          </div>
          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      )}

      <section className="card">
        {loading ? (
          <div className="alert alert-info m-3">Cargando...</div>
        ) : promos.length === 0 ? (
          <div className="alert alert-secondary m-3">No hay promociones</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Badge</th>
                  <th>Activa</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {promos.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium">{p.title}</td>
                    <td>{p.discount_badge || '-'}</td>
                    <td>{p.active ? 'Sí' : 'No'}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(p)} className="btn btn-outline-secondary btn-sm">
                          <Edit className="h-3 w-3" /> Editar
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="btn btn-outline-danger btn-sm">
                          <Trash2 className="h-3 w-3" /> Eliminar
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
    </div>
  );
}

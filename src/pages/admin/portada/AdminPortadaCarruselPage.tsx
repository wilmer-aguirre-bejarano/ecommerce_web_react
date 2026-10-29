import { useEffect, useState } from 'react';


import { Edit, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { publicImageUrl } from '../../../lib/images';

interface CarouselSlide {
  id: number;
  title: string | null;
  subtitle: string | null;
  image: string;
  sort_order: number;
  active: boolean;
  created_at: string;
}

const inputClass = 'form-control';

export default function AdminPortadaCarruselPage() {
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CarouselSlide | null>(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [active, setActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function fetchSlides() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('carousel_slides')
        .select('*')
        .order('sort_order', { ascending: true });
      setSlides((data ?? []) as CarouselSlide[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSlides();
  }, []);

  function resetForm() {
    setEditing(null);
    setTitle('');
    setSubtitle('');
    setSortOrder(0);
    setActive(true);
    setImageFile(null);
    setShowForm(false);
  }

  function handleEdit(slide: CarouselSlide) {
    setEditing(slide);
    setTitle(slide.title ?? '');
    setSubtitle(slide.subtitle ?? '');
    setSortOrder(slide.sort_order);
    setActive(slide.active);
    setImageFile(null);
    setShowForm(true);
  }

  async function handleUpload(file: File): Promise<string | null> {
    const fileExt = file.name.split('.').pop();
    const fileName = Date.now() + '-' + Math.random().toString(36).substring(2) + '.' + fileExt;
    const filePath = 'portada/' + fileName;

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
      let imagePath = editing?.image ?? '';

      if (imageFile) {
        const uploaded = await handleUpload(imageFile);
        if (!uploaded) return;
        imagePath = uploaded;
      }

      if (editing) {
        const { error } = await supabase
          .from('carousel_slides')
          .update({
            title: title || null,
            subtitle: subtitle || null,
            image: imagePath,
            sort_order: sortOrder,
            active,
          })
          .eq('id', editing.id);
        if (error) throw error;
        toast.success('Slide actualizado');
      } else {
        const { error } = await supabase.from('carousel_slides').insert({
          title: title || null,
          subtitle: subtitle || null,
          image: imagePath,
          sort_order: sortOrder,
          active,
        });
        if (error) throw error;
        toast.success('Slide creado');
      }
      resetForm();
      fetchSlides();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('¿Eliminar este slide?')) return;
    try {
      await supabase.from('carousel_slides').delete().eq('id', id);
      toast.success('Slide eliminado');
      fetchSlides();
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
            <h1 className="page-title">Carrusel</h1>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            <Plus className="h-4 w-4" />
            {showForm ? 'Cancelar' : 'Agregar slide'}
          </button>
        </div>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} className="card card-body space-y-4">
          <h2 className="text-lg font-medium">
            {editing ? 'Editar slide' : 'Nuevo slide'}
          </h2>
          <div>
            <label className="form-label">Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="form-label">Subtítulo</label>
            <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className={inputClass} />
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Orden</label>
              <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className={inputClass} />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              <label className="form-label mb-0">Activo</label>
            </div>
          </div>
          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      )}

      <section className="card">
        {loading ? (
          <div className="alert alert-info m-3">Cargando...</div>
        ) : slides.length === 0 ? (
          <div className="alert alert-secondary m-3">No hay slides</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>Título</th>
                  <th>Subtítulo</th>
                  <th>Orden</th>
                  <th>Activo</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {slides.map((slide) => (
                  <tr key={slide.id}>
                    <td>
                      {slide.image ? (
                        <img src={publicImageUrl(slide.image) || undefined} alt="" className="h-12 w-20 object-cover rounded border" />
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>{slide.title || '-'}</td>
                    <td>{slide.subtitle || '-'}</td>
                    <td>{slide.sort_order}</td>
                    <td>{slide.active ? 'Sí' : 'No'}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(slide)} className="btn btn-outline-secondary btn-sm">
                          <Edit className="h-3 w-3" /> Editar
                        </button>
                        <button onClick={() => handleDelete(slide.id)} className="btn btn-outline-danger btn-sm">
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




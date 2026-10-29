import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import { publicImageUrl } from '../../../lib/images';

interface News {
  id: number;
  title: string;
  body: string;
  image: string | null;
  is_published: boolean;
  created_at: string;
}

const inputClass = 'form-control';
const textareaClass = 'form-control';

export default function AdminPortadaNoticiasPage() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<News | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function fetchNews() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false });
      setNews((data ?? []) as News[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchNews();
  }, []);

  function resetForm() {
    setEditing(null);
    setTitle('');
    setBody('');
    setIsPublished(true);
    setImageFile(null);
    setShowForm(false);
  }

  function handleEdit(n: News) {
    setEditing(n);
    setTitle(n.title);
    setBody(n.body);
    setIsPublished(n.is_published);
    setImageFile(null);
    setShowForm(true);
  }

  async function handleUpload(file: File): Promise<string | null> {
    const fileExt = file.name.split('.').pop();
    const fileName = Date.now() + '-' + Math.random().toString(36).substring(2) + '.' + fileExt;
    const filePath = 'noticias/' + fileName;

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
          .from('news')
          .update({
            title,
            body,
            image: imagePath,
            is_published: isPublished,
          })
          .eq('id', editing.id);
        if (error) throw error;
        toast.success('Noticia actualizada');
      } else {
        const { error } = await supabase.from('news').insert({
          title,
          body,
          image: imagePath,
          is_published: isPublished,
        });
        if (error) throw error;
        toast.success('Noticia creada');
      }
      resetForm();
      fetchNews();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('¿Eliminar esta noticia?')) return;
    try {
      await supabase.from('news').delete().eq('id', id);
      toast.success('Noticia eliminada');
      fetchNews();
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
            <h1 className="page-title">Noticias</h1>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
            <Plus className="h-4 w-4" />
            {showForm ? 'Cancelar' : 'Agregar noticia'}
          </button>
        </div>
      </header>

      {showForm && (
        <form onSubmit={handleSubmit} className="card card-body space-y-4">
          <h2 className="text-lg font-medium">
            {editing ? 'Editar noticia' : 'Nueva noticia'}
          </h2>
          <div>
            <label className="form-label">Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className="form-label">Contenido</label>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} className={textareaClass} rows={5} required />
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
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
            <label className="form-label mb-0">Publicado</label>
          </div>
          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      )}

      <section className="card">
        {loading ? (
          <div className="alert alert-info m-3">Cargando...</div>
        ) : news.length === 0 ? (
          <div className="alert alert-secondary m-3">No hay noticias</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Publicado</th>
                  <th>Fecha</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {news.map((n) => (
                  <tr key={n.id}>
                    <td className="font-medium">{n.title}</td>
                    <td>{n.is_published ? 'Sí' : 'No'}</td>
                    <td>
                      {n.created_at
                        ? format(parseISO(n.created_at), 'dd/MM/yyyy HH:mm', { locale: es })
                        : '-'}
                    </td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(n)} className="btn btn-outline-secondary btn-sm">
                          <Edit className="h-3 w-3" /> Editar
                        </button>
                        <button onClick={() => handleDelete(n.id)} className="btn btn-outline-danger btn-sm">
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

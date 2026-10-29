import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useState } from 'react';

const productSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  description: z.string().optional(),
  price: z.number().min(0, 'El precio no puede ser negativo'),
  stock: z.number().int('Debe ser un número entero').min(0, 'El stock no puede ser negativo'),
  is_featured: z.boolean(),
  active: z.boolean(),
});

type ProductoForm = z.infer<typeof productSchema>;

const inputClass = 'form-control';

export default function ProductoNuevoPage() {
  const { sellerProfile } = useAuth();
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ProductoForm>({
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      stock: 0,
      is_featured: false,
      active: true,
    },
  });

  const onSubmit = async (values: ProductoForm) => {
    const parsed = productSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === 'name' || field === 'price' || field === 'stock') {
          setError(field as any, { message: issue.message });
        }
      }
      return;
    }

    if (!sellerProfile) {
      toast.error('No se encontró tu perfil de vendedor');
      return;
    }

    setSaving(true);
    let imagePath: string | null = null;

    try {
      if (imageFile) {
        const ext = imageFile.name.split('.').pop() || 'png';
        const fileName = `${Date.now()}.${ext}`;
        const filePath = `productos/${fileName}`;
        const { error: uploadError } = await supabase.storage.from('uploads').upload(filePath, imageFile, {
          upsert: true,
        });
        if (uploadError) throw uploadError;
        imagePath = filePath;
      }

      const { error } = await supabase.from('products').insert({
        seller_id: sellerProfile.id,
        name: parsed.data.name,
        description: parsed.data.description || null,
        price: parsed.data.price,
        stock: parsed.data.stock,
        image: imagePath,
        is_featured: parsed.data.is_featured,
        active: parsed.data.active,
      });

      if (error) throw error;
      toast.success('Producto creado');
      reset();
      navigate('/vendedor/productos');
    } catch (e: any) {
      toast.error(e?.message || 'Error al crear producto');
    } finally {
      setSaving(false);
    }
  };

  if (!sellerProfile) {
    return (
      <div className="alert alert-warning">
        Tu perfil de vendedor aún no está completo.
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <header className="card card-body">
        <p className="text-sm uppercase tracking-wide text-muted">Vendedor</p>
        <h1 className="page-title">Nuevo producto</h1>
      </header>

      <form
        className="card card-body space-y-4 mt-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div>
          <label htmlFor="name" className="form-label">
            Nombre
          </label>
          <input
            id="name"
            className={`${inputClass}${errors.name ? ' is-invalid' : ''}`}
            {...register('name')}
          />
          {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
        </div>

        <div>
          <label htmlFor="description" className="form-label">
            Descripción
          </label>
          <textarea id="description" rows={3} className={inputClass} {...register('description')} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="price" className="form-label">
              Precio (S/)
            </label>
            <input
              id="price"
              type="number"
              step="0.01"
              min="0"
              className={`${inputClass}${errors.price ? ' is-invalid' : ''}`}
              {...register('price', { valueAsNumber: true })}
            />
            {errors.price && <div className="invalid-feedback">{errors.price.message}</div>}
          </div>
          <div>
            <label htmlFor="stock" className="form-label">
              Stock
            </label>
            <input
              id="stock"
              type="number"
              step="1"
              min="0"
              className={`${inputClass}${errors.stock ? ' is-invalid' : ''}`}
              {...register('stock', { valueAsNumber: true })}
            />
            {errors.stock && <div className="invalid-feedback">{errors.stock.message}</div>}
          </div>
        </div>

        <div>
          <label htmlFor="image" className="form-label">
            Imagen
          </label>
          <input
            id="image"
            type="file"
            accept="image/*"
            className="mt-1 block w-full text-sm text-muted"
            onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" {...register('is_featured')} />
            Destacado
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" {...register('active')} />
            Activo
          </label>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? 'Guardando...' : 'Guardar producto'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/vendedor/productos')}
            className="btn btn-outline-secondary"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

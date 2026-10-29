import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../lib/cart';
import { useAuth } from '../../hooks/useAuth';
import type { Product } from '../../types/database';

export default function VendedorProductosPage() {
  const { sellerProfile } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    if (!sellerProfile) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('seller_id', sellerProfile.id)
      .order('created_at', { ascending: false });
    if (!error) setProducts((data ?? []) as Product[]);
    setLoading(false);
  };

  useEffect(() => {
    void fetchProducts();
  }, [sellerProfile]);

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este producto?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Producto eliminado');
    void fetchProducts();
  };

  if (!sellerProfile) {
    return (
      <div className="alert alert-warning">
        Tu perfil de vendedor aún no está completo.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="card card-body flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted">Vendedor</p>
          <h1 className="page-title">Productos</h1>
        </div>
        <Link to="/vendedor/productos/nuevo" className="btn btn-primary">
          <Plus className="h-4 w-4" /> Nuevo producto
        </Link>
      </header>

      {loading && (
        <div className="alert alert-info">Cargando...</div>
      )}

      {!loading && products.length === 0 && (
        <div className="alert alert-secondary">
          No tienes productos aún.
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="overflow-x-auto card">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Destacado</th>
                <th>Activo</th>
                <th>Creado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="font-medium">{p.name}</td>
                  <td>{formatPrice(Number(p.price))}</td>
                  <td>{p.stock}</td>
                  <td>{p.is_featured ? 'Sí' : 'No'}</td>
                  <td>{p.active ? 'Sí' : 'No'}</td>
                  <td className="text-muted">{format(new Date(p.created_at), 'dd/MM/yyyy')}</td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => navigate(`/vendedor/productos/editar/${p.id}`)}
                        className="btn btn-outline-secondary btn-sm"
                      >
                        <Edit className="h-3.5 w-3.5" /> Editar
                      </button>
                      <button
                        onClick={() => void handleDelete(p.id)}
                        className="btn btn-outline-danger btn-sm"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Borrar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

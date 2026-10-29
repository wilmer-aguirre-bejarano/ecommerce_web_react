import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';

interface Vendedor {
  id: number;
  name: string;
  email: string;
  role: string;
  sellerProfile?: {
    id: number;
    user_id: number;
    business_name: string;
    description: string | null;
    phone: string | null;
    address: string | null;
    qr_payload: string | null;
  } | null;
  productosCount?: number;
  created_at: string;
}

export default function AdminVendedoresPage() {
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchVendedores() {
    setLoading(true);
    try {
      const { data: users } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'vendedor')
        .order('created_at', { ascending: false });

      const vendedoresList: Vendedor[] = (users ?? []) as any[];

      const sellerUserIds = vendedoresList.map((v) => v.id);
      const { data: profiles } = await supabase
        .from('seller_profiles')
        .select('*')
        .in('user_id', sellerUserIds);

      const profileMap = new Map<number, any>();
      (profiles ?? []).forEach((p: any) => profileMap.set(p.user_id, p));

      const vendedorWithProfiles = vendedoresList.map((v) => ({
        ...v,
        sellerProfile: profileMap.get(v.id) ?? null,
      }));

      const counts = await Promise.all(
        vendedorWithProfiles.map(async (v) => {
          const profile = v.sellerProfile;
          if (!profile) return 0;
          const { count } = await supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .eq('seller_id', profile.id);
          return count ?? 0;
        }),
      );

      setVendedores(
        vendedorWithProfiles.map((v, i) => ({ ...v, productosCount: counts[i] })),
      );
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar vendedores');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchVendedores();
  }, []);

  async function handleEliminarVendedor(vendedor: Vendedor) {
    if (!window.confirm('¿Eliminar vendedor "' + vendedor.name + '"? Esta acción eliminará su perfil de vendedor y el usuario.')) {
      return;
    }
    try {
      const profile = vendedor.sellerProfile;
      if (profile) {
        await supabase.from('seller_profiles').delete().eq('id', profile.id);
      }
      await supabase.from('users').delete().eq('id', vendedor.id);
      toast.success('Vendedor eliminado correctamente');
      fetchVendedores();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar vendedor');
    }
  }

  return (
    <div className="space-y-6">
      <header className="card card-body">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm uppercase tracking-wide text-muted">Admin</p>
            <h1 className="page-title">Vendedores</h1>
            <p className="text-sm text-muted">Lista de vendedores con sus perfiles</p>
          </div>
          <Link to="/admin/vendedores/registrar" className="btn btn-primary">
            Registrar vendedor
          </Link>
        </div>
      </header>

      <section className="card">
        {loading ? (
          <div className="alert alert-info m-3">Cargando vendedores...</div>
        ) : vendedores.length === 0 ? (
          <div className="alert alert-secondary m-3">No hay vendedores registrados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Empresa</th>
                  <th>Teléfono</th>
                  <th>Productos</th>
                  <th>Fecha registro</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {vendedores.map((v) => (
                  <tr key={v.id}>
                    <td className="font-medium">{v.name}</td>
                    <td>{v.email}</td>
                    <td>{v.sellerProfile?.business_name || '-'}</td>
                    <td>{v.sellerProfile?.phone || '-'}</td>
                    <td>{v.productosCount ?? 0}</td>
                    <td>
                      {v.created_at
                        ? format(parseISO(v.created_at), 'dd/MM/yyyy HH:mm', { locale: es })
                        : '-'}
                    </td>
                    <td>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleEliminarVendedor(v)}
                          className="btn btn-outline-danger btn-sm"
                        >
                          <Trash2 className="h-3 w-3" />
                          Eliminar
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

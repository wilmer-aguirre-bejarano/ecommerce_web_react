/**
 * Vista: AdminDashboardPage.tsx
 * Descripción: Formulario/Componente con lógica de autenticación y validación
 * Notas: Usa react-hook-form + zod
 */
import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { DollarSign, Package, ShoppingBag, Users, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import type { Order } from '../../types/database';

interface Stats {
  totalVendedores: number;
  totalClientes: number;
  totalProductos: number;
  totalPedidos: number;
  sumaVentas: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalVendedores: 0,
    totalClientes: 0,
    totalProductos: 0,
    totalPedidos: 0,
    sumaVentas: 0,
  });
  const [ultimosPedidos, setUltimosPedidos] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [
          { count: countVendedores },
          { count: countClientes },
          { count: countProductos },
          { count: countPedidos },
          { data: ventas },
          { data: pedidos },
        ] = await Promise.all([
          supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'vendedor'),
          supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'cliente'),
          supabase.from('products').select('id', { count: 'exact', head: true }),
          supabase.from('orders').select('id', { count: 'exact', head: true }),
          supabase.from('orders').select('total'),
          supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(8),
        ]);

        const sumaVentas = ((ventas ?? []) as any[]).reduce((acc, o) => acc + Number(o.total || 0), 0);

        setStats({
          totalVendedores: countVendedores ?? 0,
          totalClientes: countClientes ?? 0,
          totalProductos: countProductos ?? 0,
          totalPedidos: countPedidos ?? 0,
          sumaVentas,
        });
        setUltimosPedidos((pedidos ?? []) as Order[]);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 ">
      <header className="card card-body">
        <p className="text-sm uppercase tracking-wide text-muted">Admin</p>
        <h1 className="page-title">Dashboard</h1>
        <p className="text-sm text-muted">Estadísticas globales del ecommerce</p>
      </header>

      {loading ? (
        <div className="alert alert-info">
          Cargando estadísticas...
        </div>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <article className="stat-card">
              <span className="stat-icon text-bg-primary">
                <UserPlus className="h-5 w-5" />
              </span>
              <div>
                <h5 className="text-sm font-medium text-muted">Total Vendedores</h5>
                <p className="text-2xl font-semibold">{stats.totalVendedores}</p>
              </div>
            </article>
            <article className="stat-card">
              <span className="stat-icon text-bg-info">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <h5 className="text-sm font-medium text-muted">Total Clientes</h5>
                <p className="text-2xl font-semibold">{stats.totalClientes}</p>
              </div>
            </article>
            <article className="stat-card">
              <span className="stat-icon text-bg-warning">
                <Package className="h-5 w-5" />
              </span>
              <div>
                <h5 className="text-sm font-medium text-muted">Total Productos</h5>
                <p className="text-2xl font-semibold">{stats.totalProductos}</p>
              </div>
            </article>
            <article className="stat-card">
              <span className="stat-icon text-bg-secondary">
                <ShoppingBag className="h-5 w-5" />
              </span>
              <div>
                <h5 className="text-sm font-medium text-muted">Total Pedidos</h5>
                <p className="text-2xl font-semibold">{stats.totalPedidos}</p>
              </div>
            </article>
            <article className="stat-card">
              <span className="stat-icon text-bg-success">
                <DollarSign className="h-5 w-5" />
              </span>
              <div>
                <h5 className="text-sm font-medium text-muted">Suma Ventas</h5>
                <p className="text-2xl font-semibold">
                  S/ {stats.sumaVentas.toFixed(2)}
                </p>
              </div>
            </article>
          </section>

          <section className="card">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-lg font-medium">Últimos 8 pedidos</h2>
              <Link to="/admin/pedidos" className="text-sm text-muted hover:text-slate-900">
                Ver todos
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>N° Pedido</th>
                    <th>Cliente</th>
                    <th>Vendedor ID</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {ultimosPedidos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-muted py-4">
                        No hay pedidos registrados
                      </td>
                    </tr>
                  ) : (
                    ultimosPedidos.map((pedido) => (
                      <tr key={pedido.id}>
                        <td className="font-medium">
                          {pedido.order_number}
                        </td>
                        <td>{pedido.full_name}</td>
                        <td>{pedido.seller_id}</td>
                        <td>S/ {Number(pedido.total).toFixed(2)}</td>
                        <td>
                          <span className="badge text-bg-secondary">
                            {pedido.status}
                          </span>
                        </td>
                        <td>
                          {pedido.created_at
                            ? format(parseISO(pedido.created_at), 'dd/MM/yyyy HH:mm', { locale: es })
                            : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

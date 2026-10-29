import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '../../../lib/supabase';

interface Cliente {
  id: number;
  name: string;
  email: string;
  role: string;
  pedidosCount?: number;
  created_at: string;
}

export default function AdminClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClientes() {
      setLoading(true);
      try {
        const { data: users } = await supabase
          .from('users')
          .select('*')
          .eq('role', 'cliente')
          .order('created_at', { ascending: false });

        const clientesList = (users ?? []) as Cliente[];

        const counts = await Promise.all(
          clientesList.map(async (c) => {
            const { count } = await supabase
              .from('orders')
              .select('id', { count: 'exact', head: true })
              .eq('client_id', c.id);
            return count ?? 0;
          }),
        );

        setClientes(clientesList.map((c, i) => ({ ...c, pedidosCount: counts[i] })));
      } finally {
        setLoading(false);
      }
    }
    fetchClientes();
  }, []);

  return (
    <div className="space-y-6">
      <header className="card card-body">
        <p className="text-sm uppercase tracking-wide text-muted">Admin</p>
        <h1 className="page-title">Clientes</h1>
        <p className="text-sm text-muted">Lista de clientes con conteo de pedidos</p>
      </header>

      <section className="card">
        {loading ? (
          <div className="alert alert-info m-3">Cargando clientes...</div>
        ) : clientes.length === 0 ? (
          <div className="alert alert-secondary m-3">No hay clientes registrados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Pedidos</th>
                  <th>Fecha registro</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((c) => (
                  <tr key={c.id}>
                    <td className="font-medium">{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.pedidosCount ?? 0}</td>
                    <td>
                      {c.created_at
                        ? format(parseISO(c.created_at), 'dd/MM/yyyy HH:mm', { locale: es })
                        : '-'}
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

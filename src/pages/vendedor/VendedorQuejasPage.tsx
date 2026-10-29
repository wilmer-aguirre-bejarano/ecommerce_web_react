import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import type { Complaint, ComplaintStatus, User } from '../../types/database';

interface ComplaintConDetalle extends Complaint {
  users: Pick<User, 'id' | 'name' | 'email'> | null;
}

const statuses: ComplaintStatus[] = ['enviada', 'en revisión', 'resuelta'];

export default function VendedorQuejasPage() {
  const { sellerProfile } = useAuth();
  const [complaints, setComplaints] = useState<ComplaintConDetalle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    if (!sellerProfile) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('complaints')
      .select('*, users(id, name, email)')
      .eq('seller_id', sellerProfile.id)
      .order('created_at', { ascending: false });
    if (!error) setComplaints((data ?? []) as ComplaintConDetalle[]);
    setLoading(false);
  };

  useEffect(() => {
    void fetch();
  }, [sellerProfile]);

  const handleStatusChange = async (id: number, status: ComplaintStatus) => {
    const { error } = await supabase
      .from('complaints')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Estado actualizado');
    void fetch();
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
      <header className="card card-body">
        <p className="text-sm uppercase tracking-wide text-muted">Vendedor</p>
        <h1 className="page-title">Quejas recibidas</h1>
      </header>

      {loading && (
        <div className="alert alert-info">Cargando...</div>
      )}

      {!loading && complaints.length === 0 && (
        <div className="alert alert-secondary">
          No hay quejas aún.
        </div>
      )}

      {!loading && complaints.length > 0 && (
        <div className="overflow-x-auto card">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Asunto</th>
                <th>Cliente</th>
                <th>Pedido</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>PDF</th>
                <th>Cambiar estado</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c) => (
                <tr key={c.id}>
                  <td className="font-medium">{c.subject}</td>
                  <td>
                    {c.users?.name}
                    <span className="block text-xs text-muted">{c.users?.email}</span>
                  </td>
                  <td>{c.order_id ?? '-'}</td>
                  <td>{c.status}</td>
                  <td className="text-muted">{format(new Date(c.created_at), 'dd/MM/yyyy HH:mm')}</td>
                  <td>
                    {c.pdf_path ? (
                      <a href="#" className="text-blue-600 hover:underline">
                        Ver PDF
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <select
                      className="form-select max-w-[10rem]"
                      value={c.status}
                      onChange={(e) => void handleStatusChange(c.id, e.target.value as ComplaintStatus)}
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
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

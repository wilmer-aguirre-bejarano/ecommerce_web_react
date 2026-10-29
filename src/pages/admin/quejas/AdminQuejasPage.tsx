import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ExternalLink, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../lib/supabase';
import type { Complaint } from '../../../types/database';

interface ComplaintWithDetails extends Complaint {
  client_name?: string;
  seller_name?: string;
  order_number?: string;
}

const STATUS_OPTIONS = ['enviada', 'en revisi�n', 'resuelta'];

export default function AdminQuejasPage() {
  const [quejas, setQuejas] = useState<ComplaintWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchQuejas() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });
      const complaints = (data ?? []) as Complaint[];

      const clientIds = [...new Set(complaints.map((q) => q.client_id))];
      const sellerIds = [...new Set(complaints.map((q) => q.seller_id))];
      const orderIds = complaints
        .map((q) => q.order_id)
        .filter((id): id is number => id !== null);

      const { data: clients } = await supabase
        .from('users')
        .select('id, name')
        .in('id', clientIds);
      const clientMap = new Map<number, string>();
      (clients ?? []).forEach((c: any) => clientMap.set(c.id, c.name));

      const { data: sellers } = await supabase
        .from('seller_profiles')
        .select('id, business_name')
        .in('id', sellerIds);
      const sellerMap = new Map<number, string>();
      (sellers ?? []).forEach((s: any) => sellerMap.set(s.id, s.business_name));

      const { data: orders } = await supabase
        .from('orders')
        .select('id, order_number')
        .in('id', orderIds.length > 0 ? orderIds : [0]);
      const orderMap = new Map<number, string>();
      (orders ?? []).forEach((o: any) => orderMap.set(o.id, o.order_number));

      setQuejas(
        complaints.map((q) => ({
          ...q,
          client_name: clientMap.get(q.client_id) ?? '',
          seller_name: sellerMap.get(q.seller_id) ?? '',
          order_number: q.order_id ? orderMap.get(q.order_id) : undefined,
        })),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQuejas();
  }, []);

  async function updateStatus(complaintId: number, status: string) {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ status })
        .eq('id', complaintId);
      if (error) throw error;
      toast.success('Estado actualizado');
      fetchQuejas();
    } catch (error: any) {
      toast.error(error.message);
    }
  }

  return (
    <div className="space-y-6">
      <header className="card card-body">
        <p className="text-sm uppercase tracking-wide text-muted">Admin</p>
        <h1 className="page-title">Quejas</h1>
        <p className="text-sm text-muted">Todas las quejas del sistema</p>
      </header>

      <section className="card">
        {loading ? (
          <div className="alert alert-info m-3">Cargando quejas...</div>
        ) : quejas.length === 0 ? (
          <div className="alert alert-secondary m-3">No hay quejas</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Asunto</th>
                  <th>Cliente</th>
                  <th>Vendedor</th>
                  <th>Pedido</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {quejas.map((q) => (
                  <tr key={q.id}>
                    <td className="font-medium">{q.subject}</td>
                    <td>{q.client_name}</td>
                    <td>{q.seller_name}</td>
                    <td>{q.order_number || '-'}</td>
                    <td>
                      <select
                        value={q.status}
                        onChange={(e) => updateStatus(q.id, e.target.value)}
                        className="form-select max-w-[10rem]"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      {q.created_at
                        ? format(parseISO(q.created_at), 'dd/MM/yyyy HH:mm', { locale: es })
                        : '-'}
                    </td>
                    <td>
                      <div className="flex justify-end gap-2">
                        {q.pdf_path && (
                          <a
                            href={q.pdf_path}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline-secondary btn-sm"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Ver PDF
                          </a>
                        )}
                        <button className="btn btn-outline-secondary btn-sm">
                          <FileText className="h-3 w-3" />
                          Ver detalle
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

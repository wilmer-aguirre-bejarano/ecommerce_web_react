import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Download, FileWarning, MessageSquarePlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { ComplaintStatusBadge } from '../../components/StatusBadge';
import type { Complaint, Order, SellerProfile } from '../../types/database';

interface QuejaConDetalle extends Complaint {
  seller_profiles: Pick<SellerProfile, 'id' | 'business_name'> | null;
  orders: Pick<Order, 'id' | 'order_number'> | null;
}

export default function QuejasPage() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<QuejaConDetalle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let active = true;

    supabase
      .from('complaints')
      .select('*, seller_profiles(id, business_name), orders(id, order_number)')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (!error) setComplaints((data ?? []) as QuejaConDetalle[]);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  return (
    <div className="space-y-6">
      <header className="card card-body flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted">Cliente</p>
          <h1 className="page-title">Mis quejas</h1>
        </div>
        <Link to="/cliente/quejas/nueva" className="btn btn-primary">
          <MessageSquarePlus className="h-4 w-4" />
          Nueva queja
        </Link>
      </header>

      {loading && (
        <div className="alert alert-info">Cargando quejas...</div>
      )}

      {!loading && complaints.length === 0 && (
        <div className="alert alert-secondary">
          <FileWarning className="h-6 w-6" />
          <p className="mt-2">
            No has interpuesto quejas todavía.
          </p>
          <Link to="/cliente/quejas/nueva" className="btn btn-primary mt-3">
            Crear una queja
          </Link>
        </div>
      )}

      {!loading && complaints.length > 0 && (
        <div className="space-y-4">
          {complaints.map((complaint) => (
            <article key={complaint.id} className="card">
              <header className="card-header flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-semibold">{complaint.subject}</h2>
                  <p className="text-xs text-muted">
                    {complaint.seller_profiles?.business_name ?? `Vendedor #${complaint.seller_id}`}
                    {complaint.orders?.order_number && (
                      <> · {complaint.orders.order_number}</>
                    )}{' '}
                    · {format(new Date(complaint.created_at), 'dd/MM/yyyy HH:mm')}
                  </p>
                </div>
                <ComplaintStatusBadge status={complaint.status} />
              </header>
              <p className="px-5 py-4 text-sm leading-relaxed text-slate-600">
                {complaint.description}
              </p>
              <footer className="card-footer flex items-center justify-between">
                <span className="text-xs text-muted">
                  {complaint.pdf_path ? 'PDF disponible' : 'PDF disponible próximamente'}
                </span>
                <button
                  type="button"
                  disabled
                  title="La descarga de PDF estará disponible próximamente"
                  className="btn btn-outline-secondary btn-sm"
                >
                  <Download className="h-4 w-4" />
                  Descargar PDF
                </button>
              </footer>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
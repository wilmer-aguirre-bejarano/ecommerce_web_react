import { useState } from 'react';
import AdminPortadaCarruselPage from './portada/AdminPortadaCarruselPage';
import AdminPortadaNoticiasPage from './portada/AdminPortadaNoticiasPage';
import AdminPortadaPromocionesPage from './portada/AdminPortadaPromocionesPage';
import AdminPortadaSiteSettingsPage from './portada/AdminPortadaSiteSettingsPage';

const tabs = [
  { id: 'carrusel', label: 'Carrusel' },
  { id: 'noticias', label: 'Noticias' },
  { id: 'promociones', label: 'Promociones' },
  { id: 'site', label: 'Site Settings' },
];

export default function AdminPortadaPage() {
  const [activeTab, setActiveTab] = useState('carrusel');

  return (
    <div className="space-y-6">
      <header className="card card-body">
        <p className="text-sm uppercase tracking-wide text-muted">Admin</p>
        <h1 className="page-title">Gestión de Portada</h1>
        <p className="text-sm text-muted">Administrar carrusel, noticias, promociones y configuraciones</p>
      </header>

      <div className="card">
        <div className="border-b border-slate-200">
          <nav className="flex gap-2 px-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={
                  activeTab === tab.id
                    ? 'px-4 py-3 text-sm font-medium border-b-2 transition-colors border-slate-900 text-slate-900'
                    : 'px-4 py-3 text-sm font-medium border-b-2 transition-colors border-transparent text-slate-500 hover:text-slate-700'
                }
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="p-6">
          {activeTab === 'carrusel' && <AdminPortadaCarruselPage />}
          {activeTab === 'noticias' && <AdminPortadaNoticiasPage />}
          {activeTab === 'promociones' && <AdminPortadaPromocionesPage />}
          {activeTab === 'site' && <AdminPortadaSiteSettingsPage />}
        </div>
      </div>
    </div>
  );
}

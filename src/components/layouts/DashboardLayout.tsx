import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';

interface NavLinkItem {
  to: string;
  label: string;
  icon: string;
  exact?: boolean;
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `list-group-item${isActive ? ' active' : ''}`;

export default function DashboardLayout() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  let links: NavLinkItem[] = [];
  let panelTitle = 'Panel';

  if (role === 'admin') {
    panelTitle = 'Panel de administración';
    links = [
      { to: '/admin', label: 'Resumen', icon: 'bi-speedometer2', exact: true },
      { to: '/admin/vendedores', label: 'Vendedores', icon: 'bi-shop' },
      { to: '/admin/vendedores/registrar', label: 'Registrar vendedor', icon: 'bi-person-plus' },
      { to: '/admin/clientes', label: 'Clientes', icon: 'bi-people' },
      { to: '/admin/portada', label: 'Portada', icon: 'bi-images' },
      { to: '/admin/pedidos', label: 'Pedidos globales', icon: 'bi-bag-check' },
      { to: '/admin/quejas', label: 'Quejas', icon: 'bi-exclamation-triangle' },
      { to: '/admin/configuracion', label: 'Configuración', icon: 'bi-gear' },
    ];
  } else if (role === 'vendedor') {
    panelTitle = 'Panel de vendedor';
    links = [
      { to: '/vendedor', label: 'Resumen', icon: 'bi-speedometer2', exact: true },
      { to: '/vendedor/perfil', label: 'Mi perfil', icon: 'bi-shop-window' },
      { to: '/vendedor/productos', label: 'Productos', icon: 'bi-box-seam' },
      { to: '/vendedor/productos/nuevo', label: 'Nuevo producto', icon: 'bi-plus-square' },
      { to: '/vendedor/pedidos', label: 'Pedidos', icon: 'bi-bag-check' },
      { to: '/vendedor/quejas', label: 'Quejas recibidas', icon: 'bi-exclamation-triangle' },
    ];
  } else {
    panelTitle = 'Mi cuenta';
    links = [
      { to: '/cliente', label: 'Resumen', icon: 'bi-speedometer2', exact: true },
      { to: '/cliente/pedidos', label: 'Mis pedidos', icon: 'bi-bag-check' },
      { to: '/cliente/quejas', label: 'Mis quejas', icon: 'bi-exclamation-triangle' },
      { to: '/cliente/quejas/nueva', label: 'Nueva queja', icon: 'bi-plus-square' },
    ];
  }

  const handleLogout = async () => {
    await signOut();
    toast.success('Sesión cerrada');
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen  ">
      <header className="dash-header">
        <div className="wrapper">
          <Link
            to="/"
            className="flex items-center gap-2 font-semibold text-slate-900"
            style={{ textDecoration: 'none' }}
          >
            <i className="bi bi-shop-window text-blue-600" style={{ fontSize: '1.3rem' }} />
            Mercado Solidario
          </Link>

          <div className="flex items-center gap-3 text-sm">
            <span className="hidden font-medium text-slate-800 sm:inline">{panelTitle}</span>
            <span className="role-pill">{role ?? 'sin rol'}</span>
            <span className="flex items-center gap-1 font-medium text-slate-800">
              <i className="bi bi-person-circle" />
              {user?.name ?? 'Invitado'}
            </span>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="btn btn-outline-secondary btn-sm"
            >
              <i className="bi bi-box-arrow-right" />
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="wrapper flex flex-col gap-6 py-6 lg:flex-row  ">
        <aside className="w-full shrink-0 lg:w-64">
          <nav className="list-group sidebar-sticky">
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={linkClass}
              >
                <i className={`bi ${item.icon}`} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

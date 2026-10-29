import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { useCart } from '../../hooks/useCart';
import { roleHomePath } from '../../lib/roles';

const navClass = ({ isActive }: { isActive: boolean }) =>
  `nav-link-pill${isActive ? ' active' : ''}`;

export default function PublicLayout() {
  const { user, role, signOut } = useAuth();
  const cart = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    toast.success('Sesión cerrada');
    navigate('/', { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="app-navbar">
        <div className="wrapper">
          <Link to="/" className="navbar-brand">
            <i className="bi bi-shop-window brand-icon" style={{ fontSize: '1.4rem' }} />
            Mercado Solidario
          </Link>

          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/" end className={navClass}>
              <i className="bi bi-house-door" />
              Inicio
            </NavLink>
            <NavLink to="/tienda" className={navClass}>
              <i className="bi bi-grid" />
              Tienda
            </NavLink>
            <NavLink to="/carrito" className={navClass}>
              <i className="bi bi-cart3" />
              Carrito
              {cart.count > 0 && <span className="cart-badge">{cart.count}</span>}
            </NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {user ? (
              <>
                <Link
                  to={roleHomePath(role)}
                  className="nav-link-pill"
                  title="Ir a mi panel"
                >
                  <i className="bi bi-person-circle" />
                  {user.name}
                </Link>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="btn btn-outline-light"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    color: '#fff',
                    borderColor: 'rgba(255,255,255,0.35)',
                  }}
                >
                  <i className="bi bi-box-arrow-right" />
                  Salir
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link-pill">
                  <i className="bi bi-box-arrow-in-right" />
                  Ingresar
                </Link>
                <Link to="/registro" className="btn btn-primary">
                  <i className="bi bi-person-plus" />
                  Crear cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-8 border-t border-slate-200 bg-white">
        <div className="wrapper flex flex-wrap items-center justify-between gap-2 py-5 text-sm text-slate-500">
          <span className="flex items-center gap-2">
            <i className="bi bi-shop-window text-slate-400" />
            Mercado Solidario &copy; {new Date().getFullYear()}
          </span>
          <span>
            <i className="bi bi-people text-slate-400" /> Tienda multi-vendedor
          </span>
        </div>
      </footer>
    </div>
  );
}

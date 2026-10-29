/**
 * Configuración de rutas y Guards
 * - RequireAuth: verifica sesión activa
 * - RequireRole: verifica rol autorizado
 */
import { Navigate, Outlet, createBrowserRouter, useLocation } from 'react-router-dom';
import type { Role } from '../types/database';
import { useAuth } from '../hooks/useAuth';
import { roleHomePath } from '../lib/roles';
import PublicLayout from '../components/layouts/PublicLayout';
import DashboardLayout from '../components/layouts/DashboardLayout';
import LoginPage from '../pages/auth/LoginPage';
import RegistroPage from '../pages/auth/RegistroPage';
import PortadaPage from '../pages/home/PortadaPage';
import CatalogoPage from '../pages/tienda/CatalogoPage';
import ProductoPage from '../pages/tienda/ProductoPage';
import CarritoPage from '../pages/carrito/CarritoPage';
import CheckoutPage from '../pages/checkout/CheckoutPage';
import ClienteDashboardPage from '../pages/cliente/ClienteDashboardPage';
import PedidosPage from '../pages/cliente/PedidosPage';
import PedidoDetallePage from '../pages/cliente/PedidoDetallePage';
import QuejasPage from '../pages/cliente/QuejasPage';
import QuejaNuevaPage from '../pages/cliente/QuejaNuevaPage';
import VendedorDashboardPage from '../pages/vendedor/VendedorDashboardPage';
import VendedorPerfilPage from '../pages/vendedor/VendedorPerfilPage';
import VendedorProductosPage from '../pages/vendedor/VendedorProductosPage';
import ProductoNuevoPage from '../pages/vendedor/ProductoNuevoPage';
import ProductoEditarPage from '../pages/vendedor/ProductoEditarPage';
import VendedorPedidosPage from '../pages/vendedor/VendedorPedidosPage';
import VendedorQuejasPage from '../pages/vendedor/VendedorQuejasPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminPortadaPage from '../pages/admin/AdminPortadaPage';
import AdminVendedoresPage from '../pages/admin/usuarios/AdminVendedoresPage';
import AdminVendedorRegistrarPage from '../pages/admin/usuarios/AdminVendedorRegistrarPage';
import AdminClientesPage from '../pages/admin/usuarios/AdminClientesPage';
import AdminPedidosPage from '../pages/admin/pedidos/AdminPedidosPage';
import AdminQuejasPage from '../pages/admin/quejas/AdminQuejasPage';
import AdminConfiguracionPage from '../pages/admin/AdminConfiguracionPage';
import NotFoundPage from '../pages/NotFoundPage';

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 text-sm text-slate-500">
      Cargando sesión...
    </div>
  );
}

export function RequireAuth() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;

  if (!session) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return <Outlet />;
}

export function RequireRole({ roles }: { roles: Role[] }) {
  const { role, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!role) return <Navigate to="/login" replace />;
  if (!roles.includes(role)) return <Navigate to={roleHomePath(role)} replace />;

  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <PortadaPage /> },
      { path: '/tienda', element: <CatalogoPage /> },
      { path: '/tienda/producto/:id', element: <ProductoPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/registro', element: <RegistroPage /> },
      {
        element: <RequireAuth />,
        children: [
          { path: '/carrito', element: <CarritoPage /> },
          { path: '/checkout', element: <CheckoutPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <RequireRole roles={['cliente']} />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              { path: '/cliente', element: <ClienteDashboardPage /> },
              { path: '/cliente/pedidos', element: <PedidosPage /> },
              { path: '/cliente/pedidos/:id', element: <PedidoDetallePage /> },
              { path: '/cliente/quejas', element: <QuejasPage /> },
              { path: '/cliente/quejas/nueva', element: <QuejaNuevaPage /> },
            ],
          },
        ],
      },
      {
        element: <RequireRole roles={['vendedor']} />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              { path: '/vendedor', element: <VendedorDashboardPage /> },
              { path: '/vendedor/perfil', element: <VendedorPerfilPage /> },
              { path: '/vendedor/productos', element: <VendedorProductosPage /> },
              { path: '/vendedor/productos/nuevo', element: <ProductoNuevoPage /> },
              { path: '/vendedor/productos/editar/:id', element: <ProductoEditarPage /> },
              { path: '/vendedor/pedidos', element: <VendedorPedidosPage /> },
              { path: '/vendedor/quejas', element: <VendedorQuejasPage /> },
            ],
          },
        ],
      },
      {
        element: <RequireRole roles={['admin']} />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              { path: '/admin', element: <AdminDashboardPage /> },
              { path: '/admin/vendedores', element: <AdminVendedoresPage /> },
              { path: '/admin/vendedores/registrar', element: <AdminVendedorRegistrarPage /> },
              { path: '/admin/clientes', element: <AdminClientesPage /> },
              { path: '/admin/portada', element: <AdminPortadaPage /> },
              { path: '/admin/pedidos', element: <AdminPedidosPage /> },
              { path: '/admin/quejas', element: <AdminQuejasPage /> },
              { path: '/admin/configuracion', element: <AdminConfiguracionPage /> },
            ],
          },
        ],
      },
    ],
  },
]);


import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="wrapper page-section text-center">
      <p className="text-sm uppercase tracking-wide text-muted">Error 404</p>
      <h1 className="page-title">Página no encontrada</h1>
      <p className="mt-2 text-sm text-muted">
        La ruta que buscas no existe o fue movida.
      </p>
      <Link to="/" className="btn btn-primary mt-6">
        Volver al inicio
      </Link>
    </div>
  );
}

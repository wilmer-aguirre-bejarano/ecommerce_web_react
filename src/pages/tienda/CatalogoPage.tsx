import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { publicImageUrl } from '../../lib/images';
import { add, formatPrice } from '../../lib/cart';
import { useCart } from '../../hooks/useCart';
import type { Product, SellerProfile } from '../../types/database';

type Status = 'loading' | 'ready' | 'error';

interface ProductoConVendedor extends Product {
  seller_profiles: SellerProfile | null;
}

export default function CatalogoPage() {
  const cart = useCart();
  const [products, setProducts] = useState<ProductoConVendedor[]>([]);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    let active = true;

    supabase
      .from('products')
      .select('*, seller_profiles(id, business_name)')
      .eq('active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setStatus('error');
          return;
        }
        setProducts((data ?? []) as ProductoConVendedor[]);
        setStatus('ready');
      });

    return () => {
      active = false;
    };
  }, []);

  const handleAdd = (product: ProductoConVendedor) => {
    const inCart = cart.items.find((item) => item.product_id === product.id)?.quantity ?? 0;
    const available = Math.max(0, product.stock - inCart);

    if (available <= 0) {
      toast.error(`Máximo disponible: ${inCart} en tu carrito`);
      return;
    }

    add({
      product_id: product.id,
      seller_id: product.seller_id,
      seller_name: product.seller_profiles?.business_name ?? null,
      name: product.name,
      price: Number(product.price),
      image: product.image,
      quantity: Math.min(1, available),
      stock: product.stock,
    });
    toast.success(`${product.name} agregado al carrito`);
  };

  return (
    <div className="wrapper page-section">
      <div className="d-flex align-items-end justify-content-between gap-4 mb-4">
        <div>
          <p className="text-muted text-uppercase small mb-1">Tienda</p>
          <h1 className="page-title mb-0">Catálogo de productos</h1>
        </div>
        <span className="badge text-bg-light">{products.length} productos</span>
      </div>

      {status === 'loading' && (
        <div className="alert alert-info d-flex align-items-center" role="alert">
          <i className="bi bi-hourglass-split me-2" />
          Cargando productos...
        </div>
      )}

      {status === 'error' && (
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <i className="bi bi-exclamation-triangle me-2" />
          No se pudieron cargar los productos. Revisa la configuración de Supabase (.env).
        </div>
      )}

      {status === 'ready' && products.length === 0 && (
        <div className="alert alert-secondary d-flex align-items-center" role="alert">
          <i className="bi bi-inbox me-2" />
          No hay productos publicados todavía.
        </div>
      )}

      {status === 'ready' && products.length > 0 && (
        <div className="row g-3 mt-2">
          {products.map((product) => {
            const inCart = cart.items.find((item) => item.product_id === product.id)?.quantity ?? 0;
            const available = Math.max(0, product.stock - inCart);
            const soldOut = product.stock <= 0;
            const maxReached = available <= 0;

            return (
              <div key={product.id} className="col-sm-6 col-lg-4">
                <article className="card h-100 card-hover d-flex flex-column position-relative">
                  {product.is_featured && (
                    <span
                      className="badge text-bg-warning position-absolute"
                      style={{ top: '0.6rem', left: '0.6rem', zIndex: 2 }}
                    >
                      <Star className="h-3 w-3" />
                      Destacado
                    </span>
                  )}
                  {product.image ? (
                    <Link
                      to={`/tienda/producto/${product.id}`}
                      className="ratio ratio-4x3 overflow-hidden rounded-top"
                    >
                      <img
                        src={publicImageUrl(product.image) ?? ''}
                        alt={product.name}
                        className="w-100 h-100"
                        style={{ objectFit: 'cover' }}
                      />
                    </Link>
                  ) : (
                    <Link
                      to={`/tienda/producto/${product.id}`}
                      className="d-flex align-items-center justify-content-center bg-light"
                      style={{ height: '200px' }}
                    >
                      <i className="bi bi-image text-muted" style={{ fontSize: '2rem' }} />
                    </Link>
                  )}
                  <div className="card-body d-flex flex-column">
                    <Link
                      to={`/tienda/producto/${product.id}`}
                      className="text-decoration-none fw-semibold text-dark"
                    >
                      {product.name}
                    </Link>
                    {product.description && (
                      <p className="text-muted small mt-2 mb-0 text-truncate-2">
                        {product.description}
                      </p>
                    )}
                    <div className="d-flex align-items-center justify-content-between mt-3">
                      <span className="price-tag">{formatPrice(Number(product.price))}</span>
                      <span className={`small ${soldOut ? 'text-danger' : 'text-muted'}`}>
                        Stock: {product.stock}
                      </span>
                    </div>
                    <small className="text-muted mt-1 d-block mb-3">
                      Vendedor:{' '}
                      <span className="fw-semibold text-dark">
                        {product.seller_profiles?.business_name ?? `Vendedor #${product.seller_id}`}
                      </span>
                    </small>
                    <button
                      type="button"
                      disabled={soldOut || maxReached}
                      onClick={() => handleAdd(product)}
                      className="btn btn-primary mt-auto"
                    >
                      <i className="bi bi-cart-plus" />
                      {soldOut
                        ? 'Sin stock'
                        : maxReached
                          ? 'Máximo en carrito'
                          : 'Añadir al carrito'}
                    </button>
                  </div>
                </article>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
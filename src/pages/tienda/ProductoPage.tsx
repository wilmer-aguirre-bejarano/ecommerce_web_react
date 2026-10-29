import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Star } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { publicImageUrl } from '../../lib/images';
import { add, formatPrice } from '../../lib/cart';
import { useCart } from '../../hooks/useCart';
import type { Product, SellerProfile } from '../../types/database';

type Status = 'loading' | 'ready' | 'notfound' | 'error';

interface ProductoConVendedor extends Product {
  seller_profiles: SellerProfile | null;
}

export default function ProductoPage() {
  const { id } = useParams<{ id: string }>();
  const productId = Number(id);
  const cart = useCart();
  const [product, setProduct] = useState<ProductoConVendedor | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    if (!Number.isInteger(productId)) {
      setStatus('notfound');
      return;
    }

    let active = true;

    supabase
      .from('products')
      .select('*, seller_profiles(id, business_name)')
      .eq('id', productId)
      .eq('active', true)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setStatus('error');
          return;
        }
        const row = (data ?? null) as ProductoConVendedor | null;
        if (!row) {
          setStatus('notfound');
          return;
        }
        setProduct(row);
        setStatus('ready');
      });

    return () => {
      active = false;
    };
  }, [productId]);

  const inCart = useMemo(
    () => cart.items.find((item) => item.product_id === productId)?.quantity ?? 0,
    [cart.items, productId],
  );

  useEffect(() => {
    if (!product) return;
    const availMax = Math.max(1, product.stock - inCart);
    setQuantity((current) => Math.min(Math.max(1, current), availMax));
  }, [product, inCart]);

  const handleAdd = () => {
    if (!product) return;
    const available = Math.max(0, product.stock - inCart);
    if (available <= 0) {
      toast.error('No hay stock disponible');
      return;
    }
    add({
      product_id: product.id,
      seller_id: product.seller_id,
      seller_name: product.seller_profiles?.business_name ?? null,
      name: product.name,
      price: Number(product.price),
      image: product.image,
      quantity: Math.min(quantity || 1, available),
      stock: product.stock,
    });
    toast.success(`${product.name} agregado al carrito`);
  };

  if (status === 'loading') {
    return (
      <div className="wrapper page-section">
        <div className="alert alert-info d-flex align-items-center" role="alert">
          <i className="bi bi-hourglass-split me-2" />
          Cargando producto...
        </div>
      </div>
    );
  }

  if (status === 'notfound') {
    return (
      <div className="wrapper page-section">
        <div className="alert alert-warning d-flex align-items-center" role="alert">
          <i className="bi bi-exclamation-circle me-2" />
          El producto no existe o ya no está disponible.
        </div>
        <Link to="/tienda" className="btn btn-primary mt-3">
          <i className="bi bi-arrow-left" />
          Volver al catálogo
        </Link>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="wrapper page-section">
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <i className="bi bi-exclamation-triangle me-2" />
          No se pudo cargar el producto. Revisa la configuración de Supabase (.env).
        </div>
        <Link to="/tienda" className="btn btn-primary mt-3">
          <i className="bi bi-arrow-left" />
          Volver al catálogo
        </Link>
      </div>
    );
  }

  if (!product) return null;

  const soldOut = product.stock <= 0;
  const available = Math.max(0, product.stock - inCart);
  const imageSrc = publicImageUrl(product.image);

  return (
    <div className="wrapper page-section">
      <Link to="/tienda" className="text-muted small d-inline-flex align-items-center gap-1 mb-3">
        <ArrowLeft className="h-4 w-4" />
        Volver al catálogo
      </Link>

      <div className="row g-4">
        <div className="col-md-6">
          <div className="card">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={product.name}
                className="w-100 rounded"
                style={{ objectFit: 'cover', maxHeight: '420px' }}
              />
            ) : (
              <div
                className="d-flex align-items-center justify-content-center bg-light rounded"
                style={{ height: '320px' }}
              >
                <i className="bi bi-image text-muted" style={{ fontSize: '3rem' }} />
              </div>
            )}
          </div>
        </div>

        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-body">
              {product.is_featured && (
                <span className="badge text-bg-warning mb-2">
                  <Star className="h-3 w-3" />
                  Destacado
                </span>
              )}
              <h1 className="h3">{product.name}</h1>
              <p className="text-muted">
                <i className="bi bi-shop me-1" />
                Vendedor:{' '}
                <span className="fw-semibold text-dark">
                  {product.seller_profiles?.business_name ?? `Vendedor #${product.seller_id}`}
                </span>
              </p>

              <p className="price-tag" style={{ fontSize: '2rem' }}>
                {formatPrice(Number(product.price))}
              </p>
              <p className={`small ${soldOut ? 'text-danger fw-semibold' : 'text-muted'}`}>
                {soldOut ? (
                  <>
                    <i className="bi bi-x-circle me-1" /> Sin stock
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-circle me-1" /> Stock disponible: {available}
                  </>
                )}
              </p>

              {product.description && (
                <p className="mt-3 text-muted">{product.description}</p>
              )}

              <div className="d-flex align-items-center gap-3 mt-4">
                <div className="d-flex align-items-center border rounded">
                  <button
                    type="button"
                    aria-label="Disminuir"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    className="btn btn-outline-secondary border-0"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-center fw-semibold px-2" style={{ minWidth: '2.5rem' }}>
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Aumentar"
                    disabled={quantity >= available}
                    onClick={() => setQuantity((current) => Math.min(available, current + 1))}
                    className="btn btn-outline-secondary border-0"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  disabled={soldOut || available <= 0}
                  onClick={handleAdd}
                  className="btn btn-primary btn-lg flex-grow-1"
                >
                  <i className="bi bi-cart-plus" />
                  {soldOut || available <= 0 ? 'Sin stock' : 'Añadir al carrito'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
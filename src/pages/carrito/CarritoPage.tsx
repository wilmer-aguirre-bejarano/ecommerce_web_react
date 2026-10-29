import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, QrCode, Trash2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { clear, formatPrice, remove, update } from '../../lib/cart';
import { useCart } from '../../hooks/useCart';
import type { SellerProfile } from '../../types/database';
//imagenes que se mostrara en el carito de compras
import { publicImageUrl } from '../../lib/images';

type SellerInfo = Pick<SellerProfile, 'id' | 'business_name' | 'qr_payload'>;

export default function CarritoPage() {
  const cart = useCart();
  const navigate = useNavigate();
  const [sellers, setSellers] = useState<Record<number, SellerInfo>>({});

  const sellerIds = Object.keys(cart.bySeller).map(Number);

  useEffect(() => {
    if (sellerIds.length === 0) {
      setSellers({});
      return;
    }

    supabase
      .from('seller_profiles')
      .select('id, business_name, qr_payload')
      .in('id', sellerIds)
      .then(({ data }) => {
        const rows = (data ?? []) as SellerInfo[];
        const map: Record<number, SellerInfo> = {};
        for (const row of rows) map[Number(row.id)] = row;
        setSellers(map);
      });
  }, [sellerIds.join(',')]);

  const handleClear = () => {
    clear();
    toast.success('Carrito vaciado');
  };

  if (cart.items.length === 0) {
    return (
      <div className="wrapper page-section">
        <h1 className="page-title mb-3 d-flex align-items-center gap-2">
          <i className="bi bi-cart3 text-primary" />
          Carrito
        </h1>
        <div className="alert alert-secondary d-flex align-items-center" role="alert">
          <i className="bi bi-cart-x me-2" />
          Tu carrito está vacío.
        </div>
        <Link to="/tienda" className="btn btn-primary mt-3">
          <i className="bi bi-shop" />
          Ir a la tienda
        </Link>
      </div>
    );
  }

  return (
    <div className="wrapper page-section">
      <div className="d-flex align-items-center justify-content-between gap-3 mb-4">
        <h1 className="page-title mb-0 d-flex align-items-center gap-2">
          <i className="bi bi-cart3 text-primary" />
          Carrito
        </h1>
        <button type="button" onClick={handleClear} className="btn btn-outline-danger btn-sm">
          <i className="bi bi-trash3" />
          Vaciar carrito
        </button>
      </div>

      <div className="d-flex flex-column gap-4">
        {sellerIds.map((sellerId) => {
          const items = cart.bySeller[sellerId] ?? [];
          const seller = sellers[sellerId];
          const subtotal = items.reduce(
            (sum, item) => sum + Number(item.price) * item.quantity,
            0,
          );
          const qrPayload =
            seller?.qr_payload ??
            (seller ? `PAGO|${seller.business_name}` : `PAGO|Vendedor #${sellerId}`);

          return (
            <section key={sellerId} className="card">
              <header className="card-header d-flex align-items-center justify-content-between gap-3">
                <div className="d-flex align-items-center gap-3">
                  <div className="border rounded-2 p-2 bg-white">
                    <QRCodeSVG
                      value={qrPayload}
                      size={44}
                      className="[&>rect]:fill-transparent"
                    />
                  </div>
                  <div>
                    <h2 className="h6 mb-0">{seller?.business_name ?? `Vendedor #${sellerId}`}</h2>
                    <p className="text-muted small mb-0 d-flex align-items-center gap-1">
                      <QrCode className="h-3 w-3" />
                      Pago por QR
                    </p>
                  </div>
                </div>
                <span className="fw-semibold text-dark">Subtotal: {formatPrice(subtotal)}</span>
              </header>

              <ul className="list-unstyled mb-0">
                {items.map((item) => (
                  <li
                    key={item.product_id}
                    className="d-flex flex-wrap align-items-center gap-3 px-3 py-3 border-bottom"
                  >
                    <div className="bg-light rounded-2 d-none d-sm-block"style={{ width: '48px', height: '48px' }}>
                      <img src={publicImageUrl(item.image) || ''} alt={item.name} />
                    </div> 
                    <div className="min-w-0 flex-grow-1">
                      <p className="mb-0 fw-semibold text-dark text-truncate">{item.name}</p>
                      <small className="text-muted">
                        {formatPrice(Number(item.price))} c/u
                        {item.stock != null && <span className="ms-1">· stock: {item.stock}</span>}
                      </small>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <button
                        type="button"
                        aria-label="Disminuir"
                        onClick={() => update(item.product_id, item.quantity - 1)}
                        className="btn btn-outline-secondary btn-sm"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-center" style={{ width: '2rem' }}>
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Aumentar"
                        disabled={item.stock != null && item.quantity >= item.stock}
                        onClick={() => update(item.product_id, item.quantity + 1)}
                        className="btn btn-outline-secondary btn-sm"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <span className="fw-semibold text-dark text-end" style={{ width: '6rem' }}>
                      {formatPrice(Number(item.price) * item.quantity)}
                    </span>

                    <button
                      type="button"
                      aria-label="Eliminar"
                      onClick={() => remove(item.product_id)}
                      className="btn btn-outline-danger btn-sm"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <div className="card mt-4">
        <div className="card-body d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <p className="text-muted mb-1">
              {cart.count} artículos · {sellerIds.length} vendedor(es)
            </p>
            <p className="h4 mb-0">Total: <span className="price-tag">{formatPrice(cart.total)}</span></p>
          </div>
          <button type="button" onClick={() => navigate('/checkout')} className="btn btn-success btn-lg">
            <i className="bi bi-credit-card" />
            Ir a checkout
          </button>
        </div>
      </div>
    </div>
  );
}
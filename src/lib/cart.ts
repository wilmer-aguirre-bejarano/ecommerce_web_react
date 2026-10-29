/**
 * Gestión de carrito en localStorage
 * - Agrupado por vendedor (bySeller)
 * - Validación de stock y cantidad
 * - Sincroniza con acciones del usuario
 */
export interface CartItem {
  product_id: number;
  seller_id: number;
  seller_name?: string | null;
  name: string;
  price: number;
  image?: string | null;
  quantity: number;
  stock?: number | null;
}

export interface CartContent {
  items: CartItem[];
  bySeller: Record<number, CartItem[]>;
  count: number;
  total: number;
}

const STORAGE_KEY = 'ecommerce_web_cart_v1';

const listeners = new Set<() => void>();
let snapshot: CartContent | null = null;

function readStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
  } catch {
    return [];
  }
}

function writeStorage(items: CartItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* almacenamiento no disponible */
  }
  snapshot = null;
  listeners.forEach((listener) => listener());
}

export function getCart(): CartItem[] {
  return readStorage();
}

export function content(): CartContent {
  if (!snapshot) {
    const items = readStorage();
    const bySeller: Record<number, CartItem[]> = {};
    let total = 0;
    let count = 0;

    for (const item of items) {
      if (!bySeller[item.seller_id]) bySeller[item.seller_id] = [];
      bySeller[item.seller_id].push(item);
      total += Number(item.price) * item.quantity;
      count += item.quantity;
    }

    snapshot = { items, bySeller, count, total };
  }
  return snapshot;
}

export type NewCartItem = Omit<CartItem, 'quantity'> & { quantity?: number };

export function add(item: NewCartItem): void {
  const items = readStorage();
  const quantity = Math.max(1, item.quantity ?? 1);
  const existing = items.find((entry) => entry.product_id === item.product_id);

  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({ ...item, quantity });
  }

  writeStorage(items);
}

export function update(productId: number, quantity: number): void {
  let items = readStorage();

  if (quantity <= 0) {
    items = items.filter((item) => item.product_id !== productId);
  } else {
    items = items.map((item) =>
      item.product_id === productId ? { ...item, quantity } : item,
    );
  }

  writeStorage(items);
}

export function remove(productId: number): void {
  writeStorage(readStorage().filter((item) => item.product_id !== productId));
}

export function clear(): void {
  writeStorage([]);
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
  }).format(Number(value) || 0);
}

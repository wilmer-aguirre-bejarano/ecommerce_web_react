/** src\lib\orders.ts - utilidades */

import { supabase } from './supabase';

const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const lower = 'abcdefghijklmnopqrstuvwxyz';
const alphabet = upper + lower;

export function randomPassword(): string {
  const chars: string[] = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
  ];
  for (let i = 2; i < 10; i++) {
    chars.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
  }
  return chars.join('');
}

function todayPrefix(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `ORD-${y}${m}${d}-`;
}

export async function generateOrderNumber(): Promise<string> {
  const { data, error } = await supabase.rpc('generate_order_number');
  if (!error && typeof data === 'string' && data) return data;

  const prefix = todayPrefix();
  const { count } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .like('order_number', `${prefix}%`);
  return `${prefix}${String((count ?? 0) + 1).padStart(4, '0')}`;
}

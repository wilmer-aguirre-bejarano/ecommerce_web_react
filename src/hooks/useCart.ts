import { useSyncExternalStore } from 'react';
import { content, subscribe } from '../lib/cart';

export function useCart() {
  return useSyncExternalStore(subscribe, content, content);
}

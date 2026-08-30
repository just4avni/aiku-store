import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Unknown';
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export function formatPrice(price: number): string {
  if (price === 0) return 'Free';
  return `$${price.toFixed(2)}`;
}

export function formatDate(date: string | null): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | null): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getAccessTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    public: 'Public',
    account: 'Account Required',
    premium: 'Premium',
    vvip: 'VVIP',
  };
  return labels[type] || type;
}

export function getAccessTypeColor(type: string): string {
  const colors: Record<string, string> = {
    public: 'bg-aiku-accent/20 text-aiku-accent',
    account: 'bg-aiku-info/20 text-aiku-info',
    premium: 'bg-aiku-warning/20 text-aiku-warning',
    vvip: 'bg-purple-500/20 text-purple-400',
  };
  return colors[type] || 'bg-aiku-dim/20 text-aiku-dim';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function generateSecureKey(prefix: string = 'AIKU-VVIP'): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = 2;
  const segmentLength = 4;
  let key = prefix;

  for (let i = 0; i < segments; i++) {
    let segment = '';
    const array = new Uint8Array(segmentLength);
    crypto.getRandomValues(array);
    for (let j = 0; j < segmentLength; j++) {
      segment += chars[array[j] % chars.length];
    }
    key += `-${segment}`;
  }

  return key;
}

export function hashKey(key: string): string {
  // In production, use server-side hashing with bcrypt or similar
  // This is a client-side placeholder for UI purposes
  return btoa(key).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

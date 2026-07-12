import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function groupBy<T, K extends PropertyKey>(
    keyFn: (item: T) => K,
    ...items: T[]
): Record<K, T[]> {
  return items.reduce((groups, item) => {
    const key = keyFn(item);

    (groups[key] ??= []).push(item);

    return groups;
  }, {} as Record<K, T[]>);
}

export function groupByUnique<T, K extends PropertyKey>(
    keyFn: (item: T) => K,
    ...items: T[]
): Record<K, T> {
  return items.reduce((groups, item) => {
    const key = keyFn(item);

    if (groups[key] !== undefined) {
      throw new Error(`Duplicate key ${String(key)} found`);
    }

    groups[key] = item;

    return groups;
  }, {} as Record<K, T>);
}

export function formatClock(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

export function formatCredits(n: number): string {
  return n.toLocaleString("en-US");
}
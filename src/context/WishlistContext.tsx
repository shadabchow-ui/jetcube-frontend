// src/context/WishlistContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type WishlistItem = {
  // canonical fields used across your app
  id: string; // product id/handle OR sku fallback
  name: string;
  price: number;
  image?: string;

  // optional legacy/extra fields (for buttons/cards)
  sku?: string;
  title?: string;
  slug?: string;
};

type WishlistCtx = {
  // canonical API (used by WishlistPage + PDP wiring)
  items: WishlistItem[];
  totalCount: number;
  has: (id: string) => boolean;
  add: (item: WishlistItem) => void;
  remove: (id: string) => void;
  toggle: (item: WishlistItem) => void;
  clear: () => void;

  // alias API (so AddToWishlistButton works without edits)
  addToWishlist: (item: {
    sku?: string;
    title?: string;
    name?: string;
    price?: number;
    image?: string;
    slug?: string;
    id?: string;
  }) => void;
  removeFromWishlist: (idOrSku: string) => void;
  isInWishlist: (idOrSku: string) => boolean;
};

const WishlistContext = createContext<WishlistCtx | null>(null);

const LS_KEY = "jetcube_wishlist_v1";

function safeParse(json: string | null): WishlistItem[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function toNumberPrice(p: any): number {
  const n = typeof p === "number" ? p : Number(String(p ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 49.99;
}

function normalizeIncoming(item: any): WishlistItem | null {
  if (!item) return null;

  const sku = String(item.sku || "").trim();
  const id = String(item.id || item.handle || sku || "").trim();
  if (!id) return null;

  const title = String(item.title || item.name || "").trim();
  const name = title || "Product";

  return {
    id,
    name,
    price: toNumberPrice(item.price),
    image: item.image ? String(item.image) : undefined,
    sku: sku || undefined,
    title: item.title ? String(item.title) : undefined,
    slug: item.slug ? String(item.slug) : undefined,
  };
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>(() =>
    safeParse(typeof window !== "undefined" ? window.localStorage.getItem(LS_KEY) : null)
  );

  // persist
  useEffect(() => {
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items]);

  // sync across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== LS_KEY) return;
      setItems(safeParse(e.newValue));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const has = (id: string) => {
    const key = String(id || "").trim();
    if (!key) return false;
    return items.some((x) => x.id === key || x.sku === key);
  };

  const add = (item: WishlistItem) => {
    const norm = normalizeIncoming(item);
    if (!norm) return;

    setItems((prev) => {
      if (prev.some((x) => x.id === norm.id)) return prev;
      return [norm, ...prev];
    });
  };

  const remove = (id: string) => {
    const key = String(id || "").trim();
    if (!key) return;

    setItems((prev) => prev.filter((x) => x.id !== key && x.sku !== key));
  };

  const toggle = (item: WishlistItem) => {
    const norm = normalizeIncoming(item);
    if (!norm) return;

    setItems((prev) => {
      const exists = prev.some((x) => x.id === norm.id);
      return exists ? prev.filter((x) => x.id !== norm.id) : [norm, ...prev];
    });
  };

  const clear = () => setItems([]);

  // ✅ aliases for older component API (AddToWishlistButton)
  const addToWishlist = (raw: any) => {
    const norm = normalizeIncoming(raw);
    if (!norm) return;
    add(norm);
  };

  const removeFromWishlist = (idOrSku: string) => {
    remove(idOrSku);
  };

  const isInWishlist = (idOrSku: string) => {
    return has(idOrSku);
  };

  const value = useMemo(
    () => ({
      items,
      totalCount: items.length,
      has,
      add,
      remove,
      toggle,
      clear,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
    }),
    [items]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}

// Backwards-compatible default export for older imports
export default WishlistProvider;

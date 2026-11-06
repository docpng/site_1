"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { useCart } from "./CartProvider";

export function AddToCart({ product }: { product: Pick<Product, "id" | "slug" | "title" | "price_cents" | "kind" | "images" | "stock"> }) {
  const { add, items } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const soldOut = product.kind === "physical" && product.stock !== null && product.stock <= 0;
  const inCart = items.some((i) => i.id === product.id);

  if (soldOut) return <p className="font-medium text-muted">Sold out</p>;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {product.kind === "physical" && (
        <label className="flex items-center gap-2 text-sm">
          Qty
          <input
            type="number"
            min={1}
            max={product.stock ?? 99}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
            className="input w-20"
          />
        </label>
      )}
      <button
        className="btn-primary px-6 py-2.5"
        onClick={() => {
          add(
            {
              id: product.id,
              slug: product.slug,
              title: product.title,
              price_cents: product.price_cents,
              kind: product.kind,
              image: product.images[0] ?? null,
            },
            qty,
          );
          setAdded(true);
        }}
      >
        {product.kind === "digital" && inCart ? "In your cart" : "Add to cart"}
      </button>
      {(added || inCart) && (
        <Link href="/cart" className="text-sm font-medium text-brand-700 hover:underline">
          Go to cart →
        </Link>
      )}
    </div>
  );
}

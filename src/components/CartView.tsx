"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { startCheckout } from "@/app/actions/checkout";
import { formatPrice, kindLabel } from "@/lib/format";
import { useCart } from "./CartProvider";

export function CartView({ currency, signedIn }: { currency: string; signedIn: boolean }) {
  const { items, ready, subtotal, setQuantity, remove } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!ready) return <p className="text-muted">Loading cart…</p>;

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-brand-200 bg-brand-50/40 p-10 text-center">
        <p className="font-medium">Your cart is empty.</p>
        <Link href="/shop" className="btn-primary mt-6">
          Browse the shop
        </Link>
      </div>
    );
  }

  const checkout = () => {
    setError(null);
    startTransition(async () => {
      const result = await startCheckout(items.map((i) => ({ id: i.id, quantity: i.quantity })));
      if (result.needsLogin) {
        router.push("/login?next=/cart");
        return;
      }
      if (result.error) setError(result.error);
      if (result.url) window.location.href = result.url;
    });
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
      <ul className="divide-y divide-line rounded-xl border border-line">
        {items.map((item) => (
          <li key={item.id} className="flex gap-4 p-4">
            {item.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.image} alt="" className="h-20 w-20 rounded-lg border border-line object-cover" />
            ) : (
              <div className="h-20 w-20 rounded-lg bg-brand-50" />
            )}
            <div className="flex min-w-0 flex-1 flex-col">
              <Link href={`/shop/${item.slug}`} className="font-medium hover:text-brand-700">
                {item.title}
              </Link>
              <span className="text-xs text-muted">{kindLabel[item.kind]}</span>
              <div className="mt-auto flex items-center gap-3 pt-2">
                {item.kind === "physical" ? (
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={item.quantity}
                    onChange={(e) => setQuantity(item.id, Number(e.target.value) || 0)}
                    className="input w-20 py-1"
                    aria-label={`Quantity of ${item.title}`}
                  />
                ) : null}
                <button onClick={() => remove(item.id)} className="text-sm text-muted hover:text-red-600">
                  Remove
                </button>
              </div>
            </div>
            <p className="font-semibold">{formatPrice(item.price_cents * item.quantity, currency)}</p>
          </li>
        ))}
      </ul>

      <aside className="card h-fit p-6">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span className="font-semibold">{formatPrice(subtotal, currency)}</span>
        </div>
        <p className="mt-2 text-xs text-muted">Final prices, taxes and shipping are confirmed at checkout.</p>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <button onClick={checkout} disabled={pending} className="btn-primary mt-6 w-full py-2.5">
          {pending ? "Starting checkout…" : signedIn ? "Checkout" : "Sign in to checkout"}
        </button>
        <p className="mt-3 text-center text-xs text-muted">Secure payment by Stripe</p>
      </aside>
    </div>
  );
}

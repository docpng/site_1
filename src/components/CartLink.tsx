"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export function CartLink() {
  const { count } = useCart();
  return (
    <Link href="/cart" className="relative inline-flex items-center gap-1 text-sm font-medium text-ink hover:text-brand-700">
      <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
        <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="10" cy="20" r="1.3" />
        <circle cx="17" cy="20" r="1.3" />
      </svg>
      <span className="sr-only">Cart</span>
      {count > 0 && (
        <span className="absolute -top-2 -right-3 rounded-full bg-brand-600 px-1.5 text-[11px] leading-5 font-semibold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}

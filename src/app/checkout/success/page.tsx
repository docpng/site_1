import type { Metadata } from "next";
import Link from "next/link";
import { ClearCart } from "@/components/ClearCart";

export const metadata: Metadata = { title: "Thank you" };

export default function CheckoutSuccessPage() {
  return (
    <div className="container-page max-w-xl py-24 text-center">
      <ClearCart />
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-2xl text-brand-700">✓</div>
      <h1 className="mt-6 text-3xl font-bold">Thank you for your order!</h1>
      <p className="mt-3 text-muted">
        A receipt is on its way to your inbox. Digital downloads appear in your account as soon as the payment is confirmed
        (usually within a few seconds).
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link href="/account" className="btn-primary">
          Go to my account
        </Link>
        <Link href="/shop" className="btn-secondary">
          Keep shopping
        </Link>
      </div>
    </div>
  );
}

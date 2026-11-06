import type { Metadata } from "next";
import Link from "next/link";
import { ClearCart } from "@/components/ClearCart";
import { text } from "@/lib/content";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Thank you" };

export default async function CheckoutSuccessPage() {
  const settings = await getSettings();
  return (
    <div className="container-page max-w-xl py-24 text-center">
      <ClearCart />
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-2xl text-brand-700">✓</div>
      <h1 className="mt-6 text-3xl font-bold">{text(settings, "success_title")}</h1>
      <p className="mt-3 whitespace-pre-line text-muted">{text(settings, "success_body")}</p>
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

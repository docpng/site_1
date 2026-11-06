import type { Metadata } from "next";
import { CartView } from "@/components/CartView";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage() {
  const [settings, user] = await Promise.all([getSettings(), getCurrentUser()]);
  return (
    <div className="container-page py-14">
      <h1 className="mb-8 text-3xl font-bold">Your cart</h1>
      <CartView currency={settings.currency} signedIn={!!user} />
    </div>
  );
}

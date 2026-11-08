import type { Metadata } from "next";
import Link from "next/link";
import { signOut } from "@/app/actions/auth";
import { requireUser } from "@/lib/auth";
import { formatDate, formatPrice } from "@/lib/format";
import { listOrders } from "@/lib/data";
import { NameForm } from "./NameForm";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await requireUser("/account");
  const orders = await listOrders({ userId: user.id });

  return (
    <div className="container-page max-w-3xl py-14">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your account</h1>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
        </div>
        <form action={signOut}>
          <button className="btn-secondary">Sign out</button>
        </form>
      </div>

      <section className="card mt-10 p-6">
        <NameForm name={user.profile.display_name} />
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold">Orders &amp; downloads</h2>
        {!orders?.length ? (
          <p className="mt-4 text-sm text-muted">
            No orders yet. <Link href="/shop" className="text-brand-700 hover:underline">Visit the shop</Link>.
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {orders.map((o) => (
              <li key={o.id} className="card p-5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="font-medium">{formatDate(o.created_at)}</span>
                  <span className="badge capitalize">{o.status}</span>
                  <span className="font-semibold">{formatPrice(o.amount_total, o.currency)}</span>
                </div>
                <ul className="mt-4 divide-y divide-line">
                  {o.order_items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span>
                        {item.title}
                        {item.quantity > 1 && <span className="text-muted"> × {item.quantity}</span>}
                      </span>
                      {item.kind === "digital" && item.product_id && (
                        <a href={`/api/download/${item.product_id}`} className="btn-secondary py-1">
                          Download
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

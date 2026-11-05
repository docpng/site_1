"use client";

import { useState } from "react";
import type { ProductKind } from "@/lib/types";
import { FileField } from "./FileField";

/** Price / stock / file inputs that change with the product type. */
export function ProductTypeFields({ kind: initialKind, price, stock, filePath, fileName, currency }: {
  kind: ProductKind;
  price: string;
  stock: number | null;
  filePath: string | null;
  fileName: string | null;
  currency: string;
}) {
  const [kind, setKind] = useState<ProductKind>(initialKind);
  return (
    <div className="space-y-4 rounded-xl border border-line p-4">
      <div>
        <span className="label">Type</span>
        <div className="grid gap-2 sm:grid-cols-3">
          {(
            [
              ["digital", "Digital download", "Paid file, delivered after purchase"],
              ["physical", "Physical item", "Shipped; collects an address at checkout"],
              ["free", "Free download", "Anyone can download it"],
            ] as const
          ).map(([value, label, help]) => (
            <label key={value} className={`cursor-pointer rounded-lg border p-3 ${kind === value ? "border-brand-500 bg-brand-50" : "border-line"}`}>
              <input type="radio" name="kind" value={value} checked={kind === value} onChange={() => setKind(value)} className="sr-only" />
              <span className="block text-sm font-medium">{label}</span>
              <span className="block text-xs text-muted">{help}</span>
            </label>
          ))}
        </div>
      </div>

      {kind !== "free" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="price">Price ({currency.toUpperCase()})</label>
            <input id="price" name="price" type="number" min="0.5" step="0.01" defaultValue={price} required className="input" />
          </div>
          {kind === "physical" && (
            <div>
              <label className="label" htmlFor="stock">Stock</label>
              <input id="stock" name="stock" type="number" min="0" defaultValue={stock ?? ""} className="input" />
              <p className="mt-1 text-xs text-muted">Leave blank for unlimited.</p>
            </div>
          )}
        </div>
      )}

      {kind !== "physical" && <FileField defaultPath={filePath} defaultName={fileName} />}
    </div>
  );
}

import type { ShoppingLink } from "../../lib/looks/model";
import { safeShoppingUrl } from "../../lib/looks/validation";

export function ShoppingLinks({ links, partName }: { links?: ShoppingLink[]; partName: string }) {
  return <ul aria-label={`${partName} alışveriş bağlantıları`} className="space-y-2">
    {(links ?? []).map(link => {
      const href = safeShoppingUrl(link.url);
      return href ? <li key={link.id}><a href={href} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="font-semibold text-accent underline-offset-4 hover:underline">{link.label || link.retailer || new URL(href).hostname} · {link.relation === "exact" ? "Birebir ürün" : "Benzer alternatif"}</a></li> : null;
    })}
  </ul>;
}

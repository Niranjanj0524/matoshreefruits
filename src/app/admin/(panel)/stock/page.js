import { getStockAdmin } from "@/lib/admin-data";
import { pageH1 } from "../../components/ui";
import StockManager from "../../components/StockManager";

export const metadata = { title: "Stock" };

/**
 * Stock admin. There is no price field anywhere: quantity/quality/location/
 * availability only — buyers ask for rates on WhatsApp.
 */
export default async function AdminStockPage() {
  const items = await getStockAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className={pageH1}>Stock</h1>
        <p className="mt-1 text-sm text-muted">
          Lots available to bigger traders. Rates are never published here —
          they stay WhatsApp-only.
        </p>
      </div>
      <StockManager initialItems={items} />
    </div>
  );
}

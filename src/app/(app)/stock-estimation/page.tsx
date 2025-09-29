import { EstimationForm } from "@/components/stock-estimation/estimation-form";
import { mockProducts, mockTransactions } from "@/lib/data";

export default function StockEstimationPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-headline font-bold">Estimasi Jumlah Stok (AI)</h1>
      <p className="text-muted-foreground">
        Gunakan tool AI untuk mendapatkan saran dan memprediksi kuantitas stok optimal untuk suatu produk.
        Tool ini akan mempertimbangkan berbagai faktor historis, tren penjualan, dan variabel lain yang relevan.
      </p>
      <EstimationForm products={mockProducts} transactions={mockTransactions} />
    </div>
  );
}

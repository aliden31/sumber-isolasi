import { ArrowUpRight, DollarSign, Package, ShoppingCart } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { mockWeeklySales, mockProducts, mockTransactions } from "@/lib/data";
import { WeeklySalesChart } from "@/components/dashboard/weekly-sales-chart";

export default function DashboardPage() {
  const today = new Date();
  const dailySales = mockTransactions
    .filter(tx => tx.date.toDateString() === today.toDateString())
    .reduce((sum, tx) => sum + tx.total, 0);
  
  const cashBalance = mockTransactions.reduce((balance, tx) => {
    return tx.paymentMethod === 'Tunai' ? balance + tx.total : balance;
  }, 0);

  const lowStockProducts = mockProducts.filter((p) => p.stock < 10);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-headline font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-body">
              Penjualan Hari Ini
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {dailySales.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground">
              Total pendapatan hari ini
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-body">Saldo Kas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {cashBalance.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground">
              Total kas yang dipegang
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-body">Stok Menipis</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockProducts.length}</div>
            <p className="text-xs text-muted-foreground">
              Produk dengan stok di bawah 10
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium font-body">Total Produk</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockProducts.length}</div>
            <p className="text-xs text-muted-foreground">
              Jumlah jenis produk
            </p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="font-headline">Penjualan Mingguan</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <WeeklySalesChart data={mockWeeklySales} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-headline">Stok Produk Menipis</CardTitle>
            <CardDescription>
              Produk dengan jumlah stok kurang dari 10 unit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produk</TableHead>
                  <TableHead className="text-right">Stok</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStockProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="font-medium">{product.name}</div>
                      <div className="hidden text-sm text-muted-foreground md:inline">
                        {product.category}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="destructive">{product.stock}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

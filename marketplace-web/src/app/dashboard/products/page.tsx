import { ProductsManager } from '@/components/dashboard/products-manager';

export default function DashboardProductsPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Products</h1>
      <ProductsManager />
    </div>
  );
}

import { ProductsManager } from '@/components/dashboard/products-manager';
import { PageHeader } from '@/components/ui/page-header';

export default function AdminProductsPage() {
  return (
    <div>
      <PageHeader title="Products" />
      <ProductsManager />
    </div>
  );
}

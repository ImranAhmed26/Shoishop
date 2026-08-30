export type UserRole = 'BUYER' | 'SHOP_OWNER' | 'ADMIN';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export type ShopStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

export interface Shop {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  status: ShopStatus;
  createdAt: string;
  updatedAt: string;
}

export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  shopId: string;
  title: string;
  description: string | null;
  priceCents: number;
  currency: string;
  stockQty: number;
  categoryId: string | null;
  category?: Category | null;
  images: string[];
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
  shop?: Shop;
  avgRating?: number | null;
  reviewCount?: number;
}

export interface Review {
  id: string;
  productId: string;
  buyerId: string;
  orderId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  buyer?: { name: string };
}

export type OrderStatus = 'PLACED' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentMethod = 'COD' | 'BKASH';

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPriceCents: number;
  product?: Product;
}

export interface Order {
  id: string;
  shopId: string;
  buyerId: string | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  totalCents: number;
  currency: string;
  guestName: string | null;
  guestPhone: string | null;
  shippingAddress: string;
  shippingCity: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  shop?: Shop;
}

export type ReelStatus = 'PUBLISHED' | 'HIDDEN';

export interface Reel {
  id: string;
  shopId: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  linkedProductId: string | null;
  status: ReelStatus;
  viewCount: number;
  createdAt: string;
  shop?: Shop;
  linkedProduct?: Product | null;
}

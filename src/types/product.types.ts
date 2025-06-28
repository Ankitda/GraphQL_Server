export interface Product {
  title: string;
  description: string;
  price: number;
  discountPercentage?: string;
  rating?: number;
  stock: number;
  brand: string;
  category: string;
  thumbnail?: string;
  images?: string;
}

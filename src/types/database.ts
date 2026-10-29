export type Role = 'admin' | 'vendedor' | 'cliente';

export type OrderStatus =
  | 'pendiente'
  | 'pagado'
  | 'enviado'
  | 'completado'
  | 'cancelado';

export type ComplaintStatus = 'enviada' | 'en revisión' | 'resuelta';

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  password?: string;
  role: Role;
  account_created_by_system: boolean;
  remember_token?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SellerProfile {
  id: number;
  user_id: number;
  business_name: string;
  description: string | null;
  phone: string | null;
  address: string | null;
  logo: string | null;
  qr_payload: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  seller_id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image: string | null;
  is_featured: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CarouselSlide {
  id: number;
  title: string | null;
  subtitle: string | null;
  image: string;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface News {
  id: number;
  title: string;
  body: string;
  image: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Promotion {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
  discount_badge: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteSetting {
  id: number;
  key: string;
  value: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  client_id: number;
  seller_id: number;
  total: number;
  status: OrderStatus;
  full_name: string;
  email: string;
  phone: string | null;
  address: string;
  payment_method: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number | null;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
  updated_at: string;
}

export interface Complaint {
  id: number;
  client_id: number;
  seller_id: number;
  order_id: number | null;
  subject: string;
  description: string;
  status: ComplaintStatus;
  pdf_path: string | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Partial<User> & { name: string; email: string; password: string };
        Update: Partial<User>;
        Relationships: [];
      };
      seller_profiles: {
        Row: SellerProfile;
        Insert: Partial<SellerProfile> & { user_id: number; business_name: string };
        Update: Partial<SellerProfile>;
        Relationships: [];
      };
      products: {
        Row: Product;
        Insert: Partial<Product> & { seller_id: number; name: string; price: number };
        Update: Partial<Product>;
        Relationships: [];
      };
      carousel_slides: {
        Row: CarouselSlide;
        Insert: Partial<CarouselSlide> & { image: string };
        Update: Partial<CarouselSlide>;
        Relationships: [];
      };
      news: {
        Row: News;
        Insert: Partial<News> & { title: string; body: string };
        Update: Partial<News>;
        Relationships: [];
      };
      promotions: {
        Row: Promotion;
        Insert: Partial<Promotion> & { title: string };
        Update: Partial<Promotion>;
        Relationships: [];
      };
      site_settings: {
        Row: SiteSetting;
        Insert: Partial<SiteSetting> & { key: string };
        Update: Partial<SiteSetting>;
        Relationships: [];
      };
      orders: {
        Row: Order;
        Insert: Partial<Order> & {
          order_number: string;
          client_id: number;
          seller_id: number;
          full_name: string;
          email: string;
          address: string;
        };
        Update: Partial<Order>;
        Relationships: [];
      };
      order_items: {
        Row: OrderItem;
        Insert: Partial<OrderItem> & {
          order_id: number;
          product_name: string;
          price: number;
          quantity: number;
          subtotal: number;
        };
        Update: Partial<OrderItem>;
        Relationships: [];
      };
      complaints: {
        Row: Complaint;
        Insert: Partial<Complaint> & {
          client_id: number;
          seller_id: number;
          subject: string;
          description: string;
        };
        Update: Partial<Complaint>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: Role;
      order_status: OrderStatus;
      complaint_status: ComplaintStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

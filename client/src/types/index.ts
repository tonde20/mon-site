export interface Ingredient {
  id: number;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  min_quantity: number;
  price_per_unit: number;
  supplier: string;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: number;
  ingredient_id: number;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  date: string;
  ingredient_name?: string;
  unit?: string;
}

export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  description: string;
  active: number;
}

export type OrderStatus = 'pending' | 'in_progress' | 'ready' | 'delivered' | 'cancelled';

export interface OrderItem {
  id?: number;
  order_id?: number;
  product_id?: number | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  customization?: string;
}

export interface Order {
  id: number;
  customer_name: string;
  customer_phone: string;
  status: OrderStatus;
  total_amount: number;
  paid_amount: number;
  payment_method: string;
  notes: string;
  delivery_date: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: number;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  date: string;
  order_id: number | null;
  payment_method: string;
  created_at: string;
}

export interface MonthlySummary {
  total_income: number;
  total_expense: number;
  net_balance: number;
  income_by_category: { category: string; total: number }[];
  expense_by_category: { category: string; total: number }[];
  daily_balances: { date: string; income: number; expense: number }[];
}

export interface DashboardStats {
  today_revenue: number;
  monthly_revenue: number;
  monthly_expense: number;
  pending_orders: number;
  low_stock_count: number;
  recent_orders: Order[];
  low_stock_items: Ingredient[];
  daily_revenue: { date: string; income: number; expense: number }[];
}

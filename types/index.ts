// Core type definitions for the POS system
export type UserRole = 'admin' | 'sales_person';

export interface Tenant {
  id: string;
  name: string;
  created_at: string;
  settings: {
    low_stock_threshold: number;
    currency: string;
    tax_rate?: number;
  };
}

export interface User {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  price: number | null; // Nullable for variable-priced products
  cost: number | null; // Nullable for variable-priced products
  base_unit: string;
  purchase_unit: string;
  unit_conversion_ratio: number;
  stock_quantity: number;
  low_stock_threshold: number;
  is_archived: boolean;
  is_variable_price: boolean; // New field for variable pricing
  image_url: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface Customer {
  id: string;
  tenant_id: string;
  name: string;
  phone?: string;
  email?: string;
  total_purchases: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  tenant_id: string;
  transaction_number: string;
  customer_id?: string;
  customer?: Customer;
  subtotal: number;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  discount_amount: number;
  total: number;
  payment_method: 'cash' | 'mpesa' | 'bank' | 'debt';
  status: 'completed' | 'debt_pending';
  created_at: string;
  created_by: string;
  served_by: string;
  served_by_user?: User;
  items: TransactionItem[];
}

export interface TransactionItem {
  id: string;
  tenant_id: string;
  transaction_id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  tenant_id: string;
  po_number: string;
  supplier_name: string;
  supplier_contact?: string;
  status: 'draft' | 'ordered' | 'received' | 'completed';
  expected_delivery_date: string;
  total_cost: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  items: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  tenant_id: string;
  purchase_order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  cost_per_unit: number;
  total_cost: number;
  created_at: string;
}

export interface Return {
  id: string;
  tenant_id: string;
  return_number: string;
  transaction_id: string;
  transaction?: Transaction;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  total_amount: number;
  approved_at?: string;
  approved_by?: string;
  created_at: string;
  created_by: string;
  items: ReturnItem[];
}

export interface ReturnItem {
  id: string;
  tenant_id: string;
  return_id: string;
  transaction_item_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
}

export interface StockHistory {
  id: string;
  tenant_id: string;
  product_id: string;
  type: 'restock' | 'adjustment' | 'sale' | 'return';
  quantity_change: number;
  quantity_after: number;
  reason: string;
  reference_id?: string;
  created_at: string;
  created_by: string;
  user?: User;
  product?: Product;
}

// Export tour types
export * from './tour';

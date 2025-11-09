export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          tenant_id: string
          total_purchases: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          tenant_id: string
          total_purchases?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          tenant_id?: string
          total_purchases?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_unit: string
          category: string
          cost: number
          created_at: string
          created_by: string
          description: string | null
          id: string
          image_url: string | null
          is_archived: boolean
          low_stock_threshold: number
          name: string
          price: number
          purchase_unit: string
          sku: string
          stock_quantity: number
          tenant_id: string
          unit_conversion_ratio: number
          updated_at: string
        }
        Insert: {
          base_unit: string
          category: string
          cost?: number
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_archived?: boolean
          low_stock_threshold?: number
          name: string
          price: number
          purchase_unit: string
          sku: string
          stock_quantity?: number
          tenant_id: string
          unit_conversion_ratio?: number
          updated_at?: string
        }
        Update: {
          base_unit?: string
          category?: string
          cost?: number
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_archived?: boolean
          low_stock_threshold?: number
          name?: string
          price?: number
          purchase_unit?: string
          sku?: string
          stock_quantity?: number
          tenant_id?: string
          unit_conversion_ratio?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          id: string
          name: string
          settings: Json
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          settings?: Json
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          settings?: Json
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          role: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          role: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          created_at: string
          created_by: string
          customer_id: string | null
          discount_amount: number
          discount_type: string
          discount_value: number
          id: string
          payment_method: string
          status: string
          subtotal: number
          tenant_id: string
          total: number
          transaction_number: string
        }
        Insert: {
          created_at?: string
          created_by: string
          customer_id?: string | null
          discount_amount?: number
          discount_type: string
          discount_value?: number
          id?: string
          payment_method: string
          status?: string
          subtotal: number
          tenant_id: string
          total: number
          transaction_number: string
        }
        Update: {
          created_at?: string
          created_by?: string
          customer_id?: string | null
          discount_amount?: number
          discount_type?: string
          discount_value?: number
          id?: string
          payment_method?: string
          status?: string
          subtotal?: number
          tenant_id?: string
          total?: number
          transaction_number?: string
        }
        Relationships: []
      }
      transaction_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          product_name: string
          product_sku: string
          quantity: number
          subtotal: number
          tenant_id: string
          transaction_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          product_name: string
          product_sku: string
          quantity: number
          subtotal: number
          tenant_id: string
          transaction_id: string
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          product_name?: string
          product_sku?: string
          quantity?: number
          subtotal?: number
          tenant_id?: string
          transaction_id?: string
          unit_price?: number
        }
        Relationships: []
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string
          expected_delivery_date: string | null
          id: string
          notes: string | null
          po_number: string
          status: string
          supplier_contact: string | null
          supplier_name: string
          tenant_id: string
          total_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          po_number: string
          status?: string
          supplier_contact?: string | null
          supplier_name: string
          tenant_id: string
          total_cost?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          po_number?: string
          status?: string
          supplier_contact?: string | null
          supplier_name?: string
          tenant_id?: string
          total_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          cost_per_unit: number
          created_at: string
          id: string
          product_id: string
          product_name: string
          purchase_order_id: string
          quantity: number
          tenant_id: string
          total_cost: number
        }
        Insert: {
          cost_per_unit: number
          created_at?: string
          id?: string
          product_id: string
          product_name: string
          purchase_order_id: string
          quantity: number
          tenant_id: string
          total_cost: number
        }
        Update: {
          cost_per_unit?: number
          created_at?: string
          id?: string
          product_id?: string
          product_name?: string
          purchase_order_id?: string
          quantity?: number
          tenant_id?: string
          total_cost?: number
        }
        Relationships: []
      }
      returns: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string
          id: string
          reason: string
          return_number: string
          status: string
          tenant_id: string
          total_amount: number
          transaction_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by: string
          id?: string
          reason: string
          return_number: string
          status?: string
          tenant_id: string
          total_amount: number
          transaction_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string
          id?: string
          reason?: string
          return_number?: string
          status?: string
          tenant_id?: string
          total_amount?: number
          transaction_id?: string
        }
        Relationships: []
      }
      return_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          product_name: string
          quantity: number
          return_id: string
          subtotal: number
          tenant_id: string
          transaction_item_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          product_name: string
          quantity: number
          return_id: string
          subtotal: number
          tenant_id: string
          transaction_item_id: string
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          return_id?: string
          subtotal?: number
          tenant_id?: string
          transaction_item_id?: string
          unit_price?: number
        }
        Relationships: []
      }
      stock_history: {
        Row: {
          created_at: string
          created_by: string
          id: string
          product_id: string
          quantity_after: number
          quantity_change: number
          reason: string | null
          reference_id: string | null
          tenant_id: string
          type: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          product_id: string
          quantity_after: number
          quantity_change: number
          reason?: string | null
          reference_id?: string | null
          tenant_id: string
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          product_id?: string
          quantity_after?: number
          quantity_change?: number
          reason?: string | null
          reference_id?: string | null
          tenant_id?: string
          type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_po_number: { Args: { p_tenant_id: string }; Returns: string }
      generate_return_number: { Args: { p_tenant_id: string }; Returns: string }
      generate_transaction_number: {
        Args: { p_tenant_id: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

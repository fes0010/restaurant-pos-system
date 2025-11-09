-- Database functions for POS system

-- Function to decrease product stock
CREATE OR REPLACE FUNCTION decrease_product_stock(
  p_product_id UUID,
  p_quantity DECIMAL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stock DECIMAL;
  v_new_stock DECIMAL;
BEGIN
  -- Get current stock with row lock
  SELECT stock_quantity INTO v_current_stock
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  -- Calculate new stock
  v_new_stock := v_current_stock - p_quantity;

  -- Update stock quantity
  UPDATE products
  SET 
    stock_quantity = v_new_stock,
    updated_at = NOW()
  WHERE id = p_product_id;

  -- Update stock history quantity_after
  UPDATE stock_history
  SET quantity_after = v_new_stock
  WHERE product_id = p_product_id
    AND quantity_after IS NULL
  ORDER BY created_at DESC
  LIMIT 1;
END;
$$;

-- Function to increment customer total purchases
CREATE OR REPLACE FUNCTION increment_customer_purchases(
  p_customer_id UUID,
  p_amount DECIMAL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE customers
  SET 
    total_purchases = total_purchases + p_amount,
    updated_at = NOW()
  WHERE id = p_customer_id;
END;
$$;

-- Function to restore stock (for returns)
CREATE OR REPLACE FUNCTION restore_product_stock(
  p_product_id UUID,
  p_quantity DECIMAL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_stock DECIMAL;
  v_new_stock DECIMAL;
BEGIN
  -- Get current stock with row lock
  SELECT stock_quantity INTO v_current_stock
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  -- Calculate new stock
  v_new_stock := v_current_stock + p_quantity;

  -- Update stock quantity
  UPDATE products
  SET 
    stock_quantity = v_new_stock,
    updated_at = NOW()
  WHERE id = p_product_id;

  -- Update stock history quantity_after
  UPDATE stock_history
  SET quantity_after = v_new_stock
  WHERE product_id = p_product_id
    AND quantity_after IS NULL
  ORDER BY created_at DESC
  LIMIT 1;
END;
$$;

-- Function to generate transaction number
CREATE OR REPLACE FUNCTION generate_transaction_number(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
  v_number TEXT;
BEGIN
  -- Get count of transactions for this tenant
  SELECT COUNT(*) INTO v_count
  FROM transactions
  WHERE tenant_id = p_tenant_id;
  
  -- Generate number with format TXN-YYYYMMDD-XXXX
  v_number := 'TXN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((v_count + 1)::TEXT, 4, '0');
  
  RETURN v_number;
END;
$$;

-- Function to generate purchase order number
CREATE OR REPLACE FUNCTION generate_po_number(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
  v_number TEXT;
BEGIN
  -- Get count of purchase orders for this tenant
  SELECT COUNT(*) INTO v_count
  FROM purchase_orders
  WHERE tenant_id = p_tenant_id;
  
  -- Generate number with format PO-YYYYMMDD-XXXX
  v_number := 'PO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((v_count + 1)::TEXT, 4, '0');
  
  RETURN v_number;
END;
$$;

-- Function to generate return number
CREATE OR REPLACE FUNCTION generate_return_number(p_tenant_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
  v_number TEXT;
BEGIN
  -- Get count of returns for this tenant
  SELECT COUNT(*) INTO v_count
  FROM returns
  WHERE tenant_id = p_tenant_id;
  
  -- Generate number with format RET-YYYYMMDD-XXXX
  v_number := 'RET-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((v_count + 1)::TEXT, 4, '0');
  
  RETURN v_number;
END;
$$;

-- Trigger function to auto-generate transaction number
CREATE OR REPLACE FUNCTION set_transaction_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.transaction_number IS NULL THEN
    NEW.transaction_number := generate_transaction_number(NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger function to auto-generate purchase order number
CREATE OR REPLACE FUNCTION set_po_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.po_number IS NULL THEN
    NEW.po_number := generate_po_number(NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger function to auto-generate return number
CREATE OR REPLACE FUNCTION set_return_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.return_number IS NULL THEN
    NEW.return_number := generate_return_number(NEW.tenant_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_set_transaction_number ON transactions;
CREATE TRIGGER trigger_set_transaction_number
  BEFORE INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION set_transaction_number();

DROP TRIGGER IF EXISTS trigger_set_po_number ON purchase_orders;
CREATE TRIGGER trigger_set_po_number
  BEFORE INSERT ON purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION set_po_number();

DROP TRIGGER IF EXISTS trigger_set_return_number ON returns;
CREATE TRIGGER trigger_set_return_number
  BEFORE INSERT ON returns
  FOR EACH ROW
  EXECUTE FUNCTION set_return_number();

-- Note: Run this SQL in your Supabase SQL Editor to create these functions and triggers

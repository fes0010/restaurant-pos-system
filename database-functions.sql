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

-- Note: Run this SQL in your Supabase SQL Editor to create these functions

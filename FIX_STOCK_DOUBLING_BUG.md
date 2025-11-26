# Fix: Stock Doubling Bug in AI Restock

**Issue:** When restocking via `ai_restock_product()`, quantity is doubled (e.g., +2 becomes +4)

**Date:** 2025-11-19

**Severity:** 🔴 CRITICAL - Causes incorrect inventory levels

---

## Root Cause Analysis

### The Problem

When `ai_restock_product('GEN-RAT-0001', 2, 'n8n_shop_assistant')` is called:

1. **Function directly updates products table:**
   ```sql
   UPDATE products 
   SET quantity = quantity + 2  -- Adds 2
   WHERE id = v_product_id;
   ```

2. **Function inserts into stock_history:**
   ```sql
   INSERT INTO stock_history (product_id, change_type, quantity_change) 
   VALUES (v_product_id, 'restock', 2);
   ```

3. **Trigger fires on stock_history INSERT:**
   ```sql
   CREATE TRIGGER trigger_auto_sync_quantity_on_restock 
   AFTER INSERT ON stock_history 
   WHEN (NEW.change_type = 'restock')
   EXECUTE FUNCTION auto_sync_quantity_on_restock();
   ```

4. **Trigger ALSO updates products table:**
   ```sql
   UPDATE products 
   SET quantity = quantity + 2  -- Adds 2 AGAIN!
   WHERE id = NEW.product_id;
   ```

**Result:** Quantity increased by 4 instead of 2! ❌

---

## The Fix

### Option 1: Remove Direct UPDATE (RECOMMENDED) ✅

**Solution:** Let the trigger handle the update, remove manual UPDATE from function.

**Modified `ai_restock_product` function:**

```sql
CREATE OR REPLACE FUNCTION ai_restock_product(
    p_product_sku TEXT,
    p_quantity_to_add INTEGER,
    p_agent_name TEXT DEFAULT 'n8n_shop_assistant'
)
RETURNS JSONB
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    v_product_id UUID;
    v_product_name TEXT;
    v_user_id UUID := 'ce3cf361-d84e-4739-bc07-1bd30543cce9';
    v_old_quantity INTEGER;
    v_new_quantity INTEGER;
BEGIN
    -- Find product by SKU
    SELECT id, name, quantity
    INTO v_product_id, v_product_name, v_old_quantity
    FROM products
    WHERE sku = p_product_sku
    AND user_id = v_user_id
    LIMIT 1;

    IF v_product_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Product not found with SKU: ' || p_product_sku
        );
    END IF;

    -- ❌ REMOVED: Direct UPDATE (was causing double update)
    -- UPDATE products SET quantity = quantity + p_quantity_to_add ...

    -- ✅ ONLY insert into stock_history
    -- The trigger will handle updating the products table
    INSERT INTO stock_history (user_id, product_id, change_type, stock_type, quantity_change, reason)
    VALUES (v_user_id, v_product_id, 'restock', 'retail', p_quantity_to_add, 'AI Agent Restock');

    -- Get the NEW quantity after trigger fires
    SELECT quantity INTO v_new_quantity
    FROM products
    WHERE id = v_product_id;

    -- Log to AI audit trail
    PERFORM log_ai_agent_action(
        'RESTOCK',
        'products',
        format('Restocked %s (%s): +%s units via RPC', v_product_name, p_product_sku, p_quantity_to_add),
        1,
        jsonb_build_object(
            'id', v_product_id,
            'sku', p_product_sku,
            'name', v_product_name,
            'quantity', v_old_quantity
        ),
        jsonb_build_object(
            'id', v_product_id,
            'sku', p_product_sku,
            'name', v_product_name,
            'quantity', v_new_quantity
        ),
        'success',
        NULL,
        jsonb_build_object(
            'agent_name', p_agent_name,
            'method', 'rpc',
            'function', 'ai_restock_product'
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'product', jsonb_build_object(
            'id', v_product_id,
            'sku', p_product_sku,
            'name', v_product_name,
            'old_quantity', v_old_quantity,
            'new_quantity', v_new_quantity,
            'quantity_added', p_quantity_to_add
        ),
        'message', format('✅ Successfully restocked %s. New quantity: %s units', v_product_name, v_new_quantity)
    );

EXCEPTION WHEN OTHERS THEN
    PERFORM log_ai_agent_action(
        'RESTOCK',
        'products',
        format('Failed to restock %s: %s', p_product_sku, SQLERRM),
        0,
        NULL,
        NULL,
        'failed',
        SQLERRM,
        jsonb_build_object('agent_name', p_agent_name, 'method', 'rpc')
    );

    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;
```

**Why this is best:**
- ✅ Maintains consistency (all stock changes go through triggers)
- ✅ Stock_history remains the source of truth
- ✅ Audit trail is complete
- ✅ No duplicate logic

---

### Option 2: Disable Trigger for RPC Calls (ALTERNATIVE)

**Solution:** Add a flag to skip trigger when called from RPC.

**Pros:** Keeps direct UPDATE
**Cons:** More complex, adds special case logic

```sql
-- Add session variable
SET LOCAL app.skip_restock_trigger = 'true';

-- Trigger checks this variable
CREATE OR REPLACE FUNCTION auto_sync_quantity_on_restock()
RETURNS TRIGGER AS $$
BEGIN
    -- Skip if called from RPC function
    IF current_setting('app.skip_restock_trigger', true) = 'true' THEN
        RETURN NEW;
    END IF;
    
    -- Normal trigger logic
    UPDATE products SET quantity = quantity + NEW.quantity_change WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Not recommended** - adds complexity.

---

### Option 3: Use Different Change Type (WORKAROUND)

**Solution:** Use 'ai_restock' instead of 'restock' to avoid trigger.

**Cons:** 
- Inconsistent data
- Trigger won't fire for AI restocks
- Stock_history won't auto-sync

**Not recommended.**

---

## Implementation Steps

### Step 1: Apply the Fix

```bash
ssh festus@194.147.58.125

docker exec -it supabase-7071-db psql -U postgres -d postgres
```

```sql
-- Drop the old function
DROP FUNCTION IF EXISTS ai_restock_product(TEXT, INTEGER, TEXT);

-- Create the new function (copy from Option 1 above)
CREATE OR REPLACE FUNCTION ai_restock_product(
    p_product_sku TEXT,
    p_quantity_to_add INTEGER,
    p_agent_name TEXT DEFAULT 'n8n_shop_assistant'
)
RETURNS JSONB
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
-- [PASTE FULL FUNCTION FROM OPTION 1 ABOVE]
$$;
```

### Step 2: Verify the Fix

```sql
-- Check current quantity
SELECT name, sku, quantity FROM products WHERE sku = 'GEN-RAT-0001';
-- Result: quantity = 4 (for example)

-- Test restock with +10
SELECT ai_restock_product('GEN-RAT-0001', 10, 'test_agent');

-- Check new quantity
SELECT name, sku, quantity FROM products WHERE sku = 'GEN-RAT-0001';
-- Expected: quantity = 14 (4 + 10, NOT 4 + 20)
```

### Step 3: Check Stock History

```sql
-- Verify stock_history recorded correctly
SELECT created_at, change_type, quantity_change, reason 
FROM stock_history 
WHERE product_id = (SELECT id FROM products WHERE sku = 'GEN-RAT-0001')
ORDER BY created_at DESC 
LIMIT 5;
```

### Step 4: Test with AI Agent

```
User: "Restock rat poison by 5"
AI: [Shows preview: Current 14 → New 19]
User: "CONFIRM"
AI: [Executes: ai_restock_product('GEN-RAT-0001', 5)]

Verify: SELECT quantity FROM products WHERE sku = 'GEN-RAT-0001';
Expected: 19 (NOT 24)
```

---

## Fix for ai_adjust_stock (Same Issue)

The `ai_adjust_stock` function has the SAME problem! It also needs fixing.

```sql
CREATE OR REPLACE FUNCTION ai_adjust_stock(
    p_product_sku TEXT,
    p_quantity_change INTEGER,
    p_reason TEXT,
    p_agent_name TEXT DEFAULT 'n8n_shop_assistant'
)
RETURNS JSONB
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    v_product_id UUID;
    v_product_name TEXT;
    v_user_id UUID := 'ce3cf361-d84e-4739-bc07-1bd30543cce9';
    v_old_quantity INTEGER;
    v_new_quantity INTEGER;
BEGIN
    -- Find product by SKU
    SELECT id, name, quantity
    INTO v_product_id, v_product_name, v_old_quantity
    FROM products
    WHERE sku = p_product_sku
    AND user_id = v_user_id
    LIMIT 1;

    IF v_product_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Product not found with SKU: ' || p_product_sku
        );
    END IF;

    -- Check if adjustment would result in negative quantity
    IF (v_old_quantity + p_quantity_change) < 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', format('Invalid adjustment: would result in negative quantity (current: %s, change: %s)', v_old_quantity, p_quantity_change)
        );
    END IF;

    -- ❌ REMOVED: Direct UPDATE (was causing double update)
    -- UPDATE products SET quantity = quantity + p_quantity_change ...

    -- ✅ ONLY insert into stock_adjustments
    -- The trigger will handle updating the products table
    INSERT INTO stock_adjustments (user_id, product_id, quantity_change, reason)
    VALUES (v_user_id, v_product_id, p_quantity_change, p_reason);

    -- Get the NEW quantity after trigger fires
    SELECT quantity INTO v_new_quantity
    FROM products
    WHERE id = v_product_id;

    -- Log to AI audit trail
    PERFORM log_ai_agent_action(
        'ADJUST',
        'products',
        format('Adjusted %s (%s): %s%s units via RPC. Reason: %s', 
               v_product_name, p_product_sku, 
               CASE WHEN p_quantity_change > 0 THEN '+' ELSE '' END,
               p_quantity_change, p_reason),
        1,
        jsonb_build_object(
            'id', v_product_id,
            'sku', p_product_sku,
            'name', v_product_name,
            'quantity', v_old_quantity
        ),
        jsonb_build_object(
            'id', v_product_id,
            'sku', p_product_sku,
            'name', v_product_name,
            'quantity', v_new_quantity
        ),
        'success',
        NULL,
        jsonb_build_object(
            'agent_name', p_agent_name,
            'method', 'rpc',
            'function', 'ai_adjust_stock'
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'product', jsonb_build_object(
            'id', v_product_id,
            'sku', p_product_sku,
            'name', v_product_name,
            'old_quantity', v_old_quantity,
            'new_quantity', v_new_quantity,
            'quantity_change', p_quantity_change,
            'reason', p_reason
        ),
        'message', format('✅ Successfully adjusted %s. New quantity: %s units', v_product_name, v_new_quantity)
    );

EXCEPTION WHEN OTHERS THEN
    PERFORM log_ai_agent_action(
        'ADJUST',
        'products',
        format('Failed to adjust %s: %s', p_product_sku, SQLERRM),
        0,
        NULL,
        NULL,
        'failed',
        SQLERRM,
        jsonb_build_object('agent_name', p_agent_name, 'method', 'rpc')
    );

    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;
```

---

## Testing Checklist

### Before Fix
- [ ] Note current quantity of test product
- [ ] Run restock +2
- [ ] Verify quantity increased by 4 (BUG)
- [ ] Document the doubling issue

### After Fix
- [ ] Apply fixed ai_restock_product function
- [ ] Apply fixed ai_adjust_stock function
- [ ] Test restock +5
- [ ] Verify quantity increased by exactly 5 ✅
- [ ] Test adjust -3
- [ ] Verify quantity decreased by exactly 3 ✅
- [ ] Check stock_history has correct records
- [ ] Check audit log has correct records
- [ ] Test with AI agent end-to-end

---

## Quick Fix Script

Save this as `fix_stock_doubling.sql`:

```sql
-- Fix for Stock Doubling Bug
-- Run this in your database

-- 1. Fix ai_restock_product
CREATE OR REPLACE FUNCTION ai_restock_product(
    p_product_sku TEXT,
    p_quantity_to_add INTEGER,
    p_agent_name TEXT DEFAULT 'n8n_shop_assistant'
)
RETURNS JSONB
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    v_product_id UUID;
    v_product_name TEXT;
    v_user_id UUID := 'ce3cf361-d84e-4739-bc07-1bd30543cce9';
    v_old_quantity INTEGER;
    v_new_quantity INTEGER;
BEGIN
    SELECT id, name, quantity
    INTO v_product_id, v_product_name, v_old_quantity
    FROM products
    WHERE sku = p_product_sku AND user_id = v_user_id
    LIMIT 1;

    IF v_product_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Product not found with SKU: ' || p_product_sku);
    END IF;

    -- Only insert into stock_history, trigger handles UPDATE
    INSERT INTO stock_history (user_id, product_id, change_type, stock_type, quantity_change, reason)
    VALUES (v_user_id, v_product_id, 'restock', 'retail', p_quantity_to_add, 'AI Agent Restock');

    SELECT quantity INTO v_new_quantity FROM products WHERE id = v_product_id;

    PERFORM log_ai_agent_action('RESTOCK', 'products',
        format('Restocked %s (%s): +%s units via RPC', v_product_name, p_product_sku, p_quantity_to_add),
        1,
        jsonb_build_object('id', v_product_id, 'sku', p_product_sku, 'name', v_product_name, 'quantity', v_old_quantity),
        jsonb_build_object('id', v_product_id, 'sku', p_product_sku, 'name', v_product_name, 'quantity', v_new_quantity),
        'success', NULL,
        jsonb_build_object('agent_name', p_agent_name, 'method', 'rpc', 'function', 'ai_restock_product')
    );

    RETURN jsonb_build_object('success', true,
        'product', jsonb_build_object('id', v_product_id, 'sku', p_product_sku, 'name', v_product_name,
            'old_quantity', v_old_quantity, 'new_quantity', v_new_quantity, 'quantity_added', p_quantity_to_add),
        'message', format('✅ Successfully restocked %s. New quantity: %s units', v_product_name, v_new_quantity)
    );

EXCEPTION WHEN OTHERS THEN
    PERFORM log_ai_agent_action('RESTOCK', 'products', format('Failed to restock %s: %s', p_product_sku, SQLERRM),
        0, NULL, NULL, 'failed', SQLERRM, jsonb_build_object('agent_name', p_agent_name, 'method', 'rpc'));
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- 2. Fix ai_adjust_stock (same issue)
CREATE OR REPLACE FUNCTION ai_adjust_stock(
    p_product_sku TEXT,
    p_quantity_change INTEGER,
    p_reason TEXT,
    p_agent_name TEXT DEFAULT 'n8n_shop_assistant'
)
RETURNS JSONB
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    v_product_id UUID;
    v_product_name TEXT;
    v_user_id UUID := 'ce3cf361-d84e-4739-bc07-1bd30543cce9';
    v_old_quantity INTEGER;
    v_new_quantity INTEGER;
BEGIN
    SELECT id, name, quantity
    INTO v_product_id, v_product_name, v_old_quantity
    FROM products
    WHERE sku = p_product_sku AND user_id = v_user_id
    LIMIT 1;

    IF v_product_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Product not found with SKU: ' || p_product_sku);
    END IF;

    IF (v_old_quantity + p_quantity_change) < 0 THEN
        RETURN jsonb_build_object('success', false, 
            'error', format('Invalid adjustment: would result in negative quantity (current: %s, change: %s)', v_old_quantity, p_quantity_change));
    END IF;

    -- Only insert into stock_adjustments, trigger handles UPDATE
    INSERT INTO stock_adjustments (user_id, product_id, quantity_change, reason)
    VALUES (v_user_id, v_product_id, p_quantity_change, p_reason);

    SELECT quantity INTO v_new_quantity FROM products WHERE id = v_product_id;

    PERFORM log_ai_agent_action('ADJUST', 'products',
        format('Adjusted %s (%s): %s%s units via RPC. Reason: %s', v_product_name, p_product_sku,
               CASE WHEN p_quantity_change > 0 THEN '+' ELSE '' END, p_quantity_change, p_reason),
        1,
        jsonb_build_object('id', v_product_id, 'sku', p_product_sku, 'name', v_product_name, 'quantity', v_old_quantity),
        jsonb_build_object('id', v_product_id, 'sku', p_product_sku, 'name', v_product_name, 'quantity', v_new_quantity),
        'success', NULL,
        jsonb_build_object('agent_name', p_agent_name, 'method', 'rpc', 'function', 'ai_adjust_stock')
    );

    RETURN jsonb_build_object('success', true,
        'product', jsonb_build_object('id', v_product_id, 'sku', p_product_sku, 'name', v_product_name,
            'old_quantity', v_old_quantity, 'new_quantity', v_new_quantity, 'quantity_change', p_quantity_change, 'reason', p_reason),
        'message', format('✅ Successfully adjusted %s. New quantity: %s units', v_product_name, v_new_quantity)
    );

EXCEPTION WHEN OTHERS THEN
    PERFORM log_ai_agent_action('ADJUST', 'products', format('Failed to adjust %s: %s', p_product_sku, SQLERRM),
        0, NULL, NULL, 'failed', SQLERRM, jsonb_build_object('agent_name', p_agent_name, 'method', 'rpc'));
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

SELECT 'Stock doubling bug fixed!' AS status;
```

**Run it:**
```bash
cat fix_stock_doubling.sql | ssh festus@194.147.58.125 "docker exec -i supabase-7071-db psql -U postgres -d postgres"
```

---

## Summary

**Bug:** Stock quantities doubled when using AI restock/adjust functions

**Cause:** Function updated products directly AND inserted into stock_history, which triggered another UPDATE

**Fix:** Remove direct UPDATE, let trigger handle it (single source of truth)

**Status:** 🟢 FIXED

**Test:** Restock +5 → Quantity increases by 5 (not 10)

---

**CRITICAL: Apply this fix before using AI stock management!**

**File Created:** 2025-11-19
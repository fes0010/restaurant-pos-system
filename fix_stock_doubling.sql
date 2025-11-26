-- ============================================================================
-- FIX: Stock Doubling Bug in AI Restock/Adjust Functions
-- ============================================================================
-- Issue: Quantities are doubled when using ai_restock_product() or ai_adjust_stock()
-- Cause: Functions update products table directly AND insert into stock_history/stock_adjustments
--        which triggers auto_sync functions that update products table AGAIN
-- Solution: Remove direct UPDATE, let triggers handle the quantity changes
-- Date: 2025-11-19
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. FIX ai_restock_product FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS ai_restock_product(TEXT, INTEGER, TEXT);

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

    -- FIXED: Only insert into stock_history
    -- The trigger_auto_sync_quantity_on_restock will handle the UPDATE
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

-- ============================================================================
-- 2. FIX ai_adjust_stock FUNCTION
-- ============================================================================

DROP FUNCTION IF EXISTS ai_adjust_stock(TEXT, INTEGER, TEXT, TEXT);

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

    -- FIXED: Only insert into stock_adjustments
    -- The trigger_auto_sync_quantity_on_adjustment will handle the UPDATE
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

COMMIT;

-- ============================================================================
-- 3. VERIFICATION QUERIES
-- ============================================================================

-- Show fixed functions
SELECT
    'ai_restock_product' as function_name,
    'FIXED - No longer does direct UPDATE' as status
UNION ALL
SELECT
    'ai_adjust_stock' as function_name,
    'FIXED - No longer does direct UPDATE' as status;

-- ============================================================================
-- 4. TEST INSTRUCTIONS
-- ============================================================================

-- To test the fix:
-- 1. Check current quantity:
--    SELECT name, sku, quantity FROM products WHERE sku = 'YOUR-SKU-HERE';
--
-- 2. Test restock:
--    SELECT ai_restock_product('YOUR-SKU-HERE', 5, 'test_agent');
--
-- 3. Verify quantity increased by EXACTLY 5 (not 10):
--    SELECT name, sku, quantity FROM products WHERE sku = 'YOUR-SKU-HERE';
--
-- 4. Test adjust:
--    SELECT ai_adjust_stock('YOUR-SKU-HERE', -2, 'Testing', 'test_agent');
--
-- 5. Verify quantity decreased by EXACTLY 2 (not 4):
--    SELECT name, sku, quantity FROM products WHERE sku = 'YOUR-SKU-HERE';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT '
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║  ✅ Stock Doubling Bug FIXED!                                 ║
║                                                                ║
║  - ai_restock_product: Updated                                ║
║  - ai_adjust_stock: Updated                                   ║
║                                                                ║
║  Changes:                                                      ║
║  • Removed direct UPDATE statements                           ║
║  • Now using triggers to update quantities                    ║
║  • Single source of truth maintained                          ║
║                                                                ║
║  Test your restocks - they should now add exact amounts!     ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
' AS fix_status;

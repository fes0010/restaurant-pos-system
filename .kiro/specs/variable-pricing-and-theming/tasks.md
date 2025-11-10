# Implementation Plan

- [x] 1. Set up database schema for variable pricing
  - Add is_variable_price boolean column to products table
  - Make price column nullable
  - Add check constraint to ensure fixed-price products have a price
  - Update database types in types/supabase.ts
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [x] 2. Update TypeScript types and interfaces
  - [x] 2.1 Update Product interface with is_variable_price field
    - Modify Product type in types/index.ts
    - Make price field nullable (number | null)
    - _Requirements: 3.5_
  
  - [x] 2.2 Update product service functions
    - Update createProduct to handle is_variable_price
    - Update updateProduct to handle is_variable_price
    - Add validation for price based on is_variable_price flag
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Enhance ProductForm for variable pricing
  - [x] 3.1 Add variable price toggle to form
    - Add checkbox/toggle for "Variable Price Product"
    - Add helper text explaining immediate sale behavior
    - Style toggle with appropriate spacing
    - _Requirements: 3.1_
  
  - [x] 3.2 Update form validation schema
    - Make price field conditionally required based on is_variable_price
    - Add validation message for missing price on fixed-price products
    - Update form schema with refined validation
    - _Requirements: 3.2, 3.3_
  
  - [x] 3.3 Update form submission logic
    - Handle is_variable_price in create/update mutations
    - Allow null price for variable-priced products
    - Test product creation and editing with both modes
    - _Requirements: 3.1, 3.4_

- [x] 4. Implement semantic color system
  - [x] 4.1 Add color variables to globals.css
    - Add monetary value colors (profit, loss, revenue, cost, neutral)
    - Add status colors (success, pending, cancelled, inactive)
    - Add stock level colors (in-stock, low-stock, out-of-stock)
    - Add alert level colors (info, warning, error, success)
    - Define colors for both light and dark modes
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 4.2 Create SemanticBadge component
    - Create components/ui/semantic-badge.tsx
    - Implement badge variants for all semantic colors
    - Add proper TypeScript types for variants
    - Style with appropriate padding and border radius
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 4.3 Create value display components
    - Create components/ui/value-display.tsx
    - Implement MonetaryValue component with color coding
    - Implement StatusDisplay component with color coding
    - Add currency formatting for monetary values
    - _Requirements: 4.1, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 5. Update ProductCard for variable pricing
  - [x] 5.1 Add price input field for variable-priced products
    - Detect is_variable_price flag
    - Render price input field instead of fixed price display
    - Add "Enter Price" badge indicator
    - Style input field with currency prefix (KES)
    - Add numeric input validation (positive numbers, 2 decimals)
    - _Requirements: 1.1, 1.2, 2.2, 2.3_
  
  - [x] 5.2 Implement button state management
    - Disable + button when price is empty or zero
    - Enable + button when valid price is entered
    - Change button appearance based on product type
    - Add visual feedback for button states
    - _Requirements: 1.3, 2.2_
  
  - [x] 5.3 Add immediate sale handler
    - Create onImmediateSale prop handler
    - Validate price before triggering sale
    - Show loading state during transaction
    - Clear price input after successful sale
    - Handle errors with appropriate messages
    - _Requirements: 1.4, 1.5_

- [x] 6. Implement immediate sale transaction flow
  - [x] 6.1 Create immediate sale service function
    - Create handleImmediateSale function in lib/services/transactions.ts
    - Validate custom price (greater than 0)
    - Check stock availability
    - Create transaction with single item
    - Update stock quantity
    - Return transaction details
    - _Requirements: 1.4, 1.5_
  
  - [x] 6.2 Integrate immediate sale in POS page
    - Add onImmediateSale handler to POS page
    - Pass handler to ProductCard components
    - Show success toast after sale completion
    - Handle errors with user-friendly messages
    - Optionally trigger receipt printing
    - _Requirements: 1.4, 1.5, 2.2_
  
  - [x] 6.3 Ensure fixed-price products maintain cart workflow
    - Verify fixed-price products still use onAddToCart
    - Test cart functionality with fixed-price products
    - Ensure no regression in existing POS workflow
    - _Requirements: 2.1, 2.4, 2.5_

- [x] 7. Apply semantic colors to Dashboard
  - [x] 7.1 Update KPICard component
    - Use MonetaryValue component for revenue (blue)
    - Use MonetaryValue component for profit (green)
    - Use MonetaryValue component for cost (amber)
    - Add color coding for positive/negative trends
    - _Requirements: 4.1, 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 7.2 Update LowStockTable component
    - Use stock level colors for quantity display
    - Apply stock-out (red), stock-low (amber), stock-in (green)
    - Update stock status badges with semantic colors
    - _Requirements: 4.4_

- [x] 8. Apply semantic colors to Transactions
  - [x] 8.1 Update TransactionList component
    - Use SemanticBadge for transaction status
    - Apply success (green) for completed transactions
    - Apply pending (amber) for debt_pending transactions
    - Use MonetaryValue for total amounts
    - _Requirements: 4.2, 6.1, 6.2_
  
  - [x] 8.2 Update TransactionDetails component
    - Use MonetaryValue for subtotal, discount, total
    - Apply semantic colors to payment method badges
    - Use StatusDisplay for transaction status
    - _Requirements: 4.1, 4.2, 5.1, 5.2, 5.3_

- [x] 9. Apply semantic colors to Purchase Orders
  - [x] 9.1 Update PurchaseOrderList component
    - Use SemanticBadge for PO status
    - Apply inactive (gray) for draft
    - Apply info (blue) for ordered
    - Apply pending (amber) for received
    - Apply success (green) for completed
    - _Requirements: 4.2, 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [x] 9.2 Update PurchaseOrderDetails component
    - Use MonetaryValue for cost values (amber)
    - Apply semantic colors to status badges
    - Update item cost displays with cost color
    - _Requirements: 4.1, 5.5_

- [x] 10. Apply semantic colors to Returns
  - [x] 10.1 Update ReturnsList component
    - Use SemanticBadge for return status
    - Apply pending (amber) for pending returns
    - Apply success (green) for approved returns
    - Apply cancelled (red) for rejected returns
    - Use MonetaryValue for return amounts
    - _Requirements: 4.2, 6.1, 6.2, 6.3_
  
  - [x] 10.2 Update ReturnDetailsModal component
    - Use StatusDisplay for return status
    - Apply semantic colors to reason text
    - Use MonetaryValue for item amounts
    - _Requirements: 4.1, 4.2_

- [x] 11. Apply semantic colors to Inventory
  - [x] 11.1 Update ProductList component
    - Use stock level colors for quantity display
    - Apply stock-out (red), stock-low (amber), stock-in (green)
    - Use MonetaryValue for price (revenue) and cost displays
    - Add visual indicator for variable-priced products
    - _Requirements: 4.4, 5.4, 5.5_
  
  - [x] 11.2 Update StockHistoryDrawer component
    - Use semantic colors for quantity changes
    - Apply profit (green) for positive changes (restock, return)
    - Apply loss (red) for negative changes (sale, adjustment)
    - Use neutral (gray) for zero changes
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 12. Update existing badge components
  - [x] 12.1 Migrate existing Badge usage to SemanticBadge
    - Identify all Badge component usages
    - Replace with SemanticBadge where semantic meaning exists
    - Keep generic Badge for non-semantic uses
    - Update imports across components
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 13. Testing and validation
  - [ ] 13.1 Test variable pricing workflow
    - Create variable-priced product
    - Test immediate sale with valid price
    - Test immediate sale with invalid price (0, negative, empty)
    - Test immediate sale with out-of-stock product
    - Verify transaction created correctly
    - Verify stock updated correctly
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.2, 2.3_
  
  - [ ] 13.2 Test fixed-price product workflow
    - Verify fixed-price products still add to cart
    - Test cart with multiple fixed-price items
    - Verify checkout process unchanged
    - Test mixed scenarios (if applicable)
    - _Requirements: 2.1, 2.4, 2.5_
  
  - [ ] 13.3 Test semantic color system
    - Verify colors in light mode
    - Verify colors in dark mode
    - Test theme switching
    - Check contrast ratios for accessibility
    - Test on different screen sizes
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ] 13.4 Cross-browser and device testing
    - Test on Chrome, Firefox, Safari, Edge
    - Test on mobile devices (iOS, Android)
    - Verify numeric keyboard on mobile for price input
    - Test touch interactions for variable-price cards
    - _Requirements: 1.1, 1.2, 2.2_

- [ ] 14. Documentation and polish
  - [ ] 14.1 Update user documentation
    - Document variable pricing feature in admin guide
    - Document immediate sale workflow in sales person guide
    - Add screenshots of variable-price product cards
    - Explain color coding system
    - _Requirements: 1.1, 2.2, 2.3, 4.1_
  
  - [ ] 14.2 Add accessibility improvements
    - Ensure price input has proper labels
    - Add ARIA attributes for button states
    - Verify screen reader announcements
    - Test keyboard navigation
    - Ensure color is not the only indicator
    - _Requirements: 4.5, 7.5_
  
  - [ ] 14.3 Performance optimization
    - Optimize immediate sale transaction speed
    - Ensure theme switching is instant
    - Test with large product catalogs
    - Profile and optimize re-renders
    - _Requirements: 1.4, 1.5_


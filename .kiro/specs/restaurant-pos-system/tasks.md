# Implementation Plan

## Project Setup and Foundation

- [x] 1. Initialize Next.js project with TypeScript and core dependencies
  - Create Next.js 14 project with App Router and TypeScript
  - Install and configure Tailwind CSS
  - Install shadcn/ui CLI and initialize
  - Install core dependencies: @supabase/supabase-js, @tanstack/react-query, react-hook-form, zod, recharts
  - Configure next-pwa for Progressive Web App support
  - Set up project folder structure (app, components, lib, types, hooks)
  - _Requirements: 9.1, 9.8, 10.1, 10.2_

- [x] 2. Configure Supabase connection and environment variables
  - Create Supabase project and obtain credentials
  - Set up environment variables (.env.local, .env.example)
  - Create Supabase client utility with TypeScript types
  - Configure Supabase Auth settings
  - _Requirements: 1.2, 1.4_

- [x] 3. Set up database schema and Row Level Security policies
  - Create tenants table with settings column
  - Create users table extending auth.users
  - Create products table with all fields
  - Create stock_history table for audit trail
  - Create customers table
  - Create transactions and transaction_items tables
  - Create purchase_orders and purchase_order_items tables
  - Create returns and return_items tables
  - Add indexes for performance optimization
  - Implement RLS policies for all tables with tenant isolation
  - Create database functions for auto-generating numbers (transaction_number, po_number, return_number)
  - _Requirements: 1.1, 1.4, 3.1-3.11, 4.1-4.11, 5.1-5.12, 6.1-6.8, 7.1-7.9_

## Authentication and Authorization

- [x] 4. Implement authentication system
  - Create AuthContext with user, tenant, and session state
  - Implement signIn function with Supabase Auth
  - Implement signOut function
  - Implement changePassword function
  - Create useAuth hook for consuming auth context
  - Create ProtectedRoute component with role checking
  - Build login page with email/password form
  - Add form validation with Zod
  - Handle authentication errors with toast notifications
  - _Requirements: 1.2, 1.3, 1.5_

- [x] 5. Create initial tenant setup flow
  - Build tenant registration page for first-time setup
  - Create form to collect business name and admin user details
  - Implement tenant creation in database
  - Create admin user linked to tenant
  - Set up JWT claims with tenant_id and role
  - Redirect to dashboard after successful setup
  - _Requirements: 1.1, 1.4_

## Core UI Components and Layout

- [x] 6. Build application layout and navigation
  - Create AppLayout component with sidebar and header
  - Implement responsive sidebar with mobile drawer
  - Add navigation menu with role-based item visibility
  - Create header with user profile dropdown, theme toggle, and logout
  - Implement breadcrumb navigation
  - Add loading states and skeleton screens
  - _Requirements: 9.1, 9.4_

- [x] 7. Implement theme system
  - Create ThemeProvider with dark/light mode support
  - Implement theme toggle component
  - Persist theme preference to localStorage
  - Configure Tailwind CSS for dark mode
  - Apply theme to all shadcn/ui components
  - _Requirements: 9.2, 9.3_

- [x] 8. Create reusable UI components
  - Build DataTable component with sorting, filtering, and pagination
  - Create SearchInput with debouncing and clear button
  - Build DateRangePicker with preset ranges
  - Create ConfirmDialog for confirmations
  - Build toast notification system
  - Add loading spinner and skeleton components
  - _Requirements: 9.4, 9.5_

## Dashboard (Admin Only)

- [x] 9. Implement dashboard KPI calculations
  - Create API route/service to fetch dashboard metrics
  - Calculate total revenue from transactions
  - Calculate total profit using product costs
  - Calculate total sales count
  - Identify low stock products below threshold
  - Implement date range filtering for metrics
  - Add React Query hooks for dashboard data
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.6_

- [x] 10. Build dashboard UI components
  - Create DashboardKPIs component with metric cards
  - Build SalesTrendChart with Recharts
  - Implement date range selector for charts
  - Create LowStockTable with product list
  - Add quick restock action buttons
  - Implement role-based access (admin only)
  - _Requirements: 2.1-2.7_

## Inventory Management (Admin Only)

- [x] 11. Implement product CRUD operations
  - Create products service with Supabase queries
  - Build ProductList page with data table
  - Implement product search with fuzzy matching
  - Add category filtering
  - Create ProductForm modal for create/edit
  - Implement form validation with Zod
  - Add product archiving functionality
  - Handle product creation with stock initialization
  - _Requirements: 3.1, 3.3, 3.7, 3.8, 3.9, 3.11_

- [x] 12. Build stock management features
  - Create StockAdjustmentModal for restock and adjustments
  - Implement stock quantity updates with reason tracking
  - Create stock_history records for all changes
  - Build StockHistoryDrawer to display audit trail
  - Add filtering by stock history type
  - Implement pagination for stock history
  - _Requirements: 3.4, 3.5, 3.6_

- [x] 13. Add inventory export functionality
  - Create CSV export utility function
  - Implement export button in ProductList
  - Generate CSV with all product fields
  - Handle special characters and formatting
  - Add date formatting for timestamps
  - _Requirements: 3.10, 11.1, 11.3, 11.4, 11.5, 11.6_

## Point of Sale

- [x] 14. Build POS product search and selection
  - Create ProductSearch component with autocomplete
  - Implement real-time search with debouncing
  - Add barcode/SKU search functionality
  - Build product grid with load-more pagination
  - Display product price and stock availability
  - Prevent selection of out-of-stock products
  - _Requirements: 4.1, 4.10, 4.11_

- [x] 15. Implement shopping cart functionality
  - Create Cart component with line items
  - Add quantity controls (increase/decrease/remove)
  - Implement cart persistence to localStorage
  - Restore cart on page refresh
  - Calculate subtotal and total
  - Add discount input (percentage or fixed)
  - Apply discount to total calculation
  - Clear cart functionality
  - _Requirements: 4.2, 4.3, 4.6, 4.7_

- [x] 16. Build customer management in POS
  - Create customer selection dropdown
  - Implement customer search
  - Build quick customer creation modal
  - Display customer purchase history
  - Link customer to transaction
  - _Requirements: 4.4_

- [x] 17. Implement checkout and payment processing
  - Create CheckoutModal component
  - Add payment method selector (Cash, M-Pesa, Bank, Debt)
  - Implement amount tendered and change calculation for cash
  - Create transaction record in database
  - Create transaction_items records
  - Update product stock quantities
  - Create stock_history records for sale
  - Generate unique transaction number
  - Clear cart after successful checkout
  - _Requirements: 4.5, 4.7, 4.8_

- [x] 18. Build receipt generation and printing
  - Create ReceiptPrint component with transaction details
  - Display business info, items, payment method, and totals
  - Implement browser print functionality
  - Add print button in checkout success
  - _Requirements: 4.8, 4.9_

## Transaction Management

- [x] 19. Build transaction list and filtering
  - Create TransactionList page with data table
  - Implement date range filtering (Today, Week, Month, Custom, All)
  - Add payment method filter
  - Implement search by customer name or transaction number
  - Display transaction summary (date, customer, total, payment method)
  - Add pagination for transaction list
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.8_

- [x] 20. Implement transaction details view
  - Create TransactionDetails modal/drawer
  - Display full transaction information
  - Show itemized breakdown with quantities and prices
  - Display customer and payment information
  - Add reprint receipt button
  - Add create return button
  - _Requirements: 6.5, 6.7_

- [x] 21. Add transaction export functionality
  - Implement CSV export for transactions
  - Apply date range filtering to export
  - Include all transaction fields and items
  - Format dates and currency values
  - _Requirements: 6.6, 11.2, 11.3, 11.4, 11.5, 11.6_

## Purchase Order Management (Admin Only)

- [x] 22. Implement purchase order CRUD operations
  - Create purchase orders service with Supabase queries
  - Build PurchaseOrderList page with data table
  - Add status filtering (Draft, Ordered, Received, Completed)
  - Implement date range filtering
  - Create PurchaseOrderForm modal for create/edit
  - Add supplier information fields
  - Build line items section with product selector
  - Calculate total cost automatically
  - Generate unique PO number
  - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.6, 5.7, 5.8, 5.12_

- [x] 23. Build purchase order status management
  - Create PurchaseOrderDetails view
  - Implement status update buttons (Draft → Ordered → Received → Completed)
  - Add confirmation dialogs for status changes
  - Record status change timestamps
  - Display status history
  - _Requirements: 5.3, 5.4, 5.10, 5.11_

- [x] 24. Implement inventory restock from purchase orders
  - Add "Restock Inventory" button when PO status is Received
  - Create modal to confirm restock quantities
  - Update product stock quantities
  - Create stock_history records with PO reference
  - Link stock changes to purchase order
  - _Requirements: 5.9_

## Returns Management

- [x] 25. Build return creation workflow (PENDING - Services and components needed)
  - Create ReturnsList page with data table
  - Add status filtering (Pending, Approved, Rejected)
  - Build CreateReturnModal component
  - Implement transaction selector
  - Display transaction items for selection
  - Add quantity input for partial returns
  - Require reason text area
  - Generate unique return number
  - Set initial status to Pending
  - _Requirements: 7.1, 7.2, 7.3_

- [x] 26. Implement return approval workflow (Admin Only) (PENDING)
  - Create ReturnApprovalCard component
  - Display return details and items
  - Add approve and reject buttons
  - Implement approval confirmation
  - Update return status on approval/rejection
  - Restore stock quantities on approval
  - Create stock_history records for approved returns
  - Record approval timestamp and user
  - Restrict approval to admin role
  - _Requirements: 7.4, 7.5, 7.6, 7.7, 7.8, 7.9_

## User Management (Admin Only)

- [x] 27. Implement user CRUD operations (PENDING - Services and components needed)
  - Create users service with Supabase queries
  - Build UserList page with data table
  - Add role filtering (Admin, Sales Person)
  - Implement search by name or email
  - Create UserForm modal for create/edit
  - Add email, full name, role, and password fields
  - Implement password strength validation
  - Create user in Supabase Auth and users table
  - Link user to current tenant
  - Add pagination for user list
  - _Requirements: 8.1, 8.2, 8.3, 8.7, 8.8, 8.9_

- [x] 28. Build user password management (PENDING)
  - Create ChangePasswordModal component
  - Add current password field (for self)
  - Add new password and confirmation fields
  - Implement password validation rules
  - Allow admins to change any user's password
  - Update password via Supabase Auth
  - _Requirements: 8.4, 1.5_

- [x] 29. Implement user deletion with safeguards (PENDING)
  - Add delete button in UserList
  - Create confirmation dialog with warning
  - Implement soft delete or maintain transaction history
  - Prevent deletion of last admin user
  - Handle deletion errors gracefully
  - _Requirements: 8.5, 8.6_

## Progressive Web App

- [x] 30. Configure PWA manifest and service worker (PENDING - Configuration needed)
  - Create manifest.json with app metadata
  - Add app icons (192x192, 512x512)
  - Configure next-pwa in next.config.js
  - Set up service worker for asset caching
  - Test PWA installation on mobile and desktop
  - Add splash screen configuration
  - _Requirements: 10.1, 10.2, 10.3_

## Testing and Quality Assurance

- [x] 31. Write unit tests for core business logic
  - Test price calculation functions
  - Test discount application logic
  - Test unit conversion calculations
  - Test form validation schemas
  - Test date formatting utilities
  - Test CSV export functions

- [x] 32. Write integration tests for key features
  - Test POS checkout flow
  - Test product creation and stock updates
  - Test transaction filtering and search
  - Test purchase order status transitions
  - Test return approval workflow

## Deployment and Documentation

- [x] 33. Prepare for deployment
  - Create production environment variables template
  - Configure Vercel project settings
  - Set up Supabase production project
  - Run database migrations on production
  - Test production build locally
  - Deploy to Vercel
  - Verify all features in production
  - _Requirements: All_

- [x] 34. Create user documentation
  - Write admin user guide
  - Write sales person user guide
  - Document common workflows
  - Create troubleshooting guide
  - Add inline help tooltips in UI

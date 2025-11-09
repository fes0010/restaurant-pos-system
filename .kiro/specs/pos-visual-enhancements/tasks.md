# Implementation Plan

- [x] 1. Set up database and storage infrastructure
  - Add image_url column to products table via migration
  - Create Supabase Storage bucket for product images
  - Configure storage policies for public read and authenticated write access
  - Update TypeScript types to include image_url field
  - _Requirements: 2.1, 2.2, 2.5_

- [x] 2. Create image upload component for product form
  - [x] 2.1 Create ImageUpload component with file input and drag-and-drop support
    - Implement file selection UI with preview
    - Add drag-and-drop zone for image files
    - Display current image if exists
    - _Requirements: 2.1, 2.2_
  
  - [x] 2.2 Implement image validation logic
    - Validate file type (JPEG, PNG, WebP, GIF)
    - Validate file size (max 5MB)
    - Display validation error messages
    - _Requirements: 2.3, 2.4_
  
  - [x] 2.3 Implement image upload to Supabase Storage
    - Generate unique filename with product ID and timestamp
    - Upload file to product-images bucket
    - Get and return public URL
    - Handle upload errors with user-friendly messages
    - _Requirements: 2.5, 2.6_
  
  - [x] 2.4 Integrate ImageUpload into ProductForm component
    - Add ImageUpload component to form
    - Update form schema to include image_url
    - Handle image URL in create/update mutations
    - Test image upload flow in product creation and editing
    - _Requirements: 2.1, 2.2_

- [x] 3. Create ProductCard component with image display
  - [x] 3.1 Build ProductCard component structure
    - Create card layout with image, name, price, and stock info
    - Implement placeholder image for products without images
    - Add responsive card sizing
    - Style card with hover/active states
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 3.2 Implement add-to-cart functionality in ProductCard
    - Add touch-friendly button (44x44px minimum)
    - Implement click/tap handler to add product to cart
    - Add visual feedback on interaction
    - Disable button for out-of-stock products
    - _Requirements: 1.4, 4.1, 4.2_
  
  - [x] 3.3 Add image optimization with Supabase transformations
    - Use image transformations for thumbnail display (400x400)
    - Implement lazy loading for product images
    - Add loading states for images
    - Handle image load errors with fallback
    - _Requirements: 1.3_

- [x] 4. Create ProductCardGrid component
  - [x] 4.1 Build grid layout with responsive columns
    - Implement responsive grid (2 cols mobile, 3 tablet, 4 desktop)
    - Add search bar at top
    - Integrate with existing useProducts hook
    - _Requirements: 1.1, 1.5, 5.1_
  
  - [x] 4.2 Implement search and filter functionality
    - Add debounced search input (300ms delay)
    - Filter products by name, SKU, and barcode
    - Display loading states during search
    - Show empty state when no results found
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 4.3 Add touch scrolling support
    - Ensure smooth scrolling on touch devices
    - Add momentum scrolling for mobile
    - Test on various screen sizes
    - _Requirements: 4.5_

- [x] 5. Create FloatingCart component
  - [x] 5.1 Build collapsed cart state
    - Create floating button/badge on right edge
    - Display cart icon, item count, and total
    - Position fixed on right side of screen
    - Style with appropriate z-index
    - _Requirements: 3.1, 3.2_
  
  - [x] 5.2 Build expanded cart state
    - Create slide-in panel from right
    - Add semi-transparent backdrop
    - Display full cart items and details
    - Include all cart actions (update quantity, remove, discount, checkout)
    - Add close button
    - _Requirements: 3.4_
  
  - [x] 5.3 Implement expand/collapse logic
    - Add toggle handler for expand/collapse
    - Implement smooth CSS animations
    - Handle keyboard events (Escape to close)
    - _Requirements: 3.3, 3.4_
  
  - [x] 5.4 Add auto-collapse behavior
    - Collapse when clicking outside cart
    - Collapse when search field is focused
    - Auto-collapse 2 seconds after adding item
    - Prevent collapse when interacting with cart
    - _Requirements: 3.5, 3.6, 3.7_
  
  - [x] 5.5 Ensure touch-friendly interactions
    - Test tap events on touch devices
    - Verify touch target sizes (44x44px minimum)
    - Add touch feedback animations
    - Test outside tap detection on mobile
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 6. Integrate new components into POS page
  - [x] 6.1 Replace ProductSearch with ProductCardGrid
    - Update POS page layout to use ProductCardGrid
    - Remove old ProductSearch component
    - Adjust layout for full-width card grid
    - _Requirements: 1.1, 1.5_
  
  - [x] 6.2 Replace fixed Cart with FloatingCart
    - Update POS page to use FloatingCart component
    - Remove old fixed cart layout
    - Manage cart expanded state in page component
    - Wire up all cart event handlers
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [x] 6.3 Update page layout for floating cart
    - Adjust grid layout to full width (remove cart column)
    - Update CustomerSelector positioning
    - Ensure proper spacing and responsive behavior
    - Test layout on various screen sizes
    - _Requirements: 1.5, 3.1_

- [x] 7. Polish and optimize
  - [x] 7.1 Add loading and error states
    - Implement skeleton loaders for product cards
    - Add error boundaries for image loading
    - Display user-friendly error messages
    - Add retry mechanisms for failed operations
    - _Requirements: 2.6, 5.3_
  
  - [x] 7.2 Optimize performance
    - Implement image lazy loading
    - Add proper caching headers for images
    - Optimize animation performance
    - Test with large product catalogs
    - _Requirements: 1.1, 5.5_
  
  - [x] 7.3 Ensure accessibility
    - Add alt text for all product images
    - Implement keyboard navigation
    - Add ARIA labels for cart states
    - Test with screen readers
    - Verify color contrast ratios
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 7.4 Cross-browser and device testing
    - Test on Chrome, Firefox, Safari, Edge
    - Test on iOS Safari and Chrome Mobile
    - Verify touch interactions on tablets
    - Test with different screen sizes
    - Verify responsive breakpoints
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

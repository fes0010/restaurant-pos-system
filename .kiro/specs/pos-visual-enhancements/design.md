# Design Document

## Overview

This design enhances the POS interface with a visual card-based product display system, image management capabilities for products, and an improved floating cart experience. The solution leverages Supabase Storage for image hosting and implements a responsive, touch-friendly interface optimized for both desktop and mobile/tablet devices.

## Architecture

### High-Level Components

1. **Product Card Grid Component** - Displays products as visual cards with images
2. **Image Upload Component** - Handles product image selection and upload
3. **Floating Cart Component** - Collapsible cart overlay with auto-collapse behavior
4. **Storage Integration** - Supabase Storage bucket for product images
5. **Database Schema Extension** - Add image_url field to products table

### Component Hierarchy

```
POSPage
├── ProductCardGrid (replaces ProductSearch)
│   ├── SearchBar
│   └── ProductCard[]
│       ├── ProductImage
│       ├── ProductInfo
│       └── AddToCartButton
├── FloatingCart (replaces fixed Cart)
│   ├── CartToggle (collapsed state)
│   └── CartContent (expanded state)
│       ├── CartItems[]
│       └── CheckoutSection
└── CustomerSelector
```

## Components and Interfaces

### 1. Database Schema Changes

Add image storage support to the products table:

```sql
-- Migration: add_product_images
ALTER TABLE products 
ADD COLUMN image_url TEXT;

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- Storage policies for product images
CREATE POLICY "Public product images are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);
```

### 2. ProductCard Component

**File**: `components/pos/ProductCard.tsx`

**Props**:
```typescript
interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
}
```

**Features**:
- Display product image (or placeholder if none)
- Show product name, price, and stock status
- Touch-friendly add-to-cart button (44x44px minimum)
- Visual feedback on tap/click
- Disabled state for out-of-stock items
- Responsive card sizing

**Layout**:
- Image at top (aspect ratio 4:3 or 1:1)
- Product name below image
- Price prominently displayed
- Stock indicator
- Add to cart button at bottom

### 3. ProductCardGrid Component

**File**: `components/pos/ProductCardGrid.tsx`

**Props**:
```typescript
interface ProductCardGridProps {
  onAddToCart: (product: Product) => void
}
```

**Features**:
- Search bar at top
- Responsive grid layout (1-4 columns based on screen size)
- Debounced search (300ms)
- Loading states
- Empty states
- Infinite scroll or pagination
- Filter by category (optional enhancement)

**Grid Breakpoints**:
- Mobile: 2 columns
- Tablet: 3 columns
- Desktop: 4 columns

### 4. ImageUpload Component

**File**: `components/inventory/ImageUpload.tsx`

**Props**:
```typescript
interface ImageUploadProps {
  currentImageUrl?: string | null
  onUpload: (url: string) => void
  productId?: string
}
```

**Features**:
- File input with drag-and-drop support
- Image preview
- File validation (type and size)
- Upload progress indicator
- Error handling
- Delete existing image option

**Validation Rules**:
- Accepted formats: JPEG, PNG, WebP, GIF
- Maximum file size: 5MB
- Recommended dimensions: 800x800px

**Upload Flow**:
1. User selects image file
2. Validate file type and size
3. Generate unique filename: `{productId}-{timestamp}.{ext}`
4. Upload to Supabase Storage bucket `product-images`
5. Get public URL
6. Return URL to parent component
7. Parent updates product record

### 5. FloatingCart Component

**File**: `components/pos/FloatingCart.tsx`

**Props**:
```typescript
interface FloatingCartProps {
  items: CartItem[]
  discount: number
  isExpanded: boolean
  onToggle: () => void
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemoveItem: (productId: string) => void
  onUpdateDiscount: (discount: number) => void
  onClearCart: () => void
  onCheckout: () => void
}
```

**States**:
- **Collapsed**: Shows compact indicator with item count and total
- **Expanded**: Shows full cart details

**Features**:
- Fixed position on right side of screen
- Smooth expand/collapse animation
- Auto-collapse after 2 seconds when item added
- Click outside to collapse
- Search focus triggers collapse
- Touch-friendly interactions
- Z-index management for overlay

**Collapsed State**:
- Floating button/badge on right edge
- Shows: cart icon, item count, total amount
- Tap to expand

**Expanded State**:
- Slides in from right
- Semi-transparent backdrop
- Full cart functionality
- Close button
- Scrollable item list

### 6. Image Service

**File**: `lib/services/images.ts`

**Functions**:
```typescript
// Upload product image
async function uploadProductImage(
  file: File,
  productId: string
): Promise<string>

// Delete product image
async function deleteProductImage(
  imageUrl: string
): Promise<void>

// Get public URL for image
function getProductImageUrl(
  path: string
): string
```

## Data Models

### Extended Product Type

```typescript
interface Product {
  // ... existing fields
  image_url: string | null
}
```

### Cart State Management

```typescript
interface CartState {
  items: CartItem[]
  discount: number
  isExpanded: boolean
  lastAddedAt: number | null
}
```

## Error Handling

### Image Upload Errors

1. **File Too Large**: Display toast with message "Image must be under 5MB"
2. **Invalid Format**: Display toast with message "Please upload a JPEG, PNG, WebP, or GIF image"
3. **Upload Failed**: Display toast with message "Failed to upload image. Please try again"
4. **Network Error**: Display toast with message "Network error. Check your connection"

### Product Loading Errors

1. **Failed to Load Products**: Display error state with retry button
2. **No Products Found**: Display empty state with helpful message
3. **Image Load Failed**: Display placeholder image

## Testing Strategy

### Unit Tests (Optional)
- Image validation logic
- URL generation functions
- Cart state management

### Integration Tests
- Image upload flow
- Product card interactions
- Cart expand/collapse behavior
- Search and filter functionality

### E2E Tests
- Complete POS workflow with images
- Add products to cart from card grid
- Floating cart interactions
- Checkout with product images
- Image upload in product form

### Manual Testing Checklist
- Test on various screen sizes
- Test touch interactions on tablet
- Verify image upload with different file types
- Test cart auto-collapse timing
- Verify outside click detection
- Test with slow network (image loading)
- Test with no images (placeholders)

## Performance Considerations

### Image Optimization

1. **Storage**: Use Supabase Storage image transformations
2. **Loading**: Implement lazy loading for product images
3. **Caching**: Leverage browser caching with proper headers
4. **Thumbnails**: Generate and serve optimized thumbnails for cards
5. **CDN**: Utilize Supabase CDN for faster image delivery

### Recommended Image Transformations

```typescript
// For product cards (thumbnail)
const thumbnailUrl = supabase.storage
  .from('product-images')
  .getPublicUrl(path, {
    transform: {
      width: 400,
      height: 400,
      resize: 'cover'
    }
  })

// For product details (full size)
const fullSizeUrl = supabase.storage
  .from('product-images')
  .getPublicUrl(path, {
    transform: {
      width: 800,
      height: 800,
      resize: 'contain'
    }
  })
```

### Cart Performance

1. **State Management**: Use React state for cart (already implemented)
2. **LocalStorage**: Persist cart state (already implemented)
3. **Debouncing**: Debounce auto-collapse timer
4. **Animation**: Use CSS transforms for smooth animations

## UI/UX Design Patterns

### Product Card Design

```
┌─────────────────────┐
│                     │
│   Product Image     │
│   (4:3 ratio)       │
│                     │
├─────────────────────┤
│ Product Name        │
│ KES 1,200.00        │
│ 50 pieces           │
│ [+ Add to Cart]     │
└─────────────────────┘
```

### Floating Cart States

**Collapsed**:
```
                    ┌──────┐
                    │ 🛒 3 │
                    │ 450  │
                    └──────┘
```

**Expanded**:
```
┌─────────────────────────┐
│ Cart (3 items)    [×]   │
├─────────────────────────┤
│ Item 1          KES 150 │
│ Item 2          KES 200 │
│ Item 3          KES 100 │
├─────────────────────────┤
│ Subtotal:      KES 450  │
│ Discount:      KES 0    │
│ Total:         KES 450  │
│                         │
│ [Checkout]              │
└─────────────────────────┘
```

### Touch Target Sizes

- Minimum touch target: 44x44px
- Spacing between targets: 8px minimum
- Button padding: 12px minimum

### Color Scheme

- Primary action (Add to Cart): Primary brand color
- Out of stock: Muted/disabled state
- Low stock warning: Yellow/amber
- Cart badge: Accent color with high contrast

## Accessibility

1. **Images**: Provide alt text for all product images
2. **Keyboard Navigation**: Support tab navigation through cards
3. **Screen Readers**: Proper ARIA labels for cart state
4. **Focus Management**: Manage focus when cart expands/collapses
5. **Color Contrast**: Ensure WCAG AA compliance

## Migration Strategy

### Phase 1: Database and Storage Setup
1. Run migration to add image_url column
2. Create storage bucket
3. Set up storage policies

### Phase 2: Image Upload in Product Form
1. Add ImageUpload component to ProductForm
2. Update product creation/edit logic
3. Test image upload flow

### Phase 3: Product Card Grid
1. Create ProductCard component
2. Create ProductCardGrid component
3. Replace ProductSearch in POS page
4. Test card interactions

### Phase 4: Floating Cart
1. Create FloatingCart component
2. Implement expand/collapse logic
3. Add auto-collapse behavior
4. Replace fixed cart in POS page
5. Test cart interactions

### Phase 5: Polish and Optimization
1. Add image transformations
2. Implement lazy loading
3. Optimize animations
4. Final testing and bug fixes

## Security Considerations

1. **Storage Policies**: Ensure proper RLS policies for image access
2. **File Validation**: Validate file types on both client and server
3. **File Size Limits**: Enforce maximum file size
4. **Sanitization**: Sanitize filenames to prevent injection
5. **Authentication**: Require authentication for image uploads

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Touch events for mobile devices
- Fallback for older browsers (graceful degradation)

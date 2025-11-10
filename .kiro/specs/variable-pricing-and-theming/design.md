# Design Document

## Overview

This design introduces variable pricing capabilities for products without predefined prices and implements a comprehensive semantic color system throughout the application. Variable-priced products will allow immediate sale completion with custom pricing, while fixed-price products maintain the existing cart workflow. The enhanced theming system provides visual differentiation for monetary values, statuses, and other data types across both light and dark modes.

## Architecture

### High-Level Components

1. **Variable Pricing System** - Database schema changes and product card modifications
2. **Immediate Checkout Flow** - Direct transaction processing for variable-priced products
3. **Semantic Color System** - Theme extension with contextual colors
4. **Product Form Enhancement** - UI for marking products as variable-priced
5. **Enhanced UI Components** - Updated badges, status indicators, and value displays

### Data Flow

```
Variable-Price Product Flow:
User enters price → Validates input → Clicks + button → Creates transaction → Processes payment → Clears input

Fixed-Price Product Flow:
User clicks add to cart → Adds to cart → Multiple items → Checkout → Creates transaction
```

## Components and Interfaces

### 1. Database Schema Changes

Add variable pricing support to the products table:

```sql
-- Migration: add_variable_pricing
ALTER TABLE products 
ADD COLUMN is_variable_price BOOLEAN DEFAULT FALSE;

-- Update price column to allow NULL for variable-priced products
ALTER TABLE products 
ALTER COLUMN price DROP NOT NULL;

-- Add check constraint to ensure fixed-price products have a price
ALTER TABLE products
ADD CONSTRAINT check_price_required 
CHECK (
  (is_variable_price = FALSE AND price IS NOT NULL) OR
  (is_variable_price = TRUE)
);

-- Add comment for clarity
COMMENT ON COLUMN products.is_variable_price IS 
'When true, product requires manual price entry at POS and completes sale immediately';
```

### 2. Updated Product Type

**File**: `types/index.ts`

```typescript
export interface Product {
  // ... existing fields
  is_variable_price: boolean;
  price: number | null; // Now nullable for variable-priced products
}
```

### 3. Enhanced ProductCard Component

**File**: `components/pos/ProductCard.tsx`

**Props**:
```typescript
interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product) => void
  onImmediateSale: (product: Product, customPrice: number) => void
}
```

**Features**:
- Detect if product is variable-priced via `is_variable_price` flag
- For variable-priced products:
  - Display price input field instead of fixed price
  - Show "Enter Price" badge/indicator
  - Disable + button until valid price entered
  - On + click: trigger immediate sale with custom price
  - Clear input after sale completion
- For fixed-priced products:
  - Display fixed price
  - Show standard "Add to Cart" button
  - Maintain existing cart behavior

**Layout for Variable-Price Product**:
```
┌─────────────────────┐
│                     │
│   Product Image     │
│   [Enter Price]     │ ← Badge
│                     │
├─────────────────────┤
│ Product Name        │
│ [KES ______]        │ ← Price Input
│ 50 pieces           │
│ [+] Complete Sale   │ ← Disabled until price entered
└─────────────────────┘
```

**State Management**:
```typescript
const [customPrice, setCustomPrice] = useState<string>('')
const [isProcessing, setIsProcessing] = useState(false)

const isPriceValid = customPrice && parseFloat(customPrice) > 0
```

### 4. Immediate Sale Handler

**File**: `app/pos/page.tsx` (or create `lib/services/immediate-sale.ts`)

**Function**:
```typescript
async function handleImmediateSale(
  product: Product,
  customPrice: number,
  customerId?: string
): Promise<void> {
  // 1. Validate price
  if (customPrice <= 0) {
    throw new Error('Invalid price')
  }

  // 2. Check stock availability
  if (product.stock_quantity <= 0) {
    throw new Error('Product out of stock')
  }

  // 3. Create transaction with single item
  const transaction = await createTransaction({
    customer_id: customerId,
    items: [{
      product_id: product.id,
      product_name: product.name,
      product_sku: product.sku,
      quantity: 1,
      unit_price: customPrice,
      subtotal: customPrice
    }],
    subtotal: customPrice,
    discount_type: 'fixed',
    discount_value: 0,
    discount_amount: 0,
    total: customPrice,
    payment_method: 'cash', // Default or prompt user
    status: 'completed'
  })

  // 4. Update stock
  await updateStock(product.id, -1)

  // 5. Show success notification
  toast.success(`Sale completed: ${product.name} - KES ${customPrice}`)

  // 6. Optionally print receipt
  // printReceipt(transaction)
}
```

### 5. Enhanced ProductForm Component

**File**: `components/inventory/ProductForm.tsx`

**Changes**:
- Add checkbox/toggle for "Variable Price Product"
- When checked:
  - Make price field optional
  - Show helper text: "Price will be entered at point of sale"
  - Add visual indicator
- When unchecked:
  - Require price field (existing behavior)

**Form Schema Update**:
```typescript
const productSchema = z.object({
  // ... existing fields
  is_variable_price: z.boolean().default(false),
  price: z.number().nullable().refine((val, ctx) => {
    const isVariablePrice = ctx.parent.is_variable_price
    if (!isVariablePrice && (val === null || val <= 0)) {
      return false
    }
    return true
  }, {
    message: 'Price is required for fixed-price products'
  }),
})
```

**UI Addition**:
```tsx
<div className="flex items-center space-x-2">
  <input
    type="checkbox"
    id="is_variable_price"
    {...register('is_variable_price')}
    className="h-4 w-4"
  />
  <Label htmlFor="is_variable_price">
    Variable Price Product
    <span className="block text-xs text-muted-foreground">
      Price will be entered at point of sale and completes sale immediately
    </span>
  </Label>
</div>
```

### 6. Semantic Color System

**File**: `app/globals.css`

**Extended Theme Variables**:
```css
@theme {
  /* Existing colors... */
  
  /* Monetary Values */
  --color-profit: #16a34a;        /* Green for profit */
  --color-profit-foreground: #ffffff;
  --color-loss: #dc2626;          /* Red for loss */
  --color-loss-foreground: #ffffff;
  --color-revenue: #2563eb;       /* Blue for revenue */
  --color-revenue-foreground: #ffffff;
  --color-cost: #f59e0b;          /* Amber for cost */
  --color-cost-foreground: #ffffff;
  --color-neutral: #71717a;       /* Gray for neutral/zero */
  --color-neutral-foreground: #ffffff;
  
  /* Status Colors */
  --color-status-success: #16a34a;    /* Green - completed, active */
  --color-status-success-foreground: #ffffff;
  --color-status-pending: #f59e0b;    /* Amber - pending, in-progress */
  --color-status-pending-foreground: #ffffff;
  --color-status-cancelled: #dc2626;  /* Red - cancelled, failed */
  --color-status-cancelled-foreground: #ffffff;
  --color-status-inactive: #71717a;   /* Gray - inactive, disabled */
  --color-status-inactive-foreground: #ffffff;
  
  /* Stock Levels */
  --color-stock-in: #16a34a;      /* Green - in stock */
  --color-stock-in-foreground: #ffffff;
  --color-stock-low: #f59e0b;     /* Amber - low stock */
  --color-stock-low-foreground: #ffffff;
  --color-stock-out: #dc2626;     /* Red - out of stock */
  --color-stock-out-foreground: #ffffff;
  
  /* Alert Levels */
  --color-alert-info: #2563eb;    /* Blue - informational */
  --color-alert-info-foreground: #ffffff;
  --color-alert-warning: #f59e0b; /* Amber - warning */
  --color-alert-warning-foreground: #ffffff;
  --color-alert-error: #dc2626;   /* Red - error */
  --color-alert-error-foreground: #ffffff;
  --color-alert-success: #16a34a; /* Green - success */
  --color-alert-success-foreground: #ffffff;
}

.dark {
  /* Existing dark colors... */
  
  /* Monetary Values - Dark Mode */
  --color-profit: #22c55e;
  --color-profit-foreground: #052e16;
  --color-loss: #ef4444;
  --color-loss-foreground: #450a0a;
  --color-revenue: #3b82f6;
  --color-revenue-foreground: #172554;
  --color-cost: #fbbf24;
  --color-cost-foreground: #451a03;
  --color-neutral: #a1a1aa;
  --color-neutral-foreground: #18181b;
  
  /* Status Colors - Dark Mode */
  --color-status-success: #22c55e;
  --color-status-success-foreground: #052e16;
  --color-status-pending: #fbbf24;
  --color-status-pending-foreground: #451a03;
  --color-status-cancelled: #ef4444;
  --color-status-cancelled-foreground: #450a0a;
  --color-status-inactive: #a1a1aa;
  --color-status-inactive-foreground: #18181b;
  
  /* Stock Levels - Dark Mode */
  --color-stock-in: #22c55e;
  --color-stock-in-foreground: #052e16;
  --color-stock-low: #fbbf24;
  --color-stock-low-foreground: #451a03;
  --color-stock-out: #ef4444;
  --color-stock-out-foreground: #450a0a;
  
  /* Alert Levels - Dark Mode */
  --color-alert-info: #3b82f6;
  --color-alert-info-foreground: #172554;
  --color-alert-warning: #fbbf24;
  --color-alert-warning-foreground: #451a03;
  --color-alert-error: #ef4444;
  --color-alert-error-foreground: #450a0a;
  --color-alert-success: #22c55e;
  --color-alert-success-foreground: #052e16;
}
```

### 7. Semantic Badge Component

**File**: `components/ui/semantic-badge.tsx`

```typescript
import { cn } from '@/lib/utils'

type BadgeVariant = 
  | 'profit' | 'loss' | 'revenue' | 'cost' | 'neutral'
  | 'success' | 'pending' | 'cancelled' | 'inactive'
  | 'stock-in' | 'stock-low' | 'stock-out'
  | 'info' | 'warning' | 'error'

interface SemanticBadgeProps {
  variant: BadgeVariant
  children: React.ReactNode
  className?: string
}

export function SemanticBadge({ variant, children, className }: SemanticBadgeProps) {
  const variantStyles = {
    // Monetary
    profit: 'bg-profit text-profit-foreground',
    loss: 'bg-loss text-loss-foreground',
    revenue: 'bg-revenue text-revenue-foreground',
    cost: 'bg-cost text-cost-foreground',
    neutral: 'bg-neutral text-neutral-foreground',
    
    // Status
    success: 'bg-status-success text-status-success-foreground',
    pending: 'bg-status-pending text-status-pending-foreground',
    cancelled: 'bg-status-cancelled text-status-cancelled-foreground',
    inactive: 'bg-status-inactive text-status-inactive-foreground',
    
    // Stock
    'stock-in': 'bg-stock-in text-stock-in-foreground',
    'stock-low': 'bg-stock-low text-stock-low-foreground',
    'stock-out': 'bg-stock-out text-stock-out-foreground',
    
    // Alerts
    info: 'bg-alert-info text-alert-info-foreground',
    warning: 'bg-alert-warning text-alert-warning-foreground',
    error: 'bg-alert-error text-alert-error-foreground',
  }

  return (
    <span className={cn(
      'inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold',
      variantStyles[variant],
      className
    )}>
      {children}
    </span>
  )
}
```

### 8. Value Display Components

**File**: `components/ui/value-display.tsx`

```typescript
import { cn } from '@/lib/utils'

interface MonetaryValueProps {
  value: number
  type: 'profit' | 'loss' | 'revenue' | 'cost' | 'neutral'
  showSign?: boolean
  className?: string
}

export function MonetaryValue({ value, type, showSign = false, className }: MonetaryValueProps) {
  const colorClasses = {
    profit: 'text-profit',
    loss: 'text-loss',
    revenue: 'text-revenue',
    cost: 'text-cost',
    neutral: 'text-neutral',
  }

  const formatValue = (val: number) => {
    const formatted = `KES ${Math.abs(val).toLocaleString('en-KE', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`
    
    if (showSign && val !== 0) {
      return val > 0 ? `+${formatted}` : `-${formatted}`
    }
    
    return formatted
  }

  return (
    <span className={cn('font-semibold', colorClasses[type], className)}>
      {formatValue(value)}
    </span>
  )
}

interface StatusDisplayProps {
  status: string
  variant: 'success' | 'pending' | 'cancelled' | 'inactive'
  className?: string
}

export function StatusDisplay({ status, variant, className }: StatusDisplayProps) {
  const colorClasses = {
    success: 'text-status-success',
    pending: 'text-status-pending',
    cancelled: 'text-status-cancelled',
    inactive: 'text-status-inactive',
  }

  return (
    <span className={cn('font-medium', colorClasses[variant], className)}>
      {status}
    </span>
  )
}
```

## Data Models

### Updated Product Interface

```typescript
interface Product {
  id: string
  tenant_id: string
  sku: string
  name: string
  description: string
  category: string
  price: number | null  // Nullable for variable-priced products
  cost: number
  base_unit: string
  purchase_unit: string
  unit_conversion_ratio: number
  stock_quantity: number
  low_stock_threshold: number
  is_archived: boolean
  is_variable_price: boolean  // New field
  image_url: string | null
  created_at: string
  updated_at: string
  created_by: string
}
```

## Error Handling

### Variable Pricing Errors

1. **Invalid Price**: Display toast "Please enter a valid price greater than 0"
2. **Out of Stock**: Display toast "Product is out of stock"
3. **Transaction Failed**: Display toast "Failed to complete sale. Please try again"
4. **Network Error**: Display toast "Network error. Check your connection"

### Form Validation Errors

1. **Missing Price for Fixed-Price Product**: "Price is required for fixed-price products"
2. **Invalid Variable Price Flag**: "Cannot change pricing mode with active transactions"

## UI/UX Patterns

### Variable-Price Product Card

**Visual Indicators**:
- Badge: "Enter Price" in amber/yellow color
- Price input with currency prefix (KES)
- Disabled + button (gray) until price entered
- Enabled + button (primary color) when valid price entered
- Button text: "Complete Sale" or just "+" icon

**Interaction Flow**:
1. User sees product card with "Enter Price" badge
2. User taps/clicks price input field
3. User enters price (numeric keyboard on mobile)
4. + button becomes enabled
5. User clicks + button
6. Loading state on button
7. Success toast appears
8. Price input clears
9. Ready for next sale

### Color Usage Examples

**Dashboard KPIs**:
- Total Revenue: Blue (`revenue`)
- Total Profit: Green (`profit`)
- Total Cost: Amber (`cost`)
- Net Loss: Red (`loss`)

**Transaction Status**:
- Completed: Green badge (`success`)
- Debt Pending: Amber badge (`pending`)

**Purchase Order Status**:
- Draft: Gray badge (`inactive`)
- Ordered: Blue badge (`info`)
- Received: Amber badge (`pending`)
- Completed: Green badge (`success`)

**Return Status**:
- Pending: Amber badge (`pending`)
- Approved: Green badge (`success`)
- Rejected: Red badge (`cancelled`)

**Stock Indicators**:
- In Stock: Green text (`stock-in`)
- Low Stock: Amber text (`stock-low`)
- Out of Stock: Red text (`stock-out`)

## Testing Strategy

### Unit Tests (Optional)
- Price validation logic
- Variable price detection
- Color variant selection logic

### Integration Tests
- Variable-price product creation
- Immediate sale transaction flow
- Price input validation
- Stock update after immediate sale

### E2E Tests
- Create variable-price product
- Complete immediate sale from POS
- Verify transaction created
- Verify stock updated
- Test with fixed-price products (existing flow)
- Verify color theming in different contexts

### Manual Testing Checklist
- Create variable-price product
- Verify price field is optional
- Test immediate sale with valid price
- Test immediate sale with invalid price (0, negative)
- Test immediate sale with out-of-stock product
- Verify fixed-price products still work
- Test color theming in light mode
- Test color theming in dark mode
- Verify WCAG AA contrast ratios
- Test on mobile devices
- Verify numeric keyboard on mobile for price input

## Performance Considerations

### Immediate Sale Optimization

1. **Transaction Creation**: Use optimistic updates for instant feedback
2. **Stock Updates**: Batch stock updates if multiple immediate sales
3. **Receipt Generation**: Generate asynchronously if printing
4. **State Management**: Clear price input immediately after submission

### Theme Performance

1. **CSS Variables**: Use native CSS variables for instant theme switching
2. **No Runtime Calculations**: All colors defined at build time
3. **Minimal Repaints**: Color changes don't trigger layout recalculations

## Accessibility

### Variable Pricing

1. **Input Labels**: Proper labels for price input fields
2. **Button States**: Clear disabled/enabled states with ARIA attributes
3. **Error Messages**: Screen reader announcements for validation errors
4. **Keyboard Navigation**: Full keyboard support for price entry

### Color System

1. **Contrast Ratios**: All color combinations meet WCAG AA (4.5:1 for text)
2. **Not Color-Only**: Status also indicated by text/icons, not just color
3. **Color Blind Friendly**: Use distinct hues and brightness levels
4. **High Contrast Mode**: Support system high contrast preferences

## Migration Strategy

### Phase 1: Database and Type Updates
1. Run migration to add `is_variable_price` column
2. Update TypeScript types
3. Update product service functions

### Phase 2: Product Form Enhancement
1. Add variable price toggle to ProductForm
2. Update form validation
3. Test product creation/editing

### Phase 3: Variable-Price Product Card
1. Update ProductCard component
2. Add price input field
3. Implement immediate sale handler
4. Test POS workflow

### Phase 4: Semantic Color System
1. Add color variables to globals.css
2. Create SemanticBadge component
3. Create value display components
4. Test in light and dark modes

### Phase 5: Apply Colors Throughout App
1. Update Dashboard KPIs
2. Update Transaction status badges
3. Update Purchase Order status badges
4. Update Return status badges
5. Update stock indicators
6. Update monetary value displays

### Phase 6: Testing and Polish
1. Comprehensive testing
2. Accessibility audit
3. Performance optimization
4. Documentation updates

## Security Considerations

1. **Price Validation**: Server-side validation of custom prices
2. **Minimum Price**: Optional minimum price enforcement
3. **Audit Trail**: Log all variable-price transactions
4. **Permission Checks**: Verify user has permission for immediate sales
5. **Stock Validation**: Prevent negative stock from immediate sales

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS custom properties support required
- Mobile browsers (iOS Safari, Chrome Mobile)
- Touch-optimized price input on mobile devices


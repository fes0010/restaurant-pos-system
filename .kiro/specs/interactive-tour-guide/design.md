# Design Document

## Overview

The Interactive Tour Guide system will provide a comprehensive, contextual, and visually engaging way for new users to learn the Restaurant POS System. The design leverages modern UI patterns including spotlights, tooltips, overlays, and progress tracking to create an intuitive learning experience. The system will be built as a reusable React component library that integrates seamlessly with the existing Next.js application architecture.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Layer                        │
│  (Pages: Dashboard, POS, Inventory, Transactions, etc.)     │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  Tour Guide System                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Tour Engine  │  │ Tour UI      │  │ Tour State   │     │
│  │              │  │ Components   │  │ Management   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  Data Layer                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Tour         │  │ User Tour    │  │ Tour         │     │
│  │ Definitions  │  │ Progress     │  │ Analytics    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

The system will be organized into the following layers:

1. **Tour Engine**: Core logic for managing tour execution, step navigation, and state transitions
2. **UI Components**: Reusable React components for rendering tour elements (spotlights, tooltips, overlays)
3. **State Management**: React Context and hooks for managing tour state across the application
4. **Data Layer**: Tour definitions, user progress tracking, and analytics storage
5. **Integration Layer**: HOCs and hooks for integrating tours into existing pages

## Components and Interfaces

### 1. Tour Context Provider

**Purpose**: Provides global tour state and methods to all components

```typescript
interface TourContextValue {
  // Current tour state
  activeTour: Tour | null
  currentStep: number
  isActive: boolean
  isPaused: boolean
  
  // Tour control methods
  startTour: (tourId: string) => void
  nextStep: () => void
  previousStep: () => void
  skipTour: () => void
  pauseTour: () => void
  resumeTour: () => void
  completeTour: () => void
  
  // Tour progress
  userProgress: UserTourProgress
  markTourComplete: (tourId: string) => void
  resetProgress: () => void
  
  // Help system
  showHelp: (pageId: string) => void
  hideHelp: () => void
}

interface Tour {
  id: string
  title: string
  description: string
  pageId: string
  requiredRole?: 'admin' | 'sales_person'
  steps: TourStep[]
  category: 'getting-started' | 'daily-tasks' | 'advanced'
}

interface TourStep {
  id: string
  title: string
  content: string
  targetSelector: string // CSS selector for element to highlight
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center'
  isInteractive: boolean
  interactionType?: 'click' | 'input' | 'select'
  validationFn?: () => boolean
  beforeStep?: () => void // Hook to run before showing step
  afterStep?: () => void // Hook to run after completing step
  keyboardShortcut?: string
}

interface UserTourProgress {
  completedTours: string[]
  skippedTours: string[]
  currentTour: string | null
  currentStep: number
  lastUpdated: Date
  dismissedHints: string[]
}
```

### 2. Tour Overlay Component

**Purpose**: Creates the semi-transparent backdrop and spotlight effect

```typescript
interface TourOverlayProps {
  targetElement: HTMLElement | null
  isActive: boolean
  onClickOutside?: () => void
}

// Features:
// - Semi-transparent dark overlay (bg-black/60)
// - SVG-based spotlight with smooth edges
// - Smooth fade-in/out animations
// - Responsive to window resize
// - Prevents interaction with non-highlighted elements
```

### 3. Tour Tooltip Component

**Purpose**: Displays step instructions and navigation controls

```typescript
interface TourTooltipProps {
  step: TourStep
  currentStepNumber: number
  totalSteps: number
  onNext: () => void
  onPrevious: () => void
  onSkip: () => void
  position: { x: number; y: number }
  placement: 'top' | 'bottom' | 'left' | 'right'
}

// Features:
// - Adaptive positioning to avoid screen edges
// - Progress indicator (e.g., "Step 3 of 10")
// - Navigation buttons (Previous, Next, Skip)
// - Keyboard shortcut hints
// - Smooth animations
// - Arrow pointer to target element
// - Responsive design for mobile
```

### 4. Tour Help Button Component

**Purpose**: Persistent button to access tours from any page

```typescript
interface TourHelpButtonProps {
  pageId: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

// Features:
// - Floating action button (FAB) style
// - Question mark or help icon
// - Pulse animation for first-time users
// - Opens tour menu on click
// - Badge showing number of incomplete tours
// - Accessible via keyboard (Tab + Enter)
```

### 5. Tour Menu Component

**Purpose**: Lists available tours for the current page

```typescript
interface TourMenuProps {
  pageId: string
  tours: Tour[]
  userProgress: UserTourProgress
  onSelectTour: (tourId: string) => void
  onClose: () => void
}

// Features:
// - List of available tours for current page
// - Completion badges (checkmark for completed)
// - Estimated duration for each tour
// - Search/filter functionality
// - "Start All" option for page
// - "Reset Progress" option
```

### 6. Tour Progress Dashboard Component

**Purpose**: Shows overall tour completion status

```typescript
interface TourProgressDashboardProps {
  allTours: Tour[]
  userProgress: UserTourProgress
  onStartTour: (tourId: string) => void
}

// Features:
// - Grid of tour cards grouped by category
// - Progress percentage per category
// - Overall completion percentage
// - Last completed tour timestamp
// - Quick access to incomplete tours
// - Achievement badges
```

### 7. Welcome Modal Component

**Purpose**: Greets first-time users and offers tour options

```typescript
interface WelcomeModalProps {
  userRole: 'admin' | 'sales_person'
  onStartTour: () => void
  onSkip: () => void
  onRemindLater: () => void
}

// Features:
// - Role-specific welcome message
// - Overview of available tours
// - Options: Start Tour, Skip, Remind Later
// - "Don't show again" checkbox
// - Animated entrance
```

### 8. Tour Step Validator

**Purpose**: Validates user actions during interactive steps

```typescript
interface TourStepValidator {
  validateStep: (step: TourStep) => boolean
  waitForAction: (step: TourStep, timeout: number) => Promise<boolean>
  provideHint: (step: TourStep) => void
}

// Features:
// - Monitors DOM for expected changes
// - Validates form inputs
// - Detects button clicks
// - Provides hints after timeout
// - Auto-advances on successful validation
```

## Data Models

### Tour Definitions Storage

Tours will be defined in JSON/TypeScript files organized by page:

```
lib/tours/
├── index.ts                    # Tour registry
├── dashboard-tours.ts          # Dashboard tours
├── pos-tours.ts               # POS tours
├── inventory-tours.ts         # Inventory tours
├── transactions-tours.ts      # Transaction tours
├── purchase-orders-tours.ts   # Purchase order tours
├── returns-tours.ts           # Returns tours
└── users-tours.ts             # User management tours
```

### User Progress Storage

User tour progress will be stored in Supabase:

```sql
CREATE TABLE user_tour_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  tour_id VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'not_started', 'in_progress', 'completed', 'skipped'
  current_step INTEGER DEFAULT 0,
  completed_at TIMESTAMP,
  started_at TIMESTAMP,
  time_spent_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, tour_id)
);

CREATE TABLE user_tour_hints_dismissed (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  hint_id VARCHAR(100) NOT NULL,
  dismissed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, hint_id)
);

CREATE TABLE tour_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  tour_id VARCHAR(100) NOT NULL,
  step_id VARCHAR(100) NOT NULL,
  event_type VARCHAR(50) NOT NULL, -- 'started', 'completed', 'skipped', 'hint_shown'
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tour Definition Schema

```typescript
// Example tour definition
const posTour: Tour = {
  id: 'pos-basic-sale',
  title: 'Making Your First Sale',
  description: 'Learn how to process a sale from start to finish',
  pageId: 'pos',
  requiredRole: undefined, // Available to all roles
  category: 'getting-started',
  steps: [
    {
      id: 'pos-welcome',
      title: 'Welcome to the POS',
      content: 'This is where you process sales. Let\'s walk through making your first sale!',
      targetSelector: '.pos-container',
      placement: 'center',
      isInteractive: false
    },
    {
      id: 'pos-search',
      title: 'Search for Products',
      content: 'Use the search box to find products. Try typing a product name or SKU.',
      targetSelector: '[data-tour="product-search"]',
      placement: 'bottom',
      isInteractive: true,
      interactionType: 'input',
      validationFn: () => document.querySelectorAll('.product-card').length > 0
    },
    {
      id: 'pos-add-to-cart',
      title: 'Add to Cart',
      content: 'Click on a product to add it to your cart.',
      targetSelector: '.product-card:first-child',
      placement: 'right',
      isInteractive: true,
      interactionType: 'click',
      validationFn: () => document.querySelectorAll('.cart-item').length > 0
    },
    // ... more steps
  ]
}
```

## Error Handling

### Tour Execution Errors

1. **Target Element Not Found**
   - Fallback: Show tooltip in center with message
   - Log warning to console
   - Provide "Skip Step" option
   - Auto-retry after 1 second (max 3 attempts)

2. **Navigation During Tour**
   - Save current tour state
   - Show notification: "Tour paused. Resume from help menu."
   - Allow resuming from same step

3. **Interactive Step Timeout**
   - Show hint after 30 seconds
   - Provide "Show Me" button to auto-complete
   - Allow manual skip

4. **Data Loading Errors**
   - Show error message in tooltip
   - Provide retry button
   - Allow skipping problematic step

### State Management Errors

1. **Progress Save Failure**
   - Retry save operation
   - Store in localStorage as backup
   - Sync when connection restored

2. **Tour Definition Not Found**
   - Show error message
   - Redirect to tour menu
   - Log error for debugging

## Testing Strategy

### Unit Tests

1. **Tour Engine Logic**
   - Test step navigation (next, previous, skip)
   - Test tour state transitions
   - Test validation functions
   - Test progress tracking

2. **Component Tests**
   - Test tooltip positioning logic
   - Test overlay rendering
   - Test button interactions
   - Test responsive behavior

3. **Utility Functions**
   - Test element selector matching
   - Test position calculations
   - Test animation timing

### Integration Tests

1. **Tour Flow Tests**
   - Test complete tour execution
   - Test interactive step validation
   - Test tour pause and resume
   - Test tour completion tracking

2. **Page Integration Tests**
   - Test tour integration on each page
   - Test role-based tour filtering
   - Test help button functionality
   - Test welcome modal flow

### E2E Tests

1. **User Journey Tests**
   - Test first-time user experience
   - Test admin tour completion
   - Test sales person tour completion
   - Test tour search functionality

2. **Cross-Browser Tests**
   - Test on Chrome, Firefox, Safari
   - Test on mobile browsers
   - Test responsive behavior
   - Test touch interactions

### Accessibility Tests

1. **Keyboard Navigation**
   - Test Tab navigation through tour controls
   - Test Arrow key navigation between steps
   - Test Escape key to close tour
   - Test Enter key to advance

2. **Screen Reader Compatibility**
   - Test ARIA labels on tour elements
   - Test announcement of step changes
   - Test focus management
   - Test alternative text for icons

## Visual Design

### Color Scheme

```css
/* Tour-specific colors */
--tour-overlay: rgba(0, 0, 0, 0.6);
--tour-spotlight-border: rgba(59, 130, 246, 0.8); /* Blue highlight */
--tour-tooltip-bg: var(--card);
--tour-tooltip-border: var(--border);
--tour-progress-complete: #10b981; /* Green */
--tour-progress-incomplete: #6b7280; /* Gray */
--tour-hint-pulse: rgba(59, 130, 246, 0.4);
```

### Typography

- **Tour Title**: text-lg font-semibold
- **Step Content**: text-sm leading-relaxed
- **Progress Indicator**: text-xs font-medium
- **Button Text**: text-sm font-medium

### Spacing

- **Tooltip Padding**: p-4
- **Button Spacing**: gap-2
- **Step Margin**: mb-3
- **Icon Size**: h-5 w-5

### Animations

```css
/* Fade in overlay */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Spotlight pulse */
@keyframes spotlightPulse {
  0%, 100% { box-shadow: 0 0 0 0 var(--tour-spotlight-border); }
  50% { box-shadow: 0 0 0 8px var(--tour-spotlight-border); }
}

/* Tooltip slide in */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Help button pulse */
@keyframes helpPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}
```

### Responsive Breakpoints

- **Mobile**: < 640px
  - Full-width tooltips
  - Bottom-positioned tooltips
  - Larger touch targets (min 44px)
  - Simplified navigation

- **Tablet**: 640px - 1024px
  - Adaptive tooltip positioning
  - Side-by-side navigation buttons
  - Medium spotlight size

- **Desktop**: > 1024px
  - Optimal tooltip positioning
  - Full feature set
  - Keyboard shortcuts enabled
  - Larger spotlight size

## Tour Content Structure

### Page-Specific Tours

#### 1. Dashboard Tours (Admin Only)

**Tour: Dashboard Overview**
- Steps: 8
- Duration: ~3 minutes
- Topics: KPI cards, sales trends, low stock alerts, date filtering

**Tour: Understanding Analytics**
- Steps: 6
- Duration: ~2 minutes
- Topics: Revenue vs profit, trend interpretation, actionable insights

#### 2. POS Tours (All Users)

**Tour: Making Your First Sale**
- Steps: 10
- Duration: ~4 minutes
- Topics: Product search, cart management, checkout, payment, receipt

**Tour: Advanced POS Features**
- Steps: 8
- Duration: ~3 minutes
- Topics: Customer selection, discounts, custom pricing, quick sale

**Tour: POS Keyboard Shortcuts**
- Steps: 5
- Duration: ~2 minutes
- Topics: Search shortcuts, cart navigation, quick checkout

#### 3. Inventory Tours (Admin Only)

**Tour: Adding Products**
- Steps: 12
- Duration: ~5 minutes
- Topics: Product form, pricing, units, stock levels, images

**Tour: Managing Stock**
- Steps: 8
- Duration: ~3 minutes
- Topics: Restock, adjustments, stock history, thresholds

**Tour: Inventory Reports**
- Steps: 5
- Duration: ~2 minutes
- Topics: Filtering, searching, CSV export, archiving

#### 4. Transactions Tours (All Users)

**Tour: Viewing Sales History**
- Steps: 7
- Duration: ~3 minutes
- Topics: Transaction list, filtering, search, details view

**Tour: Reprinting Receipts**
- Steps: 4
- Duration: ~1 minute
- Topics: Finding transactions, receipt preview, printing

#### 5. Purchase Orders Tours (Admin Only)

**Tour: Creating Purchase Orders**
- Steps: 10
- Duration: ~4 minutes
- Topics: PO form, supplier details, adding items, cost calculation

**Tour: PO Workflow**
- Steps: 8
- Duration: ~3 minutes
- Topics: Status transitions, receiving orders, restocking inventory

#### 6. Returns Tours (All Users)

**Tour: Creating Returns (Sales Person)**
- Steps: 8
- Duration: ~3 minutes
- Topics: Return request, transaction selection, item selection, reasons

**Tour: Approving Returns (Admin)**
- Steps: 6
- Duration: ~2 minutes
- Topics: Review process, approval, rejection, stock restoration

#### 7. Users Tours (Admin Only)

**Tour: Managing Users**
- Steps: 9
- Duration: ~4 minutes
- Topics: User creation, roles, permissions, password management

**Tour: Understanding Roles**
- Steps: 5
- Duration: ~2 minutes
- Topics: Admin vs Sales Person, access levels, best practices

### Welcome Tour Sequences

**Admin Welcome Tour**
- Sequence: Dashboard → Inventory → POS → Users
- Total Steps: ~35
- Duration: ~15 minutes
- Covers: Core admin workflows

**Sales Person Welcome Tour**
- Sequence: POS → Transactions → Returns
- Total Steps: ~20
- Duration: ~8 minutes
- Covers: Daily sales tasks

## Integration Points

### 1. Page-Level Integration

Each page will include the tour system via a HOC or hook:

```typescript
// Example: POS page integration
export default function POSPage() {
  const { registerTourElements } = useTour()
  
  useEffect(() => {
    registerTourElements({
      'product-search': searchInputRef.current,
      'cart-container': cartRef.current,
      'checkout-button': checkoutButtonRef.current,
    })
  }, [])
  
  return (
    <TourProvider pageId="pos">
      <TourHelpButton />
      {/* Page content */}
    </TourProvider>
  )
}
```

### 2. Component-Level Integration

Components will use data attributes for tour targeting:

```typescript
// Example: Product search component
<input
  data-tour="product-search"
  data-tour-label="Product Search Input"
  placeholder="Search products..."
/>
```

### 3. Auth Integration

Tour system will integrate with AuthContext:

```typescript
const { user } = useAuth()
const availableTours = tours.filter(tour => 
  !tour.requiredRole || tour.requiredRole === user?.role
)
```

### 4. Analytics Integration

Tour events will be tracked:

```typescript
// Track tour events
trackTourEvent({
  tourId: 'pos-basic-sale',
  stepId: 'pos-checkout',
  eventType: 'completed',
  userId: user.id,
  tenantId: user.tenant_id
})
```

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**
   - Load tour definitions on demand
   - Lazy load tour UI components
   - Defer analytics tracking

2. **Memoization**
   - Memoize tour step calculations
   - Cache element position calculations
   - Memoize filtered tour lists

3. **Debouncing**
   - Debounce window resize events
   - Debounce scroll position updates
   - Debounce progress saves

4. **Code Splitting**
   - Separate tour bundle from main app
   - Split tours by page
   - Dynamic imports for tour components

### Performance Targets

- **Initial Load**: < 100ms overhead
- **Step Transition**: < 50ms
- **Tooltip Render**: < 16ms (60fps)
- **Progress Save**: < 200ms
- **Tour Search**: < 100ms

## Accessibility

### WCAG 2.1 AA Compliance

1. **Keyboard Navigation**
   - All tour controls accessible via keyboard
   - Logical tab order
   - Visible focus indicators
   - Escape key to exit

2. **Screen Reader Support**
   - ARIA labels on all interactive elements
   - ARIA live regions for step changes
   - Descriptive button labels
   - Alternative text for icons

3. **Visual Accessibility**
   - Sufficient color contrast (4.5:1 minimum)
   - No color-only indicators
   - Resizable text support
   - Focus visible indicators

4. **Motor Accessibility**
   - Large touch targets (44x44px minimum)
   - No time-based interactions required
   - Alternative to hover interactions
   - Undo/redo support

### ARIA Attributes

```html
<!-- Tour tooltip example -->
<div
  role="dialog"
  aria-labelledby="tour-step-title"
  aria-describedby="tour-step-content"
  aria-modal="true"
>
  <h3 id="tour-step-title">Step 1: Search for Products</h3>
  <p id="tour-step-content">Use the search box to find products...</p>
  <div role="group" aria-label="Tour navigation">
    <button aria-label="Previous step">Previous</button>
    <button aria-label="Next step">Next</button>
    <button aria-label="Skip tour">Skip</button>
  </div>
</div>
```

## Security Considerations

1. **Data Privacy**
   - No sensitive data in tour content
   - User progress stored securely
   - Analytics anonymized where possible

2. **XSS Prevention**
   - Sanitize tour content
   - Escape user-generated content
   - Use React's built-in XSS protection

3. **Access Control**
   - Enforce role-based tour access
   - Validate user permissions
   - Secure API endpoints

4. **Rate Limiting**
   - Limit progress save frequency
   - Throttle analytics events
   - Prevent abuse of tour system

## Future Enhancements

### Phase 2 Features

1. **Video Tours**
   - Embedded video tutorials
   - Screen recordings
   - Animated demonstrations

2. **Interactive Simulations**
   - Practice mode with fake data
   - Sandbox environment
   - Guided exercises

3. **Gamification**
   - Achievement badges
   - Progress rewards
   - Leaderboards

4. **AI-Powered Help**
   - Contextual suggestions
   - Smart search
   - Personalized tour recommendations

5. **Multi-Language Support**
   - Translated tour content
   - Locale-specific examples
   - RTL language support

6. **Advanced Analytics**
   - Heatmaps of user interactions
   - Drop-off analysis
   - A/B testing for tour content

7. **Custom Tour Builder**
   - Admin interface to create tours
   - Visual tour editor
   - Tour templates

8. **Collaborative Features**
   - Share tour progress with team
   - Team training mode
   - Manager oversight dashboard

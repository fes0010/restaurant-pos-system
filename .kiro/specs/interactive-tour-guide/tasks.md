# Implementation Plan

- [ ] 1. Set up tour system foundation
- [x] 1.1 Create database schema for tour progress tracking
  - Create `user_tour_progress` table with fields for tour_id, status, current_step, completion timestamps
  - Create `user_tour_hints_dismissed` table for tracking dismissed help hints
  - Create `tour_analytics` table for tracking tour engagement metrics
  - Add RLS policies for tenant isolation
  - Create database functions for progress updates
  - _Requirements: 1.4, 6.4, 20.1, 20.2, 20.3, 20.4_

- [x] 1.2 Create TypeScript types and interfaces
  - Define `Tour`, `TourStep`, `UserTourProgress` interfaces
  - Define `TourContextValue` interface for context provider
  - Create enums for tour status, step placement, interaction types
  - Export types from central types file
  - _Requirements: 1.1, 5.1, 5.2, 5.3_

- [x] 1.3 Create tour data service layer
  - Implement functions to fetch user tour progress from database
  - Implement functions to save tour progress
  - Implement functions to track tour analytics events
  - Implement functions to manage dismissed hints
  - Add error handling and retry logic
  - _Requirements: 6.4, 20.1, 20.2, 20.3, 20.4, 20.5_

- [ ] 2. Build core tour engine and state management
- [x] 2.1 Create TourContext and TourProvider
  - Implement React Context for tour state
  - Create provider component with state management
  - Implement tour control methods (start, next, previous, skip, pause, resume)
  - Add user progress loading and caching
  - Integrate with AuthContext for role-based filtering
  - _Requirements: 1.1, 1.3, 3.1, 4.1, 6.1, 6.2, 6.3, 6.4_

- [x] 2.2 Create useTour hook
  - Implement hook to access tour context
  - Add helper methods for common tour operations
  - Include element registration functionality
  - Add tour availability checking based on user role
  - _Requirements: 2.1, 2.2, 3.1, 4.1_

- [x] 2.3 Implement tour navigation logic
  - Create step navigation functions (next, previous, jump to step)
  - Implement tour completion detection
  - Add progress persistence on each step change
  - Handle edge cases (first step, last step)
  - _Requirements: 6.1, 6.2, 6.3, 11.1, 11.2_


- [x] 2.4 Implement tour state persistence
  - Save tour progress to database on step changes
  - Implement debounced save to reduce database calls
  - Add localStorage backup for offline scenarios
  - Sync localStorage with database when connection restored
  - _Requirements: 6.4, 11.4_

- [ ] 3. Create tour UI components
- [x] 3.1 Build TourOverlay component
  - Create semi-transparent backdrop overlay
  - Implement SVG-based spotlight effect with smooth edges
  - Add spotlight positioning logic based on target element
  - Implement smooth fade-in/out animations
  - Handle window resize to reposition spotlight
  - Prevent clicks on non-highlighted areas
  - _Requirements: 5.1, 10.1, 10.2, 10.4_

- [x] 3.2 Build TourTooltip component
  - Create tooltip container with adaptive positioning
  - Implement arrow pointer to target element
  - Add step title, content, and progress indicator
  - Create navigation buttons (Previous, Next, Skip)
  - Implement keyboard shortcut hints display
  - Add smooth slide-in animation
  - Handle edge detection to keep tooltip on screen
  - _Requirements: 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 18.1_

- [x] 3.3 Build TourHelpButton component
  - Create floating action button (FAB) with help icon
  - Add pulse animation for first-time users
  - Implement badge showing incomplete tour count
  - Position button in bottom-right corner (configurable)
  - Add click handler to open tour menu
  - Make keyboard accessible (Tab + Enter)
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 3.4 Build TourMenu component
  - Create dropdown menu listing available tours
  - Display tour titles, descriptions, and durations
  - Show completion badges for completed tours
  - Add search/filter functionality
  - Implement "Start Tour" buttons for each tour
  - Add "Reset Progress" option
  - Group tours by category
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 11.1, 11.2, 19.1, 19.2_

- [x] 3.5 Build WelcomeModal component
  - Create modal dialog for first-time users
  - Display role-specific welcome message
  - Show overview of available tours
  - Add "Start Tour", "Skip", and "Remind Later" buttons
  - Include "Don't show again" checkbox
  - Implement animated entrance
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [x] 3.6 Build TourProgressDashboard component
  - Create grid layout for tour cards
  - Display tour completion status with badges
  - Show overall completion percentage
  - Group tours by category (Getting Started, Daily Tasks, Advanced)
  - Add quick access buttons to start incomplete tours
  - Display last completed tour timestamp
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 4. Implement interactive tour features
- [x] 4.1 Create TourStepValidator utility
  - Implement validation functions for interactive steps
  - Add DOM monitoring for expected changes
  - Create form input validation logic
  - Implement button click detection
  - Add timeout handling with hint display
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 4.2 Implement auto-advance on correct action
  - Monitor user interactions during interactive steps
  - Validate actions against step requirements
  - Auto-advance to next step on successful validation
  - Show success feedback animation
  - _Requirements: 7.2, 7.5_

- [x] 4.3 Add hint system for stuck users
  - Implement 30-second timeout detection
  - Display contextual hints when user is stuck
  - Add "Show Me" button to auto-complete step
  - Track hint usage in analytics
  - _Requirements: 7.3, 17.1, 17.2, 17.3_

- [x] 4.4 Implement demo mode for destructive actions
  - Detect potentially destructive actions in tour steps
  - Add validation to prevent actual data changes during tours
  - Show visual indicators for demo mode
  - Provide clear messaging about demo vs real actions
  - _Requirements: 7.4_

- [ ] 5. Create tour definitions for all pages
- [x] 5.1 Define Dashboard tours
  - Create "Dashboard Overview" tour (8 steps)
  - Create "Understanding Analytics" tour (6 steps)
  - Define step content, target selectors, and placements
  - Add keyboard shortcuts where applicable
  - Mark as admin-only tours
  - _Requirements: 3.1, 3.2, 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 5.2 Define POS tours
  - Create "Making Your First Sale" tour (10 steps)
  - Create "Advanced POS Features" tour (8 steps)
  - Create "POS Keyboard Shortcuts" tour (5 steps)
  - Include interactive steps for product search and cart management
  - Add validation functions for interactive steps
  - _Requirements: 4.2, 4.3, 8.1, 8.2, 8.3, 8.4, 8.5, 18.1, 18.5_

- [x] 5.3 Define Inventory tours
  - Create "Adding Products" tour (12 steps)
  - Create "Managing Stock" tour (8 steps)
  - Create "Inventory Reports" tour (5 steps)
  - Mark as admin-only tours
  - Include interactive steps for product creation
  - _Requirements: 3.1, 3.2, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 5.4 Define Transactions tours
  - Create "Viewing Sales History" tour (7 steps)
  - Create "Reprinting Receipts" tour (4 steps)
  - Include filtering and search demonstrations
  - Add steps for transaction details view
  - _Requirements: 4.2, 4.3_

- [x] 5.5 Define Purchase Orders tours
  - Create "Creating Purchase Orders" tour (10 steps)
  - Create "PO Workflow" tour (8 steps)
  - Mark as admin-only tours
  - Include interactive steps for PO creation
  - _Requirements: 3.1, 3.2, 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 5.6 Define Returns tours
  - Create "Creating Returns" tour for sales persons (8 steps)
  - Create "Approving Returns" tour for admins (6 steps)
  - Include role-based content filtering
  - Add interactive steps for return creation
  - _Requirements: 4.1, 4.2, 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 5.7 Define Users tours
  - Create "Managing Users" tour (9 steps)
  - Create "Understanding Roles" tour (5 steps)
  - Mark as admin-only tours
  - Include interactive steps for user creation
  - _Requirements: 3.1, 3.2, 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 5.8 Create welcome tour sequences
  - Define Admin Welcome Tour sequence (Dashboard → Inventory → POS → Users)
  - Define Sales Person Welcome Tour sequence (POS → Transactions → Returns)
  - Link tours in logical order
  - Add transition messages between tours
  - _Requirements: 1.1, 1.3, 3.1, 4.1_

- [ ] 6. Integrate tours into application pages
- [x] 6.1 Integrate tour system into Dashboard page
  - Wrap page with TourProvider
  - Add TourHelpButton component
  - Add data-tour attributes to KPI cards, charts, and tables
  - Register tour elements with useTour hook
  - Test tour flow on Dashboard
  - _Requirements: 2.1, 3.1, 14.1, 14.2, 14.3_

- [x] 6.2 Integrate tour system into POS page
  - Wrap page with TourProvider
  - Add TourHelpButton component
  - Add data-tour attributes to search, cart, checkout elements
  - Register tour elements with useTour hook
  - Test interactive tour steps
  - _Requirements: 2.1, 4.2, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 6.3 Integrate tour system into Inventory page
  - Wrap page with TourProvider
  - Add TourHelpButton component
  - Add data-tour attributes to product list, forms, and actions
  - Register tour elements with useTour hook
  - Test tour flow on Inventory
  - _Requirements: 2.1, 3.1, 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 6.4 Integrate tour system into Transactions page
  - Wrap page with TourProvider
  - Add TourHelpButton component
  - Add data-tour attributes to transaction list and filters
  - Register tour elements with useTour hook
  - Test tour flow on Transactions
  - _Requirements: 2.1, 4.2_

- [x] 6.5 Integrate tour system into Purchase Orders page
  - Wrap page with TourProvider
  - Add TourHelpButton component
  - Add data-tour attributes to PO list, forms, and status buttons
  - Register tour elements with useTour hook
  - Test tour flow on Purchase Orders
  - _Requirements: 2.1, 3.1, 12.1, 12.2, 12.3, 12.4_

- [x] 6.6 Integrate tour system into Returns page
  - Wrap page with TourProvider
  - Add TourHelpButton component
  - Add data-tour attributes to returns list and actions
  - Register tour elements with useTour hook
  - Test role-based tour content
  - _Requirements: 2.1, 4.1, 13.1, 13.2, 13.3, 13.4_

- [ ] 6.7 Integrate tour system into Users page
  - Wrap page with TourProvider
  - Add TourHelpButton component
  - Add data-tour attributes to user list and forms
  - Register tour elements with useTour hook
  - Test tour flow on Users
  - _Requirements: 2.1, 3.1, 15.1, 15.2, 15.3, 15.4_

- [ ] 7. Implement first-time user experience
- [ ] 7.1 Add first login detection
  - Check user_tour_progress table for any completed tours
  - Set flag in user state for first-time users
  - Trigger welcome modal on first login
  - _Requirements: 1.1, 1.4_

- [ ] 7.2 Implement welcome modal flow
  - Show WelcomeModal on first login
  - Handle "Start Tour" action to begin welcome sequence
  - Handle "Skip" action to mark tours as skipped
  - Handle "Remind Later" to show modal on next login
  - Save user preference for "Don't show again"
  - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [ ] 7.3 Create welcome tour orchestration
  - Implement logic to chain multiple tours in sequence
  - Show transition messages between tours
  - Track overall welcome tour progress
  - Allow pausing and resuming welcome sequence
  - _Requirements: 1.3, 6.4_

- [ ] 8. Add responsive and mobile support
- [ ] 8.1 Implement responsive tooltip positioning
  - Adjust tooltip placement for mobile screen sizes
  - Use bottom placement by default on mobile
  - Ensure tooltips don't overflow screen edges
  - Test on various mobile devices
  - _Requirements: 16.1, 16.5_

- [ ] 8.2 Add touch-friendly interactions
  - Increase button sizes for touch targets (min 44px)
  - Add swipe gestures for step navigation
  - Implement touch event handlers
  - Test touch interactions on mobile devices
  - _Requirements: 16.2, 16.4_

- [ ] 8.3 Optimize spotlight for mobile
  - Adjust spotlight size for smaller viewports
  - Ensure spotlight doesn't cover mobile navigation
  - Test spotlight positioning on mobile
  - _Requirements: 16.3, 16.5_

- [ ] 9. Implement accessibility features
- [ ] 9.1 Add keyboard navigation
  - Implement Arrow keys for step navigation
  - Add Escape key to exit tour
  - Add Enter key to advance step
  - Ensure logical tab order through tour controls
  - Add visible focus indicators
  - _Requirements: 18.2, 18.4_

- [ ] 9.2 Add ARIA attributes and screen reader support
  - Add ARIA labels to all tour elements
  - Implement ARIA live regions for step changes
  - Add role="dialog" to tooltips
  - Add descriptive button labels
  - Test with screen readers (NVDA, JAWS, VoiceOver)
  - _Requirements: 5.2, 5.3_

- [ ] 9.3 Ensure visual accessibility
  - Verify color contrast meets WCAG 2.1 AA (4.5:1 minimum)
  - Add non-color indicators for tour status
  - Support text resizing
  - Add visible focus indicators
  - Test with color blindness simulators
  - _Requirements: 10.4_

- [ ] 10. Add search and help features
- [ ] 10.1 Implement tour search functionality
  - Create search input in tour menu
  - Implement search algorithm for tour content
  - Display search results with highlighting
  - Allow jumping to specific tour steps from results
  - Add suggested searches
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [ ] 10.2 Create contextual help hints
  - Add help icons next to complex UI elements
  - Implement hover/click tooltips for help hints
  - Add "Learn More" links to start relevant tours
  - Allow dismissing hints permanently
  - Track dismissed hints per user
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ] 10.3 Create keyboard shortcuts reference
  - Build keyboard shortcuts reference modal
  - List all available shortcuts
  - Make accessible from help menu
  - Include in keyboard navigation tour
  - _Requirements: 18.3, 18.5_

- [ ] 11. Implement analytics and tracking
- [ ] 11.1 Add tour event tracking
  - Track tour start events
  - Track tour completion events
  - Track tour skip events
  - Track step-level events
  - Track hint usage
  - _Requirements: 20.1, 20.2, 20.3, 20.4_

- [ ] 11.2 Create analytics dashboard for admins
  - Build analytics view showing tour engagement
  - Display completion rates per tour
  - Show average time spent per tour
  - Highlight most skipped tours
  - Show most revisited steps
  - _Requirements: 20.5_

- [ ] 11.3 Implement performance tracking
  - Track time spent on each step
  - Calculate average tour completion time
  - Identify bottleneck steps
  - Store timing data in analytics table
  - _Requirements: 20.3_

- [ ] 12. Polish and optimize
- [ ] 12.1 Add animations and transitions
  - Implement smooth fade-in for overlay
  - Add spotlight pulse animation
  - Create tooltip slide-in animation
  - Add help button pulse for first-time users
  - Ensure animations respect prefers-reduced-motion
  - _Requirements: 10.1, 10.4_

- [ ] 12.2 Optimize performance
  - Implement lazy loading for tour definitions
  - Add memoization for expensive calculations
  - Debounce window resize and scroll events
  - Code split tour components
  - Test performance with Lighthouse
  - _Requirements: 5.5_

- [ ] 12.3 Add theme support
  - Ensure tour components work in light mode
  - Ensure tour components work in dark mode
  - Use CSS variables for theme colors
  - Test theme switching during active tour
  - _Requirements: 10.4, 10.5_

- [ ] 12.4 Implement error handling
  - Handle target element not found errors
  - Handle navigation during tour
  - Handle interactive step timeouts
  - Handle data loading errors
  - Handle progress save failures
  - Add user-friendly error messages
  - _Requirements: 5.5, 6.4_

- [ ] 13. Testing and documentation
- [ ] 13.1 Write unit tests
  - Test tour navigation logic
  - Test step validation functions
  - Test tooltip positioning calculations
  - Test progress tracking
  - Achieve 80%+ code coverage
  - _Requirements: All_

- [ ] 13.2 Write integration tests
  - Test complete tour flows
  - Test role-based tour filtering
  - Test welcome modal flow
  - Test tour pause and resume
  - Test progress persistence
  - _Requirements: All_

- [ ] 13.3 Write E2E tests
  - Test first-time user journey
  - Test admin tour completion
  - Test sales person tour completion
  - Test tour search functionality
  - Test cross-browser compatibility
  - _Requirements: All_

- [ ] 13.4 Create user documentation
  - Write guide for using the tour system
  - Document keyboard shortcuts
  - Create troubleshooting guide
  - Add screenshots and examples
  - _Requirements: All_

- [ ] 13.5 Create developer documentation
  - Document tour definition format
  - Explain how to add new tours
  - Document component APIs
  - Add code examples
  - _Requirements: All_

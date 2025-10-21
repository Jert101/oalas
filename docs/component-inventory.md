# Component Inventory - OALASS

## UI Component Library Overview

The OALASS system uses a comprehensive component library built on shadcn/ui with custom components for specific business logic. Components are organized by functionality and reusability.

## shadcn/ui Base Components

### Form Components
- **Button** (`components/ui/button.tsx`) - Primary, secondary, and variant buttons
- **Input** (`components/ui/input.tsx`) - Text input fields with validation
- **Form** (`components/ui/form.tsx`) - Form wrapper with React Hook Form integration
- **Label** (`components/ui/label.tsx`) - Form labels with accessibility
- **Select** (`components/ui/select.tsx`) - Dropdown selection component
- **Checkbox** (`components/ui/checkbox.tsx`) - Checkbox input component
- **Radio Group** (`components/ui/radio-group.tsx`) - Radio button groups
- **Textarea** (`components/ui/textarea.tsx`) - Multi-line text input
- **Date Picker** (`components/ui/date-picker.tsx`) - Date selection component

### Layout Components
- **Card** (`components/ui/card.tsx`) - Content containers
- **Separator** (`components/ui/separator.tsx`) - Visual dividers
- **Scroll Area** (`components/ui/scroll-area.tsx`) - Custom scrollable areas
- **Tabs** (`components/ui/tabs.tsx`) - Tab navigation
- **Accordion** (`components/ui/accordion.tsx`) - Collapsible content sections

### Navigation Components
- **Navigation Menu** (`components/ui/navigation-menu.tsx`) - Main navigation
- **Breadcrumb** (`components/ui/breadcrumb.tsx`) - Navigation breadcrumbs
- **Pagination** (`components/ui/pagination.tsx`) - Page navigation

### Feedback Components
- **Alert** (`components/ui/alert.tsx`) - Alert messages
- **Toast** (`components/ui/toast.tsx`) - Toast notifications
- **Progress** (`components/ui/progress.tsx`) - Progress indicators
- **Badge** (`components/ui/badge.tsx`) - Status badges
- **Avatar** (`components/ui/avatar.tsx`) - User avatars

### Data Display Components
- **Table** (`components/ui/table.tsx`) - Data tables
- **Data Table** (`components/data-table.tsx`) - Advanced data table with sorting/filtering
- **Chart** (`components/chart-area-interactive.tsx`) - Interactive charts
- **Calendar** (`components/ui/calendar.tsx`) - Calendar component

### Overlay Components
- **Dialog** (`components/ui/dialog.tsx`) - Modal dialogs
- **Popover** (`components/ui/popover.tsx`) - Popover content
- **Tooltip** (`components/ui/tooltip.tsx`) - Tooltip overlays
- **Alert Dialog** (`components/ui/alert-dialog.tsx`) - Confirmation dialogs

## Custom Business Components

### Authentication Components
- **Login Form** (`components/login-form.tsx`)
  - **Purpose**: User authentication form
  - **Features**: Email/password login, Google OAuth, form validation
  - **Dependencies**: React Hook Form, Zod validation, NextAuth.js

### Navigation Components
- **App Sidebar** (`components/app-sidebar.tsx`)
  - **Purpose**: Main application navigation
  - **Features**: Role-based menu items, active state management
  - **Dependencies**: Next.js navigation, user session

- **Dean Sidebar** (`components/dean-sidebar.tsx`)
  - **Purpose**: Dean-specific navigation
  - **Features**: Dean workflow navigation, application management
  - **Dependencies**: Dean role permissions

- **Finance Sidebar** (`components/finance-sidebar.tsx`)
  - **Purpose**: Finance department navigation
  - **Features**: Finance workflow navigation, reporting access
  - **Dependencies**: Finance role permissions

- **Teacher Sidebar** (`components/teacher-sidebar.tsx`)
  - **Purpose**: Teacher-specific navigation
  - **Features**: Leave application navigation, personal dashboard
  - **Dependencies**: Teacher role permissions

- **Office Head Sidebar** (`components/office-head-sidebar.tsx`)
  - **Purpose**: Office head navigation
  - **Features**: Department management, approval workflow
  - **Dependencies**: Office head role permissions

### Dashboard Components
- **Admin Quick Actions** (`components/admin-quick-actions.tsx`)
  - **Purpose**: Admin dashboard quick actions
  - **Features**: User management, system configuration shortcuts
  - **Dependencies**: Admin role permissions

- **Teacher Quick Actions** (`components/teacher-quick-actions.tsx`)
  - **Purpose**: Teacher dashboard quick actions
  - **Features**: Leave application, travel order shortcuts
  - **Dependencies**: Teacher role permissions

- **Section Cards** (`components/section-cards.tsx`)
  - **Purpose**: Dashboard section display
  - **Features**: Statistics cards, navigation shortcuts
  - **Dependencies**: User role and permissions

- **Admin Section Cards** (`components/admin-section-cards.tsx`)
  - **Purpose**: Admin-specific dashboard sections
  - **Features**: System statistics, management shortcuts
  - **Dependencies**: Admin role permissions

### Data Management Components
- **Data Table** (`components/data-table.tsx`)
  - **Purpose**: Advanced data table with sorting, filtering, pagination
  - **Features**: Column sorting, search filtering, row selection
  - **Dependencies**: TanStack Table, React

- **Edit Application Modal** (`components/edit-application-modal.tsx`)
  - **Purpose**: Modal for editing leave applications
  - **Features**: Form validation, real-time updates, role-based editing
  - **Dependencies**: React Hook Form, Zod validation

### Real-time Components
- **Realtime Provider** (`components/realtime-provider.tsx`)
  - **Purpose**: WebSocket connection management
  - **Features**: Connection handling, event broadcasting, error recovery
  - **Dependencies**: WebSocket client, React Context

- **Realtime Applications** (`components/realtime-applications.tsx`)
  - **Purpose**: Real-time application updates
  - **Features**: Live application status updates, instant notifications
  - **Dependencies**: WebSocket connection, application state

- **Realtime Dashboard** (`components/realtime-dashboard.tsx`)
  - **Purpose**: Real-time dashboard updates
  - **Features**: Live statistics, instant data updates
  - **Dependencies**: WebSocket connection, dashboard state

### Notification Components
- **Notification Bell** (`components/notification-bell.tsx`)
  - **Purpose**: Notification display and management
  - **Features**: Unread count, notification list, mark as read
  - **Dependencies**: Notification service, user session

### Form Components
- **Date Validation** (`components/date-validation.tsx`)
  - **Purpose**: Date range validation for leave applications
  - **Features**: Conflict detection, business rule validation
  - **Dependencies**: Date utilities, validation service

- **Validation Status** (`components/validation-status.tsx`)
  - **Purpose**: Form validation status display
  - **Features**: Real-time validation feedback, error messages
  - **Dependencies**: Form validation, error handling

### Admin-Specific Components
- **Term Type Form** (`components/admin/term-type-form.tsx`)
  - **Purpose**: Term type creation and editing
  - **Features**: Form validation, CRUD operations
  - **Dependencies**: Admin permissions, term type service

- **Term Type Table** (`components/admin/term-type-table.tsx`)
  - **Purpose**: Term type data display and management
  - **Features**: Data table, CRUD operations, status management
  - **Dependencies**: Term type service, admin permissions

### Utility Components
- **Session Provider** (`components/session-provider.tsx`)
  - **Purpose**: Session context management
  - **Features**: Session state, authentication status
  - **Dependencies**: NextAuth.js, React Context

- **Theme Toggle** (`components/theme-toggle.tsx`)
  - **Purpose**: Dark/light theme switching
  - **Features**: Theme persistence, system preference detection
  - **Dependencies**: next-themes, localStorage

- **Auto Refresh** (`components/auto-refresh.tsx`)
  - **Purpose**: Automatic data refresh
  - **Features**: Configurable refresh intervals, background updates
  - **Dependencies**: React hooks, data fetching

- **Performance Monitor** (`components/performance-monitor.tsx`)
  - **Purpose**: Performance monitoring and optimization
  - **Features**: Performance metrics, optimization suggestions
  - **Dependencies**: Performance API, monitoring service

## Component Architecture Patterns

### Composition Pattern
Components are built using composition patterns for maximum reusability:

```typescript
// Example: Form composition
<Form>
  <FormField>
    <FormLabel>Label</FormLabel>
    <FormControl>
      <Input />
    </FormControl>
    <FormMessage />
  </FormField>
</Form>
```

### Provider Pattern
Context providers for global state management:

```typescript
// Example: Session provider
<SessionProvider>
  <RealtimeProvider>
    <App />
  </RealtimeProvider>
</SessionProvider>
```

### Hook Pattern
Custom hooks for component logic:

```typescript
// Example: Real-time hook
const { data, loading, error } = useRealtime('applications')
```

## Component Dependencies

### External Dependencies
- **React 18** - Component framework
- **Next.js 14** - App Router and SSR
- **shadcn/ui** - Base component library
- **Tailwind CSS** - Styling framework
- **React Hook Form** - Form management
- **Zod** - Schema validation
- **TanStack Table** - Data table functionality

### Internal Dependencies
- **Authentication Service** - User session management
- **Notification Service** - Real-time notifications
- **API Client** - Data fetching
- **Validation Service** - Form validation
- **WebSocket Client** - Real-time communication

## Component Testing Strategy

### Unit Testing
- Component rendering tests
- Props validation tests
- Event handling tests
- State management tests

### Integration Testing
- Component interaction tests
- API integration tests
- Authentication flow tests
- Real-time update tests

### Visual Testing
- Component snapshot tests
- Responsive design tests
- Theme switching tests
- Accessibility tests

## Component Performance

### Optimization Techniques
- **React.memo** - Prevent unnecessary re-renders
- **useMemo** - Expensive calculation memoization
- **useCallback** - Function reference stability
- **Code splitting** - Lazy loading for heavy components

### Bundle Optimization
- Tree shaking for unused components
- Dynamic imports for route-specific components
- Component-level code splitting
- Optimized bundle size

## Accessibility Features

### ARIA Support
- Proper ARIA labels and descriptions
- Keyboard navigation support
- Screen reader compatibility
- Focus management

### Semantic HTML
- Proper heading hierarchy
- Semantic form elements
- Meaningful button labels
- Descriptive link text

## Component Documentation

### Props Documentation
Each component includes comprehensive prop documentation:

```typescript
interface ComponentProps {
  /** Component title */
  title: string
  /** Optional description */
  description?: string
  /** Click handler */
  onClick: (event: MouseEvent) => void
  /** Disabled state */
  disabled?: boolean
}
```

### Usage Examples
Components include usage examples and best practices:

```typescript
// Example: Button usage
<Button variant="primary" size="lg" onClick={handleClick}>
  Submit Application
</Button>
```

## Future Enhancements

### Planned Components
- Advanced data visualization components
- Enhanced form components with better validation
- Improved accessibility components
- Mobile-optimized components

### Component Library Expansion
- Additional shadcn/ui components
- Custom business logic components
- Specialized admin components
- Enhanced real-time components

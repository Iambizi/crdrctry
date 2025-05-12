# Fashion Directory Admin UI - Incremental Integration

**🔧 TL;DR:**
Build a Verification UI that plugs into an existing Next.js 15 + PocketBase + GraphQL stack.  
Use real file paths, follow SCSS + TS patterns, and respect existing structure.  
This is not a prototype — it’s production code for an active repo.

## Project Context
Fashion Directory is currently in development and is a version-controlled project hosted at https://github.com/Iambizi/crdrctry.git. It is an application tracking fashion industry relationships. The codebase uses:
- Next.js 15.2.1
- React 19
- TypeScript 5.8.3
- PocketBase backend
- GraphQL API layer

## Integration Goals
⚠️ This is NOT a from-scratch build. The goal is to incrementally integrate new admin UI components into the existing codebase.

🧠 **Important**: Code should be generated to fit cleanly into this existing repo, not as isolated prototypes. This means:
- Use real file paths and match module structure
- Follow existing file structure and patterns
- Use existing GraphQL types and endpoints
- Prefer integrations over replacements
- Avoid assumptions about unrelated tech

## Build Philosophy
- **Extend, don't overwrite**: respect what's already built
- **Reusability over redundancy**: extract common patterns early
- **Clean commits**: code should be production-quality, not just proof of concept
- **Accessibility first**: screen reader support and ARIA attributes are required
- **Type safety**: leverage TypeScript for robust, maintainable code

## Current Phase: Verification UI
The first component we need is the Verification UI. The AI system serves two key functions:

1. Historical Data Enrichment
   - Analyzes archived fashion news and historical records
   - Discovers missing designer tenures and relationships
   - Fills gaps in brand ownership history
   - Validates and enhances existing records

2. Real-time Industry Updates
   - Monitors current news sources (BoF, Vogue, WWD) and social media
   - Tracks:
     - Designer appointments and departures
     - Brand acquisitions and ownership changes
     - Creative director tenures
     - Industry collaborations and partnerships

For each proposed update (historical or current), the AI provides:
- Source links and timestamps
- Confidence score (0-100%)
  - High confidence (>85%): Pre-fill for quick approval
  - Medium confidence (60-85%): Normal verification flow
  - Low confidence (<60%): Prompt for additional context
- Affected entities (designers/brands)
- Type of change (appointment/departure/acquisition/tenure)
- Supporting evidence
- Timeline context (for historical updates)
- Related relationships or tenures that may need verification

These updates need human verification before being committed to the database.

## Tech Preferences
- Next.js 15.2.1 + React 19
- TypeScript 5.8.3
- React Query (recommended for data fetching)
- Radix UI (recommended for accessible components)

## Core Features Priority
1. 🔍 Data Verification Interface
   - Split view: Original vs AI changes
   - Quick approve/reject actions
   - Batch operations
   - Status tracking (PENDING/VERIFIED/REJECTED)

2. ✏️ Smart Entry Editor
   - Intuitive forms
   - Real-time validation
   - Relationship visualization
   - Auto-complete

3. 📤 Batch Upload Tool
   - File import (CSV/JSON)
   - Preview & validate
   - Progress tracking
   - Error handling

## Data Models
```typescript
// Core types (simplified for brevity)
interface Designer {
  id: string;
  name: string;
  nationality?: string;
  birth_year?: number;
  is_active: boolean;
  verificationStatus: VerificationStatus;
}

interface Brand {
  id: string;
  name: string;
  founded_year?: number;
  verificationStatus: VerificationStatus;
}

interface Tenure {
  id: string;
  designer: string;
  brand: string;
  role: string;
  department: string;
  startYear: number;
  endYear?: number;
  isCurrentRole: boolean;
  verificationStatus: VerificationStatus;
}

interface Relationship {
  id: string;
  sourceDesigner: string;
  targetDesigner: string;
  brand: string;
  type: RelationType;
  verificationStatus: VerificationStatus;
}

// Enums
enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

enum RelationType {
  MENTORSHIP = 'mentorship',
  SUCCESSION = 'succession',
  COLLABORATION = 'collaboration',
  FAMILIAL = 'familial'
}
```

## UI/UX Requirements

### 1. Layout & Navigation
- Clean, minimal design
- Sidebar navigation
- Breadcrumb trails
- Responsive design (mobile-friendly)

### 2. Data Verification Interface
```tsx
// Example component structure
<VerificationDashboard>
  <PendingItemsList />
  <ComparisonView>
    <OriginalData />
    <AIProposedChanges />
    <ActionButtons />
  </ComparisonView>
  <VerificationHistory />
</VerificationDashboard>
```

### 3. Entry Editor
```tsx
// Example form structure
<EntityEditor>
  <FormTabs>
    <BasicInfo />
    <Relationships />
    <Timeline />
    <Verification />
  </FormTabs>
  <PreviewPanel />
  <ValidationSummary />
</EntityEditor>
```

### 4. Batch Upload
```tsx
// Example workflow
<BatchUploadWizard>
  <FileUpload accept=".csv,.json" />
  <DataPreview>
    <ValidationResults />
    <ErrorHighlighting />
  </DataPreview>
  <ImportProgress />
  <ResultsSummary />
</BatchUploadWizard>
```

## API Integration

### GraphQL Endpoint
```typescript
const API_URL = 'http://localhost:4000/graphql';
```

### Example Queries
```graphql
# Get pending verifications
query GetPendingVerifications {
  designers(filter: { verificationStatus: PENDING }) {
    edges {
      node {
        id
        name
        verificationStatus
        tenures {
          role
          brand { name }
        }
      }
    }
  }
}

# Update verification status
mutation UpdateVerificationStatus(
  $id: ID!
  $status: VerificationStatus!
) {
  updateDesigner(
    id: $id
    input: { verificationStatus: $status }
  ) {
    success
    message
    designer {
      id
      verificationStatus
    }
  }
}
```

## Project Structure
```
src/
  api/                  # API routes and middleware
  database/             # Database interactions
    migrations/         # Database migrations
    seeds/              # Seed data
    types/              # Database types
  graphql/              # GraphQL backend
    resolvers/          # GraphQL resolvers
      types/           # Type resolvers
    schemas/           # GraphQL schemas
    types/             # TypeScript interfaces
  types/                # Shared TypeScript types

# New Structure to Add
src/
  app/
    admin/
      verify/          # Verification UI (CURRENT FOCUS)
        components/    # Verification-specific components
        hooks/         # Custom hooks for verification
        styles/        # SCSS modules
        page.tsx       # Verification page
      layout.tsx       # Admin layout
      page.tsx         # Admin dashboard (future)
```

## New Requirements

### Styling Architecture
- Each component should have its own SCSS module file
- Follow BEM methodology for CSS class naming
- Create a shared SCSS foundation with:
  - Variables for colors, spacing, typography
  - Mixins for common patterns
  - Reset and base styles

### Component Organization
- Keep the existing route structure:
  - `/admin` - Main dashboard
  - `/admin/editor` - Content editor
  - `/admin/verify` - Verification interface
- Reorganize components into:
```
src/
  app/
    admin/
      components/
        common/          # Shared components (buttons, inputs)
          Button/
            index.tsx
            styles.module.scss
          Input/
            index.tsx
            styles.module.scss
        dashboard/       # Dashboard-specific components
        editor/         # Editor-specific components
        verification/   # Verification-specific components
        layout/         # Layout components
      styles/
        variables.scss  # Shared variables
        mixins.scss     # Shared mixins
        global.scss     # Global styles
      hooks/           # Custom hooks
      lib/            # Utilities
```

### Verification UI Requirements

#### Core Features
1. View AI-Generated Updates
   - List pending updates (both historical and current)
   - Show source links and timestamps
   - Display confidence scores
   - Indicate update type (new/historical)
   - Show affected entities and relationships

2. Side-by-Side Comparison
   - Current database state
   - Proposed changes with timeline context
   - Visual diff highlighting
   - Related tenure/relationship impact
   - Historical data verification tools

3. Update Actions
   - Approve changes
   - Reject with reason
   - Request more information
   - Batch approve/reject

#### GraphQL Integration
- Follow query patterns from src/graphql/resolvers, and ensure all queries/mutations are typed using interfaces from src/graphql/types.
- Follow existing query/mutation patterns in `src/graphql/resolvers`
- Ensure type safety with interfaces from `src/graphql/types`

#### Required Components
- Layout Components
  - Header with navigation
  - Admin layout wrapper
- Common UI Components
  - Button (variants: primary, secondary, destructive)
  - Form inputs (text, select, checkbox)
  - Alert dialogs
  - Data tables
  - Toast notifications
- Page-Specific Components
  - Statistics cards
  - Verification interface
  - Editor forms

## UI Reference Screenshots
These screenshots illustrate the intended layout and information architecture for the Verification UI.

### Current Updates
#### Designer Appointment
[Screenshot placeholder: New designer appointment verification view]

#### Brand Acquisition
[Screenshot placeholder: Recent brand acquisition verification view]

### Historical Updates
#### Designer Tenure History
[Screenshot placeholder: Historical tenure verification with timeline]

#### Brand Relationship Archive
[Screenshot placeholder: Historical brand relationship verification]

⚠️ These mockups are for visual reference only — final components should be:
- Accessible (ARIA labels, keyboard navigation)
- Responsive (mobile-first approach)
- Following the SCSS architecture described below
- Using real data from GraphQL endpoints

## Development Guidelines

### SCSS Architecture for Verification UI

#### 1. Component-First Approach
Start with the verification UI components, following this structure:

```scss
// verify/styles/variables.scss - Verification-specific variables
$verification: (
  // Status colors
  pending: #ffd700,
  approved: #4caf50,
  rejected: #f44336,
  highlight: #e3f2fd,

  // Confidence level indicators
  confidence: (
    high: #4caf50,    // >85%: Quick approval
    medium: #ff9800,  // 60-85%: Normal flow
    low: #f44336     // <60%: Needs more context
  )
);

// verify/components/UpdateCard/styles.module.scss
.update-card {
  &__header {}
  &__content {}
  &__footer {}
  
  &--pending {}
  &--approved {}
  &--rejected {}
}

// verify/components/ComparisonView/styles.module.scss
.comparison {
  &__current {}
  &__proposed {}
  &__diff {}
  
  &--highlight {}
  &--added {}
  &--removed {}
}
```

#### 2. Shared Styles
Only create shared styles as patterns emerge:

```scss
// verify/styles/mixins.scss
@mixin card-base {
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem;
}

@mixin status-indicator($color) {
  &::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: $color;
    margin-right: 0.5rem;
  }
}
```

#### 3. Integration Points
- Keep styles scoped to verification UI initially
- Move common patterns to shared location as they're identified
- Use CSS modules to avoid conflicts with future admin components

### 1. Code Style
- Functional components
- Custom hooks for logic
- TypeScript strict mode
- Component documentation

### 2. State Management
- React Query for server state
- Context for global UI state
- Local state for component-level data

### 3. Performance
- Virtualization for long lists
- Debounced search/filter
- Optimistic updates
- Lazy loading

### 4. Accessibility
- ARIA labels
- Keyboard navigation
- Color contrast
- Screen reader support

## Integration Notes
1. Use existing project structure
2. Follow TypeScript types
3. Use Yarn for dependencies
4. Maintain existing GraphQL schema

## Development Workflow

### 1. Initial Setup
```bash
# Clone and setup
git clone https://github.com/Iambizi/crdrctry.git
cd crdrctry
yarn install
```

### 2. Development Environment
```bash
# Start all services (in separate terminals)
yarn dev          # Next.js frontend on http://localhost:3000
yarn graphql      # GraphQL server on http://localhost:4000
```

### 3. Development Flow
1. Create feature branch from main
2. Follow TypeScript types from `src/graphql/types`
3. Use existing GraphQL queries/mutations as reference
4. Test components with real data via GraphQL playground
5. Ensure accessibility and responsive design

### Services
- Next.js: http://localhost:3000
- GraphQL: http://localhost:4000/graphql (playground)
- PocketBase: http://localhost:8090 (admin UI)

### Environment
- Copy `.env.example` to `.env` for local development
- See `.env.example` for required variables

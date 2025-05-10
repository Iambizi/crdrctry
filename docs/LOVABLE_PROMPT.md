# Fashion Directory Admin UI - Lovable Development Request

## Project Overview
Building a fashion industry relationship tracker's admin interface. Backend is complete with PocketBase + GraphQL. Need a modern, user-friendly admin UI for non-technical fashion researchers to verify AI-generated updates. The AI system continuously monitors fashion news sources (Business of Fashion, Vogue, WWD) and social media for:

- Designer appointments and departures
- Brand acquisitions and ownership changes
- Creative director movements
- Industry collaborations and partnerships

The AI extracts this information and proposes updates to our database. Each update includes:
- Source links and timestamps
- Confidence score
- Affected entities (designers/brands)
- Type of change (appointment/departure/collaboration)
- Supporting evidence

These updates need human verification before being committed to the database.

## Tech Preferences
- Next.js 15.2.1 + React 19
- TypeScript 5.8.3
- TailwindCSS (recommended for rapid development)
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
  admin/                 # New admin UI code
    components/          # Reusable components
      verification/      # Verification interface
      editor/           # Entry editor
      upload/           # Batch upload
      common/           # Shared components
    hooks/              # Custom hooks
    utils/              # Utility functions
    pages/              # Admin routes
    styles/             # CSS modules/Tailwind
    types/              # Admin-specific types
```

## Development Guidelines

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

## Getting Started
```bash
# Clone and setup
git clone https://github.com/Iambizi/crdrctry.git
cd crdrctry
yarn install

# Start development
yarn dev          # Next.js frontend
yarn graphql      # GraphQL server
```

## Additional Context
- PocketBase runs on http://localhost:8090
- GraphQL playground on http://localhost:4000/graphql
- Admin credentials in .env file

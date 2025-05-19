# Verification Dashboard Implementation Plan

## Components Data Requirements

### 1. VerificationDashboard Component ⏳
- [ ] Statistics Data
  ```typescript
  stats: {
    pending: number;
    verified: number;
    rejected: number;
  }
  ```
- [ ] Updates List Data
  ```typescript
  updates: {
    id: string;
    type: string;
    title: string;
    timestamp: string;
    status: string;
    differences: Array<{field: string, original: string, modified: string}>;
    confidenceScore: number;
    source: string;
    evidence: string;
  }[]
  ```
- [ ] Batch Operations
  - [ ] handleBatchApprove(ids: string[])
  - [ ] handleBatchReject(ids: string[])
- [x] Export Functionality
  - [x] CSV Export
  - [ ] Real-time data integration

### 2. VerificationCard Component ⏳
- [ ] Individual Update Actions
  - [ ] onApprove(id: string)
  - [ ] onReject(id: string)
  - [ ] handleSave(updatedData)

### 3. SmartEntryEditor Component ⏳
- [ ] Designer Data
  ```typescript
  {
    name: string;
    nationality?: string;
    is_active?: boolean;
  }
  ```
- [ ] Save Functionality
  - [ ] onSave(data)

## GraphQL Integration

### 1. Queries
- [ ] getVerificationUpdates
  ```graphql
  query getVerificationUpdates($status: String, $page: Int, $limit: Int) {
    verificationUpdates(status: $status, page: $page, limit: $limit) {
      id
      type
      title
      timestamp
      status
      differences {
        field
        original
        modified
      }
      confidenceScore
      source
      evidence
    }
  }
  ```
- [ ] getVerificationStats
  ```graphql
  query getVerificationStats {
    verificationStats {
      pending
      verified
      rejected
    }
  }
  ```
- [ ] getDesignerByName
  ```graphql
  query getDesignerByName($name: String!) {
    designer(name: $name) {
      name
      nationality
      is_active
    }
  }
  ```

### 2. Mutations
- [ ] approveUpdate
- [ ] rejectUpdate
- [ ] batchApproveUpdates
- [ ] batchRejectUpdates
- [ ] saveDesignerChanges

### 3. Subscriptions
- [ ] onUpdateStatusChanged
- [ ] onNewUpdateReceived
- [ ] onStatsChanged

## React Query Integration

### 1. Queries
- [ ] useVerificationUpdates
- [ ] useVerificationStats
- [ ] useDesignerSearch

### 2. Mutations
- [ ] useApproveUpdate
- [ ] useRejectUpdate
- [ ] useBatchApprove
- [ ] useBatchReject
- [ ] useSaveDesigner

## Progress Tracking

### Completed Features ✅
1. Basic UI Components
2. Batch Selection
3. CSV Export Functionality

### In Progress 🚧
1. GraphQL Schema Definition
2. React Query Integration
3. Real-time Updates

### Up Next 📅
1. GraphQL Schema Implementation
2. React Query Hooks Setup
3. Real-time Subscriptions

## Notes
- Keep track of loading states for all operations
- Implement proper error handling
- Add retry mechanisms for failed operations
- Consider implementing optimistic updates
- Add proper TypeScript types for all data structures

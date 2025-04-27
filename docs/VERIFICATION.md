# Fashion Directory Data Verification System

## Overview
The Fashion Directory implements a simple verification system to ensure data quality and transparency. All entities (Designer, Brand, Tenure, Relationship) inherit three verification fields from the BaseEntity interface:

```typescript
interface BaseEntity {
  /** Confidence score (0-1) indicating data reliability */
  confidence?: number;
  /** Verification status of the entity */
  verificationStatus?: VerificationStatus;
  /** List of sources used to verify the information */
  sources?: string[];
}
```

## Verification Status

Each entity can have one of three verification states:
- `VERIFIED`: Data has high confidence (≥0.75) and has been validated
- `UNVERIFIED`: Data has lower confidence (<0.75) and requires verification
- `PENDING`: Data is awaiting initial verification review (no confidence score set)

## Confidence Scoring

The confidence score is a number between 0 and 1 that indicates the reliability of the data:
- High (0.75 - 1.00): Well-documented from reliable sources
- Medium (0.60 - 0.74): Limited verification needed
- Low (<0.60): Requires thorough review

## Sources

Sources should be listed in order of reliability:

1. Primary Sources
   - Official brand/designer websites
   - Legal documents
   - Direct interviews/statements

2. Secondary Sources
   - Reputable fashion publications
   - Industry databases
   - Academic research

3. Tertiary Sources
   - News articles
   - Blog posts
   - Social media

## Implementation Example
```typescript
{
  "name": "Example Designer",
  "verificationStatus": "UNVERIFIED",
  "confidence": 0.65,
  "sources": [
    "vogue.com/designer-profile",
    "wwd.com/interview"
  ]
  // ... other entity-specific fields
}
```

## Best Practices

1. Set Confidence Scores Appropriately
   - Use multiple reliable sources to achieve high confidence
   - Be conservative with confidence scores when in doubt
   - Document reasoning for confidence scores in sources

2. Update Verification Status
   - Set to PENDING for new entries
   - Update to VERIFIED when confidence ≥ 0.75
   - Update to UNVERIFIED when confidence < 0.75

3. Maintain Sources
   - Always include sources when adding new information
   - Keep sources list current and accessible
   - Remove outdated or broken source links

## Integration with Features

- API responses include verification status and confidence
- Search/filter by verification status
- Analytics track verification coverage
- Data quality reports show verification distribution

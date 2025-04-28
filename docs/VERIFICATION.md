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

## Brand Verification Guide

### Overview
This document outlines the process for verifying and enriching brand data in the Fashion Directory. Each brand should be thoroughly researched and categorized according to the guidelines below.

### Verification Process

### 1. Basic Information
- Brand name (including variations and historical names)
- Founded year (verify with multiple sources)
- Founder(s) (full names and roles)
- Parent company (current ownership)
- Headquarters (city, country)
- Website
- Social media handles (Instagram, Twitter, Facebook)

### 2. Brand Category
One of:
- luxury_fashion
- design_studio
- collaboration_line
- historical_retail
- designer_label
- educational_institution
- collaboration_partner

### 3. Specialties
Each brand should be tagged with relevant specialties from the Department enum:
- Ready-to-Wear
- Accessories
- Leather Goods
- Menswear
- Womenswear
- Haute Couture
- Jewelry
- Watches
- All Departments

### 4. Price Points
One of:
- Contemporary
- Entry Luxury
- Luxury
- Ultra Luxury
- Haute Couture

### 5. Markets
Multiple selections from:
- Western Europe
- North America
- East Asia
- Southeast Asia
- Middle East
- Latin America
- Oceania
- Africa
- Global

### 6. Sources & Verification
For each data point, include URLs to:
- Brand's official website
- Press releases
- Industry reports
- Historical archives
- News articles

### 7. Confidence Score Calculation
Score (0.0-1.0) based on:
- Source reliability (0.3)
- Information consistency (0.3)
- Data completeness (0.2)
- Recent verification (0.2)

#### Verification Status
- VERIFIED (confidence ≥ 0.75)
- PENDING (confidence 0.4-0.74)
- UNVERIFIED (confidence < 0.4)

## Example Entry
```typescript
{
  name: "Example Brand",
  foundedYear: 1950,
  founder: "Jane Designer",
  parentCompany: "Luxury Group",
  headquarters: "Paris, France",
  category: "luxury_fashion",
  specialties: [
    Department.readyToWear,
    Department.leatherGoods,
    Department.accessories
  ],
  pricePoint: PricePoint.luxury,
  markets: [
    Market.westernEurope,
    Market.northAmerica,
    Market.eastAsia
  ],
  website: "https://example.com",
  socialMedia: {
    instagram: "@examplebrand",
    twitter: "@examplebrand",
    facebook: "examplebrand"
  },
  sources: [
    "https://example.com/about",
    "https://fashion-archive.org/brands/example",
    "https://industry-report.com/luxury-2025"
  ],
  confidence: 0.85,
  verificationStatus: VerificationStatus.verified
}
```

## Notes
- Always cross-reference multiple sources
- Note any significant discrepancies
- Update data when new verified information becomes available
- Document any historical changes or rebranding

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

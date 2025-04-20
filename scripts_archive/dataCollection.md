# Fashion Industry Data Collection Prompt

## Task
Please help collect accurate fashion industry data in the following structured format. For each designer or brand mentioned, provide information using these exact templates:

### Designer Template
```typescript
{
  "id": "uuid", // Will be generated later
  "name": "Full Name",
  "isActive": boolean, // true if currently working, false if retired/deceased
  "status": "active" | "retired" | "deceased", // Must be one of these three
  "birthYear": number | null,
  "deathYear": number | null,
  "nationality": "string",
  "biography": "Brief bio focusing on career highlights",
  "currentRole": "Current position if active",
  "signature_styles": ["style1", "style2"],
  "education": ["institution1", "year1"],
  "awards": ["award1 (year)", "award2 (year)"],
  "confidence": number,  // Required confidence score
  "createdAt": string,  // ISO date
  "updatedAt": string   // ISO date
}
```

### Brand Historical Data Template
```typescript
{
  "brandName": "Full Brand Name",
  "historicalDesigners": [
    {
      "name": "Designer Full Name",
      "role": "Exact Title",
      "department": "Ready-to-wear" | "Accessories" | "Jewelry" | "Menswear" | "Womenswear",
      "startYear": number,
      "endYear": number | null,
      "isCurrentRole": boolean,
      "achievements": [
        "Notable achievement 1",
        "Notable achievement 2"
      ],
      "confidence": number,  // Required confidence score
      "notableWorks": [
        "Significant collection/piece 1",
        "Significant collection/piece 2"
      ]
    }
  ],
  "relationships": [
    {
      "sourceDesigner": "Name of first designer",
      "targetDesigner": "Name of second designer",
      "type": "mentorship" | "succession" | "collaboration" | "familial",
      "startYear": number,
      "endYear": number | null,
      "description": "Brief description of relationship",
      "collaboration_projects": ["Project 1", "Project 2"] // If applicable
      "confidence": number,  // Required confidence score
    }
  ],
  "confidence": number,  // Required confidence score
  "createdAt": string,  // ISO date
  "updatedAt": string   // ISO date
}
```

## Required Fields

1. **All Entities Must Include**:
```typescript
{
  "id": string,       // Will be generated
  "createdAt": Date,  // Will be generated
  "updatedAt": Date   // Will be generated
}
```

2. **Department Values Must Be One Of**:
```typescript
"Jewelry" | "Watches" | "Ready-to-Wear" | "Accessories" | "Leather Goods" | 
"Menswear" | "Womenswear" | "Haute Couture" | "All Departments"
```

3. **Designer Status Must Be One Of**:
```typescript
"active" | "retired" | "deceased"
```

4. **Relationship Types Must Be One Of**:
```typescript
"mentorship" | "succession" | "collaboration" | "familial"
```

## Common Values

1. **Specialties** (Use exact capitalization):
```
"Leather goods"
"Ready-to-wear"
"Accessories"
"Luxury goods"
"Haute Couture"
"Perfumes"
"Fur"
"Footwear"
"Jewelry"
"Watches"
```

2. **Price Points**:
```
"Luxury"
"Contemporary Luxury"
"Premium"
```

3. **Markets**:
```json
"markets": ["Global"]  // Keep this format for consistency
```

4. **Social Media Format**:
```json
"social_media": {
  "instagram": "@brandname",    // Always use @ prefix
  "twitter": "@BrandName",      // Always use @ prefix
  "facebook": "brandname"       // Username only, no @
}
```

## Enriched Data Format

1. **Designer Tenures**:
```typescript
{
  "name": string,
  "tenures": [
    {
      "brand": string,
      "role": string,
      "department": Department,
      "startYear": number,
      "endYear": number | null,
      "achievements"?: string[],  // Optional, list of verified accomplishments
      "confidence": number       // Required, 0.0-1.0 scale
    }
  ]
}
```

2. **Confidence Score Guidelines**:
```typescript
0.95 - Verified by multiple primary sources
0.90 - Verified by one primary source
0.85 - Verified by reputable secondary sources
0.50 - Needs additional verification
```

3. **Role Format Examples**:
```
"Creative Director"
"Co-Creative Director"
"Design Director"
"Artistic Director"
"Founder & Creative Director"
"Chief Creative Officer"
"Head Designer"
```

4. **Achievement Examples**:
```typescript
[
  "Expanded accessories and footwear offerings",
  "Successfully modernized the brand for contemporary audience",
  "Established signature aesthetic combining minimalism with technical innovation",
  "Brought technical expertise from streetwear to luxury context"
]
```

## Data Quality Guidelines

To maintain consistency with existing data, please follow these specific guidelines:

1. **Brand Information Level**
```typescript
{
  "name": string,
  "foundedYear": number,
  "founder": string,
  "parentCompany": string | null,
  "headquarters": string,
  "specialties": string[], // 2-4 main specialties
  "pricePoint": "Luxury" | "Contemporary Luxury" | "Premium",
  "markets": ["Global"], // Keep as is for consistency
  "website": string,
  "social_media": {
    "instagram": string, // @handle format
    "twitter": string,  // @handle format
    "facebook": string  // username only
  },
  "confidence": number,  // Required confidence score
  "createdAt": string,  // ISO date
  "updatedAt": string   // ISO date
}
```

2. **Designer Information Level**
```typescript
{
  "name": string,
  "isActive": boolean,
  "status": "active" | "retired" | "deceased",
  "currentRole": string | null,
  // Optional fields - only include if verified:
  "nationality": string,
  "birthYear": number | null,
  "deathYear": number | null,
  "confidence": number,  // Required confidence score
  "createdAt": string,  // ISO date
  "updatedAt": string   // ISO date
}
```

3. **Tenure Information Level**
```typescript
{
  "role": string,        // Exact title only
  "startYear": number,
  "endYear": number | null,
  "isCurrentRole": boolean,
  "department": "Ready-to-wear" | "Accessories" | "Jewelry" | "Menswear" | "Womenswear",
  "confidence": number,  // Required confidence score
  "createdAt": string,  // ISO date
  "updatedAt": string   // ISO date
}
```

4. **Relationship Information Level**
```typescript
{
  "type": "mentorship" | "succession" | "collaboration" | "familial",
  "startYear": number,
  "endYear": number | null,
  "confidence": number,  // Required confidence score
  "createdAt": string,  // ISO date
  "updatedAt": string   // ISO date
}
```

## File Organization

1. **Directory Structure**:
```
data/
├── designer-status-updates.json     # Current designer statuses
├── designer-complete-profiles.json  # Full designer profiles
├── brands/                         # Individual brand files
│   ├── christian-lacroix.json
│   ├── bonpoint.json
│   ├── thomas-pink.json
│   └── vera-wang.json
└── enriched/                       # Enriched data files
    ├── enriched-designers.json     # Designer tenures with confidence
    ├── enriched-brands.json        # Brand histories with confidence
    └── enriched-relationships.json # Relationships with confidence
```

2. **File Naming Convention**:
- Use lowercase with hyphens
- Include version or date in filename if needed
- Keep filenames descriptive but concise

3. **Data Organization**:
- Each file should have a single responsibility
- Use consistent field ordering
- Include metadata (version, last updated, etc.)
- Maintain referential integrity with IDs

4. **Validation Requirements**:
- All data must include confidence scores
- All entities must have timestamps
- All relationships must be bi-directional
- All IDs must be valid UUIDs

## Important Notes
1. Match existing data depth - don't add excessive detail
2. Use consistent terminology with existing records
3. For social media, use exact format as shown
4. Keep achievements and descriptions brief and factual
5. Only include verified, publicly available information

## Specific Data Needed

### 1. Designer Status Updates
For each designer below, provide ONLY their current status and activity:
```typescript
{
  "name": "Designer Name",
  "isActive": boolean,
  "status": "active" | "retired" | "deceased",
  "currentRole": "Current position if active",
  "confidence": number,  // Required confidence score
  "createdAt": string,  // ISO date
  "updatedAt": string   // ISO date
}
```

Required for:
- Peter Do
- Christophe Lemaire
- Jerry Lorenzo
- Emily Adams Bode
- Sarah Burton
- Salvatore Ferragamo
- Franco Moschino
- Issey Miyake
- Domenico Dolce
- Stefano Gabbana
- Thierry Mugler
- Helmut Lang
- Ann Demeulemeester
- Vivienne Westwood
- Walter Van Beirendonck
- Takahiro Miyashita

### 2. Missing Required Fields
For these designers, provide COMPLETE profiles using the Designer Template above:
- Demna (including createdAt/updatedAt)
- Haider Ackermann (including createdAt/updatedAt)

### 3. Relationship Type Fixes
For each relationship, specify the correct type:
```typescript
{
  "sourceDesigner": "Name of first designer",
  "targetDesigner": "Name of second designer",
  "brandName": "Associated Brand",
  "type": "mentorship" | "succession" | "collaboration" | "familial",
  "description": "Brief explanation of relationship",
  "collaboration_projects": ["Project 1", "Project 2"] // If applicable
  "confidence": number,  // Required confidence score
  "createdAt": string,  // ISO date
  "updatedAt": string   // ISO date
}
```

### 4. Historical Brand Data
For these brands, provide COMPLETE historical data using the Brand Historical Data Template:
- Christian Lacroix (focus on historical creative directors and significant collaborations)
- Bonpoint (include children's wear specific achievements)
- Thomas Pink (include shirt-making heritage and LVMH era)
- Vera Wang (include bridal wear expertise and ready-to-wear expansion)

## Example Responses

### Designer Status Example
```json
{
  "name": "Peter Do",
  "isActive": true,
  "status": "active",
  "currentRole": "Creative Director at Helmut Lang",
  "confidence": 0.95,
  "createdAt": "2025-04-11T00:00:00Z",
  "updatedAt": "2025-04-11T00:00:00Z"
}
```

### Relationship Type Example
```json
{
  "sourceDesigner": "Karl Lagerfeld",
  "targetDesigner": "Virginie Viard",
  "brandName": "Chanel",
  "type": "mentorship",
  "description": "Viard worked as Lagerfeld's closest collaborator at Chanel for over 30 years before succeeding him",
  "confidence": 0.95,
  "createdAt": "2025-04-11T00:00:00Z",
  "updatedAt": "2025-04-11T00:00:00Z"
}
```

### Historical Brand Data Example
```json
{
  "brandName": "Christian Lacroix",
  "foundedYear": 1987,
  "founder": "Christian Lacroix",
  "parentCompany": "LVMH (1987-2005)",
  "headquarters": "Paris, France",
  "specialties": [
    "Haute Couture",
    "Ready-to-wear",
    "Accessories"
  ],
  "pricePoint": "Luxury",
  "markets": ["Global"],
  "website": "christian-lacroix.com",
  "social_media": {
    "instagram": "@christianlacroix",
    "twitter": "@LACROIX",
    "facebook": "christianlacroix"
  },
  "historicalDesigners": [
    {
      "name": "Christian Lacroix",
      "role": "Creative Director",
      "department": "Ready-to-wear",
      "startYear": 1987,
      "endYear": 2009,
      "isCurrentRole": false,
      "confidence": 0.95,
      "createdAt": "2025-04-11T00:00:00Z",
      "updatedAt": "2025-04-11T00:00:00Z"
    }
  ],
  "confidence": 0.95,
  "createdAt": "2025-04-11T00:00:00Z",
  "updatedAt": "2025-04-11T00:00:00Z"
}
```

## Guidelines
1. Ensure all status values are EXACTLY one of: "active", "retired", or "deceased"
2. All dates must be numbers (years) or null
3. All relationship types must be EXACTLY one of: "mentorship", "succession", "collaboration", or "familial"
4. For new entries, use the current date ("2025-04-11T00:00:00Z") for createdAt/updatedAt
5. Verify all information against reliable fashion industry sources
6. Focus on accuracy and verifiability
7. Include specific dates where possible
8. For relationships, be specific about the nature (mentorship, succession, collaboration, familial)
9. For achievements, focus on significant industry impact
10. Include any major industry awards or recognition
11. Note any significant changes in creative direction or brand strategy

## Example Response
```json
{
  "designer": {
    "name": "Peter Do",
    "isActive": true,
    "status": "active",
    "birthYear": 1991,
    "nationality": "Vietnamese-American",
    "currentRole": "Creative Director at Helmut Lang",
    "biography": "Peter Do, after working at Celine under Phoebe Philo...",
    "signature_styles": ["Tailoring", "Minimalism", "Technical fabrics"],
    "education": ["Fashion Institute of Technology, 2014"],
    "awards": ["LVMH Prize Finalist (2014)", "CFDA Emerging Designer (2020)"],
    "confidence": 0.95,
    "createdAt": "2025-04-11T00:00:00Z",
    "updatedAt": "2025-04-11T00:00:00Z"
  }
}
```

### Brand Example (Matching Current Data)
```json
{
  "brandName": "Christian Lacroix",
  "foundedYear": 1987,
  "founder": "Christian Lacroix",
  "parentCompany": "LVMH (1987-2005)",
  "headquarters": "Paris, France",
  "specialties": [
    "Haute Couture",
    "Ready-to-wear",
    "Accessories"
  ],
  "pricePoint": "Luxury",
  "markets": ["Global"],
  "historicalDesigners": [
    {
      "name": "Christian Lacroix",
      "role": "Creative Director",
      "department": "Ready-to-wear",
      "startYear": 1987,
      "endYear": 2009,
      "isCurrentRole": false,
      "confidence": 0.95,
      "createdAt": "2025-04-11T00:00:00Z",
      "updatedAt": "2025-04-11T00:00:00Z"
    }
  ],
  "confidence": 0.95,
  "createdAt": "2025-04-11T00:00:00Z",
  "updatedAt": "2025-04-11T00:00:00Z"
}
```

### Designer Status Example (Matching Current Data)
```json
{
  "name": "Peter Do",
  "isActive": true,
  "status": "active",
  "currentRole": "Creative Director at Helmut Lang",
  "nationality": "Vietnamese-American",
  "confidence": 0.95,
  "createdAt": "2025-04-11T00:00:00Z",
  "updatedAt": "2025-04-11T00:00:00Z"
}
```

### Relationship Example (Matching Current Data)
```json
{
  "sourceDesigner": "Karl Lagerfeld",
  "targetDesigner": "Virginie Viard",
  "brandId": "BRAND_ID",  // Will be provided
  "type": "succession",
  "startYear": 1987,
  "endYear": 2019,
  "confidence": 0.95,
  "createdAt": "2025-04-11T00:00:00Z",
  "updatedAt": "2025-04-11T00:00:00Z"
}

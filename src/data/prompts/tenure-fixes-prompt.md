# Fashion Directory Data Enrichment Task

## Context
We need to add missing tenure data for several prominent fashion designers in our database. The data should be historically accurate and follow our established data structure.

## Data Structure Requirements
Each tenure record must include:
```typescript
interface Tenure {
  id: string;            // Format: "tnr-[unique-id]"
  designerId: string;    // ID of the designer
  brandId: string;      // ID of the brand
  role: string;         // e.g., "Creative Director", "Founder", etc.
  department?: string;   // Use Department enum values
  startYear: number;    // Year the tenure began
  endYear?: number;     // Year the tenure ended (null if current)
  isCurrentRole: boolean; // Whether this is their current role
  achievements?: string[]; // Notable achievements during tenure
  createdAt: string;    // ISO date string
  updatedAt: string;    // ISO date string
}

enum Department {
  JEWELRY = "Jewelry",
  WATCHES = "Watches",
  READY_TO_WEAR = "Ready-to-Wear",
  ACCESSORIES = "Accessories",
  LEATHER_GOODS = "Leather Goods",
  MENSWEAR = "Menswear",
  WOMENSWEAR = "Womenswear",
  HAUTE_COUTURE = "Haute Couture",
  ALL_DEPARTMENTS = "All Departments"
}
```

## Designers Needing Tenure Data

1. Peter Do
   - Current: Creative Director at Helmut Lang
   - Known for: Minimalist designs, technical precision
   - Previous: Worked at Celine under Phoebe Philo

2. Christophe Lemaire
   - Known for: Minimalist aesthetic
   - Notable roles: Hermès, Lacoste, UNIQLO
   - Current: Artistic Director at UNIQLO U

3. Jerry Lorenzo
   - Founder of Fear of God
   - Collaboration with Adidas
   - Known for: Luxury streetwear

4. Emily Adams Bode
   - Founder of Bode
   - Known for: Sustainable fashion, vintage textiles
   - CFDA awards recipient

5. Sarah Burton
   - Creative Director at Alexander McQueen
   - Previous: Worked directly with Lee Alexander McQueen
   - Known for: Royal wedding dress design

6. Salvatore Ferragamo
   - Founder of Ferragamo
   - Known for: Innovative shoe design
   - Historical importance in luxury footwear

7. Franco Moschino
   - Founder of Moschino
   - Known for: Irreverent fashion, social commentary
   - Previous: Worked with Gianni Versace

8. Issey Miyake
   - Founder of Issey Miyake
   - Known for: Innovative pleating techniques
   - Revolutionized Japanese fashion globally

9. Domenico Dolce & Stefano Gabbana
   - Co-founders of Dolce & Gabbana
   - Known for: Italian luxury fashion
   - Partnership began in 1980s

10. Thierry Mugler
    - Founder of Mugler
    - Known for: Avant-garde designs
    - Pioneered theatrical fashion shows

11. Helmut Lang
    - Founder of Helmut Lang
    - Known for: Minimalist aesthetic
    - Influenced 90s fashion

12. Ann Demeulemeester
    - Founder of Ann Demeulemeester
    - Part of Antwerp Six
    - Known for: Romantic punk aesthetic

13. Vivienne Westwood
    - Pioneer of punk fashion
    - Known for: Political activism in fashion
    - Multiple brands and lines

14. Walter Van Beirendonck
    - Part of Antwerp Six
    - Known for: Avant-garde designs
    - Influence on contemporary fashion

15. Takahiro Miyashita
    - Founder of Number (N)ine, The Soloist
    - Known for: Japanese streetwear
    - Influenced by music subcultures

## Requirements

1. For each designer:
   - Create accurate tenure records for all significant roles
   - Include both current and historical positions
   - Specify departments based on their focus areas
   - Add notable achievements during each tenure

2. Data Quality:
   - All dates must be historically accurate
   - Roles should reflect actual positions held
   - Include significant achievements and contributions
   - Mark current roles appropriately

3. Special Considerations:
   - For founders, create tenures starting from brand establishment
   - For deceased designers, ensure endYear is properly set
   - For current roles, set endYear to null and isCurrentRole to true
   - Include major collaborations and partnerships

## Output Format
Generate the data in a JSON format that matches our Tenure interface structure. Use the following template:

```json
{
  "tenures": [
    {
      "id": "tnr-[unique-id]",
      "designerId": "[designer-id]",
      "brandId": "[brand-id]",
      "role": "Role Title",
      "department": "Department Name",
      "startYear": YYYY,
      "endYear": YYYY,
      "isCurrentRole": boolean,
      "achievements": [
        "Achievement 1",
        "Achievement 2"
      ],
      "createdAt": "2025-04-12T14:30:00.000Z",
      "updatedAt": "2025-04-12T14:30:00.000Z"
    }
  ]
}
```

## Validation Rules
1. All required fields must be present
2. Dates must be chronologically valid
3. Department values must match the enum
4. IDs must follow the specified format
5. Current roles must have endYear as null
6. Historical accuracy is crucial

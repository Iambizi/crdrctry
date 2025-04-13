# Database Migrations

This document tracks the evolution of our PocketBase database schema and provides information about migrations and data seeding.

## Migration Files

All migrations are stored in the `pb_migrations` directory in sequential order:

1. `001_initial_schema.json` - Initial database schema
   - Created collections: designers, brands, tenures, relationships
   - Established base fields and relationships
   - Added indexes for performance

## Collections

### Designers
- `name` (text, required, unique) - Designer's full name
- `bio` (text) - Biographical information
- `nationality` (text) - Designer's nationality
- `birth_year` (number) - Year of birth
- `death_year` (number) - Year of death, if applicable
- `education` (text) - Educational background
- `awards` (json) - List of awards received
- `notable_works` (json) - Notable works and achievements

### Brands
- `name` (text, required, unique) - Brand name
- `founded_year` (number) - Year the brand was founded
- `founder` (text) - Brand founder's name
- `category` (text) - Brand category (luxury_fashion, design_studio, etc.)
- `parent_company` (text) - Parent company name
- `headquarters` (text) - Brand headquarters location
- `specialties` (json) - Brand specialties
- `price_point` (text) - Price point category
- `markets` (json) - Target markets
- `website` (text) - Official website URL
- `social_media` (json) - Social media links
- `logo_url` (text) - URL to brand logo

### Tenures
- `designer` (relation) - Reference to designer
- `brand` (relation) - Reference to brand
- `role` (text) - Designer's role
- `department` (text) - Department within the brand
- `start_year` (number) - Start year of tenure
- `end_year` (number) - End year of tenure
- `is_current_role` (boolean) - Whether this is the current role
- `achievements` (json) - Achievements during tenure
- `notable_works` (json) - Notable works during tenure
- `notable_collections` (json) - Notable collections created
- `impact_description` (text) - Description of impact

### Relationships
- `source_designer` (relation) - Reference to source designer
- `target_designer` (relation) - Reference to target designer
- `brand` (relation) - Reference to associated brand
- `type` (text) - Type of relationship
- `start_year` (number) - Start year of relationship
- `end_year` (number) - End year of relationship
- `description` (text) - Description of relationship
- `impact` (text) - Impact of relationship
- `collaboration_projects` (json) - List of collaboration projects

## Database Reset

To reset the database and reseed all data:

```bash
yarn db:reset
```

This will:
1. Run all migrations in sequence
2. Seed the database with initial data in the correct order:
   - Designers
   - Brands
   - Tenures
   - Relationships

## Breaking Changes

None yet - this is the initial schema.
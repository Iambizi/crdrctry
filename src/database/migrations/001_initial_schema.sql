
-- Create enums first
CREATE TYPE designer_status AS ENUM ('ACTIVE', 'RETIRED', 'DECEASED');
CREATE TYPE relationship_type AS ENUM ('mentorship', 'succession', 'collaboration', 'familial');
CREATE TYPE department AS ENUM (
  'Jewelry',
  'Watches',
  'Ready-to-Wear',
  'Accessories',
  'Leather Goods',
  'Menswear',
  'Womenswear',
  'Haute Couture',
  'All Departments'
);

CREATE TYPE brand_category AS ENUM (
  'luxury_fashion',
  'design_studio',
  'collaboration_line',
  'historical_retail',
  'designer_label',
  'educational_institution',
  'collaboration_partner'
);

-- Create extension for UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Designers table
CREATE TABLE designers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  current_role TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  status designer_status NOT NULL DEFAULT 'ACTIVE',
  biography TEXT,
  image_url TEXT,
  nationality TEXT,
  birth_year INTEGER,
  death_year INTEGER,
  awards TEXT[],
  education TEXT[],
  signature_styles TEXT[],
  social_media JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT birth_before_death CHECK (
    (death_year IS NULL) OR 
    (birth_year IS NULL) OR 
    (death_year > birth_year)
  )
);

-- Brands table
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  founded_year INTEGER NOT NULL,
  founder TEXT NOT NULL,
  category brand_category NOT NULL DEFAULT 'luxury_fashion',
  parent_company TEXT,
  parent_brand TEXT,
  logo_url TEXT,
  headquarters TEXT,
  specialties TEXT[],
  price_point TEXT,
  markets TEXT[],
  website TEXT,
  has_historical_data BOOLEAN DEFAULT false,
  notes TEXT,
  social_media JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_founded_year CHECK (founded_year > 1800 AND founded_year <= EXTRACT(YEAR FROM CURRENT_DATE))
);

-- Tenures table
CREATE TABLE tenures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  designer_id UUID NOT NULL REFERENCES designers(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  department department,
  start_year INTEGER NOT NULL,
  end_year INTEGER,
  is_current_role BOOLEAN NOT NULL DEFAULT false,
  achievements TEXT[],
  notable_works TEXT[],
  notable_collections TEXT[],
  impact_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_tenure_years CHECK (
    (end_year IS NULL) OR 
    (end_year >= start_year)
  ),
  CONSTRAINT valid_start_year CHECK (
    start_year > 1800 AND 
    start_year <= EXTRACT(YEAR FROM CURRENT_DATE)
  )
);

-- Relationships table
CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_designer_id UUID NOT NULL REFERENCES designers(id) ON DELETE CASCADE,
  target_designer_id UUID NOT NULL REFERENCES designers(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  type relationship_type NOT NULL,
  start_year INTEGER,
  end_year INTEGER,
  description TEXT,
  impact TEXT,
  collaboration_projects TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_relationship_years CHECK (
    (end_year IS NULL) OR 
    (end_year >= start_year)
  ),
  CONSTRAINT different_designers CHECK (source_designer_id != target_designer_id)
);

-- Create indexes for common queries
CREATE INDEX idx_designer_status ON designers(status);
CREATE INDEX idx_designer_name ON designers(name);
CREATE INDEX idx_brand_name ON brands(name);
CREATE INDEX idx_brand_category ON brands(category);
CREATE INDEX idx_tenure_years ON tenures(start_year, end_year);
CREATE INDEX idx_tenure_current ON tenures(is_current_role) WHERE is_current_role = true;
CREATE INDEX idx_relationship_type ON relationships(type);

-- Add triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_designer_updated_at
    BEFORE UPDATE ON designers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brand_updated_at
    BEFORE UPDATE ON brands
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenure_updated_at
    BEFORE UPDATE ON tenures
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_relationship_updated_at
    BEFORE UPDATE ON relationships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
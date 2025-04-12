import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Brand, Designer, Department, Tenure } from '../src/types/fashion';

// Read the current data
const fashionGenealogyPath = path.join(__dirname, '../src/data/fashionGenealogy.json');
const data = JSON.parse(fs.readFileSync(fashionGenealogyPath, 'utf8'));

// 2025 Changes
const changes = {
  // New Brands
  newBrands: [
    {
      id: uuidv4(),
      name: "Tom Ford",
      foundedYear: 2005,
      founder: "Tom Ford",
      parentCompany: "Estée Lauder Companies",
      headquarters: "New York, USA",
      specialties: [
        "Ready-to-Wear",
        "Accessories",
        "Beauty",
        "Eyewear"
      ],
      pricePoint: "Luxury",
      markets: ["Global"],
      website: "tomford.com",
      social_media: {
        instagram: "tomford"
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      name: "Christian Lacroix",
      foundedYear: 1987,
      founder: "Christian Lacroix",
      parentCompany: "Sociedad Textil Lonia",
      headquarters: "Paris, France",
      specialties: [
        "Haute Couture",
        "Ready-to-Wear",
        "Accessories"
      ],
      pricePoint: "Luxury",
      markets: ["Global"],
      website: "christian-lacroix.com",
      social_media: {
        instagram: "christianlacroix"
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      name: "Bonpoint",
      foundedYear: 1975,
      founder: "Marie-France Cohen",
      parentCompany: "Youngor Group",
      headquarters: "Paris, France",
      specialties: [
        "Childrenswear",
        "Accessories",
        "Beauty"
      ],
      pricePoint: "Luxury",
      markets: ["Global"],
      website: "bonpoint.com",
      social_media: {
        instagram: "bonpoint"
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      name: "Thomas Pink",
      foundedYear: 1984,
      founder: "Peter Mullen",
      parentCompany: "CP Brands Group",
      headquarters: "London, UK",
      specialties: [
        "Menswear",
        "Shirts",
        "Accessories"
      ],
      pricePoint: "Premium",
      markets: ["Global"],
      website: "thomaspink.com",
      social_media: {
        instagram: "thomaspink"
      },
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: uuidv4(),
      name: "Vera Wang",
      foundedYear: 1990,
      founder: "Vera Wang",
      parentCompany: "WHP Global",
      headquarters: "New York, USA",
      specialties: [
        "Bridal",
        "Ready-to-Wear",
        "Accessories"
      ],
      pricePoint: "Luxury",
      markets: ["Global"],
      website: "verawang.com",
      social_media: {
        instagram: "verawanggang"
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  
  // New Creative Directors
  newDesigners: [
    {
      id: uuidv4(),
      name: "Demna",
      status: "ACTIVE",
      isActive: true,
      currentRole: "Artistic Director at Gucci",
      achievements: [
        "Former Creative Director of Balenciaga",
        "Known for innovative approach to luxury fashion",
        "Pioneered merger of streetwear and haute couture"
      ]
    },
    {
      id: uuidv4(),
      name: "Haider Ackermann",
      status: "ACTIVE",
      isActive: true,
      currentRole: "Creative Director at Tom Ford",
      achievements: [
        "Former Creative Director of his eponymous label",
        "Guest Designer for Jean Paul Gaultier Couture",
        "Known for sophisticated tailoring and color mastery"
      ]
    },
    {
      id: uuidv4(),
      name: "Casey Cadwallader",
      status: "INACTIVE",
      isActive: false,
      currentRole: "Former Creative Director at Mugler",
      achievements: [
        "Revitalized Mugler's ready-to-wear line",
        "Introduced innovative digital fashion shows",
        "Collaborated with major celebrities"
      ]
    }
  ],
  
  // New Tenures
  newTenures: [
    {
      brandName: "Gucci",
      designerName: "Demna",
      role: "Creative Director",
      department: Department.ALL_DEPARTMENTS,
      startYear: 2025,
      isCurrentRole: true,
      achievements: [
        "Appointed as Creative Director of Gucci in January 2025",
        "First collection to be presented in September 2025"
      ]
    },
    {
      brandName: "Tom Ford",
      designerName: "Haider Ackermann",
      role: "Creative Director",
      department: Department.ALL_DEPARTMENTS,
      startYear: 2025,
      isCurrentRole: true,
      achievements: [
        "Named Creative Director under new Estée Lauder ownership",
        "Debut collection presented in March 2025"
      ]
    },
    {
      brandName: "Mugler",
      designerName: "Casey Cadwallader",
      role: "Creative Director",
      department: Department.ALL_DEPARTMENTS,
      startYear: 2017,
      endYear: 2025,
      isCurrentRole: false,
      achievements: [
        "Successfully modernized the brand's aesthetic while respecting its heritage",
        "Expanded brand visibility through innovative digital presentations",
        "Collaborated with H&M on a highly successful collection"
      ]
    },
    {
      brandName: "Loewe",
      designerName: "Jonathan Anderson",
      role: "Creative Director",
      department: Department.ALL_DEPARTMENTS,
      startYear: 2013,
      endYear: 2025,
      isCurrentRole: false,
      achievements: [
        "Transformed Loewe into a powerful cultural brand over 11-year tenure",
        "Successfully merged creation and curation in his design approach",
        "Expanded brand through initiatives like Paula's Ibiza acquisition",
        "Established Loewe as a leader in craft and artistic collaboration"
      ]
    }
  ],

  // Ownership Changes
  ownershipChanges: [
    {
      brandName: "Versace",
      newParentCompany: "Prada Group",
      acquisitionYear: 2025,
      details: "€1.25 billion acquisition"
    },
    {
      brandName: "Christian Lacroix",
      newParentCompany: "Sociedad Textil Lonia",
      acquisitionYear: 2025,
      details: "Strategic acquisition to expand luxury portfolio"
    },
    {
      brandName: "Bonpoint",
      newParentCompany: "Youngor Group",
      acquisitionYear: 2025,
      details: "Expansion into luxury childrenswear market"
    },
    {
      brandName: "Thomas Pink",
      newParentCompany: "CP Brands Group",
      acquisitionYear: 2025,
      details: "Revitalization of British shirtmaker brand"
    },
    {
      brandName: "Vera Wang",
      newParentCompany: "WHP Global",
      acquisitionYear: 2025,
      details: "Brand management acquisition"
    }
  ]
};

// Update function
function updateFashionData() {
  // Add new brands
  changes.newBrands.forEach(brand => {
    if (!data.brands.find((b: Brand) => b.name === brand.name)) {
      data.brands.push(brand);
    }
  });

  // Add new designers
  changes.newDesigners.forEach(designer => {
    if (!data.designers.find((d: Designer) => d.name === designer.name)) {
      data.designers.push(designer);
    }
  });

  // Add new tenures
  changes.newTenures.forEach(newTenure => {
    const brand = data.brands.find((b: Brand) => b.name === newTenure.brandName);
    const designer = data.designers.find((d: Designer) => d.name === newTenure.designerName);
    
    if (brand && designer) {
      // End previous tenures for this role at this brand
      data.tenures
        .filter((t: Tenure) => t.brandId === brand.id && t.isCurrentRole)
        .forEach((t: Tenure) => {
          t.isCurrentRole = false;
          t.endYear = newTenure.startYear;
        });

      // Add new tenure
      const tenure: Tenure = {
        id: uuidv4(),
        brandId: brand.id,
        designerId: designer.id,
        role: newTenure.role,
        department: Department.ALL_DEPARTMENTS,
        startYear: newTenure.startYear,
        endYear: newTenure.endYear,
        isCurrentRole: newTenure.isCurrentRole,
        achievements: newTenure.achievements,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log(`Adding tenure for ${designer.name} at ${brand.name}`);
      console.log('Brand ID:', brand.id);
      console.log('Designer ID:', designer.id);
      
      data.tenures.push(tenure);
    } else {
      console.error(`Could not find brand ${newTenure.brandName} or designer ${newTenure.designerName}`);
    }
  });

  // Update ownership
  changes.ownershipChanges.forEach(change => {
    const brand = data.brands.find((b: Brand) => b.name === change.brandName);
    if (brand) {
      brand.parentCompany = change.newParentCompany;
      brand.updatedAt = new Date();
    } else {
      console.error(`Could not find brand ${change.brandName}`);
    }
  });

  // Write updated data back to file
  fs.writeFileSync(fashionGenealogyPath, JSON.stringify(data, null, 2));
}

// Run the update
updateFashionData();

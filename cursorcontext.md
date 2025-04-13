# Fashion Genealogy Interactive Tool - Project Context

## 🎯 Goal:

This project transforms **MustBeMargiela's static fashion genealogy chart** into an **interactive, scalable, and searchable database-backed web application**. The tool helps users explore creative director transitions, mentorships, and fashion brand relationships dynamically.

## 🛠️ Tech Stack:

- **Frontend:** Next.js (TypeScript), Tailwind CSS
- **Backend:** PocketBase
- **Graph Visualization:** D3.js or Cytoscape.js
- **State Management:** Zustand (preferred) or Context API
- **API Handling:** Fetching & updating designer-brand relationships dynamically

## 📌 Core Features:

- **Interactive Genealogy Graph:** Users can explore relationships visually.
- **Search & Filter System:** Find designers by name, brand, or timeline.
- **Designer Profiles:** Clicking a node shows detailed designer history.
- **Scalability:** Supports real-time database updates via PocketBase.
- **Mobile-Friendly UI:** Fully responsive design.

## 📌 Task Breakdown:

1. **Project Setup** - Configure Next.js, Tailwind, PocketBase.
2. **Database Design** - Structure PocketBase collections for designers, brands, and successions.
3. **Frontend Components** - Build search, filters, modals, and visualization UI.
4. **Graph Visualization** - Implement Cytoscape.js or D3.js for node-link diagrams.
5. **API & Data Fetching** - Connect PocketBase to dynamically fetch & update data.
6. **Performance Optimization** - Ensure smooth rendering of large datasets.

## 📝 AI Development Guidelines:

- Maintain **modular, reusable components**.
- Fetch data using **async/await PocketBase queries**.
- Use **Zustand for state management** instead of prop drilling.
- Write code in **TypeScript** and enforce ESLint/Prettier formatting.

// Basic Types
interface BaseEntity {
id: string; // Using string for UUID compatibility with PocketBase
createdAt: Date;
updatedAt: Date;
}

interface Designer extends BaseEntity {
name: string;
currentRole?: string; // Current position if any
isActive: boolean; // Whether they're currently active
biography?: string; // Brief bio/background
imageUrl?: string; // Profile image URL
}

interface Brand extends BaseEntity {
name: string;
foundedYear: number;
founder: string;
parentCompany?: string;
logoUrl?: string;
}

interface Tenure extends BaseEntity {
designerId: string;
brandId: string;
role: string; // e.g., "Creative Director", "Artistic Director"
startYear: number;
endYear?: number; // null/undefined if current
isCurrentRole: boolean;
}

interface Relationship extends BaseEntity {
sourceDesignerId: string; // The mentor/predecessor
targetDesignerId: string; // The mentee/successor
brandId: string; // The brand where relationship occurred
type: RelationshipType;
startYear?: number;
endYear?: number;
}

// Enums
enum RelationshipType {
MENTORSHIP = "mentorship",
SUCCESSION = "succession",
COLLABORATION = "collaboration"
}

// For Graph Visualization
interface Node {
id: string;
type: "designer" | "brand";
label: string;
data: Designer | Brand;
}

interface Edge {
source: string;
target: string;
type: RelationshipType;
data: Relationship;
}

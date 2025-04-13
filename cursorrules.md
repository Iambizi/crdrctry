# Cursor AI Coding Guidelines for Fashion Genealogy Project

## 📌 General Project Structure

- This project is an **interactive fashion genealogy tool** that visualizes creative director successions, mentorships, and brand relationships.
- The stack is **Next.js (TypeScript) + PocketBase + D3.js or Cytoscape.js for visualization**.
- All code must follow the **Modular Component Structure** using the `/components` directory.

## 📌 Folder Structure & Import Aliases

- Use these **import aliases** for clean imports:
  - `@/components/*` → UI components
  - `@/styles/*` → Tailwind styles
  - `@/utils/*` → Helper functions
  - `@/hooks/*` → Custom React hooks
  - `@/types/*` → TypeScript types
  - `@/data/*` → Static JSON files
  - `@/context/*` → Global state management (Zustand or Context API)

## 📌 Database & API Integration (PocketBase)

- Fetch **brands, designers, mentorships, and successions** from PocketBase.
- Use **`pocketbase`** to handle database queries.
- Define API routes under `/pages/api/*`:
  - `GET /api/designers` → Fetch all designers
  - `GET /api/brands` → Fetch all brands
  - `POST /api/addDesigner` → Add a new designer
  - `POST /api/updateBrand` → Update brand data

## 📌 React Components & State Management

- All UI components must go into `/components`.
- Use **Zustand** for global state, avoiding unnecessary prop drilling.
- Reusable UI elements like **modals, search bars, and filters** should be independent components.

## 📌 Graph Visualization (D3.js / Cytoscape.js)

- The main interactive genealogy graph should be implemented in `/components/GraphVisualization.tsx`.
- Allow users to **click on designers/brands** to see details in a modal.
- Ensure smooth **zoom, pan, and filtering** for large datasets.

## 📌 Code Quality & Best Practices

- Enforce TypeScript usage (`.tsx` for components, `.ts` for utilities).
- Follow **React Hooks best practices** (`useEffect` for fetching data, `useState` for UI logic).
- Use **async/await** for database interactions.
- Format code with **Prettier** and **ESLint**.

## 📌 Task Flow & AI-Assisted Development

- When generating components, always follow **this structure**:
  1. Define **TypeScript types** (`@/types`).
  2. Fetch data from **PocketBase** (`@/utils`).
  3. Implement UI in **React Components** (`@/components`).
  4. Connect components to **State Management** (`@/context`).

# CITIZEN App - Frontend AI Generation Guide

Use this document as context when asking an AI (like ChatGPT or Claude) to generate new frontend components for the CITIZEN app. Paste the content below to the AI along with your prompt to ensure the generated code integrates seamlessly without breaking the existing architecture.

---
*(Copy everything below this line and provide it to the AI)*

## Project Context: CITIZEN App
You are acting as an expert React Developer building components for the CITIZEN app—a civic issue reporting and resolution platform. You need to write code that perfectly matches the existing tech stack, design system, and state management patterns.

### Tech Stack
- **Framework**: React 18
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **Icons**: `lucide-react`
- **Animations**: `framer-motion`
- **Charts**: `recharts`
- **Maps**: `leaflet` (using raw DOM manipulation via refs, NOT `react-leaflet`)
- **Build Tool**: Vite

### Architecture & State Management Rules
1. **No React Router**: Do NOT use `react-router-dom`. The app uses a custom context-based navigation system.
2. **Global State (`useApp`)**: All global state, authentication, and navigation are managed by `AppContext`.
   - Import it via: `import { useApp } from '../../context/AppContext.js';` (Adjust relative path as needed. Note the `.js` extension for imports even though it's TypeScript).
   - Available state/functions include: 
     - `currentUser: User`
     - `activeTab: string`
     - `setActiveTab: (tab: string) => void` (Used for navigation)
     - `isOffline: boolean`
     - `triggerRefresh: () => void` (Forces data refetch)
3. **API Calls**: The backend is an Express server running on the same origin (in development, Vite proxies API requests).
   - Base path: `/api/v1/`
   - Always include the demo user ID header in requests if authentication is required: `headers: { 'x-demo-user-id': String(currentUser.id) }`
4. **File Extensions**: When importing internal modules (context, types, other components), always append `.js` to the import path to comply with the project's module resolution (e.g., `import { Issue } from '../../types.js';`).

### Design System & UI Guidelines
1. **Glassmorphism & Gradients**: The app uses a modern, premium aesthetic. Use backdrop blurs (`backdrop-blur-xl`, `bg-white/10`) and subtle borders (`border-white/20`) for floating elements.
2. **Colors**: 
   - Primary accents: Blue (`blue-600`), Indigo (`indigo-600`)
   - Success: Emerald/Green
   - Warning/High Priority: Rose/Red (`rose-500`)
   - Neutral backgrounds: `slate-50`, `slate-900` (for dark elements).
3. **Animations**: Wrap main structural elements or modals in `motion.div` from `framer-motion`. Provide subtle entry animations (e.g., `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}`).
4. **Icons**: Exclusively use `lucide-react` for iconography.

### Example Component Structure
```tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Layers, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext.js';
import { Issue } from '../../types.js';

export const CustomComponent: React.FC = () => {
  const { currentUser, setActiveTab } = useApp();
  const [data, setData] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Example API fetch
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/v1/issues', {
          headers: { 'x-demo-user-id': String(currentUser.id) }
        });
        const json = await res.json();
        setData(json.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100"
    >
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Layers className="text-blue-500" /> My Custom View
      </h2>
      {/* Implementation details */}
    </motion.div>
  );
};
```

**Task Requirements**: 
Ensure the component is highly polished, responsive, strictly typed, and directly insertable into the CITIZEN project structure without triggering import errors or routing issues.

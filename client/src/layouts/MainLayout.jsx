// src/layouts/MainLayout.jsx
// ---------------------------------------------------------
// Wraps all protected pages with:
//   - Navbar at the top
//   - Main content area with consistent padding
//   - Footer at the bottom
//
// All protected routes in App.jsx use this layout via
// React Router's <Outlet /> pattern.
// ---------------------------------------------------------

import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

export default function MainLayout() {
  return (
    <div className="layout">
      <Navbar />

      <main className="layout-main">
        {/* Outlet renders the matched child route's component */}
        <Outlet />
      </main>

      <footer className="layout-footer">
        <p>
          ⚠️ NutriScan provides <strong>estimates only</strong>. Nutrition values
          are not medically verified and not a substitute for professional advice.
        </p>
        <p className="layout-footer-copy">
          © {new Date().getFullYear()} NutriScan · MCA Project
        </p>
      </footer>
    </div>
  );
}


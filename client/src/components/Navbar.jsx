// src/components/Navbar.jsx
// ---------------------------------------------------------
// Top navigation bar shown on all protected pages.
// - Shows NutriScan logo + nav links on desktop
// - Collapses to a hamburger menu on mobile
// - Shows logged-in user's name and logout button
// ---------------------------------------------------------

import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  ScanLine,
  BookOpen,
  User,
  LogOut,
  Menu,
  X,
  Leaf,
} from 'lucide-react';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/scanner',   label: 'Scan Meal',  Icon: ScanLine        },
  { to: '/diary',     label: 'Diary',      Icon: BookOpen        },
  { to: '/profile',   label: 'Profile',    Icon: User            },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      {/* ── Brand ── */}
      <NavLink to="/dashboard" className="navbar-brand" onClick={closeMenu}>
        <Leaf size={24} strokeWidth={2.5} />
        <span>NutriScan</span>
      </NavLink>

      {/* ── Desktop Nav Links ── */}
      <ul className="navbar-links">
        {NAV_LINKS.map(({ to, label, Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                'navbar-link' + (isActive ? ' navbar-link--active' : '')
              }
            >
              <Icon size={17} />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      {/* ── Desktop User + Logout ── */}
      <div className="navbar-user">
        <span className="navbar-username">
          Hi, {user?.name?.split(' ')[0] || 'User'} 👋
        </span>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
          <LogOut size={16} />
          Logout
        </button>
      </div>

      {/* ── Mobile Hamburger ── */}
      <button
        className="navbar-hamburger"
        onClick={() => setMenuOpen((o) => !o)}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
      >
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* ── Mobile Dropdown Menu ── */}
      {menuOpen && (
        <div className="navbar-mobile-menu">
          {NAV_LINKS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                'navbar-mobile-link' + (isActive ? ' navbar-mobile-link--active' : '')
              }
              onClick={closeMenu}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          <div className="navbar-mobile-divider" />
          <span className="navbar-mobile-user">
            {user?.name || 'User'}
          </span>
          <button className="btn btn-ghost btn-sm navbar-mobile-logout" onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}


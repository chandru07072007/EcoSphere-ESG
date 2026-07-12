import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Leaf, BarChart2, Target, Users, Trophy, Gift, Medal,
  Shield, FileText, ClipboardList, TrendingUp, FileBarChart, Settings,
  Database, Building, Zap, Award, ChevronRight, PanelLeftClose, PanelLeftOpen,
  LogOut
} from 'lucide-react';
import useAppStore from '../../store/useAppStore';

// ============================================================
// NAV STRUCTURE
// ============================================================
const navGroups = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    id: 'environmental',
    label: 'Environmental',
    items: [
      { label: 'Carbon Tracking',    path: '/environmental/tracking',     icon: Leaf },
      { label: 'Transactions',       path: '/environmental/transactions',  icon: BarChart2 },
      { label: 'Sustainability Goals',path: '/environmental/goals',        icon: Target },
    ],
  },
  {
    id: 'social',
    label: 'Social',
    items: [
      { label: 'CSR Activities', path: '/social/csr',         icon: Users },
      { label: 'Challenges',     path: '/social/challenges',   icon: Trophy },
      { label: 'Leaderboard',    path: '/social/leaderboard',  icon: Award },
      { label: 'Rewards',        path: '/social/rewards',      icon: Gift },
    ],
  },
  {
    id: 'governance',
    label: 'Governance',
    items: [
      { label: 'Compliance Issues', path: '/governance/compliance', icon: Shield },
      { label: 'Policy Management', path: '/governance/policies',   icon: FileText },
      { label: 'Audits',            path: '/governance/audits',     icon: ClipboardList },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    items: [
      { label: 'Reports',              path: '/analytics/reports',  icon: TrendingUp },
      { label: 'Custom Report Builder',path: '/analytics/custom',   icon: FileBarChart },
    ],
  },
  {
    id: 'masterdata',
    label: 'Master Data',
    items: [
      { label: 'Departments',     path: '/master-data/departments',      icon: Building },
      { label: 'Emission Factors',path: '/master-data/emission-factors', icon: Zap },
      { label: 'Badges',          path: '/master-data/badges',           icon: Medal },
      { label: 'Rewards',         path: '/master-data/rewards',          icon: Gift },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    items: [
      { label: 'Settings', path: '/settings', icon: Settings },
    ],
  },
];

// ============================================================
// LEAF SVG ICON
// ============================================================
const LeafIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path
      d="M21 3C21 3 14 4 9 9C4 14 3 21 3 21C3 21 7 20 10 18C10 18 10 17 11 16C12 15 13 15 13 15C13 15 16 14 18 12C20 10 21 7 21 5V3Z"
      fill="currentColor"
      opacity="0.9"
    />
    <path d="M3 21C6 18 9 14 12 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// ============================================================
// SIDEBAR COMPONENT
// ============================================================
const Sidebar = () => {
  const { ui, toggleSidebar, user, logout } = useAppStore();
  const collapsed = ui.sidebarCollapsed;
  const location = useLocation();

  // Track which groups are expanded
  const [expandedGroups, setExpandedGroups] = useState(() => {
    const initial = {};
    navGroups.forEach((g) => { initial[g.id] = true; });
    return initial;
  });

  const toggleGroup = (id) => {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <NavLink to="/dashboard" className="sidebar-logo" style={{ textDecoration: 'none' }}>
        <div className="sidebar-logo-icon">
          <LeafIcon />
        </div>
        <div className="sidebar-logo-text">
          <div className="sidebar-logo-name">EcoSphere</div>
          <div className="sidebar-logo-tagline">ESG PLATFORM</div>
        </div>
      </NavLink>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navGroups.map((group) => (
          <div key={group.id} className="nav-group">
            {/* Group header (hidden when collapsed) */}
            {!collapsed && (
              <div
                className="nav-group-header"
                onClick={() => toggleGroup(group.id)}
              >
                <span>{group.label}</span>
                <ChevronRight
                  className={`nav-group-chevron ${expandedGroups[group.id] ? 'open' : ''}`}
                  size={12}
                />
              </div>
            )}

            {/* Group items */}
            <AnimatePresence initial={false}>
              {(collapsed || expandedGroups[group.id]) && (
                <motion.div
                  className="nav-items"
                  initial={collapsed ? false : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  style={{ overflow: 'hidden' }}
                >
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={`nav-item ${active ? 'active' : ''}`}
                        style={{ textDecoration: 'none' }}
                      >
                        <span className="nav-item-icon">
                          <Icon size={16} />
                        </span>
                        <span className="nav-item-label">{item.label}</span>
                        {collapsed && (
                          <span className="nav-item-tooltip">{item.label}</span>
                        )}
                      </NavLink>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      {/* User Info */}
      <div className="sidebar-user">
        <div className="sidebar-user-avatar">
          {getInitials(user?.name)}
        </div>
        <div className="sidebar-user-info">
          <div className="sidebar-user-name">{user?.name || 'User'}</div>
          <div className="sidebar-user-role">{user?.role || 'Employee'}</div>
        </div>
      </div>

      {/* Collapse button */}
      <div className="sidebar-collapse-btn" onClick={toggleSidebar}>
        {collapsed ? (
          <PanelLeftOpen size={16} />
        ) : (
          <>
            <PanelLeftClose size={16} />
            <span className="sidebar-collapse-text">Collapse</span>
          </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;

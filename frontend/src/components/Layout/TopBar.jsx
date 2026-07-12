import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Search, User, Settings, LogOut, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAppStore from '../../store/useAppStore';
import NotificationPanel from './NotificationPanel';

// ============================================================
// MODULE TITLE MAP
// ============================================================
const routeTitles = {
  '/dashboard': { title: 'Dashboard', sub: 'Overview of your ESG metrics' },
  '/environmental/tracking': { title: 'Carbon Tracking', sub: 'Environmental · Carbon Analytics' },
  '/environmental/transactions': { title: 'Carbon Transactions', sub: 'Environmental · Transaction Log' },
  '/environmental/goals': { title: 'Sustainability Goals', sub: 'Environmental · Goal Management' },
  '/social/csr': { title: 'CSR Activities', sub: 'Social · Community Programs' },
  '/social/challenges': { title: 'Challenges', sub: 'Social · Employee Challenges' },
  '/social/leaderboard': { title: 'Leaderboard', sub: 'Social · Rankings & Points' },
  '/social/rewards': { title: 'Reward Catalog', sub: 'Social · Redeem Points' },
  '/governance/compliance': { title: 'Compliance Issues', sub: 'Governance · Issue Tracker' },
  '/governance/policies': { title: 'Policy Management', sub: 'Governance · Policy Library' },
  '/governance/audits': { title: 'Audits', sub: 'Governance · Audit Log' },
  '/analytics/reports': { title: 'Reports', sub: 'Analytics · ESG Reports' },
  '/analytics/custom': { title: 'Custom Report Builder', sub: 'Analytics · Build & Export' },
  '/master-data/departments': { title: 'Departments', sub: 'Master Data · Organization' },
  '/master-data/emission-factors': { title: 'Emission Factors', sub: 'Master Data · Configuration' },
  '/master-data/badges': { title: 'Badges', sub: 'Master Data · Badge Library' },
  '/master-data/rewards': { title: 'Rewards', sub: 'Master Data · Reward Catalog' },
  '/settings': { title: 'Settings', sub: 'Platform Configuration' },
};

// ============================================================
// TOPBAR COMPONENT
// ============================================================
const TopBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { ui, user, logout, notifications } = useAppStore();
  const collapsed = ui.sidebarCollapsed;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const pageInfo = routeTitles[location.pathname] || { title: 'EcoSphere', sub: 'ESG Platform' };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className={`topbar ${collapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Breadcrumb */}
        <div className="topbar-breadcrumb">
          <div className="topbar-breadcrumb-title">{pageInfo.title}</div>
          <div className="topbar-breadcrumb-sub">{pageInfo.sub}</div>
        </div>

        {/* Search */}
        <div className="topbar-search">
          <Search size={14} color="var(--text-muted)" />
          <input type="text" placeholder="Search anything..." />
        </div>

        {/* Actions */}
        <div className="topbar-actions">
          {/* Notification Bell */}
          <div
            className="topbar-icon-btn"
            onClick={() => setNotifOpen(!notifOpen)}
            title="Notifications"
          >
            <Bell size={18} />
            {notifications.unreadCount > 0 && (
              <span className="topbar-notif-badge">
                {notifications.unreadCount > 9 ? '9+' : notifications.unreadCount}
              </span>
            )}
          </div>

          {/* Avatar + Dropdown */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <div
              className="topbar-avatar"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              title={user?.name}
            >
              {getInitials(user?.name)}
            </div>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  className="avatar-dropdown"
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  <div className="avatar-dropdown-header">
                    <div className="avatar-dropdown-name">{user?.name || 'User'}</div>
                    <div className="avatar-dropdown-email">{user?.email || ''}</div>
                    <div className="mt-2">
                      <span className="badge badge-emerald" style={{ fontSize: '0.6875rem' }}>
                        {user?.role || 'Employee'}
                      </span>
                    </div>
                  </div>

                  <div
                    className="avatar-dropdown-item"
                    onClick={() => { setDropdownOpen(false); navigate('/settings'); }}
                  >
                    <Settings size={14} />
                    Settings
                  </div>

                  <div
                    className="avatar-dropdown-item danger"
                    onClick={handleLogout}
                  >
                    <LogOut size={14} />
                    Sign Out
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Notification Panel */}
      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
};

export default TopBar;

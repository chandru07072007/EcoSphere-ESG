import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Award } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

// ============================================================
// PAGE TRANSITION VARIANTS
// ============================================================
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  in:      { opacity: 1, y: 0 },
  out:     { opacity: 0, y: -8 },
};

const pageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.28,
};

// ============================================================
// APP SHELL — Protected Layout Wrapper
// ============================================================
const AppShell = ({ children }) => {
  const { isAuthenticated, ui } = useAppStore();
  const location = useLocation();

  // Redirect unauthenticated users to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      {/* 🏛️ Top Government Header Banner */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'var(--banner-height)',
        background: 'var(--blue)',
        color: 'var(--text-inverse)',
        padding: '0 24px',
        fontSize: '0.72rem',
        fontWeight: 600,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '3px solid var(--amber)',
        letterSpacing: '0.05em',
        zIndex: 9999,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Award size={13} color="var(--amber)" />
          <span>APIMINDS COMPANY & CORPORATE PARTNERS • ECOSPHERE NATIONAL ESG CERTIFICATION PROGRAM (ECOSPHERE-ESG)</span>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <span>Ministry of Environment, Forest and Climate Change</span>
          <span>|</span>
          <span>Ministry of Education</span>
          <span>|</span>
          <span>Private Corporate Registry</span>
        </div>
      </div>

      <div className="app-shell" style={{ flex: 1 }}>
        <Sidebar />

        <div className={`main-content ${ui.sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <TopBar />

          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
              className="page-container"
            >
              {children || <Outlet />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AppShell;

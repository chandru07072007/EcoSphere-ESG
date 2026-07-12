import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/Layout/AppShell';

// Auth pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Dashboard
import Dashboard from './pages/Dashboard/Dashboard';

// Environmental pages
import CarbonTracking from './pages/Environmental/CarbonTracking';
import CarbonTransactions from './pages/Environmental/CarbonTransactions';
import SustainabilityGoals from './pages/Environmental/SustainabilityGoals';

// Social pages
import CSRActivities from './pages/Social/CSRActivities';
import Challenges from './pages/Social/Challenges';
import Leaderboard from './pages/Social/Leaderboard';
import RewardCatalog from './pages/Social/RewardCatalog';

// Governance pages
import ComplianceIssues from './pages/Governance/ComplianceIssues';
import PolicyManagement from './pages/Governance/PolicyManagement';
import Audits from './pages/Governance/Audits';

// Analytics pages
import Reports from './pages/Analytics/Reports';
import CustomReportBuilder from './pages/Analytics/CustomReportBuilder';

// Master Data pages
import Departments from './pages/MasterData/Departments';
import EmissionFactors from './pages/MasterData/EmissionFactors';
import Badges from './pages/MasterData/Badges';
import Rewards from './pages/MasterData/Rewards';

// Settings page
import Settings from './pages/Settings/Settings';

const App = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes enclosed in AppShell */}
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Environmental */}
        <Route path="/environmental/tracking" element={<CarbonTracking />} />
        <Route path="/environmental/transactions" element={<CarbonTransactions />} />
        <Route path="/environmental/goals" element={<SustainabilityGoals />} />

        {/* Social */}
        <Route path="/social/csr" element={<CSRActivities />} />
        <Route path="/social/challenges" element={<Challenges />} />
        <Route path="/social/leaderboard" element={<Leaderboard />} />
        <Route path="/social/rewards" element={<RewardCatalog />} />

        {/* Governance */}
        <Route path="/governance/compliance" element={<ComplianceIssues />} />
        <Route path="/governance/policies" element={<PolicyManagement />} />
        <Route path="/governance/audits" element={<Audits />} />

        {/* Analytics */}
        <Route path="/analytics/reports" element={<Reports />} />
        <Route path="/analytics/custom" element={<CustomReportBuilder />} />

        {/* Master Data */}
        <Route path="/master-data/departments" element={<Departments />} />
        <Route path="/master-data/emission-factors" element={<EmissionFactors />} />
        <Route path="/master-data/badges" element={<Badges />} />
        <Route path="/master-data/rewards" element={<Rewards />} />

        {/* Settings */}
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Catch-all Route redirecting to Dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
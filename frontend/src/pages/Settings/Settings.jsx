import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Settings as SettingsIcon, Save, Info } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

import { getBusinessSettings, updateBusinessSettings } from '../../services/masterDataService';
import WeightSlider from '../../components/Forms/WeightSlider';

const Settings = () => {
  const { user } = useAppStore();
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  const [settings, setSettings] = useState({
    auto_emission: true,
    evidence_required: true,
    badge_auto_award: true,
    e_weight: 40,
    s_weight: 30,
    g_weight: 30,
  });
  
  const [loading, setLoading] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await getBusinessSettings();
      setSettings({
        auto_emission: data.auto_emission ?? true,
        evidence_required: data.evidence_required ?? true,
        badge_auto_award: data.badge_auto_award ?? true,
        e_weight: data.e_weight ?? 40,
        s_weight: data.s_weight ?? 30,
        g_weight: data.g_weight ?? 30,
      });
    } catch (err) {
      toast.error('Failed to load system settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleToggle = (key) => {
    if (!isManager) return;
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleWeightsChange = (newWeights) => {
    setSettings((prev) => ({
      ...prev,
      e_weight: newWeights.e,
      s_weight: newWeights.s,
      g_weight: newWeights.g,
    }));
  };

  const handleSave = async () => {
    if (!isManager) {
      toast.error('You must be a manager or admin to edit settings');
      return;
    }

    const sum = Number(settings.e_weight) + Number(settings.s_weight) + Number(settings.g_weight);
    if (Math.abs(sum - 100) > 0.001) {
      toast.error(`ESG Pillar weights must sum to exactly 100%. Current sum: ${sum}%`);
      return;
    }

    try {
      await updateBusinessSettings(settings);
      toast.success('System settings saved successfully!');
      fetchSettings();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update settings');
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 800 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div>
          <h1 className="page-title">Platform Settings</h1>
          <p className="page-subtitle" style={{ color: 'var(--text-secondary)' }}>Configure automated ESG algorithms, rules engines, and weight parameters</p>
        </div>
        {isManager && (
          <button className="btn btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Save size={16} /> Save Configurations
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Business Rules */}
        <div className="card card-glass">
          <h3 style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <SettingsIcon size={18} style={{ color: 'var(--emerald)' }} />
            Automated Sustainability Engines
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Rule 1 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Automatic Emission Calculation (E)</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Automatically calculate CO2e quantities when expense transactions are logged.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.auto_emission}
                onChange={() => handleToggle('auto_emission')}
                disabled={!isManager}
                style={{ width: 40, height: 20 }}
              />
            </div>

            {/* Rule 2 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Evidence Gates on CSR (S)</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Require digital proof files upload before approving CSR hours rewards.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.evidence_required}
                onChange={() => handleToggle('evidence_required')}
                disabled={!isManager}
                style={{ width: 40, height: 20 }}
              />
            </div>

            {/* Rule 3 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Badge Auto-Awarding (XP)</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Call gamification engines to grant milestones as soon as criteria is met.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.badge_auto_award}
                onChange={() => handleToggle('badge_auto_award')}
                disabled={!isManager}
                style={{ width: 40, height: 20 }}
              />
            </div>
          </div>
        </div>

        {/* ESG Weights */}
        <div className="card card-glass">
          <h3 style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Info size={18} style={{ color: 'var(--blue)' }} />
            ESG Pillar Weight Configuration
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
            Configure how environmental, social, and governance activities accumulate to compose the final organization ESG index.
          </p>

          <WeightSlider
            weights={{ e: settings.e_weight, s: settings.s_weight, g: settings.g_weight }}
            onChange={handleWeightsChange}
            disabled={!isManager}
          />
        </div>
      </div>
    </div>
  );
};

export default Settings;

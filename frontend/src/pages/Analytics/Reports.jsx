import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Download, FileText, FileSpreadsheet, File } from 'lucide-react';
import { getReport, exportReport } from '../../services/analyticsService';
import ScoreCard from '../../components/UI/ScoreCard';
import LineChart from '../../components/Charts/LineChart';
import BarChart from '../../components/Charts/BarChart';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('environmental');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async (tab) => {
    setLoading(true);
    try {
      const res = await getReport(tab);
      setReportData(res.data);
    } catch (err) {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab]);

  const handleExport = async (format) => {
    try {
      toast.loading('Preparing report file...');
      const response = await exportReport(activeTab, format);
      toast.dismiss();
      if (response && response.download_url) {
        window.open(response.download_url, '_blank');
        toast.success(`Exported ${format} successfully!`);
      } else {
        // Direct response blob download fallback done by axios response helper
        toast.success('Report downloaded successfully!');
      }
    } catch (err) {
      toast.dismiss();
      toast.error('Export failed');
    }
  };

  const tabs = [
    { id: 'environmental', label: 'Environmental (E)' },
    { id: 'social', label: 'Social (S)' },
    { id: 'governance', label: 'Governance (G)' },
    { id: 'summary', label: 'ESG Summary' },
  ];

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">ESG Reporting</h1>
          <p className="page-subtitle" style={{ color: 'var(--text-secondary)' }}>Download official regulatory compliance sheets and check indicators</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => handleExport('csv')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <File size={14} /> CSV
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => handleExport('excel')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileSpreadsheet size={14} /> Excel
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => handleExport('pdf')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText size={14} /> PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24, gap: 16 }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--emerald)' : 'none',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: activeTab === tab.id ? 600 : 500,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>Compiling report charts...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {activeTab === 'environmental' && reportData && (
            <>
              <div style={{ display: 'flex', gap: 16 }}>
                <ScoreCard title="Total Carbon Emission" value={`${reportData.total_co2e || 0} tonnes`} icon="Leaf" trend={{ type: 'down', value: '8.4%' }} />
                <ScoreCard title="Record Count" value={reportData.row_count || 0} icon="FileText" />
              </div>
              <div className="card card-glass">
                <h3>CO2e Emissions by Transaction</h3>
                <div style={{ height: 300, marginTop: 16 }}>
                  {reportData.rows && reportData.rows.length > 0 ? (
                    <BarChart
                      data={reportData.rows.map((r) => ({ label: new Date(r.date).toLocaleDateString(), value: r.amount_co2e }))}
                    />
                  ) : (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No carbon transaction data registered.</p>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'social' && reportData && (
            <>
              <div style={{ display: 'flex', gap: 16 }}>
                <ScoreCard title="Avg Approval Rate" value={`${reportData.avg_approval_rate || 0}%`} icon="Users" />
                <ScoreCard title="Active CSR Projects" value={reportData.row_count || 0} icon="Award" />
              </div>
              <div className="card card-glass">
                <h3>CSR Activity Participation rates</h3>
                <div style={{ height: 300, marginTop: 16 }}>
                  {reportData.rows && reportData.rows.length > 0 ? (
                    <BarChart
                      data={reportData.rows.map((r) => ({ label: r.activity_title, value: r.approval_rate_pct }))}
                    />
                  ) : (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No CSR activities logged.</p>
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'governance' && reportData && (
            <>
              <div style={{ display: 'flex', gap: 16 }}>
                <ScoreCard title="Total Tickets Logged" value={reportData.row_count || 0} icon="Shield" />
                <ScoreCard title="Overdue Tickets" value={reportData.overdue_count || 0} icon="AlertTriangle" />
              </div>
              <div className="card card-glass">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Severity</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.rows && reportData.rows.map((row, idx) => (
                      <tr key={idx}>
                        <td>{row.title}</td>
                        <td>{row.severity}</td>
                        <td>{row.status}</td>
                      </tr>
                    ))}
                    {(!reportData.rows || reportData.rows.length === 0) && (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No compliance issues logged.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'summary' && reportData && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <ScoreCard title="Total Carbon" value={`${reportData.total_co2e_tonnes || 0} t`} icon="Leaf" />
              <ScoreCard title="CSR Success Rate" value={`${reportData.avg_csr_approval_rate || 0}%`} icon="Users" />
              <ScoreCard title="Open Governance Issues" value={reportData.open_compliance_issues || 0} icon="Shield" />
              <ScoreCard title="Overdue Warnings" value={reportData.overdue_compliance_issues || 0} icon="AlertTriangle" />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
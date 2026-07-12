import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Check, Clock, AlertTriangle } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

import {
  getComplianceIssues,
  createComplianceIssue,
  updateComplianceIssue,
  getOverdueIssues,
} from '../../services/governanceService';
import { getDepartments } from '../../services/masterDataService';
import DataTable from '../../components/UI/DataTable';
import Modal from '../../components/UI/Modal';
import StatusBadge from '../../components/UI/StatusBadge';

const ComplianceIssues = () => {
  const { user } = useAppStore();
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  const [issues, setIssues] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await getComplianceIssues();
      setIssues(data);
      const depts = await getDepartments();
      setDepartments(depts);
    } catch (err) {
      toast.error('Failed to load compliance issues');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleResolve = async (issueId) => {
    try {
      await updateComplianceIssue(issueId, { status: 'resolved' });
      toast.success('Issue marked as resolved');
      fetchAll();
    } catch (err) {
      toast.error('Failed to update issue');
    }
  };

  const onSubmit = async (data) => {
    try {
      await createComplianceIssue(data);
      toast.success('Compliance issue logged successfully!');
      setModalOpen(false);
      reset();
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to log issue');
    }
  };

  const getSeverityBadgeClass = (severity) => {
    switch (severity) {
      case 'critical': return 'badge-danger';
      case 'high': return 'badge-amber';
      case 'medium': return 'badge-blue';
      default: return 'badge-gray';
    }
  };

  const columns = [
    { key: 'title', header: 'Issue Title', sortable: true },
    {
      key: 'severity',
      header: 'Severity',
      sortable: true,
      render: (sev) => (
        <span className={`status-badge ${getSeverityBadgeClass(sev)}`}>
          {sev.toUpperCase()}
        </span>
      ),
    },
    { key: 'owner_id', header: 'Owner User ID' },
    {
      key: 'due_date',
      header: 'Due Date',
      sortable: true,
      render: (date) => date ? new Date(date).toLocaleDateString() : '—',
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (status) => <StatusBadge status={status} />,
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Compliance Issues</h1>
          <p className="page-subtitle" style={{ color: 'var(--text-secondary)' }}>Track and resolve ESG regulatory actions and policy violations</p>
        </div>
        {isManager && (
          <button className="btn btn-primary" onClick={() => setModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} /> Log Violation
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={issues}
        loading={loading}
        exportFilename="compliance-issues"
        rowActions={(row) => (
          <>
            {row.status !== 'resolved' && row.status !== 'closed' && (
              <button
                className="btn btn-sm btn-primary"
                onClick={() => handleResolve(row._id || row.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px' }}
              >
                <Check size={10} /> Resolve
              </button>
            )}
          </>
        )}
      />

      {/* Log issue modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Log Compliance Issue">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
            <div>
              <label className="form-label">Title</label>
              <input className="form-input" type="text" {...register('title', { required: true })} placeholder="e.g. Incomplete Carbon Report" />
            </div>
            <div>
              <label className="form-label">Description</label>
              <textarea className="form-input" {...register('description', { required: true })} placeholder="Describe the compliance gap..." rows={3} style={{ resize: 'none' }} />
            </div>
            <div>
              <label className="form-label">Severity Level</label>
              <select className="form-select" {...register('severity')}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="form-label">Owner User ID (Required)</label>
              <input className="form-input" type="text" {...register('owner_id', { required: true })} placeholder="Assignee user ID" />
            </div>
            <div>
              <label className="form-label">Due Date (Required)</label>
              <input className="form-input" type="date" {...register('due_date', { required: true })} />
            </div>
            <div>
              <label className="form-label">Associated Department</label>
              <select className="form-select" {...register('department_id')}>
                {departments.map((d) => (
                  <option key={d._id || d.id} value={d._id || d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ComplianceIssues;
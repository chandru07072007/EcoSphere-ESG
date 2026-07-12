import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, ShieldAlert, Award, FileText, CheckCircle } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

import {
  getPolicies,
  createPolicy,
  publishPolicy,
  acknowledgePolicy,
  getPolicyAcknowledgements,
} from '../../services/governanceService';
import { getDepartments } from '../../services/masterDataService';
import DataTable from '../../components/UI/DataTable';
import Modal from '../../components/UI/Modal';
import ProgressBar from '../../components/UI/ProgressBar';
import { useForm } from 'react-hook-form';

const PolicyManagement = () => {
  const { user } = useAppStore();
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  const [policies, setPolicies] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Track acknowledgements
  const [ackOpen, setAckOpen] = useState(false);
  const [acknowledgements, setAcknowledgements] = useState([]);
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  const { register, handleSubmit, reset } = useForm();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await getPolicies();
      setPolicies(data);
      const depts = await getDepartments();
      setDepartments(depts);
    } catch (err) {
      toast.error('Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleAcknowledge = async (policyId) => {
    try {
      await acknowledgePolicy(policyId);
      toast.success('Policy acknowledged successfully');
      fetchAll();
    } catch (err) {
      toast.error('Failed to acknowledge policy');
    }
  };

  const handlePublish = async (policyId) => {
    try {
      await publishPolicy(policyId);
      toast.success('Policy published! Notification sent to all users.');
      fetchAll();
    } catch (err) {
      toast.error('Failed to publish policy');
    }
  };

  const openAckModal = async (policy) => {
    setSelectedPolicy(policy);
    try {
      const data = await getPolicyAcknowledgements(policy._id || policy.id);
      setAcknowledgements(data);
      setAckOpen(true);
    } catch (err) {
      toast.error('Failed to load acknowledgements');
    }
  };

  const onSubmit = async (data) => {
    // Convert departments to list
    const payload = {
      ...data,
      department_ids: [data.department_ids],
    };
    try {
      await createPolicy(payload);
      toast.success('Policy created successfully');
      setModalOpen(false);
      reset();
      fetchAll();
    } catch (err) {
      toast.error('Failed to create policy');
    }
  };

  const columns = [
    { key: 'title', header: 'Policy Title', sortable: true },
    { key: 'version', header: 'Version', width: '80px' },
    {
      key: 'published_at',
      header: 'Published Date',
      sortable: true,
      render: (date) => date ? new Date(date).toLocaleDateString() : 'Draft',
    },
    {
      key: 'acknowledgements',
      header: 'Acks Rate',
      render: (_, row) => {
        const total = row.total_required || 0;
        const c = row.acknowledgement_count || 0;
        const pct = total > 0 ? Math.round((c / total) * 100) : 0;
        return <ProgressBar value={pct} label={`${c}/${total}`} />;
      },
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Policy & Regulatory Control</h1>
          <p className="page-subtitle" style={{ color: 'var(--text-secondary)' }}>Publish corporate guidelines, tracks acknowledgements and regulatory standards</p>
        </div>
        {isManager && (
          <button className="btn btn-primary" onClick={() => setModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} /> Create Policy
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={policies}
        loading={loading}
        exportFilename="policies"
        rowActions={(row) => (
          <>
            {!row.published_at && isManager && (
              <button className="btn btn-sm btn-primary" onClick={() => handlePublish(row._id || row.id)}>
                Publish
              </button>
            )}
            {row.published_at && (
              <>
                <button className="btn btn-sm btn-secondary" onClick={() => openAckModal(row)}>
                  Status
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => handleAcknowledge(row._id || row.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <CheckCircle size={10} /> Acknowledge
                </button>
              </>
            )}
          </>
        )}
      />

      {/* Create Policy Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Policy Document">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
            <div>
              <label className="form-label">Title</label>
              <input className="form-input" type="text" {...register('title', { required: true })} placeholder="e.g. Code of Conduct" />
            </div>
            <div>
              <label className="form-label">Scope / Focus Area</label>
              <input className="form-input" type="text" {...register('scope', { required: true })} placeholder="e.g. Environmental, Social, HR" />
            </div>
            <div>
              <label className="form-label">Version</label>
              <input className="form-input" type="text" {...register('version', { required: true })} placeholder="v1.0" />
            </div>
            <div>
              <label className="form-label">Policy Content / Document body</label>
              <textarea className="form-input" {...register('content', { required: true })} placeholder="Full text of the compliance policy..." rows={4} style={{ resize: 'none' }} />
            </div>
            <div>
              <label className="form-label">Target Department (Scope)</label>
              <select className="form-select" {...register('department_ids', { required: true })}>
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

      {/* Acknowledgements Status Modal */}
      <Modal isOpen={ackOpen} onClose={() => setAckOpen(false)} title={`Acks Tracker: ${selectedPolicy?.title}`}>
        <div style={{ maxHeight: 350, overflowY: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Acknowledged At</th>
              </tr>
            </thead>
            <tbody>
              {acknowledgements.map((ack) => (
                <tr key={ack.id || ack._id}>
                  <td>{ack.employee_name || ack.employee_id}</td>
                  <td>{new Date(ack.acknowledged_at).toLocaleString()}</td>
                </tr>
              ))}
              {acknowledgements.length === 0 && (
                <tr>
                  <td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No acknowledgements recorded yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Modal>
    </div>
  );
};

export default PolicyManagement;
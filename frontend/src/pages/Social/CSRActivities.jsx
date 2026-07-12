import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Check, X, FileUp, Sparkles, UserCheck } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

import {
  getCSRActivities,
  createCSRActivity,
  participateInCSR,
  uploadProof,
  approveParticipation,
  denyParticipation,
} from '../../services/socialService';
import { getDepartments } from '../../services/masterDataService';
import Modal from '../../components/UI/Modal';
import StatusBadge from '../../components/UI/StatusBadge';
import { useForm } from 'react-hook-form';

const CSRActivities = () => {
  const { user } = useAppStore();
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  const [activities, setActivities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);
  const [selectedAct, setSelectedAct] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // For viewing participations
  const [partsOpen, setPartsOpen] = useState(false);
  const [participations, setParticipations] = useState([]);

  const { register, handleSubmit, reset } = useForm();

  const fetchAll = async () => {
    setLoading(true);
    try {
      const data = await getCSRActivities();
      setActivities(data);
      const depts = await getDepartments();
      setDepartments(depts);
    } catch (err) {
      toast.error('Failed to load CSR activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleJoin = async (actId) => {
    try {
      await participateInCSR(actId);
      toast.success('Joined CSR Activity! Submit your proof once completed.');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to join');
    }
  };

  const openProofModal = (act) => {
    setSelectedAct(act);
    setSelectedFile(null);
    setProofOpen(true);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }
    // To upload proof, we need the participation ID.
    // In our simplified flow, we fetch CSR activities participations and match current user.
    try {
      // Find participation for this user
      const response = await fetch(`/api/social/csr-activities/${selectedAct._id || selectedAct.id}/participations`);
      const parts = await response.json();
      const myPart = parts.find((p) => p.employee_id === user.id || p.employee_id === user._id);
      
      if (!myPart) {
        toast.error('You are not registered in this activity');
        return;
      }
      
      await uploadProof(myPart._id || myPart.id, selectedFile);
      toast.success('Proof uploaded successfully! Awaiting review.');
      setProofOpen(false);
      fetchAll();
    } catch (err) {
      toast.error('Failed to upload proof');
    }
  };

  const openParticipationsModal = async (act) => {
    setSelectedAct(act);
    try {
      const response = await fetch(`/api/social/csr-activities/${act._id || act.id}/participations`);
      const data = await response.json();
      setParticipations(data);
      setPartsOpen(true);
    } catch (err) {
      toast.error('Failed to load participations');
    }
  };

  const handleApprove = async (partId) => {
    try {
      await approveParticipation(partId);
      toast.success('Participation approved!');
      openParticipationsModal(selectedAct);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to approve');
    }
  };

  const handleDeny = async (partId) => {
    try {
      await denyParticipation(partId);
      toast.success('Participation denied.');
      openParticipationsModal(selectedAct);
      fetchAll();
    } catch (err) {
      toast.error('Failed to deny');
    }
  };

  const onSubmit = async (data) => {
    try {
      await createCSRActivity(data);
      toast.success('CSR Activity created successfully!');
      setModalOpen(false);
      reset();
      fetchAll();
    } catch (err) {
      toast.error('Failed to create activity');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">CSR Activities</h1>
          <p className="page-subtitle" style={{ color: 'var(--text-secondary)' }}>Earn sustainability points and XP through social impact projects</p>
        </div>
        {isManager && (
          <button className="btn btn-primary" onClick={() => setModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} /> Create Activity
          </button>
        )}
      </div>

      <div className="grid grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {activities.map((act) => (
          <div key={act._id || act.id} className="card card-glass" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 240 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <span className="status-badge badge-blue">CSR IMPACT</span>
                <div style={{ display: 'flex', gap: 8, fontSize: '0.8rem', color: 'var(--emerald)', fontWeight: 600 }}>
                  <span>+{act.xp_reward} XP</span>
                  <span>+{act.points_reward} Pts</span>
                </div>
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{act.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.4', marginBottom: 16 }}>{act.description}</p>
            </div>
            
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{act.participant_count} participating</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {isManager && (
                  <button className="btn btn-sm btn-secondary" onClick={() => openParticipationsModal(act)} style={{ padding: '6px 12px' }}>
                    Review
                  </button>
                )}
                <button className="btn btn-sm btn-secondary" onClick={() => openProofModal(act)} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <FileUp size={12} /> Proof
                </button>
                <button className="btn btn-sm btn-primary" onClick={() => handleJoin(act._id || act.id)}>
                  Join
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Activity Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create CSR Activity">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
            <div>
              <label className="form-label">Activity Title</label>
              <input className="form-input" type="text" {...register('title', { required: true })} placeholder="e.g. Tree Plantation Drive" />
            </div>
            <div>
              <label className="form-label">Description</label>
              <textarea className="form-input" {...register('description', { required: true })} placeholder="Describe the impact activity..." rows={3} style={{ resize: 'none' }} />
            </div>
            <div>
              <label className="form-label">Department Scope</label>
              <select className="form-select" {...register('department_id', { required: true })}>
                {departments.map((d) => (
                  <option key={d._id || d.id} value={d._id || d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">XP Reward</label>
                <input className="form-input" type="number" {...register('xp_reward', { required: true })} placeholder="150" />
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">Points Reward</label>
                <input className="form-input" type="number" {...register('points_reward', { required: true })} placeholder="100" />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Create</button>
          </div>
        </form>
      </Modal>

      {/* Proof Upload Modal */}
      <Modal isOpen={proofOpen} onClose={() => setProofOpen(false)} title={`Upload Evidence for: ${selectedAct?.title}`}>
        <div style={{ marginBottom: 20 }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 12 }}>
            Please select and upload your photo, document, or sign-in sheet proving your attendance.
          </p>
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            style={{ display: 'block', width: '100%', color: 'var(--text-secondary)' }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => setProofOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleUpload}>Submit Proof</button>
        </div>
      </Modal>

      {/* Manager Review Modal */}
      <Modal isOpen={partsOpen} onClose={() => setPartsOpen(false)} title="Review CSR Participations">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto' }}>
          {participations.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No participants currently registered.</p>
          ) : (
            participations.map((p) => (
              <div key={p._id || p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, border: '1px solid var(--border)', borderRadius: 8 }}>
                <div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>ID: {p.employee_id}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <StatusBadge status={p.status} />
                    {p.proof_url && (
                      <a href={p.proof_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--blue)', textDecoration: 'none' }}>
                        View Evidence
                      </a>
                    )}
                  </div>
                </div>
                {p.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-sm btn-primary" onClick={() => handleApprove(p._id || p.id)} style={{ padding: 6 }}>
                      <Check size={12} />
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDeny(p._id || p.id)} style={{ padding: 6 }}>
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
};

export default CSRActivities;
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Check, Play, Square, Award } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

import {
  getChallenges,
  createChallenge,
  updateChallengeStatus,
  participateInChallenge,
  completeChallenge,
} from '../../services/socialService';
import Modal from '../../components/UI/Modal';
import StatusBadge from '../../components/UI/StatusBadge';
import { useForm } from 'react-hook-form';

const Challenges = () => {
  const { user } = useAppStore();
  const isManager = user?.role === 'manager' || user?.role === 'admin';

  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  const fetchChallenges = async () => {
    setLoading(true);
    try {
      const data = await getChallenges();
      setChallenges(data);
    } catch (err) {
      toast.error('Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenges();
  }, []);

  const handleEnroll = async (id) => {
    try {
      await participateInChallenge(id);
      toast.success('Successfully enrolled in challenge!');
      fetchChallenges();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to enroll');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateChallengeStatus(id, status);
      toast.success(`Challenge moved to ${status}`);
      fetchChallenges();
    } catch (err) {
      toast.error('Failed to transition status');
    }
  };

  const handleCompleteParticipation = async (chall) => {
    try {
      // Find participation matching the challenge
      const response = await fetch(`/api/social/challenges/${chall._id || chall.id}`);
      const info = await response.json();
      
      // Get challenge participations
      const pResponse = await fetch(`/api/social/challenges/${chall._id || chall.id}/participations`);
      const participations = await pResponse.json();
      
      // For this simplified logic we find the enrolled record for user or let the manager trigger completion
      const myPart = participations.find((p) => p.status === 'enrolled');
      if (!myPart) {
        toast.error('No enrolled participations found to complete.');
        return;
      }
      
      await completeChallenge(myPart._id || myPart.id);
      toast.success('Challenge completed successfully! XP rewarded.');
      fetchChallenges();
    } catch (err) {
      toast.error('Failed to complete challenge');
    }
  };

  const onSubmit = async (data) => {
    try {
      await createChallenge(data);
      toast.success('Challenge created!');
      setModalOpen(false);
      reset();
      fetchChallenges();
    } catch (err) {
      toast.error('Failed to create challenge');
    }
  };

  const columns = ['draft', 'active', 'under_review', 'completed'];

  const getChallengesByStatus = (status) => {
    return challenges.filter((c) => c.status === status);
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Challenges</h1>
          <p className="page-subtitle" style={{ color: 'var(--text-secondary)' }}>Compete with teammates in sustainability and compliance challenges</p>
        </div>
        {isManager && (
          <button className="btn btn-primary" onClick={() => setModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} /> Create Challenge
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 20 }}>
        {columns.map((col) => (
          <div key={col} style={{ flex: 1, minWidth: 280, background: 'rgba(15, 22, 41, 0.5)', borderRadius: 12, padding: 16, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ textTransform: 'capitalize', fontWeight: 600, color: 'var(--text-primary)' }}>{col.replace('_', ' ')}</h3>
              <span className="status-badge" style={{ background: 'var(--border)', color: 'var(--text-secondary)' }}>{getChallengesByStatus(col).length}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {getChallengesByStatus(col).map((chall) => (
                <div key={chall._id || chall.id} className="card" style={{ padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <span className="status-badge badge-blue">{chall.difficulty?.toUpperCase()}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--emerald)', fontWeight: 600 }}>+{chall.xp_reward} XP</span>
                  </div>
                  <h4 style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 4 }}>{chall.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: 12 }}>{chall.description}</p>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
                    {chall.status === 'draft' && isManager && (
                      <button className="btn btn-sm btn-primary" onClick={() => handleStatusChange(chall._id || chall.id, 'active')} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Play size={10} /> Publish
                      </button>
                    )}
                    {chall.status === 'active' && (
                      <>
                        <button className="btn btn-sm btn-secondary" onClick={() => handleEnroll(chall._id || chall.id)}>Enroll</button>
                        {isManager && (
                          <button className="btn btn-sm btn-secondary" onClick={() => handleStatusChange(chall._id || chall.id, 'under_review')}>Review</button>
                        )}
                      </>
                    )}
                    {chall.status === 'under_review' && isManager && (
                      <>
                        <button className="btn btn-sm btn-primary" onClick={() => handleStatusChange(chall._id || chall.id, 'completed')} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Check size={10} /> Complete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Create Challenge Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New Challenge">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
            <div>
              <label className="form-label">Challenge Title</label>
              <input className="form-input" type="text" {...register('title', { required: true })} placeholder="e.g. Zero Plastic Week" />
            </div>
            <div>
              <label className="form-label">Description</label>
              <textarea className="form-input" {...register('description', { required: true })} placeholder="Detailed instructions on how to participate..." rows={3} style={{ resize: 'none' }} />
            </div>
            <div>
              <label className="form-label">Category ID</label>
              <input className="form-input" type="text" {...register('category_id', { required: true })} placeholder="Category Identifier" />
            </div>
            <div>
              <label className="form-label">Difficulty</label>
              <select className="form-select" {...register('difficulty')}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="expert">Expert</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">XP Reward</label>
                <input className="form-input" type="number" {...register('xp_reward', { required: true })} placeholder="200" />
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">Points Reward</label>
                <input className="form-input" type="number" {...register('points_reward', { required: true })} placeholder="150" />
              </div>
            </div>
            <div>
              <label className="form-label">Deadline</label>
              <input className="form-input" type="datetime-local" {...register('deadline', { required: true })} />
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

export default Challenges;
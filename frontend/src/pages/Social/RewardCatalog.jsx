import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Gift, Award } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

import { getRewards, redeemReward } from '../../services/socialService';
import Modal from '../../components/UI/Modal';

const RewardCatalog = () => {
  const { user, updateUser } = useAppStore();
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [redeemOpen, setRedeemOpen] = useState(false);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const data = await getRewards();
      setRewards(data);
    } catch (err) {
      toast.error('Failed to load rewards catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const openRedeemModal = (reward) => {
    if ((user?.points || 0) < reward.points_cost) {
      toast.error('Insufficient points to redeem this item');
      return;
    }
    if (reward.stock <= 0) {
      toast.error('This item is currently out of stock');
      return;
    }
    setSelectedReward(reward);
    setRedeemOpen(true);
  };

  const handleRedeem = async () => {
    if (!selectedReward) return;
    try {
      const response = await redeemReward(selectedReward._id || selectedReward.id);
      toast.success(`Successfully redeemed ${selectedReward.name}! check email instructions.`);
      
      // Update local points balance
      const newPoints = (user.points || 0) - selectedReward.points_cost;
      updateUser({ points: newPoints });

      setRedeemOpen(false);
      fetchCatalog();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Redemption failed');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
        <div>
          <h1 className="page-title">Rewards store</h1>
          <p className="page-subtitle" style={{ color: 'var(--text-secondary)' }}>Redeem your sustainability points for eco-friendly merchandise</p>
        </div>
        <div style={{ background: 'rgba(79, 142, 247, 0.1)', border: '1px solid var(--border-light)', padding: '12px 20px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Award style={{ color: 'var(--blue)' }} />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>YOUR BALANCE</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{user?.points || 0} pts</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>Loading catalog...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {rewards.map((reward) => (
            <div key={reward._id || reward.id} className="card card-glass" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              <div>
                <div style={{ width: '100%', height: 160, background: 'rgba(0,0,0,0.2)', borderRadius: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 16 }}>
                  {reward.image_url ? (
                    <img src={reward.image_url} alt={reward.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Gift size={48} style={{ color: 'var(--border)' }} />
                  )}
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{reward.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.4', marginBottom: 16 }}>{reward.description}</p>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{reward.stock} left in stock</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--blue)' }}>{reward.points_cost} Pts</span>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={reward.stock <= 0 || (user?.points || 0) < reward.points_cost}
                  onClick={() => openRedeemModal(reward)}
                >
                  Redeem
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal isOpen={redeemOpen} onClose={() => setRedeemOpen(false)} title="Redemption Confirmation">
        <p style={{ color: 'var(--text-primary)', marginBottom: 20 }}>
          Are you sure you want to redeem <strong>{selectedReward?.name}</strong> for <strong>{selectedReward?.points_cost} points</strong>?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => setRedeemOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleRedeem}>Confirm & Redeem</button>
        </div>
      </Modal>
    </div>
  );
};

export default RewardCatalog;
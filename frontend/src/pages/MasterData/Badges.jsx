import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2 } from 'lucide-react';

import {
  getBadges,
  createBadge,
  updateBadge,
  deleteBadge,
} from '../../services/masterDataService';
import DataTable from '../../components/UI/DataTable';
import Modal from '../../components/UI/Modal';

const Badges = () => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState(null);
  const [deletingBadge, setDeletingBadge] = useState(null);

  const { register, handleSubmit, reset } = useForm();

  const fetchBadges = async () => {
    setLoading(true);
    try {
      const data = await getBadges();
      setBadges(data);
    } catch (err) {
      toast.error('Failed to load badges');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBadges();
  }, []);

  const openCreateModal = () => {
    setEditingBadge(null);
    reset({
      name: '',
      description: '',
      icon: '🌱',
      rarity: 'common',
      unlock_rule_type: 'xp_threshold',
      unlock_rule_value: 100,
    });
    setModalOpen(true);
  };

  const openEditModal = (badge) => {
    setEditingBadge(badge);
    reset({
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      rarity: badge.rarity,
      unlock_rule_type: badge.unlock_rule_type,
      unlock_rule_value: badge.unlock_rule_value,
    });
    setModalOpen(true);
  };

  const openDeleteModal = (badge) => {
    setDeletingBadge(badge);
    setDeleteOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      if (editingBadge) {
        await updateBadge(editingBadge._id || editingBadge.id, data);
        toast.success('Badge updated successfully');
      } else {
        await createBadge(data);
        toast.success('Badge created successfully');
      }
      setModalOpen(false);
      fetchBadges();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'An error occurred');
    }
  };

  const handleDelete = async () => {
    if (!deletingBadge) return;
    try {
      await deleteBadge(deletingBadge._id || deletingBadge.id);
      toast.success('Badge deleted successfully');
      setDeleteOpen(false);
      fetchBadges();
    } catch (err) {
      toast.error('Failed to delete badge');
    }
  };

  const getRarityClass = (rarity) => {
    switch (rarity) {
      case 'legendary': return 'badge-danger';
      case 'epic': return 'badge-amber';
      case 'rare': return 'badge-blue';
      default: return 'badge-emerald';
    }
  };

  const columns = [
    {
      key: 'icon',
      header: 'Icon',
      width: '60px',
      render: (icon) => <span style={{ fontSize: '1.5rem' }}>{icon}</span>,
    },
    { key: 'name', header: 'Badge Name', sortable: true },
    { key: 'description', header: 'Description' },
    {
      key: 'rarity',
      header: 'Rarity',
      sortable: true,
      render: (rarity) => (
        <span className={`status-badge ${getRarityClass(rarity)}`}>
          {rarity.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'unlock_rule_type',
      header: 'Unlock Trigger',
      render: (_, row) => (
        <span style={{ fontSize: '0.875rem' }}>
          {row.unlock_rule_type === 'xp_threshold' ? 'XP Threshold' : 'Challenges Completed'}: {row.unlock_rule_value}
        </span>
      ),
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Badges</h1>
          <p className="page-subtitle" style={{ color: 'var(--text-secondary)' }}>Configure automated sustainability badges and achievements</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} /> Add Badge
        </button>
      </div>

      <DataTable
        columns={columns}
        data={badges}
        loading={loading}
        exportFilename="badges"
        rowActions={(row) => (
          <>
            <button className="btn btn-sm btn-secondary" onClick={() => openEditModal(row)} style={{ padding: 6 }}>
              <Edit2 size={12} />
            </button>
            <button className="btn btn-sm btn-danger" onClick={() => openDeleteModal(row)} style={{ padding: 6 }}>
              <Trash2 size={12} />
            </button>
          </>
        )}
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingBadge ? 'Edit Badge' : 'Create Badge'}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
            <div>
              <label className="form-label">Icon (Emoji)</label>
              <input
                className="form-input"
                type="text"
                {...register('icon', { required: true })}
                placeholder="e.g. 🌱"
              />
            </div>
            <div>
              <label className="form-label">Name</label>
              <input
                className="form-input"
                type="text"
                {...register('name', { required: true })}
                placeholder="e.g. Eco Pioneer"
              />
            </div>
            <div>
              <label className="form-label">Description</label>
              <input
                className="form-input"
                type="text"
                {...register('description', { required: true })}
                placeholder="How to earn this badge"
              />
            </div>
            <div>
              <label className="form-label">Rarity</label>
              <select className="form-select" {...register('rarity')}>
                <option value="common">Common</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
              </select>
            </div>
            <div>
              <label className="form-label">Unlock Rule Type</label>
              <select className="form-select" {...register('unlock_rule_type')}>
                <option value="xp_threshold">XP Threshold</option>
                <option value="challenge_count">Challenge Count</option>
              </select>
            </div>
            <div>
              <label className="form-label">Unlock Trigger Value</label>
              <input
                className="form-input"
                type="number"
                {...register('unlock_rule_value', { required: true })}
                placeholder="e.g. 1000"
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingBadge ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Confirm Delete"
      >
        <p style={{ color: 'var(--text-primary)', marginBottom: 20 }}>
          Are you sure you want to delete badge <strong>{deletingBadge?.name}</strong>? This action cannot be undone.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => setDeleteOpen(false)}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Badges;
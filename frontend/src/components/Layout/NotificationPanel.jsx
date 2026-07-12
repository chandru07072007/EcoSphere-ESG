import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, ShieldAlert, Award, Users, FileText, CheckCheck, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import useAppStore from '../../store/useAppStore';
import { getNotifications, markAsRead, markAllAsRead } from '../../services/notificationService';
import toast from 'react-hot-toast';

// ============================================================
// TYPE → ICON + COLOR MAP
// ============================================================
const typeConfig = {
  compliance: { icon: ShieldAlert, color: 'var(--danger)', bg: 'var(--danger-glow)' },
  badge:      { icon: Award,      color: 'var(--amber)',  bg: 'var(--amber-glow)'  },
  social:     { icon: Users,      color: 'var(--emerald)',bg: 'var(--emerald-glow)'},
  policy:     { icon: FileText,   color: 'var(--blue)',   bg: 'var(--blue-glow)'   },
  challenge:  { icon: Award,      color: 'var(--blue)',   bg: 'var(--blue-glow)'   },
  default:    { icon: Info,       color: 'var(--text-secondary)', bg: 'rgba(74,85,104,0.15)' },
};

// ============================================================
// NOTIFICATION PANEL
// ============================================================
const NotificationPanel = ({ open, onClose }) => {
  const { notifications, setNotifications, markRead, markAllRead } = useAppStore();

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch {
      // silently fail
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      markRead(id);
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      markAllRead();
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const getConfig = (type) => typeConfig[type] || typeConfig.default;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.3)',
              zIndex: 299,
            }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="notification-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="notif-panel-header">
              <div>
                <div className="notif-panel-title">Notifications</div>
                {notifications.unreadCount > 0 && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {notifications.unreadCount} unread
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {notifications.unreadCount > 0 && (
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={handleMarkAllRead}
                    style={{ padding: '5px 10px', fontSize: '0.75rem', gap: 4, display: 'flex', alignItems: 'center' }}
                  >
                    <CheckCheck size={12} />
                    All read
                  </button>
                )}
                <button className="btn-ghost btn" onClick={onClose}>
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="notif-panel-body">
              {notifications.items.length === 0 ? (
                <div className="notif-empty">
                  <Bell size={40} opacity={0.3} />
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    All caught up!
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    No new notifications
                  </div>
                </div>
              ) : (
                notifications.items.map((notif) => {
                  const config = getConfig(notif.type);
                  const Icon = config.icon;
                  return (
                    <div
                      key={notif.id}
                      className={`notif-item ${!notif.is_read ? 'unread' : ''}`}
                      onClick={() => !notif.is_read && handleMarkRead(notif.id)}
                    >
                      <div
                        className="notif-item-icon"
                        style={{ background: config.bg, color: config.color }}
                      >
                        <Icon size={16} />
                      </div>
                      <div className="notif-item-content">
                        <div className="notif-item-title">{notif.title}</div>
                        <div className="notif-item-body">{notif.message}</div>
                        <div className="notif-item-time">
                          {notif.created_at
                            ? formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })
                            : 'Just now'}
                        </div>
                      </div>
                      {!notif.is_read && <div className="notif-unread-dot" />}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NotificationPanel;

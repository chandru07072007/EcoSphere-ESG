import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================================
// AUTH SLICE
// ============================================================
const authSlice = (set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: (userData, token) => {
    set({
      user: userData,
      token,
      isAuthenticated: true,
    });
  },

  logout: () => {
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
    localStorage.removeItem('ecosphere-auth');
  },

  updateUser: (userData) => {
    set((state) => ({
      user: { ...state.user, ...userData },
    }));
  },
});

// ============================================================
// NOTIFICATIONS SLICE
// ============================================================
const notificationsSlice = (set, get) => ({
  notifications: {
    items: [],
    unreadCount: 0,
  },

  setNotifications: (items) => {
    const unread = items.filter((n) => !n.is_read).length;
    set((state) => ({
      notifications: { ...state.notifications, items, unreadCount: unread },
    }));
  },

  addNotification: (notification) => {
    set((state) => {
      const items = [notification, ...state.notifications.items];
      const unreadCount = state.notifications.unreadCount + (notification.is_read ? 0 : 1);
      return { notifications: { items, unreadCount } };
    });
  },

  markRead: (id) => {
    set((state) => {
      const items = state.notifications.items.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      );
      const unreadCount = items.filter((n) => !n.is_read).length;
      return { notifications: { items, unreadCount } };
    });
  },

  markAllRead: () => {
    set((state) => ({
      notifications: {
        items: state.notifications.items.map((n) => ({ ...n, is_read: true })),
        unreadCount: 0,
      },
    }));
  },
});

// ============================================================
// SETTINGS SLICE
// ============================================================
const settingsSlice = (set, get) => ({
  settings: {
    esgWeights: { e: 40, s: 30, g: 30 },
    autoEmission: true,
    evidenceRequired: false,
    badgeAutoAward: true,
    emailNotifications: {
      compliance: true,
      badges: true,
      challenges: true,
      policies: true,
      reports: false,
    },
    organization: {
      name: 'EcoSphere Corp',
      logo: null,
    },
  },

  updateSettings: (updates) => {
    set((state) => ({
      settings: { ...state.settings, ...updates },
    }));
  },

  updateEsgWeights: (weights) => {
    set((state) => ({
      settings: {
        ...state.settings,
        esgWeights: { ...state.settings.esgWeights, ...weights },
      },
    }));
  },

  updateEmailNotifications: (updates) => {
    set((state) => ({
      settings: {
        ...state.settings,
        emailNotifications: { ...state.settings.emailNotifications, ...updates },
      },
    }));
  },
});

// ============================================================
// UI SLICE
// ============================================================
const uiSlice = (set, get) => ({
  ui: {
    sidebarCollapsed: false,
    notificationPanelOpen: false,
    theme: 'dark',
    activeModule: 'Dashboard',
  },

  toggleSidebar: () => {
    set((state) => ({
      ui: { ...state.ui, sidebarCollapsed: !state.ui.sidebarCollapsed },
    }));
  },

  setSidebarCollapsed: (collapsed) => {
    set((state) => ({
      ui: { ...state.ui, sidebarCollapsed: collapsed },
    }));
  },

  setNotificationPanelOpen: (open) => {
    set((state) => ({
      ui: { ...state.ui, notificationPanelOpen: open },
    }));
  },

  setActiveModule: (module) => {
    set((state) => ({
      ui: { ...state.ui, activeModule: module },
    }));
  },
});

// ============================================================
// COMBINED STORE with PERSIST for auth
// ============================================================
const useAppStore = create(
  persist(
    (set, get) => ({
      // Auth slice
      ...authSlice(set, get),

      // Notifications slice
      ...notificationsSlice(set, get),

      // Settings slice
      ...settingsSlice(set, get),

      // UI slice
      ...uiSlice(set, get),
    }),
    {
      name: 'ecosphere-auth',
      storage: createJSONStorage(() => localStorage),
      // Only persist auth-related state
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAppStore;

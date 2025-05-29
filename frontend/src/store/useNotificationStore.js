// store/useNotificationStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useNotificationStore = create(
  persist(
    (set) => ({
      notifications: [],
      addNotification: (notification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications],
        })),
      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      markNotificationsAsRead: (id, type) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            (type === "user" && n.senderId === id) ||
            (type === "group" && n.groupId === id)
              ? { ...n, read: true }
              : n
          ),
        })),
      clearNotifications: () => set({ notifications: [] }),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
    }),
    {
      name: "notifications-storage",
    }
  )
);
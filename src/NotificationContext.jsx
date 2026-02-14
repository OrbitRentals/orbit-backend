import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  ////////////////////////////////////////////////////////////
  // LOAD
  ////////////////////////////////////////////////////////////

  async function loadNotifications() {
    try {
      const data = await api("/notifications");
      setNotifications(data);
    } catch {}
  }

  ////////////////////////////////////////////////////////////
  // MARK READ
  ////////////////////////////////////////////////////////////

  async function markAsRead(id) {
    try {
      await api(`/notifications/${id}/read`, { method: "PATCH" });

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read: true } : n
        )
      );
    } catch {}
  }

  ////////////////////////////////////////////////////////////

  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        loadNotifications,
        markAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}

import { useNotifications } from "./NotificationContext";

export default function Notifications() {
  const { notifications, markAsRead } = useNotifications();

  ////////////////////////////////////////////////////////////

  return (
    <div style={{ color: "#fff" }}>
      <h2 style={{ marginBottom: 40, fontSize: 36 }}>
        Notifications
      </h2>

      {notifications.length === 0 && (
        <p style={{ color: "#888" }}>No notifications yet.</p>
      )}

      {notifications.map((n) => (
        <div
          key={n.id}
          style={{
            padding: 24,
            marginBottom: 18,
            borderRadius: 22,
            background: n.read
              ? "rgba(255,255,255,0.05)"
              : "rgba(245,208,97,0.08)",
            border: n.read
              ? "1px solid rgba(255,255,255,0.08)"
              : "1px solid rgba(245,208,97,0.3)",
            backdropFilter: "blur(20px)",
            boxShadow: n.read
              ? "none"
              : "0 20px 60px rgba(245,208,97,0.08)",
            cursor: n.read ? "default" : "pointer",
            transition: "all 0.25s ease",
          }}
          onClick={() => !n.read && markAsRead(n.id)}
          onMouseEnter={(e) => {
            if (!n.read) {
              e.currentTarget.style.transform = "translateY(-4px)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0px)";
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 16,
              marginBottom: 8,
            }}
          >
            {n.title || "Notification"}
          </div>

          <div
            style={{
              color: "#aaa",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            {n.message}
          </div>

          {!n.read && (
            <div
              style={{
                marginTop: 12,
                fontSize: 12,
                color: "#f5d061",
                fontWeight: 600,
                letterSpacing: 0.5,
              }}
            >
              Click to mark as read
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { apiRequest } from "./api";

const SOCKET_URL = "http://localhost:5000";

function getUserIdFromToken(token) {
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1])
    );

    return payload.userId;
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
}

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  if (!token || !storedUser) {
    return;
  }

  const user = JSON.parse(storedUser);

  if (!user?.id) {
    console.error("User ID not found");
    return;
  }

  let socket;

  const loadNotifications = async () => {
    try {
      const data = await apiRequest("/notifications");

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error(
        "Failed to load notifications:",
        error
      );
    }
  };

  loadNotifications();

  socket = io(SOCKET_URL);

  socket.on("connect", () => {
    console.log("Notification socket connected");

    socket.emit("join_user", user.id);
  });

  socket.on("notification", (notification) => {
    console.log("New notification:", notification);

    setNotifications((previous) => [
      notification,
      ...previous,
    ]);

    setUnreadCount((previous) => previous + 1);
  });

  socket.on("disconnect", () => {
    console.log("Notification socket disconnected");
  });

  return () => {
    socket.disconnect();
  };
}, []);
  const markAsRead = async (notificationId) => {
    try {
      await apiRequest(
        `/notifications/${notificationId}/read`,
        {
          method: "PUT",
        }
      );

      setNotifications((previous) =>
        previous.map((notification) =>
          notification._id === notificationId
            ? {
                ...notification,
                isRead: true,
              }
            : notification
        )
      );

      setUnreadCount((previous) =>
        Math.max(0, previous - 1)
      );
    } catch (error) {
      console.error(
        "Failed to mark notification as read:",
        error
      );
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiRequest(
        "/notifications/read-all",
        {
          method: "PUT",
        }
      );

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error(
        "Failed to mark all notifications as read:",
        error
      );
    }
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}
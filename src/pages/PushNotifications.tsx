import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

interface PushNotificationsProps {
  is_admin: boolean;
}

const PushNotifications: React.FC<PushNotificationsProps> = ({ is_admin }) => {
  interface Notification {
    id: number;
    message: string;
    timestamp: string;
  }

  interface User {
    id: number;
    username: string;
  }

  const [users, setUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const token = localStorage.getItem("token");

  // ✅ Fetch Users Function
  const fetchUsers = useCallback(() => {
    if (!token) {
      setError("Unauthorized: Please log in.");
      return;
    }

    axios
      .get<{ users: User[] }>("/api/tracker/admin/all-users/", {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        console.log("📌 API Response - Users:", response.data);

        if (!response.data.users || !Array.isArray(response.data.users) || response.data.users.length === 0) {
          setError("No users found.");
          setUsers([]);
        } else {
          // ✅ Ensure valid user objects are stored in state
          setUsers(response.data.users.filter(user => user && typeof user.id === "number"));
          setError(null);
        }
      })
      .catch((err) => {
        console.error("❌ Error fetching users:", err);
        setError("Error fetching users.");
        setUsers([]);
      });
  }, [token]);

  // ✅ Fetch Notifications Function
  const fetchNotifications = useCallback(() => {
    if (!token) {
      setError("Unauthorized: Please log in.");
      return;
    }

    axios
      .get<{ notifications: Notification[] }>("/api/tracker/admin/notifications/", {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        console.log("📌 API Response - Notifications:", response.data);
        if (!response.data.notifications || response.data.notifications.length === 0) {
          setError("No notifications found.");
          setNotifications([]);
        } else {
          setNotifications(response.data.notifications);
          setError(null);
        }
      })
      .catch(() => setError("Error fetching notifications."));
  }, [token]);

  useEffect(() => {
    if (is_admin) {
      fetchUsers();
      fetchNotifications();
    }
  }, [is_admin, fetchUsers, fetchNotifications]);

  // ✅ Send Push Notification
  const handleSendNotification = () => {
    if (!message.trim()) {
      setError("Notification message cannot be empty.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    axios
      .post(
        "/api/tracker/admin/notifications/",
        { message, user_id: selectedUser === "all" ? null : Number(selectedUser) },
        { headers: { Authorization: `Token ${token}` } }
      )
      .then(() => {
        setSuccess("Notification sent successfully!");
        setMessage("");
        fetchNotifications();
      })
      .catch(() => setError("Failed to send notification."))
      .finally(() => setLoading(false));
  };

  // ✅ Delete Notification Function
  const handleDeleteNotification = (notificationId: number) => {
    axios
      .delete(`/api/tracker/admin/delete-notification/${notificationId}/`, {
        headers: { Authorization: `Token ${token}` },
      })
      .then(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      })
      .catch(() => setError("Error deleting notification."));
  };

  return (
    <Container>
      <Typography variant="h4">Push Notifications</Typography>

      {error && <Alert severity="error" sx={{ marginTop: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ marginTop: 2 }}>{success}</Alert>}

      {/* ✅ User Selector */}
      <Select
        value={selectedUser}
        onChange={(e) => {
          console.log("🔹 Selected User ID:", e.target.value); // ✅ Debugging
          setSelectedUser(e.target.value);
        }}
        displayEmpty
        fullWidth
        sx={{ marginTop: 2, marginBottom: 2 }}
      >
        <MenuItem value="all">Send to All Users</MenuItem>
        {users.length > 0 ? (
          users.map((user) => (
            <MenuItem key={user.id} value={String(user.id)}>
              {user.username} (ID: {user.id})
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>No users found</MenuItem>
        )}
      </Select>

      {/* ✅ Notification Input */}
      <textarea
        placeholder="Enter notification message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        style={{ width: "100%", height: "100px", marginBottom: "10px", padding: "10px" }}
      />

      {/* ✅ Send Notification Button */}
      <Button variant="contained" color="primary" onClick={handleSendNotification} disabled={loading}>
        {loading ? <CircularProgress size={24} /> : "Send Notification"}
      </Button>

      {/* ✅ Notifications Table */}
      <Typography variant="h5" sx={{ marginTop: 4 }}>Recent Notifications</Typography>
      {notifications.length > 0 ? (
        <TableContainer component={Paper} sx={{ marginTop: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Message</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>Action</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {notifications.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell>{notification.message}</TableCell>
                  <TableCell>{new Date(notification.timestamp).toLocaleString()}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleDeleteNotification(notification.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography sx={{ marginTop: 2 }}>No notifications available.</Typography>
      )}
    </Container>
  );
};

export default PushNotifications;

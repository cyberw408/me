import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Box,
  Fade,
  Divider,
  useTheme as useMuiTheme
} from "@mui/material";
import { useTheme } from "../context/ThemeContext";
import AccessibilityAnnouncement from "../components/AccessibilityAnnouncement";

// Define Type for Notifications
interface Notification {
  id: number;
  message: string;
  timestamp: string;
}

// Interface for theme extras
interface ThemeExtras {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  gradient: string;
  // Additional custom properties
  card: string;
  border: string;
  input: string;
  headingSecondary: string;
  cardHeader: string;
  textSecondary: string;
  tableHeader: string;
  tableRow: string;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Theme context for accessibility features
  const { colors, accessibility, themeMood } = useTheme();
  const muiTheme = useMuiTheme();
  
  // Combined theme colors with both original theme colors and custom extras
  const themeColors: ThemeExtras = {
    // Base theme properties
    primary: colors.primary,
    secondary: colors.secondary,
    accent: colors.accent || colors.secondary,
    background: colors.background,
    surface: colors.surface,
    text: colors.text || '#212121',
    gradient: colors.gradient,
    
    // Custom additional properties
    card: accessibility.highContrast ? 'transparent' : '#ffffff',
    border: accessibility.highContrast ? muiTheme.palette.text.primary : '#e0e0e0',
    input: accessibility.highContrast ? 'transparent' : colors.background || '#f5f5f5',
    headingSecondary: colors.secondary || '#666',
    cardHeader: accessibility.highContrast ? 'transparent' : '#f9f9f9',
    textSecondary: colors.secondary || '#666',
    tableHeader: accessibility.highContrast ? 'transparent' : `${colors.primary}15`,
    tableRow: accessibility.highContrast ? 'transparent' : `${colors.primary}05`,
  };

  const token = localStorage.getItem("token"); // ✅ Retrieve token from localStorage

  const fetchNotifications = useCallback(() => {
    if (!token) {
      setError("Unauthorized: Please log in.");
      setLoading(false);
      return;
    }

    axios
      .get<{ notifications: Notification[] }>("/api/tracker/user/notifications/", {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        setNotifications(response.data.notifications);
        setError(null);
        if (response.data.notifications.length === 0) {
          setSuccess("You have no notifications at this time.");
        }
      })
      .catch((err) => {
        setError("Error fetching notifications: " + (err.response?.data?.error || "Unknown error."));
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Effect for accessibility announcements
  useEffect(() => {
    // Accessibility announcements are now handled by the AccessibilityAnnouncement component
    // which is declared in the return section of this component
  }, [loading, error, success, notifications]);

  const handleDeleteNotification = (id: number) => {
    if (!token) {
      setError("Unauthorized: Please log in.");
      return;
    }

    axios
      .delete(`/api/tracker/admin/delete-notification/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      })
      .then(() => {
        setNotifications((prev) => prev.filter((notif) => notif.id !== id));
        setSuccess("Notification dismissed successfully.");
      })
      .catch((err) => {
        setError("Failed to delete notification: " + (err.response?.data?.error || "Unknown error."));
      });
  };

  return (
    <Container>
      {/* Accessibility announcements for screen readers */}
      {error && <AccessibilityAnnouncement message={error} assertive={true} />}
      {success && <AccessibilityAnnouncement message={success} />}
      {!loading && notifications.length > 0 && (
        <AccessibilityAnnouncement 
          message={`You have ${notifications.length} notification${notifications.length !== 1 ? 's' : ''}.`} 
        />
      )}
      
      <Typography 
        variant="h4" 
        component="h1"
        sx={{ 
          mt: 2,
          fontWeight: 700,
          ...(accessibility.largeText && { fontSize: '2.5rem' }),
          ...(accessibility.highContrast 
            ? { color: themeColors.text }
            : {
                background: `linear-gradient(90deg, ${themeColors.primary} 0%, ${themeColors.accent} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }
          )
        }}
        id="notifications-title"
      >
        Notifications
      </Typography>

      {/* Alert Messages */}
      {error && (
        <Fade in={Boolean(error)} timeout={accessibility.reduceMotion ? 0 : 300}>
          <Alert 
            severity="error" 
            sx={{ 
              marginTop: 2,
              borderRadius: 1,
              '& .MuiAlert-icon': { alignItems: 'center' }
            }}
            role="alert"
          >
            {error}
          </Alert>
        </Fade>
      )}
      
      {success && (
        <Fade in={Boolean(success)} timeout={accessibility.reduceMotion ? 0 : 300}>
          <Alert 
            severity="success" 
            sx={{ 
              marginTop: 2,
              borderRadius: 1,
              '& .MuiAlert-icon': { alignItems: 'center' }
            }}
            role="status"
          >
            {success}
          </Alert>
        </Fade>
      )}

      {loading ? (
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '200px' 
          }}
          aria-live="polite"
          aria-busy="true"
        >
          <CircularProgress 
            size={40} 
            aria-label="Loading notifications"
            sx={{ color: themeColors.primary }}
          />
        </Box>
      ) : notifications.length > 0 ? (
        <Paper 
          elevation={accessibility.highContrast ? 0 : 2}
          sx={{ 
            mt: 3,
            mb: 4,
            backgroundColor: themeColors.card,
            border: accessibility.highContrast ? `2px solid ${themeColors.border}` : 'none',
            borderRadius: 1,
            overflow: 'hidden',
          }}
          aria-labelledby="notifications-title"
        >
          <Box
            sx={{
              p: 2, 
              backgroundColor: themeColors.cardHeader,
              borderBottom: `1px solid ${themeColors.border}`,
            }}
          >
            <Typography 
              variant="h6" 
              component="h2"
              sx={{ 
                fontWeight: 600,
                ...(accessibility.largeText && { fontSize: '1.3rem' }),
                color: themeColors.headingSecondary
              }}
            >
              Your Notifications
            </Typography>
          </Box>
          <List 
            aria-label="Notification list" 
            sx={{ padding: 0 }}
          >
            {notifications.map((notif, index) => (
              <React.Fragment key={notif.id}>
                <ListItem
                  sx={{
                    padding: '16px',
                    backgroundColor: index % 2 === 0 ? 'transparent' : themeColors.tableRow,
                    ...(accessibility.largeText && { padding: '20px 16px' })
                  }}
                >
                  <ListItemText 
                    primary={notif.message} 
                    secondary={new Date(notif.timestamp).toLocaleString()}
                    primaryTypographyProps={{
                      sx: {
                        color: themeColors.text,
                        fontWeight: 500,
                        ...(accessibility.largeText && { fontSize: '1.1rem' })
                      }
                    }}
                    secondaryTypographyProps={{
                      sx: {
                        color: themeColors.textSecondary,
                        ...(accessibility.largeText && { fontSize: '0.95rem' })
                      }
                    }}
                  />
                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleDeleteNotification(notif.id)}
                    aria-label={`Dismiss notification: ${notif.message}`}
                    sx={{
                      ml: 2,
                      minWidth: '90px',
                      ...(accessibility.highContrast && {
                        border: `2px solid #d32f2f`,
                        color: '#d32f2f',
                        fontWeight: 600
                      }),
                      ...(accessibility.largeText && { fontSize: '0.95rem' })
                    }}
                  >
                    Dismiss
                  </Button>
                </ListItem>
                {index < notifications.length - 1 && (
                  <Divider sx={{ 
                    borderColor: accessibility.highContrast ? themeColors.border : 'rgba(0, 0, 0, 0.08)'
                  }} />
                )}
              </React.Fragment>
            ))}
          </List>
        </Paper>
      ) : (
        <Paper 
          elevation={accessibility.highContrast ? 0 : 2}
          sx={{ 
            mt: 3,
            mb: 4,
            p: 4,
            backgroundColor: themeColors.card,
            border: accessibility.highContrast ? `2px solid ${themeColors.border}` : 'none',
            borderRadius: 1,
            textAlign: 'center'
          }}
          aria-labelledby="notifications-title"
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <i 
              className="ri-notification-off-line" 
              style={{ 
                fontSize: accessibility.largeText ? '3rem' : '2.5rem', 
                color: themeColors.textSecondary,
                marginBottom: '16px'
              }}
              aria-hidden="true"
            ></i>
            <Typography 
              variant="h6" 
              component="p"
              sx={{ 
                color: themeColors.textSecondary,
                fontWeight: 500,
                ...(accessibility.largeText && { fontSize: '1.3rem' })
              }}
            >
              No notifications available
            </Typography>
            <Typography
              sx={{
                mt: 1,
                color: themeColors.textSecondary,
                ...(accessibility.largeText && { fontSize: '1rem' })
              }}
            >
              When you receive notifications, they will appear here.
            </Typography>
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default Notifications;
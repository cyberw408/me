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
  Box,
  Fade,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  useTheme as useMuiTheme,
  CircularProgress
} from "@mui/material";
import { useTheme } from "../context/ThemeContext";
import AccessibilityAnnouncement from "../components/AccessibilityAnnouncement";

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

const UserActivityLogs = ({ isAdmin }: { isAdmin: boolean }) => {
  // ✅ Define User & Activity Log Interfaces
  interface User {
    id: number;
    username: string;
  }

  interface ActivityLog {
    id: string;
    activity: string;
    timestamp: string;
    ip_address?: string; // ✅ Include IP Address in logs (Admin only)
  }

  // ✅ Define states properly
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const token = localStorage.getItem("token");

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

  // ✅ Fetch Activity Logs (Admin can select user)
  const fetchActivityLogs = useCallback((userId?: number) => {
    setLoading(true);
    
    if (isAdmin && !userId) {
      setLoading(false);
      return; // Prevent fetching without a user ID
    }

    const url = isAdmin
      ? `/api/tracker/admin/activity-logs/?user_id=${userId}`
      : "/api/tracker/user/activity-logs/";

    axios
      .get<{ logs: ActivityLog[] }>(url, {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        setLogs(response.data.logs || []);
        setError(null);
      })
      .catch((err) => {
        setError("Error fetching activity logs: " + (err.response?.data?.error || "Unknown error."));
      })
      .finally(() => setLoading(false));
  }, [isAdmin, token]);

  // ✅ Fetch Users (For Admins)
  const fetchUsers = useCallback(() => {
    if (!isAdmin) {
      return;
    }

    setLoading(true);
    axios
      .get<{ users: User[] }>("/api/tracker/admin/all-users/", {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        setUsers(response.data.users);
        if (response.data.users.length > 0) {
          const defaultUserId = response.data.users[0].id;
          setSelectedUser(defaultUserId);
          fetchActivityLogs(defaultUserId);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        setError("Error fetching users: " + (err.response?.data?.error || "Unknown error."));
        setLoading(false);
      });
  }, [isAdmin, token, fetchActivityLogs]);

  useEffect(() => {
    fetchUsers();
    if (!isAdmin) {
      fetchActivityLogs();
    }
  }, [fetchUsers, fetchActivityLogs, isAdmin]);

  // Effect for accessibility announcements
  useEffect(() => {
    // Accessibility announcements are now handled by the AccessibilityAnnouncement component
    // which is declared in the return section of this component
  }, [loading, error, logs]);

  const handleUserChange = (event: SelectChangeEvent<number>) => {
    const userId = Number(event.target.value);
    setSelectedUser(userId);
    fetchActivityLogs(userId);
  };

  return (
    <Container>
      {/* Accessibility announcements for screen readers */}
      {error && <AccessibilityAnnouncement message={error} assertive={true} />}
      {!loading && logs.length > 0 && (
        <AccessibilityAnnouncement 
          message={`Found ${logs.length} activity log${logs.length !== 1 ? 's' : ''}.`} 
        />
      )}
      {!loading && logs.length === 0 && (
        <AccessibilityAnnouncement message="No activity logs available." />
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
        id="activity-logs-title"
      >
        User Activity Logs
      </Typography>

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

      {/* User Selector (Admins Only) */}
      {isAdmin && (
        <Paper
          elevation={accessibility.highContrast ? 0 : 2}
          sx={{ 
            marginTop: 3, 
            padding: 3,
            backgroundColor: themeColors.card,
            border: accessibility.highContrast ? `2px solid ${themeColors.border}` : 'none',
            borderRadius: 1,
          }}
        >
          <Typography 
            variant="h6" 
            component="h2"
            id="user-selector-title"
            sx={{ 
              mb: 2,
              fontWeight: 600,
              color: themeColors.headingSecondary,
              ...(accessibility.largeText && { fontSize: '1.3rem' }),
            }}
          >
            Select User
          </Typography>
          
          <FormControl 
            fullWidth
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
                ...(accessibility.highContrast && {
                  border: `2px solid ${themeColors.border}`,
                  '& fieldset': { border: 'none' }
                })
              },
              ...(accessibility.largeText && {
                '& .MuiInputLabel-root': { fontSize: '1.1rem' },
                '& .MuiSelect-select': { fontSize: '1.1rem' }
              })
            }}
          >
            <InputLabel 
              id="user-select-label"
              sx={{
                color: themeColors.textSecondary,
                ...(accessibility.largeText && { fontSize: '1.1rem' })
              }}
            >
              Select User
            </InputLabel>
            <Select
              labelId="user-select-label"
              id="user-select"
              value={selectedUser ?? ""}
              onChange={handleUserChange}
              label="Select User"
              displayEmpty
              aria-labelledby="user-selector-title"
              disabled={loading || users.length === 0}
            >
              {users.length > 0 ? (
                users.map((user) => (
                  <MenuItem 
                    key={user.id} 
                    value={user.id}
                    sx={{
                      ...(accessibility.largeText && { fontSize: '1.1rem' })
                    }}
                  >
                    {user.username} (ID: {user.id})
                  </MenuItem>
                ))
              ) : (
                <MenuItem 
                  disabled
                  sx={{
                    ...(accessibility.largeText && { fontSize: '1.1rem' })
                  }}
                >
                  No users found
                </MenuItem>
              )}
            </Select>
          </FormControl>
        </Paper>
      )}

      {/* Loading State */}
      {loading && (
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
            aria-label="Loading activity logs"
            sx={{ color: themeColors.primary }}
          />
        </Box>
      )}

      {/* Activity Logs Table */}
      {!loading && logs.length > 0 ? (
        <Box sx={{ mt: 3, mb: 4 }}>
          <TableContainer 
            component={Paper}
            sx={{
              backgroundColor: themeColors.card,
              border: accessibility.highContrast ? `2px solid ${themeColors.border}` : 'none',
              borderRadius: 1,
              overflow: 'hidden',
            }}
            aria-labelledby="activity-logs-title"
          >
            <Table aria-label="activity logs table">
              <TableHead>
                <TableRow sx={{ backgroundColor: themeColors.tableHeader }}>
                  <TableCell 
                    sx={{
                      fontWeight: 700,
                      color: themeColors.text,
                      ...(accessibility.largeText && { fontSize: '1.1rem' })
                    }}
                  >
                    Activity
                  </TableCell>
                  <TableCell 
                    sx={{
                      fontWeight: 700,
                      color: themeColors.text,
                      ...(accessibility.largeText && { fontSize: '1.1rem' })
                    }}
                  >
                    Timestamp
                  </TableCell>
                  {isAdmin && (
                    <TableCell 
                      sx={{
                        fontWeight: 700,
                        color: themeColors.text,
                        ...(accessibility.largeText && { fontSize: '1.1rem' })
                      }}
                    >
                      IP Address
                    </TableCell>
                  )} 
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log, index) => (
                  <TableRow 
                    key={log.id}
                    sx={{ 
                      '&:nth-of-type(even)': { backgroundColor: themeColors.tableRow },
                      '&:hover': { backgroundColor: `${themeColors.primary}10` }
                    }}
                  >
                    <TableCell
                      sx={{
                        ...(accessibility.largeText && { fontSize: '1.1rem' })
                      }}
                    >
                      {log.activity}
                    </TableCell>
                    <TableCell
                      sx={{
                        ...(accessibility.largeText && { fontSize: '1.1rem' }),
                        color: themeColors.textSecondary
                      }}
                    >
                      {new Date(log.timestamp).toLocaleString()}
                    </TableCell>
                    {isAdmin && (
                      <TableCell
                        sx={{
                          ...(accessibility.largeText && { fontSize: '1.1rem' }),
                          color: themeColors.textSecondary
                        }}
                      >
                        {log.ip_address ? log.ip_address : "N/A"}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ) : !loading && (
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
          aria-labelledby="activity-logs-title"
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
              className="ri-file-list-3-line" 
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
              No activity logs available
            </Typography>
            <Typography
              sx={{
                mt: 1,
                color: themeColors.textSecondary,
                ...(accessibility.largeText && { fontSize: '1rem' })
              }}
            >
              {isAdmin ? "Select a different user or check back later." : "Check back later for your activity history."}
            </Typography>
          </Box>
        </Paper>
      )}
    </Container>
  );
};

export default UserActivityLogs;
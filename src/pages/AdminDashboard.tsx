import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Grid,
  Card,
  CardContent,
  Switch,
  Box,
  useTheme as useMuiTheme,
  Tooltip,
  Fade,
} from "@mui/material";
import { useTheme } from "../context/ThemeContext";
import AccessibilityAnnouncement from "../components/AccessibilityAnnouncement";

// ✅ Define User Interface
interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
}

// ✅ Define Dashboard Data Interface
interface DashboardData {
  total_users: number;
  total_devices: number;
  active_users: number;
  pending_users: User[];
  active_users_list: User[];
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

const AdminDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ✅ Fetch Admin Dashboard Data
  const fetchDashboardData = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Authentication token is missing.");
      return;
    }

    axios
      .get<DashboardData>("/api/tracker/admin/dashboard/", {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        setDashboardData(response.data);
      })
      .catch(() => {
        setError("Failed to load admin dashboard data.");
      });
  };

  // ✅ Approve User Function
  const handleApproveUser = (userId: number) => {
    setError(null);
    setMessage(null);
    const token = localStorage.getItem("token");

    axios
      .post(
        "/api/tracker/admin/approve-user/",
        { user_id: userId },
        { headers: { Authorization: `Token ${token}` } }
      )
      .then(() => {
        setMessage("User approved successfully!");
        fetchDashboardData(); // ✅ Refresh Dashboard Data
      })
      .catch(() => {
        setError("Error approving user.");
      });
  };

  // ✅ Toggle User Activation Status
  const handleToggleUserStatus = (userId: number, isActive: boolean) => {
    setError(null);
    setMessage(null);
    const token = localStorage.getItem("token");

    axios
      .post(
        "/api/tracker/admin/toggle-user-status/",
        { user_id: userId, is_active: !isActive },
        { headers: { Authorization: `Token ${token}` } }
      )
      .then(() => {
        setMessage("User status updated successfully!");
        fetchDashboardData(); // ✅ Refresh Dashboard Data
      })
      .catch(() => {
        setError("Error updating user status.");
      });
  };

  // Effect for accessibility announcements
  useEffect(() => {
    // Accessibility announcements are now handled by the AccessibilityAnnouncement component
    // which is declared in the return section of this component
  }, [message, error, dashboardData]);

  return (
    <Container>
      {/* Accessibility announcements for screen readers */}
      {message && <AccessibilityAnnouncement message={message} />}
      {error && <AccessibilityAnnouncement message={error} assertive={true} />}
      {dashboardData && <AccessibilityAnnouncement message="Admin dashboard data loaded successfully" />}
      
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
      >
        Admin Dashboard
      </Typography>

      {message && (
        <Fade in={Boolean(message)} timeout={accessibility.reduceMotion ? 0 : 300}>
          <Alert 
            severity="success" 
            sx={{ 
              marginTop: 2,
              borderRadius: 1,
              '& .MuiAlert-icon': { alignItems: 'center' }
            }}
            role="status"
          >
            {message}
          </Alert>
        </Fade>
      )}
      
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

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ marginTop: 2 }}>
        <Grid item xs={12} sm={4}>
          <Card 
            elevation={accessibility.highContrast ? 0 : 3}
            sx={{
              backgroundColor: themeColors.card,
              border: accessibility.highContrast ? `2px solid ${themeColors.border}` : 'none',
              height: '100%',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: accessibility.reduceMotion ? 'none' : 'translateY(-5px)',
              }
            }}
          >
            <CardContent>
              <Typography 
                variant="h6" 
                component="h2"
                sx={{ 
                  color: themeColors.textSecondary,
                  ...(accessibility.largeText && { fontSize: '1.3rem' })
                }}
              >
                Total Users
              </Typography>
              <Typography 
                variant="h4" 
                component="p"
                sx={{ 
                  fontWeight: 700,
                  mt: 1,
                  color: themeColors.primary,
                  ...(accessibility.largeText && { fontSize: '2.2rem' })
                }}
              >
                {dashboardData?.total_users ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card 
            elevation={accessibility.highContrast ? 0 : 3}
            sx={{
              backgroundColor: themeColors.card,
              border: accessibility.highContrast ? `2px solid ${themeColors.border}` : 'none',
              height: '100%',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: accessibility.reduceMotion ? 'none' : 'translateY(-5px)',
              }
            }}
          >
            <CardContent>
              <Typography 
                variant="h6" 
                component="h2"
                sx={{ 
                  color: themeColors.textSecondary,
                  ...(accessibility.largeText && { fontSize: '1.3rem' })
                }}
              >
                Total Devices Tracked
              </Typography>
              <Typography 
                variant="h4" 
                component="p"
                sx={{ 
                  fontWeight: 700,
                  mt: 1,
                  color: themeColors.primary,
                  ...(accessibility.largeText && { fontSize: '2.2rem' })
                }}
              >
                {dashboardData?.total_devices ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card 
            elevation={accessibility.highContrast ? 0 : 3}
            sx={{
              backgroundColor: themeColors.card,
              border: accessibility.highContrast ? `2px solid ${themeColors.border}` : 'none',
              height: '100%',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: accessibility.reduceMotion ? 'none' : 'translateY(-5px)',
              }
            }}
          >
            <CardContent>
              <Typography 
                variant="h6" 
                component="h2"
                sx={{ 
                  color: themeColors.textSecondary,
                  ...(accessibility.largeText && { fontSize: '1.3rem' })
                }}
              >
                Active Users
              </Typography>
              <Typography 
                variant="h4" 
                component="p"
                sx={{ 
                  fontWeight: 700,
                  mt: 1,
                  color: themeColors.primary,
                  ...(accessibility.largeText && { fontSize: '2.2rem' })
                }}
              >
                {dashboardData?.active_users ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pending Users Table */}
      <Typography 
        variant="h5" 
        component="h2"
        sx={{ 
          marginTop: 4, 
          marginBottom: 2,
          fontWeight: 600,
          ...(accessibility.largeText && { fontSize: '1.8rem' }),
          ...(accessibility.highContrast 
            ? { color: themeColors.text }
            : {
                color: themeColors.headingSecondary
              }
          )
        }}
        id="pending-users-heading"
      >
        Pending Users
      </Typography>
      
      <TableContainer 
        component={Paper} 
        sx={{ 
          marginTop: 2,
          backgroundColor: themeColors.card,
          border: accessibility.highContrast ? `2px solid ${themeColors.border}` : 'none',
        }}
        aria-labelledby="pending-users-heading"
      >
        <Table aria-label="Pending users table">
          <TableHead>
            <TableRow sx={{ backgroundColor: themeColors.tableHeader }}>
              <TableCell 
                sx={{ 
                  fontWeight: 700, 
                  color: themeColors.text,
                  ...(accessibility.largeText && { fontSize: '1.1rem' })
                }}
              >
                Username
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 700, 
                  color: themeColors.text,
                  ...(accessibility.largeText && { fontSize: '1.1rem' })
                }}
              >
                Email
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 700, 
                  color: themeColors.text,
                  ...(accessibility.largeText && { fontSize: '1.1rem' })
                }}
              >
                Approve
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dashboardData?.pending_users.length ? (
              dashboardData.pending_users.map((user) => (
                <TableRow 
                  key={user.id}
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
                    {user.username}
                  </TableCell>
                  <TableCell
                    sx={{
                      ...(accessibility.largeText && { fontSize: '1.1rem' })
                    }}
                  >
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleApproveUser(user.id)}
                      aria-label={`Approve user ${user.username}`}
                      sx={{
                        ...(accessibility.highContrast 
                          ? {
                              backgroundColor: themeColors.primary,
                              color: '#fff',
                              border: `2px solid ${themeColors.border}`,
                              '&:hover': { backgroundColor: themeColors.accent }
                            }
                          : {
                              background: `linear-gradient(45deg, ${themeColors.primary} 30%, ${themeColors.accent} 90%)`,
                              '&:hover': { filter: 'brightness(0.9)' }
                            }
                        ),
                        ...(accessibility.largeText && { fontSize: '1rem', padding: '8px 16px' })
                      }}
                    >
                      Approve
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell 
                  colSpan={3}
                  sx={{
                    textAlign: 'center',
                    padding: 3,
                    color: themeColors.textSecondary,
                    ...(accessibility.largeText && { fontSize: '1.1rem' })
                  }}
                >
                  No pending users.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Active Users Table */}
      <Typography 
        variant="h5" 
        component="h2"
        sx={{ 
          marginTop: 4, 
          marginBottom: 2,
          fontWeight: 600,
          ...(accessibility.largeText && { fontSize: '1.8rem' }),
          ...(accessibility.highContrast 
            ? { color: themeColors.text }
            : {
                color: themeColors.headingSecondary
              }
          )
        }}
        id="active-users-heading"
      >
        Manage Active Users
      </Typography>
      
      <TableContainer 
        component={Paper} 
        sx={{ 
          marginTop: 2,
          marginBottom: 4,
          backgroundColor: themeColors.card,
          border: accessibility.highContrast ? `2px solid ${themeColors.border}` : 'none',
        }}
        aria-labelledby="active-users-heading"
      >
        <Table aria-label="Active users table">
          <TableHead>
            <TableRow sx={{ backgroundColor: themeColors.tableHeader }}>
              <TableCell 
                sx={{ 
                  fontWeight: 700, 
                  color: themeColors.text,
                  ...(accessibility.largeText && { fontSize: '1.1rem' })
                }}
              >
                Username
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 700, 
                  color: themeColors.text,
                  ...(accessibility.largeText && { fontSize: '1.1rem' })
                }}
              >
                Email
              </TableCell>
              <TableCell 
                sx={{ 
                  fontWeight: 700, 
                  color: themeColors.text,
                  ...(accessibility.largeText && { fontSize: '1.1rem' })
                }}
              >
                Active Status
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dashboardData?.active_users_list.length ? (
              dashboardData.active_users_list.map((user) => (
                <TableRow 
                  key={user.id}
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
                    {user.username}
                  </TableCell>
                  <TableCell
                    sx={{
                      ...(accessibility.largeText && { fontSize: '1.1rem' })
                    }}
                  >
                    {user.email}
                  </TableCell>
                  <TableCell>
                    <Tooltip 
                      title={`${user.is_active ? 'Deactivate' : 'Activate'} user ${user.username}`}
                      arrow
                    >
                      <Switch 
                        checked={user.is_active} 
                        onChange={() => handleToggleUserStatus(user.id, user.is_active)} 
                        aria-label={`${user.is_active ? 'Deactivate' : 'Activate'} user ${user.username}`}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': {
                            color: themeColors.primary,
                            '&:hover': {
                              backgroundColor: `${themeColors.primary}20`,
                            },
                          },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                            backgroundColor: themeColors.primary,
                          },
                          ...(accessibility.highContrast && {
                            '& .MuiSwitch-track': {
                              border: `1px solid ${themeColors.border}`,
                            }
                          })
                        }}
                      />
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell 
                  colSpan={3}
                  sx={{
                    textAlign: 'center',
                    padding: 3,
                    color: themeColors.textSecondary,
                    ...(accessibility.largeText && { fontSize: '1.1rem' })
                  }}
                >
                  No active users.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default AdminDashboard;

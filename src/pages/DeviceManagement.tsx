import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { 
  Container, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  Alert, 
  Fade,
  Paper,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  useTheme as useMuiTheme
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import TabletIcon from '@mui/icons-material/Tablet';
import LaptopIcon from '@mui/icons-material/Laptop';
import AccessibilityAnnouncement from "../components/AccessibilityAnnouncement";
import { useTheme } from "../context/ThemeContext";

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

const DeviceManagement = () => {
  // ✅ Define Device Interface
  interface Device {
    device_id: string;
    device_name: string;
  }

  // ✅ Define state properly
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceStatus, setDeviceStatus] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [removingDevice, setRemovingDevice] = useState<string | null>(null);
  const [confirmationDialog, setConfirmationDialog] = useState<{open: boolean; deviceId: string; deviceName: string}>({
    open: false,
    deviceId: '',
    deviceName: ''
  });

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

  // Retrieve token from localStorage
  const token = localStorage.getItem("token");

  // Get device icon based on device name
  const getDeviceIcon = (deviceName: string) => {
    const name = deviceName.toLowerCase();
    const iconProps = {
      fontSize: accessibility.largeText ? "large" as "large" : "medium" as "medium",
      sx: { 
        color: themeColors.secondary,
        ...(accessibility.highContrast && { color: themeColors.text })
      }
    };

    if (name.includes('phone') || name.includes('mobile') || name.includes('iphone') || name.includes('android')) {
      return <SmartphoneIcon {...iconProps} />;
    } else if (name.includes('tablet') || name.includes('ipad')) {
      return <TabletIcon {...iconProps} />;
    } else {
      return <LaptopIcon {...iconProps} />;
    }
  };

  // Get status chip color based on status
  const getStatusColor = (status: string): "success" | "error" | "warning" | "default" => {
    switch (status.toLowerCase()) {
      case 'online':
      case 'active':
        return 'success';
      case 'offline':
      case 'inactive':
        return 'error';
      case 'suspended':
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  // ✅ Fetch Device Status with Authentication
  const fetchDeviceStatus = useCallback(
    (deviceId: string) => {
      if (!token) return;

      axios
        .get(`/api/tracker/device/status/${deviceId}/`, {
          headers: { Authorization: `Token ${token}` },
          withCredentials: true,
        })
        .then((response) => {
          setDeviceStatus((prevStatus) => ({
            ...prevStatus,
            [deviceId]: response.data?.status || "Unknown",
          }));
        })
        .catch(() => {
          setDeviceStatus((prevStatus) => ({
            ...prevStatus,
            [deviceId]: "Unknown",
          }));
        });
    },
    [token]
  );

  // ✅ Fetch Devices with Authentication
  const fetchDevices = useCallback(() => {
    setLoading(true);
    
    if (!token) {
      setError("Unauthorized: Please log in.");
      setLoading(false);
      return;
    }

    axios
      .get<{ devices: Device[] }>("/api/tracker/device-management/", {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true,
      })
      .then((response) => {
        if (Array.isArray(response.data.devices)) {
          setDevices(response.data.devices);
          response.data.devices.forEach((device) => fetchDeviceStatus(device.device_id));
          setLoading(false);
        } else {
          console.error("Invalid API response format", response.data);
          setError("Invalid response format.");
          setLoading(false);
        }
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          setError("Unauthorized: Please log in again.");
        } else {
          setError("Error fetching devices: " + (err.response?.data?.error || "Unknown error"));
        }
        setLoading(false);
      });
  }, [token, fetchDeviceStatus]);

  // Open confirmation dialog before removing device
  const openRemoveConfirmation = (deviceId: string, deviceName: string) => {
    setConfirmationDialog({
      open: true,
      deviceId,
      deviceName
    });
  };

  // Close confirmation dialog
  const closeRemoveConfirmation = () => {
    setConfirmationDialog({
      open: false,
      deviceId: '',
      deviceName: ''
    });
  };

  // ✅ Handle Remove Device with Authentication
  const handleRemoveDevice = (deviceId: string) => {
    if (!token) {
      setError("Unauthorized: Please log in.");
      return;
    }

    setRemovingDevice(deviceId);
    closeRemoveConfirmation();

    axios
      .delete(`/api/tracker/device/remove/${deviceId}/`, {
        headers: { Authorization: `Token ${token}` },
        withCredentials: true,
      })
      .then(() => {
        setMessage(`Device "${devices.find(d => d.device_id === deviceId)?.device_name || deviceId}" removed successfully.`);
        setDevices((prevDevices) => prevDevices.filter((device) => device.device_id !== deviceId));
        setRemovingDevice(null);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          setError("Unauthorized: Please log in again.");
        } else {
          setError("Failed to remove device: " + (err.response?.data?.error || "Unknown error"));
        }
        setRemovingDevice(null);
      });
  };

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Auto-dismiss success message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <Container>
      {/* Accessibility announcements for screen readers */}
      {error && <AccessibilityAnnouncement message={error} assertive={true} />}
      {message && <AccessibilityAnnouncement message={message} />}
      {loading && <AccessibilityAnnouncement message="Loading devices, please wait." />}
      
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
        id="device-management-title"
      >
        Device Management
      </Typography>

      {/* Alert Messages */}
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

      {/* Loading Indicator */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress 
            aria-label="Loading devices" 
            size={accessibility.largeText ? 60 : 40}
            sx={{
              ...(accessibility.highContrast && {
                color: themeColors.text
              })
            }}
          />
        </Box>
      )}

      {/* Devices Grid */}
      {!loading && (
        <Grid container spacing={3} sx={{ marginTop: 1, marginBottom: 4 }}>
          {devices.length > 0 ? (
            devices.map((device) => (
              <Grid item xs={12} sm={6} md={4} key={device.device_id}>
                <Card 
                  elevation={accessibility.highContrast ? 0 : 2}
                  sx={{ 
                    height: '100%',
                    backgroundColor: themeColors.card,
                    border: accessibility.highContrast ? `2px solid ${themeColors.border}` : 'none',
                    borderRadius: 1,
                    transition: accessibility.reduceMotion ? 'none' : 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                    '&:hover': {
                      transform: accessibility.reduceMotion ? 'none' : 'translateY(-4px)',
                      boxShadow: accessibility.reduceMotion ? 'none' : '0 8px 16px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  <CardContent sx={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Card Header */}
                    <Box 
                      sx={{ 
                        p: 2, 
                        backgroundColor: themeColors.cardHeader,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: `1px solid ${themeColors.border}`
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ mr: 2 }}>
                          {getDeviceIcon(device.device_name)}
                        </Box>
                        <Typography 
                          variant="h6" 
                          component="h2"
                          sx={{ 
                            fontWeight: 600,
                            ...(accessibility.largeText && { fontSize: '1.3rem' })
                          }}
                        >
                          {device.device_name}
                        </Typography>
                      </Box>
                      <Chip 
                        label={deviceStatus[device.device_id] ?? "Checking..."}
                        color={getStatusColor(deviceStatus[device.device_id] || '')}
                        size={accessibility.largeText ? "medium" : "small"}
                        sx={{
                          fontWeight: 500,
                          ...(accessibility.largeText && { fontSize: '0.9rem' }),
                          ...(accessibility.highContrast && {
                            border: `1px solid ${themeColors.border}`,
                            color: themeColors.text,
                            backgroundColor: 'transparent'
                          })
                        }}
                      />
                    </Box>
                    
                    {/* Card Content */}
                    <Box sx={{ p: 2, flexGrow: 1 }}>
                      <Typography 
                        variant="body2"
                        sx={{
                          mb: 1,
                          ...(accessibility.largeText && { fontSize: '1rem' })
                        }}
                      >
                        <strong>Device ID:</strong> {device.device_id}
                      </Typography>
                      
                      <Typography 
                        variant="body2"
                        sx={{
                          mb: 1,
                          ...(accessibility.largeText && { fontSize: '1rem' })
                        }}
                      >
                        <strong>Status:</strong> {deviceStatus[device.device_id] ?? "Checking..."}
                      </Typography>
                      
                      <Typography 
                        variant="body2"
                        sx={{
                          color: themeColors.textSecondary,
                          ...(accessibility.largeText && { fontSize: '1rem' })
                        }}
                      >
                        This device is currently being tracked and monitored.
                      </Typography>
                    </Box>
                    
                    <Divider sx={{ 
                      ...(accessibility.highContrast && { 
                        backgroundColor: themeColors.border,
                        height: '2px'
                      })
                    }} />
                    
                    {/* Card Actions */}
                    <Box 
                      sx={{ 
                        p: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <Typography 
                        variant="caption"
                        sx={{
                          color: themeColors.textSecondary,
                          ...(accessibility.largeText && { fontSize: '0.9rem' })
                        }}
                      >
                        Last updated: {new Date().toLocaleDateString()}
                      </Typography>
                      
                      <Tooltip title="Remove this device">
                        <span>
                          <IconButton
                            aria-label={`Remove device ${device.device_name}`}
                            onClick={() => openRemoveConfirmation(device.device_id, device.device_name)}
                            disabled={removingDevice === device.device_id}
                            sx={{
                              color: 'error.main',
                              ...(accessibility.highContrast && {
                                border: '1px solid currentColor',
                                borderRadius: '4px'
                              })
                            }}
                          >
                            {removingDevice === device.device_id ? (
                              <CircularProgress size={24} color="error" />
                            ) : (
                              <DeleteIcon sx={{
                                ...(accessibility.largeText && { fontSize: '1.5rem' })
                              }} />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Paper
                elevation={accessibility.highContrast ? 0 : 1}
                sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  border: accessibility.highContrast ? `2px solid ${themeColors.border}` : 'none',
                  borderRadius: 1,
                }}
              >
                <Typography 
                  variant="h6"
                  sx={{
                    mb: 1,
                    color: themeColors.textSecondary,
                    ...(accessibility.largeText && { fontSize: '1.3rem' })
                  }}
                >
                  No devices found
                </Typography>
                <Typography 
                  variant="body1"
                  sx={{
                    color: themeColors.textSecondary,
                    ...(accessibility.largeText && { fontSize: '1.1rem' })
                  }}
                >
                  There are no devices connected to your account. Please connect a device to start tracking.
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmationDialog.open}
        onClose={closeRemoveConfirmation}
        aria-labelledby="remove-device-dialog-title"
        aria-describedby="remove-device-dialog-description"
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: themeColors.card,
            ...(accessibility.highContrast && {
              border: `2px solid ${themeColors.border}`
            })
          }
        }}
      >
        <DialogTitle 
          id="remove-device-dialog-title"
          sx={{
            ...(accessibility.largeText && { fontSize: '1.5rem' })
          }}
        >
          Remove Device
        </DialogTitle>
        <DialogContent>
          <DialogContentText 
            id="remove-device-dialog-description"
            sx={{
              color: themeColors.text,
              ...(accessibility.largeText && { fontSize: '1.1rem' })
            }}
          >
            Are you sure you want to remove the device "{confirmationDialog.deviceName}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button 
            onClick={closeRemoveConfirmation}
            sx={{
              ...(accessibility.largeText && { fontSize: '1rem' })
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => handleRemoveDevice(confirmationDialog.deviceId)}
            variant="contained"
            color="error"
            autoFocus
            sx={{
              ...(accessibility.largeText && { fontSize: '1rem' }),
              ...(accessibility.highContrast && {
                border: '2px solid #d32f2f',
                fontWeight: 600
              })
            }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DeviceManagement;
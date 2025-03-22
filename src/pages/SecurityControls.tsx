import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Button,
  Select,
  MenuItem,
  Alert,
  Grid,
  TextField,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Paper,
  Box,
  Fade,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Divider,
  Tooltip,
  useTheme as useMuiTheme
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
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

const SecurityControls = () => {
  // ✅ Define Interfaces
  interface Device {
    device_id: string;
    device_name: string;
  }

  interface BlockedApp {
    id: number;
    app_name: string;
  }

  interface BlockedWebsite {
    id: number;
    url: string;
  }

  // ✅ Define States
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [appPackage, setAppPackage] = useState<string>("");
  const [websiteUrl, setWebsiteUrl] = useState<string>("");
  const [blockedApps, setBlockedApps] = useState<BlockedApp[]>([]);
  const [blockedWebsites, setBlockedWebsites] = useState<BlockedWebsite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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

  const token = localStorage.getItem("token");

  // ✅ Fetch Blocked Apps
  const fetchBlockedApps = useCallback((deviceId: string) => {
    axios
      .get(`/api/tracker/blocked-apps/?device_id=${deviceId}`, {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        if (response.data.blocked_apps) {
          setBlockedApps(response.data.blocked_apps);
        }
      })
      .catch(() => setBlockedApps([]));
  }, [token]);

  // ✅ Fetch Blocked Websites
  const fetchBlockedWebsites = useCallback((deviceId: string) => {
    axios
      .get(`/api/tracker/blocked-websites/?device_id=${deviceId}`, {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        if (response.data.blocked_websites) {
          setBlockedWebsites(response.data.blocked_websites);
        }
      })
      .catch(() => setBlockedWebsites([]));
  }, [token]);

  // ✅ Fetch Devices
  const fetchDevices = useCallback(() => {
    setLoading(true);
    
    if (!token) {
      setError("Unauthorized: Please log in.");
      window.location.href = "/login";
      return;
    }

    axios
      .get<{ devices: Device[] }>("/api/tracker/device-management/", {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        if (Array.isArray(response.data.devices)) {
          setDevices(response.data.devices);
          if (response.data.devices.length > 0) {
            const firstDeviceId = response.data.devices[0].device_id;
            setSelectedDevice(firstDeviceId);
            fetchBlockedApps(firstDeviceId);
            fetchBlockedWebsites(firstDeviceId);
          }
          setLoading(false);
        } else {
          setError("Invalid response format.");
          setLoading(false);
        }
      })
      .catch((err) => {
        setError("Error fetching devices: " + (err.response?.data?.error || "Unknown error."));
        setLoading(false);
      });
  }, [token, fetchBlockedApps, fetchBlockedWebsites]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Effect for accessibility announcements
  useEffect(() => {
    // Accessibility announcements are now handled by the AccessibilityAnnouncement component
    // which is declared in the return section of this component
  }, [loading, error, success]);

  // ✅ Handle Actions (Block, Unblock, Security Controls)
  const handleAction = (endpoint: string, successMessage: string, data: object = {}) => {
    if (!selectedDevice) {
      setError("Please select a device.");
      return;
    }

    setError(null);
    setSuccess(null);

    axios
      .post(endpoint, { device_id: selectedDevice, ...data }, { headers: { Authorization: `Token ${token}` } })
      .then(() => {
        setSuccess(successMessage);
        fetchBlockedApps(selectedDevice);
        fetchBlockedWebsites(selectedDevice);
        
        // Clear input fields after successful action if they were used
        if ('app_name' in data) {
          setAppPackage("");
        }
        if ('url' in data) {
          setWebsiteUrl("");
        }
      })
      .catch((err) => {
        setError("Operation failed: " + (err.response?.data?.error || "Unknown error."));
      });
  };

  const handleDeviceChange = (event: SelectChangeEvent<string>) => {
    const deviceId = event.target.value as string;
    setSelectedDevice(deviceId);
    fetchBlockedApps(deviceId);
    fetchBlockedWebsites(deviceId);
  };

  return (
    <Container>
      {/* Accessibility announcements for screen readers */}
      {error && <AccessibilityAnnouncement message={error} assertive={true} />}
      {success && <AccessibilityAnnouncement message={success} />}
      
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
        id="security-controls-title"
      >
        Security & Control Features
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

      {/* Device Selector */}
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
          id="device-selector-title"
          sx={{ 
            mb: 2,
            fontWeight: 600,
            color: themeColors.headingSecondary,
            ...(accessibility.largeText && { fontSize: '1.3rem' }),
          }}
        >
          Select Device
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
            id="device-select-label"
            sx={{
              color: themeColors.textSecondary,
              ...(accessibility.largeText && { fontSize: '1.1rem' })
            }}
          >
            Select Device
          </InputLabel>
          <Select
            labelId="device-select-label"
            id="device-select"
            value={selectedDevice}
            onChange={handleDeviceChange}
            label="Select Device"
            displayEmpty
            aria-labelledby="device-selector-title"
            aria-expanded="false"
            aria-disabled={loading || devices.length === 0}
          >
            {devices.length > 0 ? (
              devices.map((device) => (
                <MenuItem 
                  key={device.device_id} 
                  value={device.device_id}
                  sx={{
                    ...(accessibility.largeText && { fontSize: '1.1rem' })
                  }}
                >
                  {device.device_name} (ID: {device.device_id})
                </MenuItem>
              ))
            ) : (
              <MenuItem 
                disabled
                sx={{
                  ...(accessibility.largeText && { fontSize: '1.1rem' })
                }}
              >
                No devices found
              </MenuItem>
            )}
          </Select>
        </FormControl>
      </Paper>

      {/* Security Controls */}
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
          id="security-actions-title"
          sx={{ 
            mb: 2,
            fontWeight: 600,
            color: themeColors.headingSecondary,
            ...(accessibility.largeText && { fontSize: '1.3rem' }),
          }}
        >
          Device Controls
        </Typography>
        
        <Grid container spacing={2} aria-labelledby="security-actions-title">
          <Grid item xs={12}>
            <Button 
              fullWidth 
              variant="contained" 
              color="error" 
              onClick={() => handleAction("/api/tracker/remote-lock/", "Device locked successfully")}
              aria-label="Lock device"
              sx={{
                py: accessibility.largeText ? 1.5 : 1,
                ...(accessibility.largeText && { fontSize: '1.1rem' }),
                ...(accessibility.highContrast && {
                  border: `2px solid #d32f2f`,
                  fontWeight: 600
                })
              }}
              disabled={!selectedDevice}
            >
              Lock Device
            </Button>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Button 
              fullWidth 
              variant="contained" 
              color="secondary" 
              onClick={() => handleAction("/api/tracker/uninstall-protection/", "Uninstall protection enabled")}
              aria-label="Enable uninstall protection"
              sx={{
                py: accessibility.largeText ? 1.5 : 1,
                ...(accessibility.largeText && { fontSize: '1.1rem' }),
                ...(accessibility.highContrast && {
                  border: `2px solid ${themeColors.secondary}`,
                  fontWeight: 600
                })
              }}
              disabled={!selectedDevice}
            >
              Enable Uninstall Protection
            </Button>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Button 
              fullWidth 
              variant="contained" 
              color="primary" 
              onClick={() => handleAction("/api/tracker/device/admin-mode/", "Device Admin Mode enabled")}
              aria-label="Enable device admin mode"
              sx={{
                py: accessibility.largeText ? 1.5 : 1,
                ...(accessibility.largeText && { fontSize: '1.1rem' }),
                ...(accessibility.highContrast && {
                  border: `2px solid ${themeColors.primary}`,
                  fontWeight: 600
                })
              }}
              disabled={!selectedDevice}
            >
              Enable Device Admin Mode
            </Button>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Button 
              fullWidth 
              variant="contained" 
              color="warning" 
              onClick={() => handleAction("/api/tracker/device/hide-app/", "App hidden successfully")}
              aria-label="Hide app on device"
              sx={{
                py: accessibility.largeText ? 1.5 : 1,
                ...(accessibility.largeText && { fontSize: '1.1rem' }),
                ...(accessibility.highContrast && {
                  border: `2px solid #ed6c02`,
                  fontWeight: 600
                })
              }}
              disabled={!selectedDevice}
            >
              Hide App
            </Button>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Button 
              fullWidth 
              variant="contained" 
              color="info" 
              onClick={() => handleAction("/api/tracker/device/toggle-visibility/", "App visibility updated", { visible: true })}
              aria-label="Make app visible on device"
              sx={{
                py: accessibility.largeText ? 1.5 : 1,
                ...(accessibility.largeText && { fontSize: '1.1rem' }),
                ...(accessibility.highContrast && {
                  border: `2px solid #0288d1`,
                  fontWeight: 600
                })
              }}
              disabled={!selectedDevice}
            >
              Toggle App Visibility
            </Button>
          </Grid>

          <Grid item xs={12}>
            <Tooltip title="Warning: This will reset the device to factory settings and cannot be undone">
              <Button 
                fullWidth 
                variant="contained" 
                color="error" 
                onClick={() => handleAction("/api/tracker/device/remote-control/", "Factory reset initiated", { action: "factory_reset" })}
                aria-label="Factory reset device - Warning: this cannot be undone"
                sx={{
                  py: accessibility.largeText ? 1.5 : 1,
                  ...(accessibility.largeText && { fontSize: '1.1rem' }),
                  ...(accessibility.highContrast && {
                    border: `2px solid #d32f2f`,
                    fontWeight: 600
                  })
                }}
                disabled={!selectedDevice}
              >
                Factory Reset Device
              </Button>
            </Tooltip>
          </Grid>
        </Grid>
      </Paper>

      {/* Block Apps & Websites */}
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
          id="blocking-title"
          sx={{ 
            mb: 3,
            fontWeight: 600,
            color: themeColors.headingSecondary,
            ...(accessibility.largeText && { fontSize: '1.3rem' }),
          }}
        >
          Block Apps & Websites
        </Typography>

        {/* Block App Section */}
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            if (appPackage.trim() && selectedDevice) {
              handleAction("/api/tracker/block-apps/", "App blocked successfully", { 
                device_id: selectedDevice,
                app_name: appPackage.trim()
              });
            }
          }}
          sx={{ mb: 3 }}
        >
          <Typography 
            variant="subtitle1" 
            component="h3"
            sx={{ 
              mb: 1.5,
              fontWeight: 600,
              color: themeColors.text,
              ...(accessibility.largeText && { fontSize: '1.1rem' }),
            }}
          >
            Block Application
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                label="App Package Name"
                fullWidth
                value={appPackage}
                onChange={(e) => setAppPackage(e.target.value)}
                variant="outlined"
                placeholder="com.example.app"
                helperText="Enter the app package name (e.g., com.facebook.katana)"
                required
                aria-required="true"
                aria-invalid={!appPackage.trim()}
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
                    '& .MuiOutlinedInput-input': { fontSize: '1.1rem' },
                    '& .MuiFormHelperText-root': { fontSize: '0.9rem' }
                  })
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant="contained"
                color="error"
                fullWidth
                type="submit"
                disabled={!appPackage.trim() || !selectedDevice}
                aria-label="Block application"
                sx={{
                  height: '56px',
                  ...(accessibility.largeText && { fontSize: '1.1rem' }),
                  ...(accessibility.highContrast && {
                    border: `2px solid #d32f2f`,
                    fontWeight: 600
                  })
                }}
              >
                Block App
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ 
          my: 3,
          ...(accessibility.highContrast && { 
            backgroundColor: themeColors.border,
            height: '2px'
          })
        }} />

        {/* Block Website Section */}
        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            if (websiteUrl.trim() && selectedDevice) {
              handleAction("/api/tracker/block-websites/", "Website blocked successfully", { 
                url: websiteUrl.trim() 
              });
            }
          }}
        >
          <Typography 
            variant="subtitle1" 
            component="h3"
            sx={{ 
              mb: 1.5,
              fontWeight: 600,
              color: themeColors.text,
              ...(accessibility.largeText && { fontSize: '1.1rem' }),
            }}
          >
            Block Website
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                label="Website URL"
                fullWidth
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                variant="outlined"
                placeholder="www.example.com"
                helperText="Enter the website URL to block (e.g., facebook.com)"
                required
                aria-required="true"
                aria-invalid={!websiteUrl.trim()}
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
                    '& .MuiOutlinedInput-input': { fontSize: '1.1rem' },
                    '& .MuiFormHelperText-root': { fontSize: '0.9rem' }
                  })
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button
                variant="contained"
                color="error"
                fullWidth
                type="submit"
                disabled={!websiteUrl.trim() || !selectedDevice}
                aria-label="Block website"
                sx={{
                  height: '56px',
                  ...(accessibility.largeText && { fontSize: '1.1rem' }),
                  ...(accessibility.highContrast && {
                    border: `2px solid #d32f2f`,
                    fontWeight: 600
                  })
                }}
              >
                Block Website
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Lists of Blocked Items */}
      <Grid container spacing={3} sx={{ mt: 1, mb: 4 }}>
        {/* Blocked Apps List */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={accessibility.highContrast ? 0 : 2}
            sx={{ 
              backgroundColor: themeColors.card,
              border: accessibility.highContrast ? `2px solid ${themeColors.border}` : 'none',
              borderRadius: 1,
              height: '100%',
            }}
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
                id="blocked-apps-title"
                sx={{ 
                  fontWeight: 600,
                  ...(accessibility.largeText && { fontSize: '1.3rem' }),
                  color: themeColors.headingSecondary
                }}
              >
                Blocked Apps
              </Typography>
            </Box>
            
            <List 
              aria-labelledby="blocked-apps-title"
              sx={{ 
                p: 0,
                ...(blockedApps.length === 0 && { p: 2 }) 
              }}
            >
              {blockedApps.length > 0 ? (
                blockedApps.map((app, index) => (
                  <React.Fragment key={app.id}>
                    <ListItem
                      sx={{
                        py: 1.5,
                        px: 2,
                        backgroundColor: index % 2 === 0 ? 'transparent' : themeColors.tableRow,
                        ...(accessibility.largeText && { py: 2 })
                      }}
                      secondaryAction={
                        <Tooltip title="Unblock app">
                          <IconButton 
                            edge="end" 
                            aria-label={`Unblock ${app.app_name}`}
                            onClick={() => handleAction("/api/tracker/unblock-apps/", `App ${app.app_name} unblocked`, { app_name: app.app_name })}
                            sx={{
                              ...(accessibility.highContrast && { 
                                border: `1px solid ${themeColors.border}`,
                                borderRadius: '4px'
                              })
                            }}
                          >
                            <DeleteIcon 
                              sx={{ 
                                color: accessibility.highContrast ? '#d32f2f' : 'inherit',
                                ...(accessibility.largeText && { fontSize: '1.5rem' })
                              }} 
                            />
                          </IconButton>
                        </Tooltip>
                      }
                    >
                      <ListItemText 
                        primary={app.app_name}
                        primaryTypographyProps={{
                          sx: {
                            color: themeColors.text,
                            ...(accessibility.largeText && { fontSize: '1.1rem' })
                          }
                        }}
                      />
                    </ListItem>
                    {index < blockedApps.length - 1 && (
                      <Divider sx={{ 
                        borderColor: accessibility.highContrast ? themeColors.border : 'rgba(0, 0, 0, 0.08)'
                      }} />
                    )}
                  </React.Fragment>
                ))
              ) : (
                <Typography 
                  sx={{ 
                    textAlign: 'center',
                    color: themeColors.textSecondary,
                    ...(accessibility.largeText && { fontSize: '1.1rem' })
                  }}
                >
                  No blocked apps for this device
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>
        
        {/* Blocked Websites List */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={accessibility.highContrast ? 0 : 2}
            sx={{ 
              backgroundColor: themeColors.card,
              border: accessibility.highContrast ? `2px solid ${themeColors.border}` : 'none',
              borderRadius: 1,
              height: '100%',
            }}
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
                id="blocked-websites-title"
                sx={{ 
                  fontWeight: 600,
                  ...(accessibility.largeText && { fontSize: '1.3rem' }),
                  color: themeColors.headingSecondary
                }}
              >
                Blocked Websites
              </Typography>
            </Box>
            
            <List 
              aria-labelledby="blocked-websites-title"
              sx={{ 
                p: 0,
                ...(blockedWebsites.length === 0 && { p: 2 }) 
              }}
            >
              {blockedWebsites.length > 0 ? (
                blockedWebsites.map((site, index) => (
                  <React.Fragment key={site.id}>
                    <ListItem
                      sx={{
                        py: 1.5,
                        px: 2,
                        backgroundColor: index % 2 === 0 ? 'transparent' : themeColors.tableRow,
                        ...(accessibility.largeText && { py: 2 })
                      }}
                      secondaryAction={
                        <Tooltip title="Unblock website">
                          <IconButton 
                            edge="end" 
                            aria-label={`Unblock ${site.url}`}
                            onClick={() => handleAction("/api/tracker/unblock-websites/", `Website ${site.url} unblocked`, { url: site.url })}
                            sx={{
                              ...(accessibility.highContrast && { 
                                border: `1px solid ${themeColors.border}`,
                                borderRadius: '4px'
                              })
                            }}
                          >
                            <DeleteIcon 
                              sx={{ 
                                color: accessibility.highContrast ? '#d32f2f' : 'inherit',
                                ...(accessibility.largeText && { fontSize: '1.5rem' })
                              }} 
                            />
                          </IconButton>
                        </Tooltip>
                      }
                    >
                      <ListItemText 
                        primary={site.url}
                        primaryTypographyProps={{
                          sx: {
                            color: themeColors.text,
                            ...(accessibility.largeText && { fontSize: '1.1rem' })
                          }
                        }}
                      />
                    </ListItem>
                    {index < blockedWebsites.length - 1 && (
                      <Divider sx={{ 
                        borderColor: accessibility.highContrast ? themeColors.border : 'rgba(0, 0, 0, 0.08)'
                      }} />
                    )}
                  </React.Fragment>
                ))
              ) : (
                <Typography 
                  sx={{ 
                    textAlign: 'center',
                    color: themeColors.textSecondary,
                    ...(accessibility.largeText && { fontSize: '1.1rem' })
                  }}
                >
                  No blocked websites for this device
                </Typography>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default SecurityControls;
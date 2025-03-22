import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Select,
  MenuItem,
  Alert,
  Box,
  Paper,
  FormControl,
  InputLabel,
  FormHelperText,
  Chip,
  Divider,
  LinearProgress,
  SelectChangeEvent,
  useTheme as useMuiTheme,
  Button,
  Card,
  CardContent,
  CardMedia,
  Skeleton,
  Tooltip,
} from "@mui/material";
import { useTheme } from "../context/ThemeContext";
import AccessibilityAnnouncement from "../components/AccessibilityAnnouncement";

// Define ThemeExtras interface for consistent theming
interface ThemeExtras {
  card: string;
  border: string;
  input: string;
  headingSecondary: string;
  cardHeader: string;
  textSecondary: string;
  accent: string;
}

// ✅ Define Device Interface
interface Device {
  device_id: string;
  device_name: string;
}

// ✅ Define Live Screen Response Interface
interface LiveScreenResponse {
  image_url: string;
  timestamp: string;
}

const LiveScreen = () => {
  // Get theme context for colors and accessibility features
  const { colors, accessibility } = useTheme();
  const muiTheme = useMuiTheme();
  
  // Create combined theme colors for consistent styling
  const themeColors = {
    ...colors,
    card: '#ffffff',
    border: '#e0e0e0',
    input: '#f5f5f5',
    headingSecondary: '#424242',
    cardHeader: '#f8f8f8',
    textSecondary: '#757575',
    accent: colors.secondary || '#4caf50'
  };

  // ✅ Define state properly with accessibility features
  const [screenData, setScreenData] = useState<LiveScreenResponse | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [announcement, setAnnouncement] = useState<string>("");
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const token = localStorage.getItem("token");

  // ✅ Fetch Live Screen Data with accessibility support
  const fetchLiveScreen = useCallback((deviceId: string, isRefresh: boolean = false) => {
    if (!token) {
      setError("Unauthorized: Please log in again.");
      setAnnouncement("Authentication error. Please log in again.");
      return;
    }

    // Set appropriate loading state
    if (isRefresh) {
      setRefreshing(true);
      setAnnouncement("Refreshing screen capture...");
    } else {
      setLoading(true);
      setImageLoaded(false);
      setAnnouncement("Loading screen capture from device...");
    }

    // Find device name for better announcements
    const deviceName = devices.find(d => d.device_id === deviceId)?.device_name || deviceId;

    axios
      .get(`/api/tracker/live-screen/?device_id=${deviceId}`, {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        console.log("✅ Fetched Live Screen Data:", response.data);

        if (response.data.live_screen && Array.isArray(response.data.live_screen) && response.data.live_screen.length > 0) {
          const latestScreen = response.data.live_screen[0]; // ✅ Get the first screenshot
          
          // Set the screen data
          setScreenData({
            image_url: latestScreen.screenshot_url,
            timestamp: latestScreen.timestamp,
          });
          
          // Update announcement with timestamp
          const captureTime = new Date(latestScreen.timestamp).toLocaleString();
          if (isRefresh) {
            setAnnouncement(`Screen refreshed for device ${deviceName}. Captured at ${captureTime}`);
          } else {
            setAnnouncement(`Screen loaded for device ${deviceName}. Captured at ${captureTime}`);
          }
        } else {
          setScreenData(null);
          setAnnouncement(`No screen capture available for device ${deviceName}`);
        }
        setError(null);
      })
      .catch((error) => {
        console.error("❌ Error fetching live screen data:", error);
        setError("Error fetching live screen.");
        setAnnouncement("Failed to load screen capture. Please try again.");
        setScreenData(null);
      })
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  }, [token, devices]);

  // ✅ Fetch Devices with accessibility support
  const fetchDevices = useCallback(() => {
    if (!token) {
      setError("Unauthorized: Please log in.");
      setAnnouncement("Authentication error. Please log in to continue.");
      window.location.href = "/login";
      return;
    }

    setLoading(true);
    setAnnouncement("Loading available devices...");

    axios
      .get<{ devices: Device[] }>("/api/tracker/device-management/", {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        if (Array.isArray(response.data.devices)) {
          const deviceList = response.data.devices;
          setDevices(deviceList);
          
          // Announce devices count for screen readers
          const deviceCount = deviceList.length;
          
          if (deviceCount > 0) {
            const firstDeviceId = deviceList[0].device_id;
            const firstName = deviceList[0].device_name;
            
            setSelectedDevice(firstDeviceId);
            setAnnouncement(`Found ${deviceCount} device${deviceCount !== 1 ? 's' : ''}. Selected ${firstName} for screen monitoring.`);
            
            // Load screen data for the first device
            fetchLiveScreen(firstDeviceId);
          } else {
            setAnnouncement("No devices found. Please add a device first to monitor screen.");
            setLoading(false);
          }
        } else {
          setError("Invalid response format from the server.");
          setAnnouncement("Error in the device data format.");
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("❌ API Error:", err);
        if (err.response?.status === 401) {
          setError("Unauthorized: Please log in again.");
          setAnnouncement("Your session has expired. Please log in again.");
          localStorage.removeItem("token");
          window.location.href = "/login"; // Redirect to login page
        } else {
          setError("Error fetching devices.");
          setAnnouncement("Failed to load devices. Please check your connection and try again.");
        }
        setLoading(false);
      });
  }, [fetchLiveScreen, token]);

  // ✅ Fetch Devices on Mount
  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // ✅ Fetch Live Screen Data when Device Changes with accessibility support
  useEffect(() => {
    if (selectedDevice) {
      fetchLiveScreen(selectedDevice);
      
      // Announce auto-refresh behavior for screen readers
      setAnnouncement("Screen capture will auto-refresh every 5 seconds");
      
      // Set up auto-refresh interval
      const interval = setInterval(() => {
        fetchLiveScreen(selectedDevice, true); // true = isRefresh
      }, 5000); // Refresh every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [selectedDevice, fetchLiveScreen]);
  
  // Image load handler for accessibility
  const handleImageLoad = () => {
    setImageLoaded(true);
    setAnnouncement("Screen capture image loaded successfully");
  };
  
  // Image error handler for accessibility
  const handleImageError = () => {
    setImageLoaded(true); // Still mark as loaded to remove loading state
    setAnnouncement("Screen capture image failed to load");
  };
  
  // Manual refresh handler with accessibility
  const handleManualRefresh = () => {
    if (selectedDevice) {
      fetchLiveScreen(selectedDevice, true);
    } else {
      setAnnouncement("Please select a device first");
    }
  };

  return (
    <Container>
      {/* Screen reader announcement */}
      <AccessibilityAnnouncement message={announcement} />
      
      {/* Page Title with theme-aware styling */}
      <Typography 
        variant="h4" 
        component="h1"
        sx={{ 
          mb: 3,
          color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary,
          fontSize: accessibility.largeText ? '2.5rem' : '2rem',
          fontWeight: 600,
          ...(accessibility.highContrast ? {
            textDecoration: 'underline',
            textUnderlineOffset: '5px'
          } : {
            background: `linear-gradient(45deg, ${themeColors.primary}, ${themeColors.accent})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: accessibility.highContrast ? 'initial' : 'transparent'
          })
        }}
      >
        Live Screen Monitoring
      </Typography>

      {/* Error alert with enhanced accessibility */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            marginTop: 2,
            ...(accessibility.highContrast && {
              backgroundColor: '#ffebee', 
              color: '#d32f2f',
              border: '2px solid #d32f2f',
              fontWeight: 'bold'
            })
          }}
          role="alert"
          aria-live="assertive"
        >
          {error}
        </Alert>
      )}

      {/* Loading indicator */}
      {loading && (
        <Box sx={{ width: '100%', mt: 2, mb: 2 }}>
          <LinearProgress 
            color="primary" 
            aria-label="Loading data"
            sx={{
              height: accessibility.largeText ? 10 : 6,
              backgroundColor: accessibility.highContrast ? '#e0e0e0' : undefined,
              '& .MuiLinearProgress-bar': {
                backgroundColor: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary
              }
            }}
          />
          <Typography 
            variant="body2" 
            sx={{ 
              mt: 1, 
              color: 'text.secondary',
              ...(accessibility.highContrast && { color: muiTheme.palette.text.primary, fontWeight: 'bold' })
            }}
            aria-live="polite"
          >
            {loading ? "Loading screen data..." : ""}
          </Typography>
        </Box>
      )}
      
      {/* Device selection and control section */}
      <Paper
        elevation={accessibility.highContrast ? 0 : 1}
        sx={{ 
          p: 3, 
          mt: 2,
          mb: 3,
          borderRadius: 2,
          border: accessibility.highContrast ? `2px solid ${muiTheme.palette.text.primary}` : 'none',
          backgroundColor: accessibility.highContrast ? 'transparent' : 'background.paper'
        }}
      >
        <Box 
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 2
          }}
        >
          <i 
            className="ri-computer-line" 
            style={{ 
              color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary,
              fontSize: accessibility.largeText ? '1.8rem' : '1.5rem',
              marginRight: '12px'
            }}
          ></i>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary,
              ...(accessibility.largeText && { fontSize: '1.4rem' })
            }}
          >
            Device Screen Controls
          </Typography>
        </Box>
      
        {/* Device Count Summary */}
        {devices.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip 
              label={`${devices.length} connected device${devices.length !== 1 ? 's' : ''}`}
              size={accessibility.largeText ? "medium" : "small"}
              sx={{ 
                bgcolor: accessibility.highContrast ? 'transparent' : `${themeColors.primary}15`,
                color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary,
                fontWeight: 500,
                border: accessibility.highContrast ? `2px solid ${muiTheme.palette.text.primary}` : 'none',
                ...(accessibility.largeText && { fontSize: '1rem' })
              }}
            />
            
            <Chip 
              label={`Auto-refresh: 5 seconds`}
              size={accessibility.largeText ? "medium" : "small"}
              color="primary"
              variant={accessibility.highContrast ? "outlined" : "filled"}
              sx={{ 
                ...(accessibility.highContrast && { 
                  borderWidth: 2,
                  borderColor: muiTheme.palette.text.primary,
                  color: muiTheme.palette.text.primary
                }),
                ...(accessibility.largeText && { fontSize: '1rem' })
              }}
            />
          </Box>
        )}
        
        {/* Device Selector with accessibility enhancements */}
        <FormControl 
          fullWidth 
          sx={{ 
            mb: 3,
            ...(accessibility.highContrast && {
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: 2,
                borderColor: muiTheme.palette.text.primary
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: muiTheme.palette.text.primary
              }
            })
          }}
        >
          <InputLabel 
            id="device-select-label"
            sx={{ 
              color: accessibility.highContrast ? muiTheme.palette.text.primary : undefined,
              ...(accessibility.largeText && { fontSize: '1.1rem' })
            }}
          >
            Select Device for Screen Monitoring
          </InputLabel>
          <Select
            labelId="device-select-label"
            id="device-select"
            value={selectedDevice}
            onChange={(e: SelectChangeEvent) => {
              const deviceId = e.target.value;
              setSelectedDevice(deviceId);
              
              // Find device name for better announcement
              const selectedDeviceName = devices.find(d => d.device_id === deviceId)?.device_name || deviceId;
              setAnnouncement(`Switching to device ${selectedDeviceName} for screen monitoring`);
              
              fetchLiveScreen(deviceId);
            }}
            label="Select Device for Screen Monitoring"
            displayEmpty
            fullWidth
            sx={{ 
              ...(accessibility.largeText && { 
                fontSize: '1.1rem',
                '.MuiSelect-select': { padding: '14px' }
              })
            }}
          >
            {devices.length > 0 ? (
              devices.map((device: Device) => (
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
              <MenuItem disabled>No devices found</MenuItem>
            )}
          </Select>
          <FormHelperText
            sx={{
              color: accessibility.highContrast ? muiTheme.palette.text.primary : undefined,
              ...(accessibility.largeText && { fontSize: '0.9rem' })
            }}
          >
            Choose a device to monitor its screen
          </FormHelperText>
        </FormControl>
        
        {/* Manual refresh button */}
        <Button
          variant="outlined"
          color="primary"
          onClick={handleManualRefresh}
          disabled={refreshing || !selectedDevice}
          aria-label="Manually refresh screen capture"
          sx={{ 
            py: accessibility.largeText ? 1 : 0.5,
            px: accessibility.largeText ? 2 : 1,
            fontSize: accessibility.largeText ? '1rem' : '0.9rem',
            borderColor: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary,
            borderWidth: accessibility.highContrast ? 2 : 1,
            color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary,
            '&:focus': {
              outline: accessibility.highContrast ? `2px solid ${muiTheme.palette.text.primary}` : 'none',
              outlineOffset: '2px'
            }
          }}
          startIcon={
            <i 
              className="ri-refresh-line" 
              style={{ 
                color: 'inherit',
                fontSize: accessibility.largeText ? '1.3rem' : '1rem'
              }}
            ></i>
          }
        >
          {refreshing ? "Refreshing..." : "Refresh Now"}
        </Button>
        
        {/* Screen reader helper text */}
        {accessibility.screenReaderOptimized && (
          <Typography className="sr-only">
            Screen capture is automatically refreshed every 5 seconds. 
            You can also manually refresh using the Refresh Now button.
          </Typography>
        )}
      </Paper>

      {/* Live Screen Display with accessibility enhancements */}
      <Box 
        id="screen-display"
        role="region"
        aria-label="Live screen display"
        tabIndex={0}
      >
        <Divider 
          sx={{ 
            my: 3,
            borderColor: accessibility.highContrast ? muiTheme.palette.text.primary : 'divider',
            borderWidth: accessibility.highContrast ? '2px' : '1px'
          }}
        />
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <i 
            className="ri-device-line" 
            style={{ 
              color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary,
              fontSize: accessibility.largeText ? '1.8rem' : '1.5rem',
              marginRight: '12px'
            }}
          ></i>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary,
              ...(accessibility.largeText && { fontSize: '1.4rem' })
            }}
          >
            Live Screen View
          </Typography>
        </Box>
        
        {/* Screen image with accessibility support */}
        {screenData && screenData.image_url ? (
          <Card
            sx={{
              mt: 2,
              p: 0,
              borderRadius: 2,
              boxShadow: accessibility.highContrast ? 'none' : '0 2px 10px rgba(0,0,0,0.1)',
              border: accessibility.highContrast ? `2px solid ${muiTheme.palette.text.primary}` : 'none',
            }}
          >
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                transition: 'all 0.3s ease',
              }}
            >
              {!imageLoaded && (
                <Skeleton 
                  variant="rectangular" 
                  width="100%" 
                  height={400}
                  animation="wave"
                  sx={{
                    bgcolor: accessibility.highContrast ? 'rgba(0,0,0,0.11)' : 'rgba(0,0,0,0.07)'
                  }}
                />
              )}
              
              <img
                src={screenData.image_url}
                alt={`Live screen capture from device taken at ${new Date(screenData.timestamp).toLocaleString()}`}
                style={{
                  width: "100%",
                  maxHeight: accessibility.largeText ? "800px" : "600px",
                  borderRadius: accessibility.highContrast ? '0' : '8px 8px 0 0',
                  objectFit: "contain",
                  display: imageLoaded ? 'block' : 'none',
                  border: accessibility.highContrast ? `2px solid ${muiTheme.palette.text.primary}` : 'none'
                }}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </Box>
            
            <CardContent
              sx={{
                borderTop: accessibility.highContrast ? `2px solid ${muiTheme.palette.text.primary}` : '1px solid #eee',
                backgroundColor: accessibility.highContrast ? 'transparent' : 'rgba(0,0,0,0.02)',
                p: 2
              }}
            >
              <Typography 
                variant={accessibility.largeText ? "body1" : "body2"}
                color="text.secondary"
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  color: accessibility.highContrast ? muiTheme.palette.text.primary : undefined,
                  fontWeight: accessibility.highContrast ? 'medium' : 'normal'
                }}
              >
                <i 
                  className="ri-time-line" 
                  style={{ 
                    marginRight: '8px',
                    fontSize: accessibility.largeText ? '1.2rem' : '1rem'
                  }}
                ></i>
                Captured At: {new Date(screenData.timestamp).toLocaleString()}
              </Typography>
              
              {/* Auto-refresh status */}
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'block', 
                  mt: 1,
                  color: accessibility.highContrast ? muiTheme.palette.text.primary : 'text.secondary',
                  ...(accessibility.largeText && { fontSize: '0.9rem' })
                }}
              >
                Screen automatically refreshes every 5 seconds. Last updated: {new Date().toLocaleTimeString()}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Paper
            elevation={accessibility.highContrast ? 0 : 1}
            sx={{ 
              p: 4, 
              mt: 2, 
              textAlign: 'center',
              borderRadius: 2,
              minHeight: '200px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 2,
              ...(accessibility.highContrast && {
                border: `2px solid ${muiTheme.palette.text.primary}`,
              })
            }}
          >
            <i 
              className="ri-computer-line" 
              style={{ 
                fontSize: accessibility.largeText ? '3rem' : '2.5rem',
                color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary,
                opacity: 0.5
              }}
            ></i>
            <Typography 
              sx={{ 
                color: accessibility.highContrast ? muiTheme.palette.text.primary : 'text.secondary',
                ...(accessibility.largeText && { fontSize: '1.2rem' })
              }}
              aria-live="polite"
            >
              {loading ? "Loading screen capture..." : "No live screen available. Select a device and make sure it's connected."}
            </Typography>
          </Paper>
        )}
      </Box>
      
      {/* Add CSS for screen reader only elements */}
      <style>{`
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }
      `}</style>
    </Container>
  );
};

export default LiveScreen;

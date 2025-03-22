import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Select,
  MenuItem,
  Alert,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  FormControl,
  InputLabel,
  FormHelperText,
  Grid,
  Chip,
  Divider,
  LinearProgress,
  SelectChangeEvent,
  useTheme as useMuiTheme,
} from "@mui/material";
import { useTheme } from "../context/ThemeContext";
import AccessibilityAnnouncement from "../components/AccessibilityAnnouncement";

// ✅ Define ThemeExtras interface for additional UI customization
interface ThemeExtras {
  card: string;
  border: string;
  input: string;
  headingSecondary: string;
  cardHeader: string;
  textSecondary: string;
}

// ✅ Define Interfaces
interface Device {
  device_id: string;
  device_name: string;
}

interface CapturedPhoto {
  id: string;
  image_url: string;
  timestamp: string;
}

const LiveCamera = () => {
  // Get theme context for colors and accessibility features
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
  
  // ✅ Properly Typed States
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [captureLoading, setCaptureLoading] = useState<boolean>(false);
  const [announcement, setAnnouncement] = useState<string>("");
  const [photoLoadedStates, setPhotoLoadedStates] = useState<{[key: string]: boolean}>({});

  const token = localStorage.getItem("token");

  // ✅ Fetch Latest Captured Photos with accessibility support
  const fetchCapturedPhotos = useCallback(
    (deviceId: string) => {
      if (!deviceId) return;
      
      setLoading(true);
      setAnnouncement("Loading captured photos from device camera");
      
      // Reset photo loaded states when fetching new photos
      setPhotoLoadedStates({});

      axios
        .get<{ live_camera: CapturedPhoto[] }>(
          `/api/tracker/live-camera/list/?device_id=${deviceId}`,
          {
            headers: { Authorization: `Token ${token}` },
          }
        )
        .then((response) => {
          console.log("✅ Fetched live camera captures:", response.data);
          if (response.data.live_camera && response.data.live_camera.length > 0) {
            const photos = response.data.live_camera;
            setCapturedPhotos(photos);
            
            // Initialize photo loaded states
            const initialStates: {[key: string]: boolean} = {};
            photos.forEach(photo => {
              initialStates[photo.id] = false;
            });
            setPhotoLoadedStates(initialStates);
            
            // Announce for screen readers
            const photoCount = photos.length;
            setAnnouncement(`Found ${photoCount} captured photo${photoCount !== 1 ? 's' : ''} from device camera`);
          } else {
            setCapturedPhotos([]);
            setAnnouncement("No photos have been captured yet from this device");
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error("❌ API Error:", err);
          setError("Error fetching captured images.");
          setAnnouncement("An error occurred while loading camera photos. Please try again.");
          setLoading(false);
        });
    },
    [token]
  );

  // ✅ Fetch Devices with accessibility support
  const fetchDevices = useCallback(() => {
    if (!token) {
      setError("Unauthorized: Please log in.");
      setAnnouncement("You need to log in to access this feature");
      window.location.href = "/login";
      return;
    }

    setLoading(true);
    setAnnouncement("Loading available devices");

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
            setAnnouncement(`Found ${deviceCount} device${deviceCount !== 1 ? 's' : ''}. Selected ${firstName}.`);
            fetchCapturedPhotos(firstDeviceId); // ✅ Fetch latest captured images
          } else {
            setAnnouncement("No devices found. Please add a device first.");
            setLoading(false);
          }
        } else {
          setError("Invalid API response format.");
          setAnnouncement("Error in the device data format.");
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("❌ API Error:", err);
        setError("Error fetching devices.");
        setAnnouncement("Failed to load devices. Please try again later.");
        setLoading(false);
      });
  }, [token, fetchCapturedPhotos]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // ✅ Capture Live Photo with accessibility support
  const captureLivePhoto = () => {
    if (!selectedDevice) {
      setError("Please select a device first.");
      setAnnouncement("You need to select a device before capturing a photo.");
      return;
    }

    setCaptureLoading(true);
    setLoading(true);
    setError(null);
    setAnnouncement("Capturing photo from device camera...");

    // Find device name for better announcement
    const deviceName = devices.find(d => d.device_id === selectedDevice)?.device_name || selectedDevice;

    axios
      .post<{ image_url: string }>(
        "/api/tracker/live-camera/capture/",
        { device_id: selectedDevice },
        { headers: { Authorization: `Token ${token}` } }
      )
      .then(() => {
        setAnnouncement(`Successfully captured photo from ${deviceName}. Loading new photo...`);
        fetchCapturedPhotos(selectedDevice); // ✅ Fetch and update UI with the new image
      })
      .catch((err) => {
        console.error("❌ API Error:", err);
        setError("Error capturing live photo.");
        setAnnouncement("Failed to capture photo. Please try again.");
        setLoading(false);
      })
      .finally(() => setCaptureLoading(false));
  };
  
  // Handle image load events for accessibility
  const handleImageLoad = (photoId: string) => {
    setPhotoLoadedStates(prev => ({
      ...prev,
      [photoId]: true
    }));
    
    // Check if this is the last image to load
    const allLoaded = Object.values(photoLoadedStates).every(state => state === true);
    if (allLoaded && capturedPhotos.length > 0) {
      setAnnouncement(`All ${capturedPhotos.length} photos have loaded successfully.`);
    }
  };
  
  // Handle image error with accessibility
  const handleImageError = (photoId: string, photoUrl: string) => {
    console.warn(`❌ Image failed to load: ${photoUrl}`);
    setPhotoLoadedStates(prev => ({
      ...prev,
      [photoId]: true // Mark as loaded even though it failed, to complete loading state
    }));
    
    // Set error text for specific image
    setAnnouncement(`Image ${photoId} failed to load.`);
  };

  return (
    <Container>
      {/* Screen reader announcement component */}
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
            background: `linear-gradient(45deg, ${themeColors.primary}, ${themeColors.secondary})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: accessibility.highContrast ? 'initial' : 'transparent'
          })
        }}
      >
        Live Camera Capture
      </Typography>
      
      {/* Skip link for keyboard users */}
      <Box 
        className="skip-link" 
        sx={{ 
          position: 'absolute', 
          left: '-9999px',
          '&:focus': {
            position: 'static',
            left: 'auto',
            zIndex: 999,
            padding: '10px',
            margin: '10px 0',
            background: themeColors.primary,
            color: '#fff',
            borderRadius: '4px'
          }
        }}
        tabIndex={0}
      >
        <a 
          href="#photo-gallery" 
          style={{ color: '#fff', textDecoration: 'none' }}
          onClick={(e) => {
            e.preventDefault();
            const tableElement = document.getElementById('photo-gallery');
            if (tableElement) {
              tableElement.focus();
              tableElement.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        >
          Skip to photo gallery
        </a>
      </Box>

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
            {loading ? "Loading data..." : ""}
          </Typography>
        </Box>
      )}
      
      {/* Device selection and camera control section */}
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
            className="ri-camera-line" 
            style={{ 
              color: accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary,
              fontSize: accessibility.largeText ? '1.8rem' : '1.5rem',
              marginRight: '12px'
            }}
          ></i>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary,
              ...(accessibility.largeText && { fontSize: '1.4rem' })
            }}
          >
            Camera Controls
          </Typography>
        </Box>
      
        {/* Device Count Summary */}
        {devices.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip 
              label={`${devices.length} connected device${devices.length !== 1 ? 's' : ''}`}
              size={accessibility.largeText ? "medium" : "small"}
              sx={{ 
                bgcolor: accessibility.highContrast ? 'transparent' : `${colors.primary}15`,
                color: accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary,
                fontWeight: 500,
                border: accessibility.highContrast ? `2px solid ${muiTheme.palette.text.primary}` : 'none',
                ...(accessibility.largeText && { fontSize: '1rem' })
              }}
            />
            
            {capturedPhotos.length > 0 && (
              <Chip 
                label={`${capturedPhotos.length} photo${capturedPhotos.length !== 1 ? 's' : ''} captured`}
                size={accessibility.largeText ? "medium" : "small"}
                color="success"
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
            )}
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
            Select Device for Camera Access
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
              setAnnouncement(`Switching to device ${selectedDeviceName}`);
              
              fetchCapturedPhotos(deviceId);
            }}
            label="Select Device for Camera Access"
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
            Choose a device to access its camera
          </FormHelperText>
        </FormControl>
        
        {/* Capture Button with accessibility support */}
        <Button
          variant="contained"
          color="primary"
          onClick={captureLivePhoto}
          disabled={loading || captureLoading}
          aria-label="Capture photo from device camera"
          sx={{ 
            py: accessibility.largeText ? 1.5 : 1,
            px: accessibility.largeText ? 3 : 2,
            fontSize: accessibility.largeText ? '1.1rem' : '0.9rem',
            bgcolor: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary,
            color: accessibility.highContrast ? muiTheme.palette.background.paper : 'white',
            '&:hover': { 
              bgcolor: accessibility.highContrast ? 'primary.dark' : themeColors.secondary 
            },
            '&:focus': {
              outline: accessibility.highContrast ? `2px solid ${muiTheme.palette.text.primary}` : 'none',
              outlineOffset: '2px'
            },
            '&:disabled': {
              bgcolor: accessibility.highContrast ? 'rgba(0, 0, 0, 0.26)' : undefined,
              color: accessibility.highContrast ? '#fff' : undefined
            }
          }}
          startIcon={
            captureLoading ? (
              <CircularProgress 
                size={24} 
                sx={{ 
                  color: accessibility.highContrast ? muiTheme.palette.background.paper : 'inherit' 
                }} 
              />
            ) : (
              <i 
                className="ri-camera-3-line" 
                style={{ 
                  color: accessibility.highContrast ? muiTheme.palette.background.paper : 'inherit',
                  fontSize: accessibility.largeText ? '1.3rem' : '1rem'
                }}
              ></i>
            )
          }
        >
          {captureLoading ? "Capturing..." : "Capture Live Photo"}
        </Button>
        
        {/* Screen reader helper text */}
        {accessibility.screenReaderOptimized && (
          <Typography className="sr-only">
            This button will trigger the camera on the selected device and capture a photo.
            Photos appear in the gallery below after they are captured.
          </Typography>
        )}
      </Paper>

      {/* Photo Gallery with accessibility enhancements */}
      <Box 
        id="photo-gallery"
        role="region"
        aria-label="Device camera photos"
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
            className="ri-gallery-line" 
            style={{ 
              color: accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary,
              fontSize: accessibility.largeText ? '1.8rem' : '1.5rem',
              marginRight: '12px'
            }}
          ></i>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              color: accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary,
              ...(accessibility.largeText && { fontSize: '1.4rem' })
            }}
          >
            Captured Photos
          </Typography>
        </Box>
        
        {capturedPhotos.length > 0 ? (
          <TableContainer 
            component={Paper} 
            sx={{ 
              mt: 2,
              borderRadius: 2,
              ...(accessibility.highContrast && {
                border: `2px solid ${muiTheme.palette.text.primary}`,
                boxShadow: 'none'
              })
            }}
          >
            <Table aria-label="Device captured photos table">
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: accessibility.highContrast ? 'transparent' : `${colors.primary}15`,
                  }}
                >
                  <TableCell 
                    sx={{ 
                      fontWeight: 700,
                      ...(accessibility.largeText && { fontSize: '1.1rem', padding: '12px 16px' }),
                      ...(accessibility.highContrast && { 
                        color: muiTheme.palette.text.primary,
                        borderBottom: `2px solid ${muiTheme.palette.text.primary}`
                      })
                    }}
                  >
                    Captured Image
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 700,
                      ...(accessibility.largeText && { fontSize: '1.1rem', padding: '12px 16px' }),
                      ...(accessibility.highContrast && { 
                        color: muiTheme.palette.text.primary,
                        borderBottom: `2px solid ${muiTheme.palette.text.primary}`
                      })
                    }}
                  >
                    Capture Time
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {capturedPhotos.map((photo) => (
                  <TableRow 
                    key={photo.id}
                    sx={{ 
                      '&:nth-of-type(odd)': { 
                        bgcolor: accessibility.highContrast ? 'transparent' : 'rgba(0, 0, 0, 0.03)' 
                      },
                      '&:hover': {
                        bgcolor: accessibility.highContrast ? 'transparent' : 'rgba(0, 0, 0, 0.06)'
                      },
                      ...(accessibility.highContrast && { 
                        borderBottom: `1px solid ${muiTheme.palette.text.primary}`
                      })
                    }}
                    tabIndex={0}
                    aria-label={`Photo captured at ${new Date(photo.timestamp).toLocaleString()}`}
                  >
                    <TableCell>
                      <Box
                        sx={{
                          position: 'relative',
                          width: accessibility.largeText ? '190px' : '150px',
                          height: accessibility.largeText ? '190px' : '150px',
                        }}
                      >
                        <img
                          src={photo.image_url}
                          alt={`Camera photo from ${new Date(photo.timestamp).toLocaleString()}`}
                          onLoad={() => handleImageLoad(photo.id)}
                          onError={(e) => {
                            handleImageError(photo.id, photo.image_url);
                            e.currentTarget.src = "/fallback-image.jpg";
                          }}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: accessibility.highContrast ? '0' : '5px',
                            border: accessibility.highContrast ? `2px solid ${muiTheme.palette.text.primary}` : 'none',
                            boxShadow: accessibility.highContrast ? 'none' : '0px 0px 8px rgba(0,0,0,0.2)',
                          }}
                          tabIndex={0}
                        />
                        {/* Screen reader only description */}
                        <span className="sr-only">
                          Photo captured on {new Date(photo.timestamp).toLocaleString()}
                        </span>
                      </Box>
                    </TableCell>
                    <TableCell
                      sx={{ 
                        ...(accessibility.largeText && { fontSize: '1.05rem', padding: '12px 16px' }),
                        ...(accessibility.highContrast && { color: muiTheme.palette.text.primary })
                      }}
                    >
                      {new Date(photo.timestamp).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Paper
            elevation={accessibility.highContrast ? 0 : 1}
            sx={{ 
              p: 3, 
              mt: 2, 
              textAlign: 'center',
              borderRadius: 2,
              ...(accessibility.highContrast && {
                border: `2px solid ${muiTheme.palette.text.primary}`,
              })
            }}
          >
            <Typography 
              sx={{ 
                color: accessibility.highContrast ? muiTheme.palette.text.primary : 'text.secondary',
                ...(accessibility.largeText && { fontSize: '1.2rem' })
              }}
              aria-live="polite"
            >
              {loading ? "Loading photos..." : "No captured photos available. Use the 'Capture Live Photo' button to take a new photo."}
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

export default LiveCamera;

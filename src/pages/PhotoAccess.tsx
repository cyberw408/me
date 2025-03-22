import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Select,
  MenuItem,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  LinearProgress,
  InputLabel,
  FormControl,
  SelectChangeEvent,
  useTheme as useMuiTheme,
  Chip,
  FormHelperText,
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

// ✅ Define Photo Entry Interface
interface PhotoEntry {
  id: string;
  photo_url: string;
  timestamp: string;
}

const PhotoAccess = () => {
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
  
  // ✅ Define states properly
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [announcement, setAnnouncement] = useState<string>("");
  const [photoLoadedStates, setPhotoLoadedStates] = useState<{[key: string]: boolean}>({});

  // ✅ Fetch Photos with accessibility and loading state
  const fetchPhotos = useCallback((deviceId: string) => {
    const token = localStorage.getItem("token");
    setLoading(true);
    
    // Announce loading state to screen readers
    setAnnouncement("Loading photos from device");

    if (!token) {
      setError("Unauthorized: Please log in again.");
      setAnnouncement("Authentication error. Please log in again.");
      window.location.href = "/login"; // Redirect to login page
      return;
    }

    axios
      .get<{ photo_access: PhotoEntry[] }>(`/api/tracker/device/photos/?device_id=${deviceId}`, {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        console.log("✅ Fetched photos:", response.data);
        if (response.data.photo_access && Array.isArray(response.data.photo_access)) {
          const photoData = response.data.photo_access;
          setPhotos(photoData);
          
          // Initialize photo loaded states
          const initialStates: {[key: string]: boolean} = {};
          photoData.forEach(photo => {
            initialStates[photo.id] = false;
          });
          setPhotoLoadedStates(initialStates);
          
          // Announce photo count for screen readers
          const photoCount = photoData.length;
          setAnnouncement(`Loaded ${photoCount} photo${photoCount !== 1 ? 's' : ''} from device.`);
        } else {
          setPhotos([]); // ✅ Ensure `photos` is always an array
          setAnnouncement("No photos found for this device.");
        }
        setError(null);
        setLoading(false);
      })
      .catch((error) => {
        console.error("❌ Error fetching photos:", error);
        if (error.response?.status === 401) {
          setError("Unauthorized: Invalid token. Please log in again.");
          setAnnouncement("Authentication error. Please log in again.");
          localStorage.removeItem("token");
          window.location.href = "/login"; // Redirect to login page
        } else {
          setError("Error fetching photos.");
          setAnnouncement("Error loading photos. Please try again later.");
        }
        setPhotos([]); // ✅ Prevents undefined state
        setLoading(false);
      });
  }, []);

  // ✅ Fetch Devices with accessibility support
  const fetchDevices = useCallback(() => {
    const token = localStorage.getItem("token");
    setLoading(true);
    setAnnouncement("Loading devices");

    if (!token) {
      setError("Unauthorized: Please log in.");
      setAnnouncement("Authentication error. Please log in.");
      window.location.href = "/login";
      return;
    }

    axios
      .get<{ devices: Device[] }>("/api/tracker/device-management/", {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        if (Array.isArray(response.data.devices)) {
          const deviceData = response.data.devices;
          setDevices(deviceData);
          
          // Announce device count for screen readers
          const deviceCount = deviceData.length;
          setAnnouncement(`Found ${deviceCount} device${deviceCount !== 1 ? 's' : ''}.`);
          
          if (deviceCount > 0) {
            const firstDeviceId = deviceData[0].device_id;
            setSelectedDevice(firstDeviceId);
            fetchPhotos(firstDeviceId);
          } else {
            setLoading(false);
            setAnnouncement("No devices found. Please add a device to monitor photos.");
          }
        } else {
          setError("Invalid response format.");
          setAnnouncement("Error in device data format.");
          setLoading(false);
        }
      })
      .catch((error) => {
        console.error("❌ Error fetching devices:", error);
        setError("Error fetching devices.");
        setAnnouncement("Failed to load devices. Please try again later.");
        setLoading(false);
      });
  }, [fetchPhotos]);

  // ✅ Fetch Devices on Mount
  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // ✅ Fetch Photos when selectedDevice changes
  useEffect(() => {
    if (selectedDevice) {
      fetchPhotos(selectedDevice);
    }
  }, [selectedDevice, fetchPhotos]);

  // Handle image load events for accessibility
  const handleImageLoad = (photoId: string) => {
    setPhotoLoadedStates(prev => ({
      ...prev,
      [photoId]: true
    }));
    
    // Check if this is the last image to load
    const allLoaded = Object.values(photoLoadedStates).every(state => state === true);
    if (allLoaded && photos.length > 0) {
      setAnnouncement(`All ${photos.length} photos have loaded successfully.`);
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
        Device Photo Access
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
          href="#photo-table" 
          style={{ color: '#fff', textDecoration: 'none' }}
          onClick={(e) => {
            e.preventDefault();
            const tableElement = document.getElementById('photo-table');
            if (tableElement) {
              tableElement.focus();
              tableElement.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        >
          Skip to photo list
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
              backgroundColor: accessibility.highContrast ? '#e0e0e0' : themeColors.input,
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

      {/* Device count summary */}
      {devices.length > 0 && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Chip 
            label={`${devices.length} device${devices.length !== 1 ? 's' : ''} found`}
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
            label={photos.length > 0 ? `${photos.length} photo${photos.length !== 1 ? 's' : ''} available` : "No photos"}
            size={accessibility.largeText ? "medium" : "small"}
            color={photos.length > 0 ? "success" : "default"}
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

      {/* ✅ Device Selector with accessibility enhancements */}
      <FormControl 
        fullWidth 
        sx={{ 
          mt: 2, 
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
          Select Device
        </InputLabel>
        <Select
          labelId="device-select-label"
          id="device-select"
          value={selectedDevice}
          onChange={(e: SelectChangeEvent) => {
            const deviceId = e.target.value;
            setSelectedDevice(deviceId);
            fetchPhotos(deviceId);
            
            // Find device name for better announcement
            const selectedDeviceName = devices.find(d => d.device_id === deviceId)?.device_name || deviceId;
            setAnnouncement(`Switching to device ${selectedDeviceName}`);
          }}
          label="Select Device"
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
          Choose a device to view its photos
        </FormHelperText>
      </FormControl>

      {/* ✅ Photo Table View with accessibility enhancements */}
      {photos.length > 0 ? (
        <TableContainer 
          component={Paper} 
          sx={{ 
            mt: 3,
            borderRadius: 2,
            ...(accessibility.highContrast && {
              border: `2px solid ${muiTheme.palette.text.primary}`,
              boxShadow: 'none'
            })
          }}
          id="photo-table"
          tabIndex={0}
          role="region"
          aria-label="Photo gallery"
        >
          <Table aria-label="Device photos table">
            <TableHead>
              <TableRow
                sx={{
                  backgroundColor: accessibility.highContrast ? 'transparent' : `${themeColors.primary}15`,
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
                  ID
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
                  Photo
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
                  Captured At
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {photos.map((photo) => (
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
                  aria-label={`Photo ${photo.id} taken at ${new Date(photo.timestamp).toLocaleString()}`}
                >
                  <TableCell
                    sx={{ 
                      ...(accessibility.largeText && { fontSize: '1.05rem', padding: '12px 16px' }),
                      ...(accessibility.highContrast && { color: muiTheme.palette.text.primary })
                    }}
                  >
                    {photo.id}
                  </TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        position: 'relative',
                        width: accessibility.largeText ? '130px' : '100px',
                        height: accessibility.largeText ? '130px' : '100px',
                      }}
                    >
                      <img
                        src={photo.photo_url}
                        alt={`Photo captured on ${new Date(photo.timestamp).toLocaleString()}`}
                        onLoad={() => handleImageLoad(photo.id)}
                        onError={(e) => {
                          handleImageError(photo.id, photo.photo_url);
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
                        Photo ID {photo.id} captured on {new Date(photo.timestamp).toLocaleString()}
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
            mt: 3, 
            textAlign: 'center',
            borderRadius: 2,
            backgroundColor: themeColors.card,
            borderColor: themeColors.border,
            borderWidth: '1px',
            borderStyle: 'solid',
            color: themeColors.textSecondary,
            ...(accessibility.highContrast && {
              border: `2px solid ${muiTheme.palette.text.primary}`,
              backgroundColor: 'transparent'
            })
          }}
        >
          <Typography 
            sx={{ 
              color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.textSecondary,
              ...(accessibility.largeText && { fontSize: '1.2rem' })
            }}
            aria-live="polite"
          >
            {loading ? "Loading photos..." : "No photos available for this device."}
          </Typography>
        </Paper>
      )}
      
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

export default PhotoAccess;

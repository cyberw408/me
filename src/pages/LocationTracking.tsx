import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  Box,
  Paper,
  FormControl,
  InputLabel,
  Chip,
  Divider,
  useTheme as useMuiTheme,
  SelectChangeEvent
} from "@mui/material";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { useTheme } from "../context/ThemeContext";
import { formatDateForScreenReader } from "../utils/accessibility";
import AccessibilityAnnouncement from "../components/AccessibilityAnnouncement";

// Add CSS styles for accessibility 
const styles = `
  /* Screen reader only class - visually hidden but available to screen readers */
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
  
  /* High contrast map styles */
  .high-contrast-map {
    filter: contrast(1.4) saturate(0.8);
  }
  
  .high-contrast-map .leaflet-tile {
    filter: grayscale(0.7) contrast(1.2);
  }
  
  .high-contrast-map .leaflet-marker-icon {
    filter: brightness(0.8) contrast(1.5);
    border: 3px solid black !important;
  }
`;

// Add styles to document
React.useEffect(() => {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
  
  return () => {
    document.head.removeChild(styleElement);
  };
}, []);

// ✅ Define Interfaces
interface LocationData {
  latitude: number;
  longitude: number;
  timestamp?: string;
}

interface Device {
  device_id: string;
  device_name: string;
}

// ✅ Define ThemeExtras interface for additional UI customization
interface ThemeExtras {
  card: string;
  border: string;
  input: string;
  headingSecondary: string;
  cardHeader: string;
  textSecondary: string;
}

// ✅ Fix Leaflet marker issue
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const LocationTracking = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [location, setLocation] = useState<LocationData | null>(null);
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
  const token = localStorage.getItem("token"); // ✅ Retrieve Auth Token

  // ✅ Fetch Devices
  const fetchDevices = useCallback(() => {
    if (!token) {
      setError("Unauthorized: Please log in.");
      return;
    }

    axios
      .get<{ devices: Device[] }>("/api/tracker/device-management/", {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        setDevices(response.data.devices);
        if (response.data.devices.length > 0) {
          setSelectedDevice(response.data.devices[0].device_id);
        } else {
          setError("No devices found.");
        }
      })
      .catch((err) => {
        console.error("❌ API Error (Fetching Devices):", err);
        setError("Error fetching devices.");
      });
  }, [token]);

  // ✅ Fetch Last Known Location
  const fetchLocation = useCallback((deviceId: string) => {
    if (!token) return;

    axios
      .get<{ latest_location: LocationData }>(
        `/api/tracker/location/?device_id=${deviceId}`,
        { headers: { Authorization: `Token ${token}` } }
      )
      .then((response) => {
        if (response.data.latest_location) {
          setLocation(response.data.latest_location);
          setError(null);
        } else {
          setError("No location data found.");
        }
      })
      .catch((err) => {
        console.error("❌ API Error (Fetching Location):", err);
        setError("Error fetching location. Ensure the device is online.");
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    if (selectedDevice) {
      fetchLocation(selectedDevice);
      const interval = setInterval(() => fetchLocation(selectedDevice), 5000); // Refresh every 5 sec
      return () => clearInterval(interval);
    }
  }, [selectedDevice, fetchLocation]);
  
  // Effect for screen reader announcements when location updates
  useEffect(() => {
    if (location && location.timestamp) {
      const deviceName = devices.find(d => d.device_id === selectedDevice)?.device_name || "Selected device";
      const formattedDate = formatDateForScreenReader(new Date(location.timestamp));
      setAnnouncement(`${deviceName} location updated. Position: latitude ${location.latitude.toFixed(4)}, longitude ${location.longitude.toFixed(4)}. Last updated ${formattedDate}`);
    }
  }, [location, selectedDevice, devices]);

  return (
    <Container>
      {/* Accessibility announcement for screen readers */}
      {announcement && <AccessibilityAnnouncement message={announcement} />}
      {/* Header with gradient text styling */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ 
          fontWeight: '700', 
          mb: 1,
          background: themeColors.gradient,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Location Tracking
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track and monitor the real-time location of your devices
        </Typography>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            '& .MuiAlert-icon': { alignItems: 'center' }
          }}
        >
          {error}
        </Alert>
      )}

      {/* Device selector with improved styling */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          border: `1px solid ${themeColors.border}`,
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          bgcolor: themeColors.card
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <i className="ri-smartphone-line" style={{ color: themeColors.primary, fontSize: '1.5rem', marginRight: '10px' }}></i>
          <Typography variant="h6" sx={{ fontWeight: 600, color: themeColors.cardHeader }}>
            Select Device
          </Typography>
        </Box>
        
        <FormControl fullWidth variant="outlined">
          <InputLabel id="device-select-label">Device</InputLabel>
          <Select
            labelId="device-select-label"
            id="device-select"
            value={selectedDevice}
            onChange={(e: SelectChangeEvent) => {
              setSelectedDevice(e.target.value);
              // Announce device selection to screen readers
              const selectedDeviceName = devices.find(d => d.device_id === e.target.value)?.device_name || "Unknown device";
              setAnnouncement(`Selected device: ${selectedDeviceName}`);
            }}
            label="Device"
            aria-label="Select a device to track"
            sx={{ 
              borderRadius: 1.5,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: `${themeColors.primary}40`,
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: themeColors.primary,
              },
              ...(accessibility.highContrast && {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: muiTheme.palette.text.primary,
                  borderWidth: 2,
                },
                color: muiTheme.palette.text.primary,
              })
            }}
          >
            {devices.length > 0 ? (
              devices.map((device) => (
                <MenuItem key={device.device_id} value={device.device_id}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <i className="ri-smartphone-line" style={{ marginRight: '8px', color: themeColors.primary }}></i>
                    {device.device_name} <Typography variant="caption" sx={{ ml: 1, color: themeColors.textSecondary }}>ID: {device.device_id}</Typography>
                  </Box>
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>No devices found</MenuItem>
            )}
          </Select>
        </FormControl>
      </Paper>

      {loading ? (
        <Box 
          sx={{ display: 'flex', justifyContent: 'center', my: 4 }} 
          role="status" 
          aria-live="polite"
          aria-label="Loading location data"
        >
          <CircularProgress 
            sx={{ 
              color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary,
              ...(accessibility.highContrast && { size: 48 })
            }} 
          />
          {/* Text for screen readers */}
          <span className="sr-only">Loading location data, please wait</span>
        </Box>
      ) : location ? (
        <Paper 
          elevation={0} 
          sx={{ 
            borderRadius: 2,
            overflow: 'hidden',
            border: `1px solid ${themeColors.border}`,
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            bgcolor: themeColors.card
          }}
        >
          {/* Location data section */}
          <Box sx={{ p: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: '1 1 200px' }}>
              <Typography variant="subtitle2" color={themeColors.textSecondary} gutterBottom>
                Latitude
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'medium', color: themeColors.primary }}>
                {location.latitude}
              </Typography>
            </Box>
            
            <Box sx={{ flex: '1 1 200px' }}>
              <Typography variant="subtitle2" color={themeColors.textSecondary} gutterBottom>
                Longitude
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 'medium', color: themeColors.primary }}>
                {location.longitude}
              </Typography>
            </Box>
            
            <Box sx={{ flex: '1 1 200px' }}>
              <Typography variant="subtitle2" color={themeColors.textSecondary} gutterBottom>
                Last Updated
              </Typography>
              <Chip 
                label={location.timestamp ? new Date(location.timestamp).toLocaleString() : "Unknown"} 
                size="small"
                sx={{ 
                  backgroundColor: `${themeColors.primary}15`,
                  color: themeColors.primary,
                  fontWeight: 500
                }}
                icon={<i className="ri-time-line" style={{ fontSize: '1rem' }}></i>}
              />
            </Box>
          </Box>
          
          <Divider />
          
          {/* Map container with accessibility improvements */}
          <Box sx={{ p: 0 }}>
            {/* Screen reader accessible description of the map */}
            <div className="sr-only" aria-live="polite">
              {`Map showing device location at latitude ${location.latitude.toFixed(6)} and longitude ${location.longitude.toFixed(6)}.`}
              {location.timestamp && ` Last updated on ${new Date(location.timestamp).toLocaleString()}.`}
            </div>
            
            <MapContainer
              center={[location.latitude, location.longitude]}
              zoom={15}
              style={{ height: "500px", width: "100%" }}
              aria-label="Map showing device location"
              // High-contrast mode settings
              className={accessibility.highContrast ? "high-contrast-map" : ""}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker 
                position={[location.latitude, location.longitude]}
                // Add extra attributes for better accessibility
                eventHandlers={{
                  click: () => {
                    setAnnouncement(`Marker clicked. Device located at latitude ${location.latitude.toFixed(4)}, longitude ${location.longitude.toFixed(4)}.`);
                  }
                }}
              >
                <Popup>
                  <strong>Device Location</strong><br />
                  <span style={{ 
                    color: themeColors.primary, 
                    fontWeight: 'bold',
                    ...(accessibility.highContrast && { color: '#000000', fontWeight: 'bolder' })
                  }}>
                    Lat: {location.latitude.toFixed(6)}, Lng: {location.longitude.toFixed(6)}
                  </span>
                  <br />
                  Last updated: {location.timestamp ? new Date(location.timestamp).toLocaleString() : "Unknown"}
                </Popup>
              </Marker>
            </MapContainer>
          </Box>
        </Paper>
      ) : (
        <Paper 
          elevation={0} 
          sx={{ 
            p: 4, 
            borderRadius: 2, 
            textAlign: 'center',
            border: accessibility.highContrast ? '2px solid' : `1px solid ${themeColors.border}`,
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            bgcolor: accessibility.highContrast ? 'transparent' : `${themeColors.accent}05`
          }}
          role="alert"
          aria-live="polite"
        >
          <Box sx={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            bgcolor: accessibility.highContrast ? 'transparent' : `${themeColors.accent}15`, 
            color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.accent,
            borderRadius: '50%',
            width: 60,
            height: 60,
            mb: 2,
            ...(accessibility.highContrast && {
              border: '2px solid',
              borderColor: muiTheme.palette.text.primary
            })
          }}>
            <i className="ri-map-pin-line" style={{ fontSize: '1.75rem' }}></i>
          </Box>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 1,
              fontWeight: 'bold',
              color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.headingSecondary
            }}
          >
            No location data available
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.textSecondary,
              fontSize: accessibility.largeText ? '1.1rem' : 'inherit',
            }}
          >
            Location data will appear here once your devices start reporting their position.
          </Typography>
        </Paper>
      )}
    </Container>
  );
};

export default LocationTracking;

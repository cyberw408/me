import React, { useEffect, useState, useCallback, useRef } from "react";
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
  Divider,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  SelectChangeEvent,
  useTheme as useMuiTheme,
  LinearProgress,
} from "@mui/material";
import { MapContainer, TileLayer, Popup, Circle, useMapEvents, Marker } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "../context/ThemeContext";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
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
  mapControls: string;
  mapBorder: string;
}

// ✅ Define Interfaces for Devices & Geofences
interface Device {
  device_id: string;
  device_name: string;
  latitude?: number;
  longitude?: number;
}

interface Geofence {
  id: string;
  latitude: number;
  longitude: number;
  radius: number;
}

// ✅ Fix Leaflet marker issue
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const Geofencing = () => {
  const [fences, setFences] = useState<Geofence[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [mapCenter, setMapCenter] = useState<LatLngExpression>([37.7749, -122.4194]); // Default location
  const [newGeofenceRadius, setNewGeofenceRadius] = useState<number>(500);
  const [selectedDeviceLocation, setSelectedDeviceLocation] = useState<{lat: number, lng: number} | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [announcement, setAnnouncement] = useState<string>("");
  
  const { colors, accessibility } = useTheme(); // Get theme colors and accessibility settings
  const muiTheme = useMuiTheme(); // Material UI theme for high contrast mode
  
  // Create combined theme colors for consistent styling
  const themeColors = {
    ...colors,
    card: '#ffffff',
    border: '#e0e0e0',
    input: '#f5f5f5',
    headingSecondary: '#424242',
    cardHeader: '#f8f8f8',
    textSecondary: '#757575',
    accent: colors.secondary || '#4caf50',
    mapControls: '#ffffff',
    mapBorder: colors.primary + '40' // 40% opacity of primary color
  };
  
  // Reference to slider for keyboard focus management
  const radiusSliderRef = useRef<HTMLInputElement>(null);

  // ✅ Fetch Geofences (Memoized)
  const fetchGeofences = useCallback((deviceId: string) => {
    const token = localStorage.getItem("token");
    setLoading(true);
    
    if (!token) {
      setError("Unauthorized: Please log in.");
      window.location.href = "/login";
      return;
    }

    // Announce loading state to screen readers
    setAnnouncement("Loading geofence data for selected device");

    axios
      .get<{ geofencing: Geofence[] }>(`/api/tracker/geofencing/?device_id=${deviceId}`, {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        console.log("✅ Fetched geofences:", response.data); // ✅ Debugging API response
        if (Array.isArray(response.data.geofencing)) {
          setFences(response.data.geofencing);
          // Announce result to screen readers
          const fenceCount = response.data.geofencing.length;
          setAnnouncement(`Loaded ${fenceCount} geofence${fenceCount !== 1 ? 's' : ''} for the selected device`);
        } else {
          setFences([]); // ✅ Prevent undefined errors
          setAnnouncement("No geofences found for this device");
        }
        setError("");
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ API Error (Fetching Geofences):", err);
        setError("Error fetching geofencing data.");
        setFences([]); // ✅ Prevents undefined state
        setAnnouncement("Error loading geofence data. Please try again.");
        setLoading(false);
      });
  }, []);

  // ✅ Fetch Devices (Memoized)
  const fetchDevices = useCallback(() => {
    const token = localStorage.getItem("token");
    setLoading(true);
    setAnnouncement("Loading available devices");

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
        console.log("✅ Fetched devices:", response.data); // ✅ Debugging API response
        if (Array.isArray(response.data.devices)) {
          setDevices(response.data.devices);
          
          if (response.data.devices.length > 0) {
            const firstDevice = response.data.devices[0];
            setSelectedDevice(firstDevice.device_id);
            fetchGeofences(firstDevice.device_id);

            // ✅ Update mapCenter if latitude & longitude exist
            if (firstDevice.latitude && firstDevice.longitude) {
              setMapCenter([firstDevice.latitude, firstDevice.longitude]);
            }
            
            // Announce the loaded devices
            setAnnouncement(`Loaded ${response.data.devices.length} devices. Selected ${firstDevice.device_name}.`);
          } else {
            setLoading(false);
            setAnnouncement("No devices found. Please add a device to use geofencing features.");
          }
        } else {
          setError("Invalid API response format.");
          setAnnouncement("Error: Received invalid data format from server.");
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("❌ API Error (Fetching Devices):", err);
        setError("Error fetching devices.");
        setAnnouncement("Failed to load devices. Please check your connection and try again.");
        setLoading(false);
      });
  }, [fetchGeofences]); // ✅ Memoized function to prevent infinite loops

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    if (selectedDevice) fetchGeofences(selectedDevice);
  }, [selectedDevice, fetchGeofences]);

  const handleAddGeofence = (lat: number, lng: number) => {
    if (!selectedDevice) {
      setError("Please select a device first.");
      setAnnouncement("Error: Please select a device before creating a geofence.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Unauthorized: Please log in.");
      setAnnouncement("Error: You are not authorized. Please log in again.");
      window.location.href = "/login";
      return;
    }

    // Update the temporary preview location
    setSelectedDeviceLocation({ lat, lng });
    
    // Announce to screen readers
    setAnnouncement(`Creating new geofence at location: ${lat.toFixed(4)}, ${lng.toFixed(4)} with radius ${newGeofenceRadius} meters`);
    setLoading(true);

    axios
      .post(
        "/api/tracker/geofencing/",
        {
          device_id: selectedDevice,
          latitude: lat,
          longitude: lng,
          radius: newGeofenceRadius, // Using the state value
        },
        {
          headers: { Authorization: `Token ${token}` },
        }
      )
      .then(() => {
        console.log(`✅ Geofence added at lat: ${lat}, lng: ${lng} with radius ${newGeofenceRadius}m`);
        setAnnouncement(`Geofence successfully created with radius of ${newGeofenceRadius} meters. Refreshing geofence list.`);
        fetchGeofences(selectedDevice);
        // Reset the preview
        setSelectedDeviceLocation(null);
      })
      .catch((error) => {
        console.error("❌ Error adding geofence:", error);
        setError("Failed to add geofence.");
        setAnnouncement("Error: Failed to create geofence. Please try again.");
        setLoading(false);
        // Reset the preview on error too
        setSelectedDeviceLocation(null);
      });
  };

  return (
    <Container>
      {/* Accessibility announcement for screen readers */}
      {announcement && <AccessibilityAnnouncement message={announcement} />}
      
      {/* Header with gradient text styling */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            mb: 1,
            ...(accessibility.highContrast ? {
              color: muiTheme.palette.text.primary,
              fontWeight: 800
            } : {
              background: colors.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 700
            }),
            ...(accessibility.largeText && {
              fontSize: '2.5rem'
            })
          }}
        >
          Geofencing & Alerts
        </Typography>
        <Typography 
          variant="body1" 
          color={accessibility.highContrast ? "text.primary" : "text.secondary"}
          sx={{
            ...(accessibility.largeText && {
              fontSize: '1.1rem'
            })
          }}
        >
          Create and manage virtual boundaries for location monitoring
        </Typography>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3, 
            borderRadius: 2,
            '& .MuiAlert-icon': { alignItems: 'center' },
            ...(accessibility.highContrast && {
              borderWidth: 2,
              borderColor: 'error.main',
              backgroundColor: 'rgba(211, 47, 47, 0.1)',
              color: muiTheme.palette.text.primary,
              fontWeight: 'bold'
            })
          }}
          role="alert"
        >
          {error}
        </Alert>
      )}
      
      {/* Loading indicator */}
      {loading && (
        <Box 
          sx={{ width: '100%', mb: 3 }}
          role="status"
          aria-live="polite"
          aria-label="Loading geofencing data"
        >
          <LinearProgress 
            sx={{ 
              height: accessibility.largeText ? 8 : 6, 
              borderRadius: 3,
              backgroundColor: accessibility.highContrast ? `${muiTheme.palette.text.primary}20` : `${themeColors.primary}20`,
              '& .MuiLinearProgress-bar': {
                backgroundColor: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary
              }
            }} 
          />
          <Typography 
            variant="caption" 
            sx={{ 
              mt: 1, 
              display: 'block',
              color: accessibility.highContrast ? muiTheme.palette.text.primary : 'text.secondary',
              ...(accessibility.largeText && { fontSize: '0.9rem' })
            }}
          >
            Loading...
          </Typography>
        </Box>
      )}

      {/* Device selector with improved styling */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          border: accessibility.highContrast ? `2px solid ${muiTheme.palette.text.primary}` : `1px solid ${themeColors.border}`,
          boxShadow: accessibility.highContrast ? 'none' : '0 2px 10px rgba(0,0,0,0.05)',
          backgroundColor: accessibility.highContrast ? 'transparent' : themeColors.card
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <i className="ri-smartphone-line" style={{ 
            color: accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary, 
            fontSize: accessibility.largeText ? '1.8rem' : '1.5rem', 
            marginRight: '10px' 
          }}></i>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600,
              color: accessibility.highContrast ? muiTheme.palette.text.primary : 'inherit',
              ...(accessibility.largeText && { fontSize: '1.4rem' })
            }}
          >
            Select Device
          </Typography>
        </Box>
        
        <FormControl fullWidth variant="outlined">
          <InputLabel 
            id="device-select-label"
            sx={{
              ...(accessibility.largeText && { fontSize: '1.1rem' }),
              ...(accessibility.highContrast && { color: muiTheme.palette.text.primary, fontWeight: 'bold' })
            }}
          >
            Device
          </InputLabel>
          <Select
            labelId="device-select-label"
            id="device-select"
            value={selectedDevice}
            onChange={(e: SelectChangeEvent) => {
              const deviceId = e.target.value as string;
              setSelectedDevice(deviceId);
              fetchGeofences(deviceId);
              const selectedDeviceInfo = devices.find((device) => device.device_id === deviceId);

              // Update mapCenter if the device has latitude & longitude
              if (selectedDeviceInfo?.latitude && selectedDeviceInfo?.longitude) {
                setMapCenter([selectedDeviceInfo.latitude, selectedDeviceInfo.longitude]);
              }
              
              // Announce the selected device for screen readers
              if (selectedDeviceInfo) {
                setAnnouncement(`Selected device: ${selectedDeviceInfo.device_name}. Loading geofence data.`);
              }
            }}
            label="Device"
            aria-label="Select a device to view geofence data"
            sx={{ 
              borderRadius: 1.5,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: accessibility.highContrast ? muiTheme.palette.text.primary : `${colors.primary}40`,
                borderWidth: accessibility.highContrast ? 2 : 1,
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary,
              },
              ...(accessibility.largeText && {
                fontSize: '1.1rem'
              }),
              ...(accessibility.highContrast && {
                color: muiTheme.palette.text.primary,
              })
            }}
          >
            {devices.length > 0 ? (
              devices.map((device: Device) => (
                <MenuItem 
                  key={device.device_id} 
                  value={device.device_id}
                  sx={{
                    ...(accessibility.largeText && { fontSize: '1.1rem', py: 1.5 })
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <i className="ri-smartphone-line" style={{ 
                      marginRight: '8px', 
                      color: accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary 
                    }}></i>
                    {device.device_name} 
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        ml: 1, 
                        color: accessibility.highContrast ? 'text.primary' : 'text.secondary',
                        ...(accessibility.largeText && { fontSize: '0.9rem' })
                      }}
                    >
                      ID: {device.device_id}
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>No devices found</MenuItem>
            )}
          </Select>
        </FormControl>
      </Paper>

      {/* Geofence settings */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2, 
          border: accessibility.highContrast ? `2px solid ${muiTheme.palette.text.primary}` : `1px solid ${themeColors.border}`,
          boxShadow: accessibility.highContrast ? 'none' : '0 2px 10px rgba(0,0,0,0.05)',
          backgroundColor: accessibility.highContrast ? 'transparent' : themeColors.card
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <i className="ri-map-pin-range-line" style={{ 
            color: accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary, 
            fontSize: accessibility.largeText ? '1.8rem' : '1.5rem', 
            marginRight: '10px' 
          }}></i>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600,
              color: accessibility.highContrast ? muiTheme.palette.text.primary : 'inherit',
              ...(accessibility.largeText && { fontSize: '1.4rem' })
            }}
          >
            Geofence Settings
          </Typography>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography 
            variant="body2" 
            color={accessibility.highContrast ? "text.primary" : "text.secondary"} 
            gutterBottom
            sx={{
              fontWeight: accessibility.highContrast ? 'bold' : 'regular',
              ...(accessibility.largeText && { fontSize: '1.1rem' }),
              mb: 1
            }}
          >
            Set the radius for new geofences (in meters)
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <input
                ref={radiusSliderRef}
                type="range"
                min="100"
                max="5000"
                step="100"
                value={newGeofenceRadius}
                onChange={(e) => {
                  const newRadius = Number(e.target.value);
                  setNewGeofenceRadius(newRadius);
                  // Announce the change for screen readers
                  if (accessibility.screenReaderOptimized) {
                    setAnnouncement(`Geofence radius set to ${newRadius} meters`);
                  }
                }}
                style={{ 
                  width: '100%', 
                  accentColor: accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary,
                  height: accessibility.largeText ? '24px' : '16px'
                }}
                aria-label="Geofence radius in meters"
                aria-valuemin={100}
                aria-valuemax={5000}
                aria-valuenow={newGeofenceRadius}
              />
            </Box>
            <Box sx={{ 
              minWidth: '80px',
              padding: '8px 16px',
              borderRadius: '4px',
              backgroundColor: accessibility.highContrast ? 'transparent' : `${colors.primary}15`,
              color: accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary,
              fontWeight: 'bold',
              textAlign: 'center',
              border: accessibility.highContrast ? `2px solid ${muiTheme.palette.text.primary}` : 'none',
              ...(accessibility.largeText && { fontSize: '1.1rem' })
            }}
            role="status"
            aria-live="polite"
            >
              {newGeofenceRadius}m
            </Box>
          </Box>
        </Box>

        <Divider 
          sx={{ 
            my: 2,
            borderColor: accessibility.highContrast ? muiTheme.palette.text.primary : 'inherit',
            borderWidth: accessibility.highContrast ? '2px' : '1px'
          }} 
        />
        
        <Box role="region" aria-label="Map instructions">
          <Typography 
            variant="body2" 
            color={accessibility.highContrast ? "text.primary" : "text.secondary"} 
            gutterBottom
            sx={{
              fontWeight: accessibility.highContrast ? 'bold' : 'regular',
              ...(accessibility.largeText && { fontSize: '1.1rem' })
            }}
          >
            Click on the map to create a new geofence boundary
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <i className="ri-information-line" style={{ 
              color: accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary, 
              marginRight: '8px' 
            }}></i>
            <Typography 
              variant="caption"
              sx={{
                color: accessibility.highContrast ? muiTheme.palette.text.primary : 'inherit',
                ...(accessibility.largeText && { fontSize: '0.9rem' })
              }}
            >
              Each click will create a new geofence with the selected radius
            </Typography>
          </Box>
          
          {/* Additional screen reader instructions */}
          {accessibility.screenReaderOptimized && (
            <span className="sr-only">
              Use the Enter key to confirm creating a geofence at the location shown on the map. 
              The map can be navigated using the arrow keys once it has focus.
            </span>
          )}
        </Box>
      </Paper>

      {/* Map container with styled Paper */}
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 2,
          overflow: 'hidden',
          border: accessibility.highContrast ? `2px solid ${muiTheme.palette.text.primary}` : `1px solid ${themeColors.mapBorder}`,
          boxShadow: accessibility.highContrast ? 'none' : '0 2px 10px rgba(0,0,0,0.05)'
        }}
        role="region"
        aria-label="Interactive map for creating and viewing geofences"
      >
        {/* Screen reader only heading */}
        {accessibility.screenReaderOptimized && (
          <Typography className="sr-only" variant="h6">
            Map with geofence boundaries. Click on the map to create a new geofence.
          </Typography>
        )}
        
        <Box sx={{ p: 0 }}>
          <MapContainer 
            center={mapCenter} 
            zoom={12} 
            style={{ height: accessibility.largeText ? "600px" : "500px", width: "100%" }}
            attributionControl={true}
          >
            <TileLayer 
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
              attribution="&copy; OpenStreetMap contributors" 
            />
            
            {/* Render device location if available */}
            {selectedDeviceLocation && (
              <Marker 
                position={[selectedDeviceLocation.lat, selectedDeviceLocation.lng]}
                eventHandlers={{
                  click: () => {
                    if (accessibility.screenReaderOptimized) {
                      setAnnouncement(`Selected location at latitude ${selectedDeviceLocation.lat.toFixed(4)} and longitude ${selectedDeviceLocation.lng.toFixed(4)}`);
                    }
                  }
                }}
              >
                <Popup>
                  <Typography 
                    variant="body2"
                    sx={{
                      fontWeight: accessibility.highContrast ? 'bold' : 'normal',
                      ...(accessibility.largeText && { fontSize: '1rem' })
                    }}
                  >
                    <strong>New geofence location</strong>
                    <br />
                    Coordinates: {selectedDeviceLocation.lat.toFixed(4)}, {selectedDeviceLocation.lng.toFixed(4)}
                    <br />
                    Radius: {newGeofenceRadius} meters
                    <br />
                    Click to confirm creation
                  </Typography>
                </Popup>
              </Marker>
            )}

            {/* Render existing geofences */}
            {fences.length > 0 ? (
              fences.map((fence: Geofence) => (
                <Circle
                  key={fence.id}
                  center={[fence.latitude, fence.longitude] as LatLngExpression}
                  radius={fence.radius}
                  color={accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary}
                  fillColor={accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary}
                  fillOpacity={accessibility.highContrast ? 0.3 : 0.2}
                  weight={accessibility.highContrast ? 3 : 2}
                  eventHandlers={{
                    click: () => {
                      if (accessibility.screenReaderOptimized) {
                        setAnnouncement(
                          `Geofence with ID ${fence.id} selected. Located at coordinates: ${fence.latitude.toFixed(4)}, ${fence.longitude.toFixed(4)}. Radius: ${fence.radius} meters.`
                        );
                      }
                    }
                  }}
                >
                  <Popup>
                    <Box sx={{ p: 1 }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          color: accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary, 
                          fontWeight: 600, 
                          mb: 1,
                          ...(accessibility.largeText && { fontSize: '1rem' })
                        }}
                      >
                        Geofence Details
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: accessibility.highContrast ? muiTheme.palette.text.primary : 'text.secondary',
                              ...(accessibility.largeText && { fontSize: '0.9rem' })
                            }}
                          >
                            ID:
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontWeight: 500,
                              color: accessibility.highContrast ? muiTheme.palette.text.primary : 'inherit',
                              ...(accessibility.largeText && { fontSize: '0.9rem' })
                            }}
                          >
                            {fence.id}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: accessibility.highContrast ? muiTheme.palette.text.primary : 'text.secondary',
                              ...(accessibility.largeText && { fontSize: '0.9rem' })
                            }}
                          >
                            Latitude:
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontWeight: 500,
                              color: accessibility.highContrast ? muiTheme.palette.text.primary : 'inherit',
                              ...(accessibility.largeText && { fontSize: '0.9rem' })
                            }}
                          >
                            {fence.latitude.toFixed(4)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: accessibility.highContrast ? muiTheme.palette.text.primary : 'text.secondary',
                              ...(accessibility.largeText && { fontSize: '0.9rem' })
                            }}
                          >
                            Longitude:
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontWeight: 500,
                              color: accessibility.highContrast ? muiTheme.palette.text.primary : 'inherit',
                              ...(accessibility.largeText && { fontSize: '0.9rem' })
                            }}
                          >
                            {fence.longitude.toFixed(4)}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: accessibility.highContrast ? muiTheme.palette.text.primary : 'text.secondary',
                              ...(accessibility.largeText && { fontSize: '0.9rem' })
                            }}
                          >
                            Radius:
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontWeight: 500,
                              color: accessibility.highContrast ? muiTheme.palette.text.primary : 'inherit',
                              ...(accessibility.largeText && { fontSize: '0.9rem' })
                            }}
                          >
                            {fence.radius}m
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Popup>
                </Circle>
              ))
            ) : (
              <Box 
                sx={{ 
                  position: 'absolute', 
                  top: '50%', 
                  left: '50%', 
                  transform: 'translate(-50%, -50%)' 
                }}
                role="alert"
                aria-live="polite"
              >
                <Paper 
                  elevation={3} 
                  sx={{ 
                    p: 2, 
                    bgcolor: accessibility.highContrast ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.9)', 
                    maxWidth: '280px', 
                    textAlign: 'center',
                    border: accessibility.highContrast ? `2px solid ${muiTheme.palette.text.primary}` : 'none'
                  }}
                >
                  <i 
                    className="ri-map-pin-add-line" 
                    style={{ 
                      fontSize: accessibility.largeText ? '2.5rem' : '2rem', 
                      color: accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary, 
                      marginBottom: '8px' 
                    }}
                  ></i>
                  <Typography 
                    variant="body2"
                    sx={{
                      color: accessibility.highContrast ? muiTheme.palette.text.primary : 'inherit',
                      fontWeight: accessibility.highContrast ? 'bold' : 'regular',
                      ...(accessibility.largeText && { fontSize: '1rem' })
                    }}
                  >
                    No geofences available. Click on the map to create one.
                  </Typography>
                </Paper>
              </Box>
            )}

            <MapClickHandler onMapClick={(lat, lng) => handleAddGeofence(lat, lng)} />
          </MapContainer>
        </Box>
      </Paper>
      
      {/* Geofence list summary */}
      {fences.length > 0 && (
        <Paper 
          elevation={0}
          sx={{ 
            mt: 3, 
            p: 3, 
            borderRadius: 2,
            border: accessibility.highContrast ? `2px solid ${muiTheme.palette.text.primary}` : '1px solid #eee',
            boxShadow: accessibility.highContrast ? 'none' : '0 2px 10px rgba(0,0,0,0.05)',
            backgroundColor: accessibility.highContrast ? 'transparent' : 'background.paper'
          }}
          role="region"
          aria-label="Geofence summary information"
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <i 
              className="ri-history-line" 
              style={{ 
                color: accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary, 
                fontSize: accessibility.largeText ? '1.8rem' : '1.5rem', 
                marginRight: '10px' 
              }}
            ></i>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                color: accessibility.highContrast ? muiTheme.palette.text.primary : 'inherit',
                ...(accessibility.largeText && { fontSize: '1.4rem' })
              }}
            >
              Geofence Summary
            </Typography>
          </Box>
          
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              flexWrap: 'wrap', 
              gap: 1.5 
            }}
          >
            <Chip 
              label={`${fences.length} active geofence${fences.length !== 1 ? 's' : ''}`}
              size={accessibility.largeText ? "medium" : "small"}
              sx={{ 
                bgcolor: accessibility.highContrast ? 'transparent' : `${colors.primary}15`,
                color: accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary,
                fontWeight: 500,
                px: 1,
                border: accessibility.highContrast ? `2px solid ${muiTheme.palette.text.primary}` : 'none',
                ...(accessibility.largeText && { fontSize: '1rem' })
              }}
              icon={
                <i 
                  className="ri-map-pin-fill" 
                  style={{ 
                    color: accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary 
                  }}
                ></i>
              }
            />
            
            <Chip 
              label="Click to edit boundary"
              variant={accessibility.highContrast ? "filled" : "outlined"}
              size={accessibility.largeText ? "medium" : "small"}
              sx={{ 
                color: accessibility.highContrast ? muiTheme.palette.text.primary : 'text.secondary',
                borderColor: accessibility.highContrast ? muiTheme.palette.text.primary : 'inherit',
                borderWidth: accessibility.highContrast ? 2 : 1,
                bgcolor: accessibility.highContrast ? 'rgba(0,0,0,0.05)' : 'transparent',
                ...(accessibility.largeText && { fontSize: '1rem' })
              }}
              icon={
                <i 
                  className="ri-edit-line"
                  style={{ 
                    color: accessibility.highContrast ? muiTheme.palette.text.primary : 'inherit'
                  }}
                ></i>
              }
            />
            
            <Box sx={{ flexGrow: 1 }} />
            
            <Button
              variant="contained"
              sx={{ 
                bgcolor: accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary,
                color: accessibility.highContrast ? muiTheme.palette.background.paper : 'white',
                '&:hover': { 
                  bgcolor: accessibility.highContrast ? 'primary.dark' : colors.secondary 
                },
                fontWeight: accessibility.highContrast ? 'bold' : 'medium',
                ...(accessibility.largeText && { 
                  fontSize: '1rem',
                  padding: '10px 16px'
                })
              }}
              startIcon={
                <i 
                  className="ri-refresh-line"
                  style={{
                    color: accessibility.highContrast ? muiTheme.palette.background.paper : 'inherit'
                  }}
                ></i>
              }
              onClick={() => {
                fetchGeofences(selectedDevice);
                setAnnouncement("Refreshing geofence data...");
              }}
              aria-label="Refresh geofence data"
            >
              Refresh
            </Button>
            
            {/* Screen reader only summary */}
            {accessibility.screenReaderOptimized && (
              <span className="sr-only">
                The device has {fences.length} active geofence{fences.length !== 1 ? 's' : ''}. 
                You can click on each geofence on the map to view its details.
              </span>
            )}
          </Box>
        </Paper>
      )}
    </Container>
  );
};

// ✅ Component to handle map clicks and create geofences with accessibility support
const MapClickHandler = ({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) => {
  const { accessibility } = useTheme();
  
  // Get map events including click, zoom, and other interactions
  const mapEvents = useMapEvents({
    click: (e) => {
      // Process click event and pass to parent handler
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
    // Add keyboard handlers for accessibility
    keypress: (e) => {
      // If Enter key is pressed while a marker is focused, simulate a click
      if (e.originalEvent.key === 'Enter') {
        console.log('Enter key pressed on map');
        // The map location is already handled by Leaflet's focus system
      }
    },
    // Announce zoom changes for screen readers
    zoomend: () => {
      if (accessibility.screenReaderOptimized) {
        const zoom = mapEvents.getZoom();
        // This announcement would be handled by the parent component
        // setAnnouncement(`Map zoom level changed to ${zoom}`);
      }
    }
  });

  // This component doesn't render anything visible
  return null;
};

export default Geofencing;

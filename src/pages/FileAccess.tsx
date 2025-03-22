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
  Card,
  CardContent,
  Divider,
  FormControl,
  InputLabel,
  Button,
  LinearProgress,
  Chip,
  Tooltip,
  SelectChangeEvent,
  useTheme as useMuiTheme,
} from "@mui/material";
import { useTheme } from "../context/ThemeContext";
import AccessibilityAnnouncement from "../components/AccessibilityAnnouncement";
import 'remixicon/fonts/remixicon.css';

// ✅ Define Device Interface
interface Device {
  device_id: string;
  device_name: string;
}

// ✅ Define File Data Interface (Updated fields)
interface FileData {
  id: number;
  file_name: string;
  file_url: string;
  timestamp: string;
}

// Define theme extras interface for additional custom UI colors
interface ThemeExtras {
  card: string;
  border: string;
  input: string;
  headingSecondary: string;
  cardHeader: string;
  textSecondary: string;
}

const FileAccess = () => {
  // ✅ Define states properly
  const [files, setFiles] = useState<FileData[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [announcement, setAnnouncement] = useState<string>("");

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
  
  const token = localStorage.getItem("token");

  // ✅ Fetch Files (Memoized)
  const fetchFiles = useCallback(
    (deviceId: string) => {
      if (!token) {
        setError("Unauthorized: Please log in again.");
        window.location.href = "/login"; // Redirect to login page
        return;
      }
      
      setLoading(true);
      
      // Update accessibility announcement for screen readers
      const deviceName = devices.find(d => d.device_id === deviceId)?.device_name || "selected device";
      setAnnouncement(`Loading files for ${deviceName}...`);

      axios
        .get(`/api/tracker/device/files/?device_id=${deviceId}`, {
          headers: { Authorization: `Token ${token}` }, // ✅ Ensure token is included
        })
        .then((response) => {
          console.log("✅ Fetched files:", response.data);

          // ✅ Ensure correct state mapping
          if (response.data.file_access && Array.isArray(response.data.file_access)) {
            setFiles(response.data.file_access);
            setAnnouncement(`Loaded ${response.data.file_access.length} files for ${deviceName}.`);
          } else {
            setFiles([]); // ✅ Ensure files is always an array
            setAnnouncement(`No files found for ${deviceName}.`);
          }
          setError(null);
          setLoading(false);
        })
        .catch((error) => {
          console.error("❌ Error fetching files:", error);
          if (error.response?.status === 401) {
            setError("Unauthorized: Invalid token. Please log in again.");
            localStorage.removeItem("token");
            window.location.href = "/login"; // ✅ Redirect to login page
          } else {
            setError("Error fetching files.");
          }
          setFiles([]); // ✅ Prevent undefined state
          setAnnouncement(`Error loading files. Please try again.`);
          setLoading(false);
        });
    },
    [token, devices]
  );

  // ✅ Fetch Devices (Memoized)
  const fetchDevices = useCallback(() => {
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
            fetchFiles(firstDeviceId);
          }
        } else {
          setError("Invalid response format.");
        }
      })
      .catch(() => setError("Error fetching devices."));
  }, [token, fetchFiles]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    if (selectedDevice) fetchFiles(selectedDevice);
  }, [selectedDevice, fetchFiles]);

  return (
    <Container>
      {/* Accessibility announcement for screen readers */}
      {announcement && <AccessibilityAnnouncement message={announcement} />}
      
      {/* Header with gradient styling */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ 
          fontWeight: '700',
          mb: 1,
          background: themeColors.gradient,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: accessibility.largeText ? '2.2rem' : '2rem',
        }}>
          Device File Access
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{
            fontSize: accessibility.largeText ? '1.1rem' : '1rem',
            lineHeight: 1.5
          }}
        >
          View and download files from monitored devices
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
              border: '2px solid',
              borderColor: muiTheme.palette.error.main,
              fontWeight: 'bold'
            })
          }}
        >
          {error}
        </Alert>
      )}

      {/* Device Selector with improved styling */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          border: `1px solid ${themeColors.border}`,
          backgroundColor: themeColors.card,
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          ...(accessibility.highContrast && {
            border: `2px solid ${themeColors.border}`,
            boxShadow: 'none'
          })
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <i className="ri-smartphone-line" style={{ 
            color: themeColors.cardHeader, 
            fontSize: '1.5rem', 
            marginRight: '10px' 
          }}></i>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 600,
              fontSize: accessibility.largeText ? '1.3rem' : '1.125rem'
            }}
          >
            Select Device
          </Typography>
        </Box>
        
        <FormControl fullWidth variant="outlined">
          <InputLabel 
            id="device-select-label"
            sx={{
              fontSize: accessibility.largeText ? '1.1rem' : 'inherit'
            }}
          >
            Device
          </InputLabel>
          <Select
            labelId="device-select-label"
            id="device-select"
            value={selectedDevice}
            onChange={(e: SelectChangeEvent) => {
              const deviceId = e.target.value;
              setSelectedDevice(deviceId);
              fetchFiles(deviceId);
              // Announce device selection to screen readers
              const selectedDeviceName = devices.find(d => d.device_id === deviceId)?.device_name || "Unknown device";
              setAnnouncement(`Selected device: ${selectedDeviceName}. Loading files.`);
            }}
            label="Device"
            aria-label="Select a device to view files"
            sx={{ 
              borderRadius: 1.5,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: `${themeColors.input}40`,
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: themeColors.input,
              },
              ...(accessibility.highContrast && {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: themeColors.input,
                  borderWidth: 2,
                },
              }),
              ...(accessibility.largeText && {
                fontSize: '1.1rem'
              })
            }}
          >
            {devices.length > 0 ? (
              devices.map((device: Device) => (
                <MenuItem 
                  key={device.device_id} 
                  value={device.device_id}
                  sx={{
                    fontSize: accessibility.largeText ? '1.1rem' : 'inherit'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <i className="ri-smartphone-line" style={{ marginRight: '8px', color: themeColors.primary }}></i>
                    {device.device_name} <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary', fontSize: accessibility.largeText ? '0.9rem' : 'inherit' }}>ID: {device.device_id}</Typography>
                  </Box>
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>No devices found</MenuItem>
            )}
          </Select>
        </FormControl>
      </Paper>

      {/* Files List */}
      <Card 
        elevation={0}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          border: `1px solid ${themeColors.border}`,
          backgroundColor: themeColors.card,
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          ...(accessibility.highContrast && {
            border: `2px solid ${themeColors.border}`,
            boxShadow: 'none'
          })
        }}
      >
        <CardContent sx={{ px: 0, pt: 0, pb: 0 }}>
          <Box 
            sx={{ 
              p: 2, 
              borderBottom: `1px solid ${themeColors.border}`,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <i className="ri-file-list-line" style={{ color: themeColors.cardHeader, fontSize: '1.3rem' }}></i>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                fontSize: accessibility.largeText ? '1.3rem' : '1.125rem'
              }}
            >
              Files
            </Typography>
          </Box>
          
          {/* Accessibility announcement for screen readers */}
          {announcement && <AccessibilityAnnouncement message={announcement} />}
          
          {loading ? (
            <Box 
              sx={{ p: 4, textAlign: 'center' }}
              role="status"
              aria-live="polite"
              aria-label="Loading files"
            >
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <div className="spinner" style={{ 
                  width: accessibility.largeText ? '50px' : '40px', 
                  height: accessibility.largeText ? '50px' : '40px', 
                  border: `3px solid ${accessibility.highContrast ? muiTheme.palette.text.primary + '40' : themeColors.primary + '20'}`,
                  borderTop: `3px solid ${accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary}`,
                  borderRadius: '50%',
                  animation: accessibility.reduceMotion ? 'none' : 'spin 1s linear infinite'
                }}></div>
                <style>
                  {`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}
                </style>
              </Box>
              <Typography 
                variant="body1" 
                sx={{
                  color: accessibility.highContrast ? muiTheme.palette.text.primary : 'text.secondary',
                  fontSize: accessibility.largeText ? '1.1rem' : 'inherit'
                }}
              >
                Loading files...
              </Typography>
              {/* Hidden text for screen readers with more details */}
              <span className="sr-only">
                Please wait while we fetch the files for the selected device.
              </span>
            </Box>
          ) : files.length > 0 ? (
            <TableContainer>
              <Table 
                aria-label="Device files"
                sx={{
                  ...(accessibility.highContrast && {
                    border: '2px solid',
                    borderColor: muiTheme.palette.text.primary,
                    borderTop: 'none',
                  })
                }}
              >
                <TableHead>
                  <TableRow sx={{ 
                    backgroundColor: accessibility.highContrast ? muiTheme.palette.background.default : `${themeColors.primary}10`,
                  }}>
                    <TableCell sx={{ 
                      fontWeight: 'bold',
                      fontSize: accessibility.largeText ? '1.1rem' : 'inherit',
                      color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <i className="ri-file-line"></i>
                        File Name
                      </Box>
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold',
                      fontSize: accessibility.largeText ? '1.1rem' : 'inherit',
                      color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <i className="ri-download-2-line"></i>
                        Download
                      </Box>
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold',
                      fontSize: accessibility.largeText ? '1.1rem' : 'inherit', 
                      color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <i className="ri-time-line"></i>
                        Uploaded Time
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {files.map((file) => (
                    <TableRow 
                      key={file.id}
                      sx={{ 
                        '&:nth-of-type(odd)': {
                          backgroundColor: accessibility.highContrast ? 'transparent' : `${themeColors.background}50`,
                        },
                        '&:hover': {
                          backgroundColor: accessibility.highContrast ? `${muiTheme.palette.text.primary}20` : `${themeColors.primary}10`,
                        },
                        ...(accessibility.largeText && {
                          '& .MuiTableCell-root': {
                            padding: '16px',
                            fontSize: '1.1rem'
                          }
                        })
                      }}
                    >
                      <TableCell>
                        <Tooltip title={file.file_name}>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            maxWidth: '300px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            <i className="ri-file-text-line" style={{ color: themeColors.primary }}></i>
                            {file.file_name}
                          </Box>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outlined"
                          color="primary"
                          component="a"
                          href={file.file_url}
                          download
                          startIcon={<i className="ri-download-2-line"></i>}
                          aria-label={`Download ${file.file_name}`}
                          sx={{
                            textTransform: 'none',
                            borderRadius: 1.5,
                            ...(accessibility.highContrast && {
                              border: '2px solid',
                              borderColor: muiTheme.palette.text.primary,
                              color: muiTheme.palette.text.primary,
                              fontWeight: 'bold'
                            }),
                            ...(accessibility.largeText && {
                              fontSize: '1rem',
                              padding: '8px 16px'
                            })
                          }}
                        >
                          Download
                        </Button>
                      </TableCell>
                      <TableCell>
                        {new Date(file.timestamp).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box 
              sx={{ 
                p: 4, 
                textAlign: 'center',
                color: accessibility.highContrast ? muiTheme.palette.text.primary : 'text.secondary'
              }}
            >
              <i className="ri-inbox-line" style={{ fontSize: '3rem', opacity: 0.5, marginBottom: '16px' }}></i>
              <Typography 
                sx={{ 
                  fontSize: accessibility.largeText ? '1.2rem' : '1rem',
                  mt: 2 
                }}
              >
                No files available for this device.
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  mt: 1,
                  fontSize: accessibility.largeText ? '1rem' : '0.875rem',
                  maxWidth: '400px',
                  mx: 'auto'
                }}
              >
                When files are uploaded from the monitored device, they will appear here for download.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default FileAccess;

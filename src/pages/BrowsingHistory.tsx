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
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Divider,
  Button,
  useTheme as useMuiTheme,
  SelectChangeEvent
} from "@mui/material";
import { useTheme } from "../context/ThemeContext";
import { formatDateForScreenReader } from "../utils/accessibility";
import AccessibilityAnnouncement from "../components/AccessibilityAnnouncement";
import AccessibleTable from "../components/AccessibleTable";
import AccessibleLink from "../components/AccessibleLink";

const BrowsingHistory = () => {
  // ✅ Define Device Interface
  interface Device {
    device_id: string;
    device_name: string;
  }

  // ✅ Define Browsing History Entry Interface
  interface BrowsingHistoryEntry {
    id: string;
    url: string;
    timestamp: string;
    title?: string;
  }

  // ✅ Define states properly
  const [history, setHistory] = useState<BrowsingHistoryEntry[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [announcement, setAnnouncement] = useState<string>("");
  
  // Define ThemeExtras interface for consistent theming
  interface ThemeExtras {
    card: string;
    border: string;
    input: string;
    headingSecondary: string;
    cardHeader: string;
    textSecondary: string;
  }

  // Access theme contexts
  const { colors, accessibility } = useTheme();
  const muiTheme = useMuiTheme();
  
  // Create combined theme colors for consistent styling
  const themeColors = {
    ...colors,
    card: '#ffffff',
    border: '#e0e0e0',
    input: '#f5f5f5',
    headingSecondary: '#424242',
    cardHeader: '#f5f5f5',
    textSecondary: '#757575'
  };
  
  // Filter history based on search query
  const filteredHistory = history.filter(
    (entry) => 
      entry.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      entry.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ✅ Fetch Browsing History
const fetchHistory = useCallback((deviceId: string) => {
  const token = localStorage.getItem("token");

  if (!token) {
    setError("Unauthorized: Please log in again.");
    return;
  }
  
  setLoading(true);

  axios
    .get(`/api/tracker/browsing-history/?device_id=${deviceId}`, {
      headers: { Authorization: `Token ${token}` },
    })
    .then((response) => {
      console.log("✅ Fetched Browsing History:", response.data); // ✅ Debugging API response
      if (response.data.browsing_history && Array.isArray(response.data.browsing_history)) {
        setHistory([...response.data.browsing_history]); // ✅ Ensure React detects state change
      } else {
        setHistory([]);
      }
      setError(null);
    })
    .catch((error) => {
      console.error("❌ Error fetching browsing history:", error);
      setError("Error fetching browsing history.");
      setHistory([]);
    })
    .finally(() => {
      setLoading(false);
    });
}, []);


  // ✅ Fetch Devices
const fetchDevices = useCallback(() => {
  const token = localStorage.getItem("token");

  if (!token) {
    setError("Unauthorized: Please log in.");
    window.location.href = "/login";
    return;
  }

  axios
    .get<{ devices: Device[] }>("/api/tracker/device-management/", {
      headers: {
        Authorization: `Token ${token}`,
      },
    })
    .then((response) => {
      if (Array.isArray(response.data.devices)) {
        setDevices(response.data.devices);
        if (response.data.devices.length > 0) {
          const firstDeviceId = response.data.devices[0].device_id;
          setSelectedDevice(firstDeviceId);
          fetchHistory(firstDeviceId);
        }
      } else {
        setError("Invalid response format.");
      }
    })
    .catch((err) => {
      console.error("❌ API Error:", err);
      if (err.response?.status === 401) {
        setError("Unauthorized: Please log in again.");
        localStorage.removeItem("token");
        window.location.href = "/login"; // Redirect to login page
      } else {
        setError("Error fetching devices.");
      }
    });
}, [fetchHistory]);



useEffect(() => {
  const token = localStorage.getItem("token");

  if (!token) {
    setError("Unauthorized: Please log in.");
    window.location.href = "/login";
    return;
  }

  fetchDevices();
}, [fetchDevices]);

// Effect for screen reader announcements when history updates
useEffect(() => {
  if (!loading && history.length > 0) {
    const deviceName = devices.find(d => d.device_id === selectedDevice)?.device_name || "Selected device";
    setAnnouncement(`Loaded ${history.length} browsing history records for ${deviceName}`);
  }
}, [history, loading, selectedDevice, devices]);

// Effect for screen reader announcements when search is applied
useEffect(() => {
  if (searchQuery && !loading) {
    setAnnouncement(`Search results: ${filteredHistory.length} records match "${searchQuery}"`);
  }
}, [searchQuery, filteredHistory.length, loading]);


  // Helper function to get domain from URL
  const extractDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return domain;
    } catch (e) {
      return url;
    }
  };

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
          Browsing History
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor and track web activity across monitored devices
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
          border: '1px solid #eee',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <i className="ri-smartphone-line" style={{ color: themeColors.primary, fontSize: '1.5rem', marginRight: '10px' }}></i>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
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
              const deviceId = e.target.value;
              setSelectedDevice(deviceId);
              fetchHistory(deviceId);
              // Announce device selection to screen readers
              const selectedDeviceName = devices.find(d => d.device_id === deviceId)?.device_name || "Unknown device";
              setAnnouncement(`Selected device: ${selectedDeviceName}. Loading browsing history.`);
            }}
            label="Device"
            aria-label="Select a device to view browsing history"
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
              devices.map((device: Device) => (
                <MenuItem key={device.device_id} value={device.device_id}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <i className="ri-smartphone-line" style={{ marginRight: '8px', color: themeColors.primary }}></i>
                    {device.device_name} <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>ID: {device.device_id}</Typography>
                  </Box>
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>No devices found</MenuItem>
            )}
          </Select>
        </FormControl>
      </Paper>

      {/* Search and filter controls */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          border: '1px solid #eee',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            <i className="ri-search-line" style={{ marginRight: '8px', color: themeColors.primary }}></i>
            Search & Filter
          </Typography>
          
          <Box>
            <Chip 
              label={`${history.length} records found`}
              size="small"
              sx={{ 
                bgcolor: `${themeColors.primary}15`,
                color: themeColors.primary,
                fontWeight: 500
              }}
            />
          </Box>
        </Box>
        
        <TextField
          fullWidth
          id="search-browsing-history"
          placeholder="Search by website title or URL..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="outlined"
          size="small"
          aria-label="Search browsing history"
          sx={{ mt: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <i className="ri-search-line" style={{ color: themeColors.primary }}></i>
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton 
                  size="small" 
                  onClick={() => {
                    setSearchQuery('');
                    setAnnouncement('Search cleared');
                  }}
                  aria-label="Clear search field"
                  sx={{ color: 'text.secondary' }}
                >
                  <i className="ri-close-line"></i>
                </IconButton>
              </InputAdornment>
            ),
            sx: { 
              borderRadius: 1.5,
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: themeColors.primary,
              },
              ...(accessibility.highContrast && {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: muiTheme.palette.text.primary,
                  borderWidth: 2,
                },
                color: muiTheme.palette.text.primary,
              }),
              ...(accessibility.largeText && {
                fontSize: '1.1rem',
              })
            }
          }}
        />
      </Paper>

      {/* Browsing History Table */}
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid #eee',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}
      >
        {loading ? (
          <Box 
            sx={{ p: 4, textAlign: 'center' }}
            role="status"
            aria-live="polite"
            aria-label="Loading browsing history"
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
              Loading browsing history...
            </Typography>
            {/* Hidden text for screen readers with more details */}
            <span className="sr-only">
              Please wait while we load the browsing history for the selected device.
            </span>
          </Box>
        ) : filteredHistory.length > 0 ? (
          <TableContainer sx={{ maxHeight: '600px' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ backgroundColor: `${themeColors.primary}05` }}>
                  <TableCell width="30%" sx={{ fontWeight: 600 }}>
                    Website Title
                  </TableCell>
                  <TableCell width="45%" sx={{ fontWeight: 600 }}>
                    URL
                  </TableCell>
                  <TableCell width="25%" sx={{ fontWeight: 600 }}>
                    Visited On
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredHistory.map((entry) => (
                  <TableRow 
                    key={entry.id}
                    sx={{ '&:hover': { backgroundColor: `${themeColors.primary}05` } }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ 
                          width: 30, 
                          height: 30, 
                          borderRadius: '4px',
                          backgroundColor: `${themeColors.primary}15`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '10px',
                        }}>
                          <i className="ri-global-line" style={{ color: themeColors.primary }}></i>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
                          {entry.title ? entry.title : "Untitled"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={entry.url} placement="top">
                        <Box>
                          <AccessibleLink
                            href={entry.url}
                            isExternal={true}
                            ariaLabel={`Visit ${entry.title || 'website'}: ${entry.url}`}
                            sx={{ 
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '100%'
                            }}
                          >
                            {entry.url}
                          </AccessibleLink>
                          <Typography variant="caption" color="text.secondary">
                            {extractDomain(entry.url)}
                          </Typography>
                        </Box>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <i className="ri-time-line" style={{ color: themeColors.primary, marginRight: '6px', fontSize: '0.9rem' }}></i>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(entry.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box 
            sx={{ p: 4, textAlign: 'center' }}
            role="status"
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
              <i className="ri-history-line" style={{ fontSize: '1.75rem' }}></i>
            </Box>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 1,
                fontWeight: 'bold',
                color: accessibility.highContrast ? muiTheme.palette.text.primary : 'inherit',
                fontSize: accessibility.largeText ? '1.5rem' : 'inherit'
              }}
            >
              {searchQuery ? 'No matching results found' : 'No browsing history available'}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: accessibility.highContrast ? muiTheme.palette.text.primary : 'text.secondary',
                fontSize: accessibility.largeText ? '1.1rem' : 'inherit',
              }}
            >
              {searchQuery 
                ? `Try adjusting your search to find what you're looking for.`
                : `Browsing history will appear here once available from the device.`
              }
            </Typography>
            {searchQuery && (
              <Button 
                variant="outlined" 
                size="small" 
                sx={{ 
                  mt: 2, 
                  color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary, 
                  borderColor: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary,
                  borderWidth: accessibility.highContrast ? 2 : 1,
                  ...(accessibility.largeText && {
                    fontSize: '1rem',
                    padding: '6px 16px'
                  })
                }}
                onClick={() => {
                  setSearchQuery('');
                  setAnnouncement('Search cleared. Showing all browsing history records.');
                }}
                aria-label="Clear search and show all records"
              >
                Clear Search
              </Button>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default BrowsingHistory;

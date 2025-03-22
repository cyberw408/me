import React, { useEffect, useState, useCallback, useRef } from "react";
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
  ButtonGroup,
  CircularProgress,
  LinearProgress,
  Grid,
  SelectChangeEvent,
  useTheme as useMuiTheme
} from "@mui/material";
import { useTheme } from "../context/ThemeContext";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import AccessibilityAnnouncement from "../components/AccessibilityAnnouncement";
import { createChartScreenReaderText, formatDurationForScreenReader } from "../utils/accessibility";

const AppUsage = () => {
  // ✅ Define Device Interface
  interface Device {
    device_id: string;
    device_name: string;
  }

  // ✅ Define App Usage Data Interface
  interface AppUsageData {
    id: string;
    app_name: string;
    usage_time: number;
    timestamp?: string | null;
  }

  // ✅ Define states properly
  const [appUsage, setAppUsage] = useState<AppUsageData[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [chartView, setChartView] = useState<'pie' | 'bar'>('pie');
  
  // Get theme colors and accessibility settings
  const { colors, accessibility } = useTheme();
  const muiTheme = useMuiTheme();
  
  // Define theme extras for additional UI customization
  interface ThemeExtras {
    card: string;
    border: string;
    input: string;
    headingSecondary: string;
    cardHeader: string;
    textSecondary: string;
    text: string;
  }
  
  const themeExtras: ThemeExtras = {
    card: accessibility.highContrast ? muiTheme.palette.background.paper : colors.surface,
    border: accessibility.highContrast ? muiTheme.palette.text.primary : `${colors.primary}20`,
    input: accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary,
    headingSecondary: accessibility.highContrast ? muiTheme.palette.text.primary : colors.secondary,
    cardHeader: accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary,
    textSecondary: accessibility.highContrast ? muiTheme.palette.text.secondary : colors.text,
    text: accessibility.highContrast ? muiTheme.palette.text.primary : colors.text
  };
  
  // Combine colors with theme extras for a complete theme object
  const themeColors = { ...colors, ...themeExtras };
  
  // State for screen reader announcements
  const [announcement, setAnnouncement] = useState<string>("");
  
  // Ref for chart element to enhance accessibility
  const chartRef = useRef<HTMLDivElement>(null);
  
  // ✅ Get authentication token
  const token = localStorage.getItem("token");
  
  // Filter app usage data based on search query
  const filteredAppUsage = appUsage.filter(app => 
    app.app_name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Calculate total usage time
  const totalUsageTime = appUsage.reduce((total, app) => total + app.usage_time, 0);
  
  // Process data for charts
  const chartData = appUsage
    .sort((a, b) => b.usage_time - a.usage_time)
    .slice(0, 10)
    .map(app => ({
      name: app.app_name.length > 15 ? `${app.app_name.substring(0, 15)}...` : app.app_name,
      fullName: app.app_name,
      value: app.usage_time,
      percentage: Math.round((app.usage_time / totalUsageTime) * 100),
      minutes: Math.round(app.usage_time / 60),
    }));

  // ✅ Fetch App Usage
const fetchAppUsage = useCallback((deviceId: string) => {
  const token = localStorage.getItem("token");

  if (!token) {
    setError("Unauthorized: Please log in again.");
    return;
  }
  
  setLoading(true);

  axios
    .get<{ app_usage: AppUsageData[] }>(`/api/tracker/app-usage/?device_id=${deviceId}`, {
      headers: { Authorization: `Token ${token}` },
    })
    .then((response) => {
      console.log("✅ Fetched App Usage:", response.data); // ✅ Debugging API response
      if (response.data.app_usage && Array.isArray(response.data.app_usage)) {
        setAppUsage(
          response.data.app_usage.map((entry: AppUsageData) => ({
            ...entry,
            last_used: entry.timestamp ? new Date(entry.timestamp).toISOString() : null, // ✅ Ensure proper timestamp format
          }))
        );
      } else {
        setAppUsage([]);
      }
      setError(null);
    })
    .catch((error) => {
      console.error("❌ Error fetching app usage:", error);
      setError("Error fetching app usage.");
      setAppUsage([]);
    })
    .finally(() => {
      setLoading(false);
    });
}, []);

  // ✅ Fetch Devices
  const fetchDevices = useCallback(() => {
    if (!token) {
      setError("Authentication token is missing.");
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
            setSelectedDevice(response.data.devices[0].device_id);
            fetchAppUsage(response.data.devices[0].device_id);
          }
        } else {
          setError("Invalid response format.");
        }
      })
      .catch(() => setError("Error fetching devices."));
  }, [token, fetchAppUsage]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);
  
  // Effect to announce chart data when the view changes
  useEffect(() => {
    if (chartData.length > 0) {
      // Create a summary of the top 3 apps for screen readers
      const topApps = chartData.slice(0, 3);
      const summary = topApps.map(app => 
        `${app.fullName}: ${formatTime(app.minutes)} (${app.percentage}%)`
      ).join(', ');
      
      setAnnouncement(`Chart showing top applications by usage time. Most used: ${summary}`);
    }
  }, [chartView, chartData]);

  // Helper function to format minutes in a human-readable way
  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours} hr${hours > 1 ? 's' : ''} ${mins > 0 ? `${mins} min` : ''}`;
    }
  };

  // Generate colors for charts based on theme
  const COLORS = [
    colors.primary,
    colors.secondary,
    colors.accent,
    `${colors.primary}CC`,
    `${colors.secondary}CC`,
    `${colors.accent}CC`,
    `${colors.primary}99`,
    `${colors.secondary}99`,
    `${colors.accent}99`,
    `${colors.primary}77`,
  ];

  return (
    <Container>
      {/* Header with gradient text styling */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ 
          fontWeight: '700', 
          mb: 1,
          background: colors.gradient,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          App Usage Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor application activity and usage patterns across monitored devices
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
          bgcolor: themeColors.card,
          border: `1px solid ${themeColors.border}`,
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <i className="ri-smartphone-line" style={{ color: colors.primary, fontSize: '1.5rem', marginRight: '10px' }}></i>
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
              fetchAppUsage(deviceId);
              // Announce device selection to screen readers
              const selectedDeviceName = devices.find(d => d.device_id === deviceId)?.device_name || "Unknown device";
              setAnnouncement(`Selected device: ${selectedDeviceName}. Loading app usage data.`);
            }}
            label="Device"
            aria-label="Select a device to view app usage data"
            sx={{ 
              borderRadius: 1.5,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: `${colors.primary}40`,
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: colors.primary,
              },
              ...(accessibility.highContrast && {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: muiTheme.palette.text.primary,
                  borderWidth: 2,
                },
                color: muiTheme.palette.text.primary,
              }),
              ...(accessibility.largeText && {
                fontSize: '1.1rem'
              })
            }}
          >
            {devices.length > 0 ? (
              devices.map((device) => (
                <MenuItem key={device.device_id} value={device.device_id}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <i className="ri-smartphone-line" style={{ marginRight: '8px', color: colors.primary }}></i>
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

      {/* Accessibility announcement for screen readers */}
      {announcement && <AccessibilityAnnouncement message={announcement} />}
      
      {/* Loading state */}
      {loading && (
        <Box 
          sx={{ width: '100%', mb: 3 }}
          role="status"
          aria-live="polite"
          aria-label="Loading app usage data"
        >
          <LinearProgress 
            sx={{ 
              height: accessibility.largeText ? 8 : 6, 
              borderRadius: 3,
              backgroundColor: accessibility.highContrast ? `${muiTheme.palette.text.primary}20` : `${colors.primary}20`,
              '& .MuiLinearProgress-bar': {
                backgroundColor: accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary
              }
            }} 
          />
          {/* Hidden text for screen readers */}
          <span className="sr-only">
            Loading application usage data for the selected device. Please wait.
          </span>
        </Box>
      )}

      {/* App Usage Analytics Dashboard */}
      {!loading && appUsage.length > 0 ? (
        <>
          {/* Search and filter controls */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              mb: 3, 
              borderRadius: 2,
              bgcolor: themeColors.card,
              border: `1px solid ${themeColors.border}`,
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                <i className="ri-search-line" style={{ marginRight: '8px', color: colors.primary }}></i>
                Search & Filter
              </Typography>
              
              <Box>
                <Chip 
                  label={`${appUsage.length} applications found`}
                  size="small"
                  sx={{ 
                    bgcolor: `${colors.primary}15`,
                    color: colors.primary,
                    fontWeight: 500
                  }}
                />
              </Box>
            </Box>
            
            <TextField
              fullWidth
              id="app-search"
              aria-label="Search applications by name"
              placeholder="Search by application name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value) {
                  setAnnouncement(`Searching for applications containing: ${e.target.value}`);
                }
              }}
              variant="outlined"
              size="small"
              sx={{ mt: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <i className="ri-search-line" style={{ 
                      color: accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary 
                    }}></i>
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton 
                      size="small" 
                      onClick={() => {
                        setSearchQuery('');
                        setAnnouncement("Search cleared. Showing all applications.");
                      }}
                      aria-label="Clear search"
                      sx={{ color: accessibility.highContrast ? muiTheme.palette.text.primary : 'text.secondary' }}
                    >
                      <i className="ri-close-line"></i>
                    </IconButton>
                  </InputAdornment>
                ),
                sx: { 
                  borderRadius: 1.5,
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary,
                  },
                  ...(accessibility.highContrast && {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: muiTheme.palette.text.primary,
                      borderWidth: 2,
                    }
                  }),
                  ...(accessibility.largeText && {
                    fontSize: '1.1rem'
                  })
                }
              }}
            />
          </Paper>

          {/* Summary Stats */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              <i className="ri-bar-chart-line" style={{ marginRight: '8px', color: colors.primary }}></i>
              Usage Summary
            </Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    border: `1px solid ${themeColors.border}`,
                    backgroundColor: `${themeColors.primary}08`,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    <i className="ri-apps-line" style={{ marginRight: '6px', color: colors.primary }}></i>
                    Total Apps
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: colors.primary }}>
                    {appUsage.length}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    border: `1px solid ${themeColors.border}`,
                    backgroundColor: `${themeColors.secondary}08`,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    <i className="ri-time-line" style={{ marginRight: '6px', color: colors.secondary }}></i>
                    Total Usage Time
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: colors.secondary }}>
                    {formatTime(Math.round(totalUsageTime / 60))}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    border: `1px solid ${themeColors.border}`,
                    backgroundColor: `${themeColors.accent}08`,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    <i className="ri-star-line" style={{ marginRight: '6px', color: colors.accent }}></i>
                    Most Used App
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: colors.accent }}>
                    {appUsage.length > 0 ? appUsage.sort((a, b) => b.usage_time - a.usage_time)[0].app_name : 'N/A'}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    border: `1px solid ${themeColors.border}`,
                    backgroundColor: themeColors.card,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center'
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                    <i className="ri-smartphone-line" style={{ marginRight: '6px', color: 'text.secondary' }}></i>
                    Selected Device
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {devices.find(d => d.device_id === selectedDevice)?.device_name || 'Unknown'}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>

          {/* Visualization Controls and Charts */}
          {chartData.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 4,
                borderRadius: 2,
                bgcolor: themeColors.card,
                border: `1px solid ${themeColors.border}`,
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  <i className="ri-pie-chart-line" style={{ marginRight: '8px', color: colors.primary }}></i>
                  Top 10 Most Used Applications
                </Typography>
                
                <Box>
                  <ButtonGroup variant="outlined" size="small" aria-label="chart view toggle">
                    <Button 
                      onClick={() => {
                        setChartView('pie');
                        setAnnouncement("Chart view changed to pie chart");
                      }} 
                      variant={chartView === 'pie' ? 'contained' : 'outlined'}
                      aria-pressed={chartView === 'pie'}
                      aria-label="Show pie chart"
                      sx={{ 
                        color: chartView === 'pie' ? 'white' : accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary,
                        borderColor: accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary,
                        backgroundColor: chartView === 'pie' ? 
                          (accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary) : 'transparent',
                        '&:hover': {
                          backgroundColor: chartView === 'pie' ? 
                            (accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary) : 
                            accessibility.highContrast ? 'rgba(0, 0, 0, 0.1)' : `${colors.primary}20`,
                        },
                        ...(accessibility.largeText && { fontSize: '1.05rem' })
                      }}
                    >
                      <i className="ri-pie-chart-line" style={{ marginRight: '4px' }}></i>
                      Pie
                    </Button>
                    <Button 
                      onClick={() => {
                        setChartView('bar');
                        setAnnouncement("Chart view changed to bar chart");
                      }} 
                      variant={chartView === 'bar' ? 'contained' : 'outlined'}
                      aria-pressed={chartView === 'bar'}
                      aria-label="Show bar chart"
                      sx={{ 
                        color: chartView === 'bar' ? 'white' : accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary,
                        borderColor: accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary,
                        backgroundColor: chartView === 'bar' ? 
                          (accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary) : 'transparent',
                        '&:hover': {
                          backgroundColor: chartView === 'bar' ? 
                            (accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary) : 
                            accessibility.highContrast ? 'rgba(0, 0, 0, 0.1)' : `${colors.primary}20`,
                        },
                        ...(accessibility.largeText && { fontSize: '1.05rem' })
                      }}
                    >
                      <i className="ri-bar-chart-horizontal-line" style={{ marginRight: '4px' }}></i>
                      Bar
                    </Button>
                  </ButtonGroup>
                </Box>
              </Box>
              
              <Divider sx={{ mb: 3 }} />
              
              {/* Screen reader optimized chart description */}
              {accessibility.screenReaderOptimized && (
                <div className="sr-only" role="region" aria-live="polite">
                  {createChartScreenReaderText(
                    chartView === 'pie' ? 'pie' : 'bar', 
                    'Top 10 Most Used Applications', 
                    `This chart shows the distribution of app usage time. ${
                      chartData.slice(0, 3).map(entry => 
                        `${entry.fullName}: ${formatTime(entry.minutes)} (${entry.percentage}%)`
                      ).join('. ')
                    }${chartData.length > 3 ? ', and other applications.' : '.'}`
                  )}
                </div>
              )}
              
              {/* Screen reader optimized chart description - hidden */}
              <div className="sr-only">
                Chart showing top applications by usage time.
              </div>

              <Box 
                sx={{ height: 400, width: '100%' }}
                ref={chartRef}
                tabIndex={0}
                role="img"
                aria-label={`${chartView === 'pie' ? 'Pie' : 'Bar'} chart showing top 10 most used applications`}
              >
                {chartView === 'pie' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={150}
                        fill={accessibility.highContrast ? muiTheme.palette.text.primary : colors.primary}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={accessibility.highContrast ? 
                              // Use higher contrast colors for accessibility
                              index % 2 === 0 ? muiTheme.palette.text.primary : `${muiTheme.palette.text.primary}99` : 
                              COLORS[index % COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value: number, name: string, props: any) => [
                          `${formatTime(Math.round(value / 60))} (${props.payload.percentage}%)`, 
                          props.payload.fullName
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis 
                        type="number" 
                        tick={{ 
                          fill: accessibility.highContrast ? muiTheme.palette.text.primary : undefined,
                          fontSize: accessibility.largeText ? 14 : undefined
                        }}
                      />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        width={150}
                        tick={{ 
                          fill: accessibility.highContrast ? muiTheme.palette.text.primary : undefined,
                          fontSize: accessibility.largeText ? 14 : undefined
                        }}
                      />
                      <RechartsTooltip 
                        formatter={(value: number, name: string, props: any) => [
                          `${formatTime(Math.round(value / 60))} (${props.payload.percentage}%)`, 
                          props.payload.fullName
                        ]}
                      />
                      <Bar dataKey="value" name="Usage Time">
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={accessibility.highContrast ? 
                              // Use higher contrast colors for accessibility
                              index % 2 === 0 ? muiTheme.palette.text.primary : `${muiTheme.palette.text.primary}99` : 
                              COLORS[index % COLORS.length]} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
              
              <Box sx={{ mt: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {chartData.map((entry, index) => (
                  <Chip
                    key={index}
                    label={`${entry.fullName}: ${formatTime(entry.minutes)}`}
                    sx={{
                      backgroundColor: `${COLORS[index % COLORS.length]}20`,
                      color: COLORS[index % COLORS.length],
                      fontWeight: 500,
                      border: `1px solid ${COLORS[index % COLORS.length]}40`,
                    }}
                    size="small"
                  />
                ))}
              </Box>
            </Paper>
          )}

          {/* App Usage Table */}
          <Paper 
            elevation={0} 
            sx={{ 
              borderRadius: 2,
              overflow: 'hidden',
              bgcolor: themeColors.card,
              border: `1px solid ${themeColors.border}`,
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
            }}
          >
            <Box sx={{ 
              p: 2, 
              borderBottom: `1px solid ${themeColors.border}`, 
              backgroundColor: `${themeColors.card}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                <i className="ri-list-check" style={{ marginRight: '8px', color: colors.primary }}></i>
                Detailed Application Usage
              </Typography>
              <Chip 
                label={`${filteredAppUsage.length} of ${appUsage.length} apps`}
                size="small"
                sx={{ 
                  bgcolor: `${colors.primary}15`,
                  color: colors.primary,
                  fontWeight: 500
                }}
              />
            </Box>
            
            <TableContainer 
              sx={{ 
                maxHeight: '600px',
                ...(accessibility.highContrast && {
                  border: '2px solid',
                  borderColor: muiTheme.palette.text.primary,
                })
              }}
            >
              <Table 
                stickyHeader
                aria-label="Application usage data table"
              >
                <TableHead>
                  <TableRow sx={{ 
                    backgroundColor: accessibility.highContrast ? muiTheme.palette.background.paper : `${themeColors.primary}05`,
                  }}>
                    <TableCell 
                      width="50%" 
                      sx={{ 
                        fontWeight: 600,
                        ...(accessibility.highContrast && {
                          color: muiTheme.palette.text.primary,
                          borderBottom: '2px solid',
                          borderColor: muiTheme.palette.text.primary,
                        }),
                        ...(accessibility.largeText && {
                          fontSize: '1.1rem',
                        })
                      }}
                    >
                      Application Name
                    </TableCell>
                    <TableCell 
                      width="25%" 
                      sx={{ 
                        fontWeight: 600,
                        ...(accessibility.highContrast && {
                          color: muiTheme.palette.text.primary,
                          borderBottom: '2px solid',
                          borderColor: muiTheme.palette.text.primary,
                        }),
                        ...(accessibility.largeText && {
                          fontSize: '1.1rem',
                        })
                      }}
                    >
                      Usage Time
                    </TableCell>
                    <TableCell 
                      width="25%" 
                      sx={{ 
                        fontWeight: 600,
                        ...(accessibility.highContrast && {
                          color: muiTheme.palette.text.primary,
                          borderBottom: '2px solid',
                          borderColor: muiTheme.palette.text.primary,
                        }),
                        ...(accessibility.largeText && {
                          fontSize: '1.1rem',
                        })
                      }}
                    >
                      Last Used
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredAppUsage.map((app: AppUsageData, index: number) => (
                    <TableRow 
                      key={app.id}
                      sx={{ 
                        '&:hover': { backgroundColor: `${themeColors.primary}05` },
                        ...(accessibility.highContrast && index % 2 === 0 && {
                          backgroundColor: 'action.hover',
                        }),
                        ...(accessibility.largeText && {
                          '& .MuiTableCell-root': {
                            padding: '16px',
                          }
                        })
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ 
                            width: 40, 
                            height: 40, 
                            borderRadius: '8px',
                            backgroundColor: accessibility.highContrast ? `${muiTheme.palette.text.primary}15` : `${themeColors.primary}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '12px',
                          }}>
                            <i className="ri-app-store-line" style={{ 
                              color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary, 
                              fontSize: '1.25rem' 
                            }}></i>
                          </Box>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 500,
                              ...(accessibility.largeText && { fontSize: '1.05rem' })
                            }}
                          >
                            {app.app_name}
                          </Typography>
                        </Box>
                        
                        {/* Hidden text for screen readers */}
                        {accessibility.screenReaderOptimized && (
                          <span className="sr-only">
                            Application name: {app.app_name}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <i className="ri-time-line" style={{ 
                            color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary, 
                            marginRight: '6px' 
                          }}></i>
                          <Typography 
                            variant="body2"
                            sx={accessibility.largeText ? { fontSize: '1.05rem' } : undefined}
                          >
                            {formatTime(Math.round(app.usage_time / 60))}
                          </Typography>
                        </Box>
                        
                        {/* Hidden text for screen readers */}
                        {accessibility.screenReaderOptimized && (
                          <span className="sr-only">
                            Usage time: {formatDurationForScreenReader(app.usage_time)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          color={accessibility.highContrast ? "text.primary" : "text.secondary"}
                          sx={accessibility.largeText ? { fontSize: '1.05rem' } : undefined}
                        >
                          {app.timestamp ? new Date(app.timestamp).toLocaleString() : "N/A"}
                        </Typography>
                        
                        {/* Hidden text for screen readers */}
                        {accessibility.screenReaderOptimized && app.timestamp && (
                          <span className="sr-only">
                            Last used: {new Date(app.timestamp).toLocaleString()}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {filteredAppUsage.length === 0 && (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Box sx={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  bgcolor: `${themeColors.accent}15`, 
                  color: themeColors.accent,
                  borderRadius: '50%',
                  width: 60,
                  height: 60,
                  mb: 2
                }}>
                  <i className="ri-search-line" style={{ fontSize: '1.75rem' }}></i>
                </Box>
                <Typography variant="h6" sx={{ mb: 1 }}>
                  No matching applications found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your search to find what you're looking for.
                </Typography>
                {searchQuery && (
                  <Button 
                    variant="outlined" 
                    size="small" 
                    sx={{ 
                      mt: 2, 
                      color: themeColors.primary, 
                      borderColor: themeColors.primary 
                    }}
                    onClick={() => setSearchQuery('')}
                  >
                    Clear Search
                  </Button>
                )}
              </Box>
            )}
          </Paper>
        </>
      ) : !loading && (
        <Box 
          sx={{ 
            p: 4, 
            textAlign: 'center', 
            border: accessibility.highContrast ? '2px solid' : '1px dashed #ddd', 
            borderColor: accessibility.highContrast ? muiTheme.palette.text.primary : 'inherit',
            borderRadius: 2,
            bgcolor: accessibility.highContrast ? 'transparent' : `${themeColors.accent}05`,
          }}
          role="region"
          aria-label="No data available"
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
            <i className="ri-app-store-line" style={{ fontSize: '1.75rem' }}></i>
          </Box>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 1,
              color: accessibility.highContrast ? muiTheme.palette.text.primary : 'inherit',
              fontWeight: 'bold',
              ...(accessibility.largeText && { fontSize: '1.5rem' })
            }}
          >
            No app usage data available
          </Typography>
          <Typography 
            variant="body2" 
            color={accessibility.highContrast ? "text.primary" : "text.secondary"}
            sx={{ ...(accessibility.largeText && { fontSize: '1.1rem' }) }}
          >
            App usage data will appear here once available from the device.
          </Typography>
          
          {/* Hidden text for screen readers with additional context */}
          {accessibility.screenReaderOptimized && (
            <span className="sr-only">
              The device has not reported any app usage data yet. This data is collected from monitored devices and will be displayed here when available. Please check back later or select a different device.
            </span>
          )}
        </Box>
      )}
    </Container>
  );
};

export default AppUsage;

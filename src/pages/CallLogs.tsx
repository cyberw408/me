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
  Button,
  Box,
  Chip,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Divider,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  SelectChangeEvent,
  useTheme as useMuiTheme,
} from "@mui/material";
import { useTheme } from "../context/ThemeContext";
import { formatDateForScreenReader, formatDurationForScreenReader } from "../utils/accessibility";
import AccessibilityAnnouncement from "../components/AccessibilityAnnouncement";
import AccessibleLink from "../components/AccessibleLink";

// ✅ Define Interfaces
interface CallLog {
  id: string;
  caller: string;
  call_type: string;
  duration: number;
  timestamp: string;
  recording_url?: string; // ✅ New Field for Call Recording
}

interface SMSLog {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
}

interface Device {
  device_id: string;
  device_name: string;
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

const CallLogs = () => {
  const [logs, setLogs] = useState<CallLog[] | SMSLog[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<"calls" | "sms">("calls");
  const [tabValue, setTabValue] = useState<number>(0);
  const [announcement, setAnnouncement] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  
  const { colors, accessibility } = useTheme();
  const muiTheme = useMuiTheme();
  
  // Define theme extras for additional UI customization
  // Define theme extras with needed colors
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
  
  // Reference for audio elements to add accessibility attributes
  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);

  // ✅ Fetch Call & SMS Logs including Recordings
  const fetchLogs = useCallback(
    (deviceId: string, type: "calls" | "sms") => {
      if (!token) {
        setError("Unauthorized: Please log in again.");
        return;
      }

      setLoading(true);
      
      // Update the announcement for screen readers
      const deviceName = devices.find(d => d.device_id === deviceId)?.device_name || "selected device";
      setAnnouncement(`Loading ${type} logs for ${deviceName}...`);

      const apiUrl =
        type === "calls"
          ? `/api/tracker/calllog/?device_id=${deviceId}`
          : `/api/tracker/sms/?device_id=${deviceId}`;

      axios
        .get(apiUrl, {
          headers: { Authorization: `Token ${token}` },
        })
        .then((response) => {
          console.log(`✅ Fetched ${type} logs:`, response.data);

          if (type === "calls" && response.data.call_logs && Array.isArray(response.data.call_logs)) {
            setLogs(response.data.call_logs);
            setAnnouncement(`Loaded ${response.data.call_logs.length} call logs for ${deviceName}.`);
          } else if (type === "sms" && response.data.sms_logs && Array.isArray(response.data.sms_logs)) {
            setLogs(response.data.sms_logs);
            setAnnouncement(`Loaded ${response.data.sms_logs.length} SMS messages for ${deviceName}.`);
          } else {
            setLogs([]);
            setAnnouncement(`No ${type} logs found for ${deviceName}.`);
          }
          setError(null);
          setLoading(false);
        })
        .catch((error) => {
          console.error(`❌ Error fetching ${type} logs:`, error);
          setError(`Error fetching ${type} logs.`);
          setLogs([]);
          setAnnouncement(`Error loading ${type} logs. Please try again.`);
          setLoading(false);
        });
    },
    [token, devices]
  );

  // ✅ Fetch Devices
  const fetchDevices = useCallback(() => {
    if (!token) {
      setError("Unauthorized: Please log in again.");
      return;
    }

    axios
      .get<{ devices: Device[] }>("/api/tracker/device-management/", {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        console.log("✅ Fetched devices:", response.data);
        if (response.data.devices && response.data.devices.length > 0) {
          setDevices(response.data.devices);
          const firstDeviceId = response.data.devices[0].device_id;
          setSelectedDevice(firstDeviceId);
          fetchLogs(firstDeviceId, "calls");
        } else {
          setDevices([]);
          setSelectedDevice("");
        }
      })
      .catch((error) => {
        console.error("❌ Error fetching devices:", error);
        setError("Error fetching devices.");
        setDevices([]);
      });
  }, [fetchLogs, token]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Helper function to handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    const newViewType = newValue === 0 ? "calls" : "sms";
    setViewType(newViewType);
    if (selectedDevice) fetchLogs(selectedDevice, newViewType);
  };

  // Helper function to render call type chip
  const renderCallTypeChip = (callType: string) => {
    let chipColor;
    let icon;
    
    switch(callType.toLowerCase()) {
      case 'incoming':
        chipColor = themeColors.accent; // Using accent color for incoming calls
        icon = 'ri-phone-incoming-line';
        break;
      case 'outgoing':
        chipColor = themeColors.primary; // Using primary color for outgoing calls
        icon = 'ri-phone-outgoing-line';
        break;
      case 'missed':
        chipColor = '#f44336'; // Using standard red color for missed calls
        icon = 'ri-phone-missed-line';
        break;
      default:
        chipColor = themeColors.secondary;
        icon = 'ri-phone-line';
    }
    
    return (
      <Chip 
        label={callType}
        size="small"
        sx={{ 
          bgcolor: `${chipColor}15`,
          color: chipColor,
          fontWeight: 500,
          textTransform: 'capitalize'
        }}
        icon={<i className={icon} style={{ fontSize: '1rem' }}></i>}
      />
    );
  };

  // Effect to update audio elements with accessibility attributes when loaded
  useEffect(() => {
    if (viewType === 'calls' && audioRefs.current) {
      audioRefs.current.forEach((audio, index) => {
        if (audio) {
          // Set keyboard navigable
          audio.setAttribute('tabindex', '0');
          
          // Add keyboard shortcuts
          audio.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              if (audio.paused) {
                audio.play();
              } else {
                audio.pause();
              }
            } else if (e.key === 'ArrowLeft') {
              e.preventDefault();
              audio.currentTime = Math.max(0, audio.currentTime - 5);
            } else if (e.key === 'ArrowRight') {
              e.preventDefault();
              audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
            }
          });
        }
      });
    }
  }, [logs, viewType]);

  return (
    <Container>
      {/* Header with gradient styling */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ 
          fontWeight: '700',
          mb: 1,
          background: themeColors.gradient,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Communication Logs
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage call history and SMS messages from monitored devices
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

      {/* Device Selector with improved styling */}
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
              fetchLogs(deviceId, viewType);
              // Announce device selection to screen readers
              const selectedDeviceName = devices.find(d => d.device_id === deviceId)?.device_name || "Unknown device";
              setAnnouncement(`Selected device: ${selectedDeviceName}. Loading ${viewType} logs.`);
            }}
            label="Device"
            aria-label="Select a device to view communication logs"
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

      {/* Communication logs with tabs */}
      <Paper 
        elevation={0} 
        sx={{ 
          borderRadius: 2,
          overflow: 'hidden',
          border: '1px solid #eee',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            aria-label="Communication logs type selector"
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: themeColors.primary,
                ...(accessibility.highContrast && {
                  height: 3,
                  backgroundColor: muiTheme.palette.text.primary,
                })
              },
              '& .Mui-selected': {
                color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary,
                fontWeight: 'bold',
              },
              ...(accessibility.largeText && {
                '& .MuiTab-root': {
                  fontSize: '1.1rem',
                }
              })
            }}
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <i className="ri-phone-line" style={{ marginRight: '8px', fontSize: '1.1rem' }}></i>
                  Call Logs
                </Box>
              } 
              sx={{ 
                textTransform: 'none', 
                fontWeight: 600,
                ...(accessibility.highContrast && {
                  '&.Mui-selected': {
                    textDecoration: 'underline',
                  }
                })
              }}
              aria-label="View call logs"
              id="communication-tab-0"
              aria-controls="communication-tabpanel-0"
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <i className="ri-message-2-line" style={{ marginRight: '8px', fontSize: '1.1rem' }}></i>
                  SMS Messages
                </Box>
              } 
              sx={{ 
                textTransform: 'none', 
                fontWeight: 600,
                ...(accessibility.highContrast && {
                  '&.Mui-selected': {
                    textDecoration: 'underline',
                  }
                })
              }}
              aria-label="View SMS messages"
              id="communication-tab-1"
              aria-controls="communication-tabpanel-1"
            />
          </Tabs>
        </Box>

        <Box 
          role="tabpanel"
          id={`communication-tabpanel-${tabValue}`}
          aria-labelledby={`communication-tab-${tabValue}`}
          sx={{ p: 0 }}
        >
          {/* Accessibility announcement for screen readers */}
          {announcement && <AccessibilityAnnouncement message={announcement} />}
          
          {loading ? (
            <Box 
              sx={{ p: 4, textAlign: 'center' }}
              role="status"
              aria-live="polite"
              aria-label={`Loading ${viewType} logs`}
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
                Loading {viewType} logs...
              </Typography>
              {/* Hidden text for screen readers with more details */}
              <span className="sr-only">
                Please wait while we fetch the {viewType} logs for the selected device.
              </span>
            </Box>
          ) : logs.length > 0 ? (
            <TableContainer 
              sx={{ 
                maxHeight: '600px',
                ...(accessibility.highContrast && {
                  border: '2px solid',
                  borderColor: muiTheme.palette.text.primary,
                  borderTop: 'none',
                })
              }}
            >
              <Table 
                stickyHeader
                aria-label={`${viewType === "calls" ? "Call logs" : "SMS messages"} table`}
              >
                <TableHead>
                  <TableRow sx={{ 
                    backgroundColor: accessibility.highContrast ? muiTheme.palette.background.paper : `${themeColors.primary}05`,
                  }}>
                    <TableCell sx={{ 
                      fontWeight: 600,
                      ...(accessibility.highContrast && {
                        color: muiTheme.palette.text.primary,
                        borderBottom: '2px solid',
                        borderColor: muiTheme.palette.text.primary,
                      }),
                      ...(accessibility.largeText && {
                        fontSize: '1.1rem',
                      })
                    }}>
                      {viewType === "calls" ? "Caller" : "Sender"}
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600,
                      ...(accessibility.highContrast && {
                        color: muiTheme.palette.text.primary,
                        borderBottom: '2px solid',
                        borderColor: muiTheme.palette.text.primary,
                      }),
                      ...(accessibility.largeText && {
                        fontSize: '1.1rem',
                      })
                    }}>
                      {viewType === "calls" ? "Call Type" : "Message"}
                    </TableCell>
                    {viewType === "calls" && <TableCell sx={{ 
                      fontWeight: 600,
                      ...(accessibility.highContrast && {
                        color: muiTheme.palette.text.primary,
                        borderBottom: '2px solid',
                        borderColor: muiTheme.palette.text.primary,
                      }),
                      ...(accessibility.largeText && {
                        fontSize: '1.1rem',
                      })
                    }}>Duration</TableCell>}
                    <TableCell sx={{ 
                      fontWeight: 600,
                      ...(accessibility.highContrast && {
                        color: muiTheme.palette.text.primary,
                        borderBottom: '2px solid',
                        borderColor: muiTheme.palette.text.primary,
                      }),
                      ...(accessibility.largeText && {
                        fontSize: '1.1rem',
                      })
                    }}>Time</TableCell>
                    {viewType === "calls" && <TableCell sx={{ 
                      fontWeight: 600,
                      ...(accessibility.highContrast && {
                        color: muiTheme.palette.text.primary,
                        borderBottom: '2px solid',
                        borderColor: muiTheme.palette.text.primary,
                      }),
                      ...(accessibility.largeText && {
                        fontSize: '1.1rem',
                      })
                    }}>Recording</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log, index) =>
                    viewType === "calls" ? (
                      <TableRow 
                        key={index}
                        sx={{ 
                          '&:hover': { backgroundColor: accessibility.highContrast ? 'action.hover' : `${themeColors.primary}05` },
                          ...(accessibility.highContrast && index % 2 === 0 && {
                            backgroundColor: 'action.hover',
                          }),
                          ...(accessibility.largeText && {
                            '& .MuiTableCell-root': {
                              fontSize: '1.05rem',
                              padding: '16px',
                            }
                          })
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <i className="ri-user-line" style={{ color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary, marginRight: '8px' }}></i>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 500,
                              ...(accessibility.largeText && { fontSize: '1.05rem' })
                            }}>
                              {(log as CallLog).caller}
                            </Typography>
                          </Box>
                          
                          {/* Hidden text for screen readers */}
                          {accessibility.screenReaderOptimized && (
                            <span className="sr-only">
                              Caller: {(log as CallLog).caller}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {renderCallTypeChip((log as CallLog).call_type)}
                          
                          {/* Hidden text for screen readers */}
                          {accessibility.screenReaderOptimized && (
                            <span className="sr-only">
                              Call type: {(log as CallLog).call_type}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <i className="ri-time-line" style={{ color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.textSecondary, marginRight: '8px' }}></i>
                            <Typography sx={{ ...(accessibility.largeText && { fontSize: '1.05rem' }) }}>
                              {(log as CallLog).duration} sec
                            </Typography>
                          </Box>
                          
                          {/* Hidden text for screen readers */}
                          {accessibility.screenReaderOptimized && (
                            <span className="sr-only">
                              Duration: {formatDurationForScreenReader((log as CallLog).duration)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            color={accessibility.highContrast ? "text.primary" : "text.secondary"}
                            sx={{ ...(accessibility.largeText && { fontSize: '1.05rem' }) }}
                          >
                            {new Date((log as CallLog).timestamp).toLocaleString()}
                          </Typography>
                          
                          {/* Hidden text for screen readers */}
                          {accessibility.screenReaderOptimized && (
                            <span className="sr-only">
                              Time: {formatDateForScreenReader(new Date((log as CallLog).timestamp))}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {(log as CallLog).recording_url ? (
                            <Box sx={{ 
                              maxWidth: '250px',
                              '& audio': { 
                                height: '35px',
                                width: '100%',
                                '&::-webkit-media-controls-panel': {
                                  backgroundColor: accessibility.highContrast ? undefined : `${themeColors.primary}05`,
                                },
                              },
                            }}>
                              <audio 
                                controls
                                ref={el => {
                                  if (!audioRefs.current) audioRefs.current = [];
                                  audioRefs.current[index] = el;
                                }}
                                aria-label={`Recording of call with ${(log as CallLog).caller} on ${formatDateForScreenReader(new Date((log as CallLog).timestamp))}`}
                              >
                                <source src={(log as CallLog).recording_url} type="audio/mpeg" />
                                Your browser does not support the audio element.
                              </audio>
                            </Box>
                          ) : (
                            <Chip 
                              label="No Recording"
                              size="small"
                              variant="outlined"
                              sx={{ 
                                color: accessibility.highContrast ? muiTheme.palette.text.primary : 'text.secondary',
                                borderColor: accessibility.highContrast ? muiTheme.palette.text.primary : undefined,
                                ...(accessibility.largeText && { fontSize: '0.9rem' })
                              }}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow 
                        key={index}
                        sx={{ 
                          '&:hover': { backgroundColor: accessibility.highContrast ? 'action.hover' : `${themeColors.primary}05` },
                          ...(accessibility.highContrast && index % 2 === 0 && {
                            backgroundColor: 'action.hover',
                          }),
                          ...(accessibility.largeText && {
                            '& .MuiTableCell-root': {
                              fontSize: '1.05rem',
                              padding: '16px',
                            }
                          })
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <i className="ri-user-line" style={{ color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary, marginRight: '8px' }}></i>
                            <Typography variant="body2" sx={{ 
                              fontWeight: 500,
                              ...(accessibility.largeText && { fontSize: '1.05rem' })
                            }}>
                              {(log as SMSLog).sender}
                            </Typography>
                          </Box>
                          
                          {/* Hidden text for screen readers */}
                          {accessibility.screenReaderOptimized && (
                            <span className="sr-only">
                              Sender: {(log as SMSLog).sender}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2"
                            sx={{ ...(accessibility.largeText && { fontSize: '1.05rem' }) }}
                          >
                            {(log as SMSLog).message}
                          </Typography>
                          
                          {/* Hidden text for screen readers */}
                          {accessibility.screenReaderOptimized && (
                            <span className="sr-only">
                              Message: {(log as SMSLog).message}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            color={accessibility.highContrast ? "text.primary" : "text.secondary"}
                            sx={{ ...(accessibility.largeText && { fontSize: '1.05rem' }) }}
                          >
                            {new Date((log as SMSLog).timestamp).toLocaleString()}
                          </Typography>
                          
                          {/* Hidden text for screen readers */}
                          {accessibility.screenReaderOptimized && (
                            <span className="sr-only">
                              Time: {formatDateForScreenReader(new Date((log as SMSLog).timestamp))}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  )}
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
                <i className={viewType === "calls" ? "ri-phone-line" : "ri-message-2-line"} style={{ fontSize: '1.75rem' }}></i>
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
                No {viewType} logs available
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: accessibility.highContrast ? muiTheme.palette.text.primary : 'text.secondary',
                  fontSize: accessibility.largeText ? '1.1rem' : 'inherit',
                }}
              >
                {viewType === "calls" 
                  ? "Call logs will appear here once the device makes or receives calls."
                  : "SMS messages will appear here once the device sends or receives messages."
                }
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default CallLogs;

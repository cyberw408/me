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
  Chip,
  Divider,
  LinearProgress,
  SelectChangeEvent,
  useTheme as useMuiTheme,
  IconButton,
  Tooltip,
  Card,
  CardContent,
} from "@mui/material";
import { useTheme } from "../context/ThemeContext";
import AccessibilityAnnouncement from "../components/AccessibilityAnnouncement";

// Define additional theme color constants for UI components and their TypeScript interface
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

interface LiveAudioEntry {
  id: string;
  audio_url: string;
  timestamp: string;
}

const LiveAudio = () => {
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

  // ✅ State Variables with accessibility enhancements
  const [recordings, setRecordings] = useState<LiveAudioEntry[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [recording, setRecording] = useState<boolean>(false);
  const [dataLoading, setDataLoading] = useState<boolean>(false);
  const [announcement, setAnnouncement] = useState<string>("");
  const [recordingTime, setRecordingTime] = useState<number>(0);
  
  const token = localStorage.getItem("token");

  // ✅ Fetch Stored Live Audio Recordings with accessibility support
const fetchLiveAudioRecordings = useCallback((deviceId: string) => {
  setDataLoading(true);
  
  // Find device name for better accessibility announcements
  const deviceName = devices.find(d => d.device_id === deviceId)?.device_name || deviceId;
  setAnnouncement(`Loading audio recordings from device ${deviceName}...`);
  
  axios
    .get<{ live_audio: { id: string; audio_url: string; timestamp: string } }>(
      `/api/tracker/live-audio/list/?device_id=${deviceId}`,
      {
        headers: { Authorization: `Token ${token}` },
      }
    )
    .then((response) => {
      console.log("✅ Fetched live audio recordings:", response.data);

      if (response.data.live_audio && response.data.live_audio.audio_url) {
        // Convert single object into an array for UI compatibility
        setRecordings([response.data.live_audio]);
        setAnnouncement(`Found 1 audio recording for device ${deviceName}`);
      } else {
        setRecordings([]);
        setAnnouncement(`No audio recordings found for device ${deviceName}`);
      }
      setError(null);
    })
    .catch((err) => {
      console.error("❌ API Error:", err);
      setError("Error fetching live audio recordings.");
      setAnnouncement("Failed to load audio recordings. Please try again later.");
      setRecordings([]);
    })
    .finally(() => {
      setDataLoading(false);
    });
}, [token, devices]);


  // ✅ Fetch Devices with accessibility support
  const fetchDevices = useCallback(() => {
    setLoading(true);
    setAnnouncement("Loading available devices...");
    
    if (!token) {
      setError("Unauthorized: Please log in.");
      setAnnouncement("Authentication error. Please log in to continue.");
      window.location.href = "/login";
      return;
    }
    
    axios
      .get<{ devices: Device[] }>("/api/tracker/device-management/", {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        if (Array.isArray(response.data.devices) && response.data.devices.length > 0) {
          const deviceList = response.data.devices;
          setDevices(deviceList);
          
          // Announce devices count for screen readers
          const deviceCount = deviceList.length;
          const firstDeviceId = deviceList[0].device_id;
          const firstName = deviceList[0].device_name;
          
          setSelectedDevice(firstDeviceId);
          setAnnouncement(`Found ${deviceCount} device${deviceCount !== 1 ? 's' : ''}. Selected ${firstName} for audio monitoring.`);
          
          // Load audio recordings for the first device
          fetchLiveAudioRecordings(firstDeviceId);
        } else {
          setDevices([]);
          setAnnouncement("No devices found. Please add a device first to monitor audio.");
        }
      })
      .catch((err) => {
        console.error("❌ API Error:", err);
        if (err.response?.status === 401) {
          setError("Unauthorized: Please log in again.");
          setAnnouncement("Your session has expired. Please log in again.");
          localStorage.removeItem("token");
          window.location.href = "/login";
        } else {
          setError("Error fetching devices.");
          setAnnouncement("Failed to load devices. Please check your connection and try again.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [fetchLiveAudioRecordings, token]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    if (selectedDevice) {
      fetchLiveAudioRecordings(selectedDevice);
    }
  }, [selectedDevice, fetchLiveAudioRecordings]);

  // ✅ Stop Live Audio Streaming with accessibility features
const stopLiveAudio = useCallback(() => {
  if (!selectedDevice) {
    setError("Please select a device.");
    setAnnouncement("Error: No device selected. Please select a device first.");
    return;
  }

  // Find the last recorded audio entry for the selected device
  const lastRecording = recordings.length > 0 ? recordings[0] : null;

  if (!lastRecording || !lastRecording.audio_url) {
    setError("No active audio session found.");
    setAnnouncement("Error: No active audio recording session found.");
    return;
  }
  
  // Get device name for better announcements
  const deviceName = devices.find(d => d.device_id === selectedDevice)?.device_name || selectedDevice;
  setAnnouncement(`Stopping audio recording for device ${deviceName}...`);
  setLoading(true);

  console.log("🔴 Stopping live audio for device:", selectedDevice, "Audio URL:", lastRecording.audio_url);

  axios
    .post(
      "/api/tracker/live-audio/stop/",
      { device_id: selectedDevice, audio_url: lastRecording.audio_url },
      { headers: { Authorization: `Token ${localStorage.getItem("token")}` } }
    )
    .then((response) => {
      console.log("✅ Live audio stopped:", response.data);
      setRecording(false);
      setRecordingTime(0);
      setAnnouncement(`Audio recording stopped successfully for device ${deviceName}.`);
      fetchLiveAudioRecordings(selectedDevice); // Refresh list of recordings
    })
    .catch((err) => {
      console.error("❌ API Error:", err.response ? err.response.data : err.message);
      setError("Error stopping live audio. Please try again.");
      setAnnouncement("Failed to stop audio recording. Please try again.");
    })
    .finally(() => {
      setLoading(false);
    });
}, [selectedDevice, recordings, fetchLiveAudioRecordings, devices]);


  // ✅ Start Live Audio Streaming with accessibility features
  const startLiveAudio = useCallback(() => {
    if (!selectedDevice) {
      setError("Please select a device first.");
      setAnnouncement("Error: No device selected. Please select a device first.");
      return;
    }

    // Get device name for better announcements
    const deviceName = devices.find(d => d.device_id === selectedDevice)?.device_name || selectedDevice;
    
    setLoading(true);
    setError(null);
    setAnnouncement(`Starting audio recording for device ${deviceName}...`);

    axios
      .post<{ audio_url: string }>("/api/tracker/live-audio/start/", {
        device_id: selectedDevice,
        duration: 300, // 5 minutes
      }, {
        headers: { Authorization: `Token ${token}` },
      })
      .then(() => {
        setRecording(true);
        setAnnouncement(`Audio recording started for device ${deviceName}. Recording will automatically stop after 5 minutes.`);
        
        // Start recording timer 
        setRecordingTime(0);
        const timerInterval = setInterval(() => {
          setRecordingTime(prev => {
            const newTime = prev + 1;
            // Announce recording time at certain intervals
            if (newTime % 60 === 0) {
              const minutes = Math.floor(newTime / 60);
              setAnnouncement(`Recording in progress: ${minutes} minute${minutes !== 1 ? 's' : ''} elapsed.`);
            }
            return newTime;
          });
        }, 1000);

        // ✅ Automatically stop recording after 5 minutes
        setTimeout(() => {
          clearInterval(timerInterval);
          stopLiveAudio();
        }, 300000); // 300,000ms = 5 minutes
      })
      .catch((err) => {
        console.error("❌ API Error:", err);
        setError("Error starting live audio.");
        setAnnouncement("Failed to start audio recording. Please try again.");
      })
      .finally(() => setLoading(false));
  }, [selectedDevice, stopLiveAudio, token, devices]);

  // Record the accessibility announcement for screen readers
  useEffect(() => {
    if (announcement) {
      // The announcement will be read by screen readers
      setTimeout(() => setAnnouncement(""), 3000);
    }
  }, [announcement]);

  // Format recording time for display
  const formatRecordingTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Create keyboard shortcut for starting/stopping recording
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+R to toggle recording
      if (e.altKey && e.key === 'r' && !loading) {
        e.preventDefault();
        if (recording) {
          stopLiveAudio();
          setAnnouncement("Stopped recording with keyboard shortcut Alt+R");
        } else if (selectedDevice) {
          startLiveAudio();
          setAnnouncement("Started recording with keyboard shortcut Alt+R");
        } else {
          setAnnouncement("Please select a device before starting recording");
        }
      }
      
      // Alt+D to focus on device selector
      if (e.altKey && e.key === 'd') {
        e.preventDefault();
        const deviceSelector = document.getElementById('device-selector');
        if (deviceSelector) {
          deviceSelector.focus();
          setAnnouncement("Device selector focused. Use arrow keys to select a device.");
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recording, selectedDevice, loading, startLiveAudio, stopLiveAudio]);

  return (
    <Container sx={{ 
      padding: 3,
      backgroundColor: themeColors.background,
      color: themeColors.text,
      borderRadius: 2
    }}>
      {/* Accessibility announcement component */}
      {announcement && <AccessibilityAnnouncement message={announcement} />}
      
      {/* Page Title */}
      <Typography 
        variant="h4" 
        component="h1"
        sx={{ 
          fontWeight: 'bold',
          marginBottom: 2,
          color: themeColors.primary,
          fontSize: accessibility.largeText ? '2.5rem' : '2rem',
          background: accessibility.highContrast ? 'none' : 'linear-gradient(90deg, rgba(25,118,210,1) 0%, rgba(66,165,245,1) 100%)',
          WebkitBackgroundClip: accessibility.highContrast ? 'none' : 'text',
          WebkitTextFillColor: accessibility.highContrast ? themeColors.primary : 'transparent',
          padding: 1,
          paddingLeft: 0
        }}
      >
        Live Audio Streaming
      </Typography>
      
      <Typography 
        variant="body1" 
        sx={{ 
          marginBottom: 2,
          fontSize: accessibility.largeText ? '1.1rem' : '1rem',
          color: themeColors.secondary
        }}
        aria-live="polite"
      >
        Listen to live audio from monitored devices or review previous recordings.
      </Typography>

      {/* Error Alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            marginY: 2,
            backgroundColor: accessibility.highContrast ? '#550000' : undefined,
            color: accessibility.highContrast ? '#ffffff' : undefined
          }}
          role="alert"
          aria-live="assertive"
        >
          {error}
        </Alert>
      )}

      {/* Device Selector Card */}
      <Card 
        sx={{ 
          marginY: 3, 
          backgroundColor: themeColors.card,
          borderRadius: 2,
          border: accessibility.highContrast ? `2px solid ${themeColors.border}` : 'none'
        }}
      >
        <CardContent>
          <Typography 
            variant="h6" 
            component="h2"
            sx={{ 
              marginBottom: 2,
              color: themeColors.headingSecondary,
              fontSize: accessibility.largeText ? '1.3rem' : '1.1rem'
            }}
          >
            Select Device
          </Typography>
          
          {/* Loading indicator for device list */}
          {loading && devices.length === 0 && (
            <Box sx={{ width: '100%', marginY: 2 }}>
              <LinearProgress 
                color="primary" 
                aria-label="Loading devices" 
              />
            </Box>
          )}
          
          {/* Device Selector */}
          <FormControl 
            fullWidth 
            variant="outlined"
            sx={{ marginBottom: 2 }}
          >
            <InputLabel 
              id="device-selector-label"
              sx={{ 
                color: themeColors.text,
                fontSize: accessibility.largeText ? '1.1rem' : '1rem'
              }}
            >
              Device
            </InputLabel>
            <Select
              labelId="device-selector-label"
              id="device-selector"
              value={selectedDevice}
              onChange={(e: SelectChangeEvent) => {
                setSelectedDevice(e.target.value as string);
                fetchLiveAudioRecordings(e.target.value as string);
              }}
              label="Device"
              sx={{ 
                backgroundColor: themeColors.input,
                color: themeColors.text,
                '.MuiOutlinedInput-notchedOutline': {
                  borderColor: accessibility.highContrast ? themeColors.border : 'rgba(0, 0, 0, 0.23)',
                  borderWidth: accessibility.highContrast ? 2 : 1
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: accessibility.highContrast ? themeColors.primary : 'rgba(0, 0, 0, 0.23)'
                },
                '.MuiSvgIcon-root': {
                  color: themeColors.text
                }
              }}
              inputProps={{
                'aria-label': 'Select a device for audio monitoring',
              }}
            >
              {devices.length > 0 ? (
                devices.map((device: Device) => (
                  <MenuItem 
                    key={device.device_id} 
                    value={device.device_id}
                    sx={{ 
                      fontSize: accessibility.largeText ? '1.1rem' : '1rem',
                      backgroundColor: themeColors.input,
                      color: themeColors.text,
                      '&.Mui-selected': {
                        backgroundColor: accessibility.highContrast ? themeColors.primary : 'rgba(25, 118, 210, 0.12)',
                        color: accessibility.highContrast ? '#ffffff' : themeColors.text
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.04)'
                      }
                    }}
                  >
                    {device.device_name} (ID: {device.device_id})
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>
                  {loading ? 'Loading devices...' : 'No devices found'}
                </MenuItem>
              )}
            </Select>
            <FormHelperText
              sx={{ 
                color: themeColors.textSecondary,
                fontSize: accessibility.largeText ? '0.9rem' : '0.75rem'
              }}
            >
              Press Alt+D to focus this selector
            </FormHelperText>
          </FormControl>

          {/* Recording Controls */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2
            }}
          >
            <Box>
              <Button
                variant="contained"
                color="primary"
                onClick={startLiveAudio}
                disabled={loading || recording}
                aria-label="Start audio recording"
                sx={{ 
                  marginRight: 2,
                  padding: accessibility.largeText ? '12px 24px' : '8px 22px',
                  fontSize: accessibility.largeText ? '1rem' : '0.875rem',
                  backgroundColor: accessibility.highContrast ? '#00008B' : undefined,
                  '&:hover': {
                    backgroundColor: accessibility.highContrast ? '#000066' : undefined,
                  },
                  '&.Mui-disabled': {
                    backgroundColor: accessibility.highContrast ? '#666666' : undefined,
                    color: accessibility.highContrast ? '#cccccc' : undefined
                  }
                }}
              >
                {loading ? <CircularProgress size={24} /> : "Request Live Audio"}
              </Button>

              {recording && (
                <Button 
                  variant="contained"
                  color="secondary"
                  onClick={stopLiveAudio}
                  aria-label="Stop audio recording"
                  sx={{ 
                    padding: accessibility.largeText ? '12px 24px' : '8px 22px',
                    fontSize: accessibility.largeText ? '1rem' : '0.875rem',
                    backgroundColor: accessibility.highContrast ? '#B30000' : undefined,
                    '&:hover': {
                      backgroundColor: accessibility.highContrast ? '#800000' : undefined,
                    }
                  }}
                >
                  Stop Recording
                </Button>
              )}
            </Box>
            
            {/* Keyboard Shortcut Helper */}
            <Tooltip 
              title="Press Alt+R to start/stop recording" 
              placement="top"
              arrow
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  color: themeColors.textSecondary,
                  border: `1px dashed ${themeColors.border}`,
                  padding: '4px 8px',
                  borderRadius: 1,
                  fontSize: accessibility.largeText ? '0.9rem' : '0.75rem'
                }}
              >
                Keyboard shortcut: Alt+R
              </Typography>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>
      
      {/* Recording Status */}
      {recording && (
        <Card 
          sx={{ 
            marginY: 2, 
            backgroundColor: accessibility.highContrast ? '#330000' : '#fff8e1',
            border: accessibility.highContrast ? '2px solid #ff0000' : 'none',
            borderRadius: 2
          }}
        >
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box 
              sx={{ 
                width: 12, 
                height: 12, 
                borderRadius: '50%', 
                backgroundColor: 'red',
                animation: 'pulse 1.5s infinite'
              }}
            />
            <Typography 
              variant="h6" 
              component="div"
              sx={{ 
                color: accessibility.highContrast ? '#ffffff' : '#d32f2f',
                fontSize: accessibility.largeText ? '1.1rem' : '1rem'
              }}
              aria-live="polite"
            >
              Recording in progress - {formatRecordingTime(recordingTime)}
            </Typography>
          </CardContent>
        </Card>
      )}
      
      {/* Audio Recordings Section */}
      <Typography 
        variant="h6" 
        component="h2"
        sx={{ 
          marginTop: 4,
          marginBottom: 2,
          color: themeColors.headingSecondary,
          fontSize: accessibility.largeText ? '1.3rem' : '1.1rem',
          borderBottom: `1px solid ${themeColors.border}`,
          paddingBottom: 1
        }}
        id="recordings-section"
      >
        Audio Recordings
      </Typography>
      
      {/* Data Loading Indicator */}
      {dataLoading && (
        <Box sx={{ width: '100%', marginY: 2 }}>
          <LinearProgress color="primary" aria-label="Loading audio recordings" />
        </Box>
      )}

      {/* Recordings Table */}
      {!dataLoading && recordings.length > 0 ? (
        <TableContainer 
          component={Paper} 
          sx={{ 
            marginTop: 2,
            backgroundColor: themeColors.card,
            border: accessibility.highContrast ? `2px solid ${themeColors.border}` : 'none'
          }}
        >
          <Table 
            aria-label="Audio recordings table"
            sx={{ 
              backgroundColor: themeColors.card,
              '& .MuiTableCell-head': {
                backgroundColor: accessibility.highContrast ? themeColors.primary : themeColors.cardHeader,
                color: accessibility.highContrast ? '#ffffff' : themeColors.text,
                fontWeight: 'bold',
                fontSize: accessibility.largeText ? '1.1rem' : '0.875rem'
              },
              '& .MuiTableCell-body': {
                fontSize: accessibility.largeText ? '1rem' : '0.875rem',
                color: themeColors.text
              }
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell>Recorded Audio</TableCell>
                <TableCell>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recordings.map((recording) => (
                <TableRow 
                  key={recording.id}
                  sx={{ 
                    '&:nth-of-type(odd)': {
                      backgroundColor: accessibility.highContrast ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.04)'
                    },
                    '&:hover': {
                      backgroundColor: accessibility.highContrast ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.07)'
                    }
                  }}
                >
                  <TableCell>
                    <audio 
                      controls
                      aria-label={`Audio recording from ${new Date(recording.timestamp).toLocaleString()}`}
                      style={{ 
                        width: '100%',
                        maxWidth: '300px'
                      }}
                    >
                      <source src={recording.audio_url} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </TableCell>
                  <TableCell>
                    {new Date(recording.timestamp).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : !dataLoading && (
        <Typography 
          sx={{ 
            marginTop: 2,
            padding: 2,
            backgroundColor: themeColors.card,
            borderRadius: 1,
            border: `1px dashed ${themeColors.border}`,
            color: themeColors.textSecondary,
            fontSize: accessibility.largeText ? '1.1rem' : '1rem',
            textAlign: 'center'
          }}
        >
          No live audio recordings available.
        </Typography>
      )}
      
      {/* Keyboard Accessibility Instructions */}
      <Box 
        sx={{ 
          marginTop: 4, 
          padding: 2, 
          backgroundColor: themeColors.card,
          borderRadius: 2,
          border: `1px solid ${themeColors.border}`
        }}
      >
        <Typography 
          variant="h6"
          component="h2"
          sx={{ 
            marginBottom: 1,
            color: themeColors.headingSecondary,
            fontSize: accessibility.largeText ? '1.1rem' : '1rem'
          }}
        >
          Keyboard Shortcuts
        </Typography>
        <Typography 
          variant="body2"
          component="div"
          sx={{ 
            color: themeColors.text,
            fontSize: accessibility.largeText ? '1rem' : '0.875rem'
          }}
        >
          <ul>
            <li><strong>Alt+D</strong>: Focus on device selector</li>
            <li><strong>Alt+R</strong>: Start/Stop recording</li>
            <li><strong>Tab</strong>: Navigate between controls</li>
            <li><strong>Space/Enter</strong>: Activate focused buttons</li>
          </ul>
        </Typography>
      </Box>
    </Container>
  );
};

export default LiveAudio;

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
  Button,
  Box,
  Tab,
  Tabs,
  Fade,
  FormControl,
  InputLabel,
  Chip,
  CircularProgress,
  Tooltip,
  FormHelperText,
  useTheme as useMuiTheme,
  SelectChangeEvent,
  IconButton,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import TelegramIcon from "@mui/icons-material/Telegram";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import ChatIcon from "@mui/icons-material/Chat";
import CallIcon from "@mui/icons-material/Call";
import AccessibilityAnnouncement from "../components/AccessibilityAnnouncement";
import { useTheme } from "../context/ThemeContext";
import AccessibleTable from "../components/AccessibleTable";

// Interface for theme extras
interface ThemeExtras {
  card: string;
  border: string;
  input: string;
  headingSecondary: string;
  cardHeader: string;
  textSecondary: string;
  tableHeader: string;
  tableRow: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
}

const SocialMediaLogs = () => {
  // ✅ Define Device Interface
  interface Device {
    device_id: string;
    device_name: string;
  }

  // ✅ Define Message Interface
  interface Message {
    id: string;
    platform: string;
    sender: string;
    message: string;
    timestamp: string;
  }

  // ✅ Define CallLog Interface
  interface CallLog {
    id: string;
    platform: string;
    contact_number: string;
    call_type: string;
    duration?: number;
    timestamp: string;
    file_url?: string; // ✅ For Call Recording
  }

  // ✅ Define States
  const [messages, setMessages] = useState<Message[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<"messages" | "calls">("messages");
  const [loading, setLoading] = useState<boolean>(true);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);

  // For theme and accessibility
  const { colors, accessibility, themeMood } = useTheme();
  const muiTheme = useMuiTheme();

  // Combined theme colors with both original theme colors and custom extras
  const themeColors: ThemeExtras = {
    // Base theme properties
    primary: colors.primary,
    secondary: colors.secondary,
    accent: colors.accent || colors.secondary,
    text: colors.text || '#212121',
    
    // Custom additional properties
    card: accessibility.highContrast ? 'transparent' : '#ffffff',
    border: accessibility.highContrast ? muiTheme.palette.text.primary : '#e0e0e0',
    input: accessibility.highContrast ? 'transparent' : colors.background || '#f5f5f5',
    headingSecondary: colors.secondary || '#666',
    cardHeader: accessibility.highContrast ? 'transparent' : '#f9f9f9',
    textSecondary: colors.secondary || '#666',
    tableHeader: accessibility.highContrast ? 'transparent' : `${colors.primary}15`,
    tableRow: accessibility.highContrast ? 'transparent' : `${colors.primary}05`,
  };

  const token = localStorage.getItem("token");

  // Function to get platform icon
  const getPlatformIcon = (platform: string) => {
    const iconProps = {
      fontSize: "small" as "small" | "inherit" | "large" | "medium", 
      sx: { 
        marginRight: 0.5,
        ...(accessibility.largeText && { fontSize: '1.2rem' })
      }
    };
    
    switch (platform.toLowerCase()) {
      case "whatsapp":
        return <WhatsAppIcon {...iconProps} sx={{ ...iconProps.sx, color: "#25D366" }} />;
      case "telegram":
        return <TelegramIcon {...iconProps} sx={{ ...iconProps.sx, color: "#0088cc" }} />;
      case "facebook":
      case "messenger":
        return <FacebookIcon {...iconProps} sx={{ ...iconProps.sx, color: "#1877F2" }} />;
      case "instagram":
        return <InstagramIcon {...iconProps} sx={{ ...iconProps.sx, color: "#E1306C" }} />;
      default:
        return <ChatIcon {...iconProps} />;
    }
  };

  // ✅ Fetch Logs (Messages & Calls)
  const fetchLogs = useCallback((deviceId: string, type: "messages" | "calls") => {
    if (!token) {
      setError("Unauthorized: Please log in again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    const apiUrl =
      type === "messages"
        ? `/api/tracker/social/messages/?device_id=${deviceId}`
        : `/api/tracker/social/call-recordings/?device_id=${deviceId}`;

    axios
      .get(apiUrl, {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        console.log(`✅ Fetched ${type} logs:`, response.data);

        if (type === "messages" && response.data.social_media_messages && Array.isArray(response.data.social_media_messages)) {
          setMessages([...response.data.social_media_messages]);
        } else if (type === "calls" && response.data.social_call_recordings && Array.isArray(response.data.social_call_recordings)) {
          // ✅ Ensure `caller` field is included
          setCallLogs(
            response.data.social_call_recordings.map((call: any) => ({
              ...call,
              caller: call.contact_number || "Unknown Caller", // ✅ Ensure caller field is not missing
            }))
          );
        } else {
          type === "messages" ? setMessages([]) : setCallLogs([]);
        }

        setError(null);
        setLoading(false);
      })
      .catch((error) => {
        console.error(`❌ Error fetching ${type} logs:`, error);
        setError(`Error fetching ${type} logs: ${error.response?.data?.error || "Unknown error"}`);
        type === "messages" ? setMessages([]) : setCallLogs([]);
        setLoading(false);
      });
  }, [token]);

  // ✅ Fetch Devices
  const fetchDevices = useCallback(() => {
    setLoading(true);
    
    if (!token) {
      setError("Authentication token is missing. Please log in.");
      setLoading(false);
      return;
    }

    axios
      .get<{ devices: Device[] }>("/api/tracker/device-management/", {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        if (Array.isArray(response.data.devices) && response.data.devices.length > 0) {
          setDevices(response.data.devices);
          setSelectedDevice(response.data.devices[0].device_id);
          fetchLogs(response.data.devices[0].device_id, "messages"); // Default: Fetch Messages
        } else {
          setDevices([]);
          setSelectedDevice("");
          setError("No devices found.");
          setLoading(false);
        }
      })
      .catch((err) => {
        setError(`Error fetching devices: ${err.response?.data?.error || "Unknown error"}`);
        setLoading(false);
      });
  }, [token, fetchLogs]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: "messages" | "calls") => {
    setViewType(newValue);
    if (selectedDevice) {
      fetchLogs(selectedDevice, newValue);
    }
  };

  const handleDeviceChange = (event: SelectChangeEvent<string>) => {
    const deviceId = event.target.value as string;
    setSelectedDevice(deviceId);
    fetchLogs(deviceId, viewType);
  };

  const handlePlayAudio = (audioId: string) => {
    // If something is already playing, stop it
    if (currentlyPlaying) {
      const currentAudio = document.getElementById(currentlyPlaying) as HTMLAudioElement;
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    }

    // Play the selected audio
    const audio = document.getElementById(audioId) as HTMLAudioElement;
    if (audio) {
      audio.play();
      setCurrentlyPlaying(audioId);

      // Add event listener to reset state when audio ends
      audio.onended = () => setCurrentlyPlaying(null);
    }
  };

  const handleStopAudio = (audioId: string) => {
    const audio = document.getElementById(audioId) as HTMLAudioElement;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      setCurrentlyPlaying(null);
    }
  };

  // For accessibility screen reader - format duration nicely
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return "No duration available";
    
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    let result = `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    if (remainingSeconds > 0) {
      result += ` and ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`;
    }
    
    return result;
  };

  return (
    <Container>
      {/* Accessibility announcements for screen readers */}
      {error && <AccessibilityAnnouncement message={error} assertive={true} />}
      {loading && <AccessibilityAnnouncement message="Loading social media logs, please wait." />}
      
      <Typography 
        variant="h4" 
        component="h1"
        sx={{ 
          mt: 2,
          fontWeight: 700,
          ...(accessibility.largeText && { fontSize: '2.5rem' }),
          ...(accessibility.highContrast 
            ? { color: themeColors.text }
            : {
                background: `linear-gradient(90deg, ${themeColors.primary} 0%, ${themeColors.accent} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }
          )
        }}
        id="social-media-logs-title"
      >
        Social Media Logs
      </Typography>

      {/* Error Message */}
      {error && (
        <Fade in={Boolean(error)} timeout={accessibility.reduceMotion ? 0 : 300}>
          <Alert 
            severity="error" 
            sx={{ 
              marginTop: 2,
              borderRadius: 1,
              '& .MuiAlert-icon': { alignItems: 'center' }
            }}
            role="alert"
          >
            {error}
          </Alert>
        </Fade>
      )}

      {/* Device Selector and Controls */}
      <Paper
        elevation={accessibility.highContrast ? 0 : 2}
        sx={{ 
          marginTop: 3, 
          padding: 3,
          backgroundColor: themeColors.card,
          border: accessibility.highContrast ? `2px solid ${themeColors.border}` : 'none',
          borderRadius: 1,
        }}
      >
        {/* Device Selector */}
        <FormControl 
          fullWidth
          variant="outlined"
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              borderRadius: 1,
              ...(accessibility.highContrast && {
                border: `2px solid ${themeColors.border}`,
                '& fieldset': { border: 'none' }
              })
            },
            ...(accessibility.largeText && {
              '& .MuiInputLabel-root': { fontSize: '1.1rem' },
              '& .MuiSelect-select': { fontSize: '1.1rem' }
            })
          }}
        >
          <InputLabel 
            id="device-select-label"
            sx={{
              color: themeColors.textSecondary,
              ...(accessibility.largeText && { fontSize: '1.1rem' })
            }}
          >
            Select Device
          </InputLabel>
          <Select
            labelId="device-select-label"
            id="device-select"
            value={selectedDevice}
            onChange={handleDeviceChange}
            label="Select Device"
            displayEmpty
            aria-labelledby="device-selector-title"
            aria-expanded="false"
            aria-disabled={loading || devices.length === 0}
          >
            {devices.length > 0 ? (
              devices.map((device) => (
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
              <MenuItem 
                disabled
                sx={{
                  ...(accessibility.largeText && { fontSize: '1.1rem' })
                }}
              >
                No devices found
              </MenuItem>
            )}
          </Select>
          <FormHelperText
            sx={{
              ...(accessibility.largeText && { fontSize: '0.9rem' })
            }}
          >
            Select a device to view its social media logs
          </FormHelperText>
        </FormControl>

        {/* Toggle Tabs for Messages & Call Logs */}
        <Tabs 
          value={viewType} 
          onChange={handleTabChange}
          aria-label="social media logs type selector"
          sx={{
            mb: 2,
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              ...(accessibility.largeText && { 
                fontSize: '1.1rem',
                py: 1.5
              }),
              ...(accessibility.highContrast && {
                border: '1px solid transparent',
                '&.Mui-selected': {
                  border: `1px solid ${themeColors.border}`,
                  borderBottom: 'none',
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                  fontWeight: 'bold'
                }
              })
            }
          }}
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <ChatIcon sx={{ mr: 1, ...(accessibility.largeText && { fontSize: '1.3rem' }) }} />
                Messages
              </Box>
            } 
            value="messages" 
            id="tab-messages"
            aria-controls="tabpanel-messages"
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CallIcon sx={{ mr: 1, ...(accessibility.largeText && { fontSize: '1.3rem' }) }} />
                Calls
              </Box>
            } 
            value="calls" 
            id="tab-calls"
            aria-controls="tabpanel-calls"
          />
        </Tabs>
      </Paper>

      {/* Content Based on Selected View */}
      <Box
        role="tabpanel"
        aria-labelledby={`tab-${viewType}`}
        id={`tabpanel-${viewType}`}
        sx={{ mt: 3, mb: 4 }}
      >
        {/* Loading Indicator */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress 
              aria-label="Loading data" 
              size={accessibility.largeText ? 60 : 40}
              sx={{
                ...(accessibility.highContrast && {
                  color: themeColors.text
                })
              }}
            />
          </Box>
        )}

        {/* Social Media Messages Table */}
        {!loading && viewType === "messages" && (
          <Fade in timeout={accessibility.reduceMotion ? 0 : 500}>
            <div>
              {messages.length > 0 ? (
                <TableContainer 
                  component={Paper}
                  elevation={accessibility.highContrast ? 0 : 2}
                  sx={{ 
                    borderRadius: 1,
                    border: accessibility.highContrast ? `2px solid ${themeColors.border}` : 'none'
                  }}
                >
                  <Table aria-label="Social media messages table">
                    <TableHead>
                      <TableRow
                        sx={{
                          backgroundColor: themeColors.tableHeader
                        }}
                      >
                        <TableCell 
                          sx={{ 
                            fontWeight: 'bold',
                            ...(accessibility.largeText && { fontSize: '1.1rem', padding: '16px' }),
                            ...(accessibility.highContrast && { 
                              borderBottom: `2px solid ${themeColors.border}` 
                            })
                          }}
                        >
                          Platform
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            fontWeight: 'bold',
                            ...(accessibility.largeText && { fontSize: '1.1rem', padding: '16px' }),
                            ...(accessibility.highContrast && { 
                              borderBottom: `2px solid ${themeColors.border}` 
                            })
                          }}
                        >
                          Sender
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            fontWeight: 'bold',
                            ...(accessibility.largeText && { fontSize: '1.1rem', padding: '16px' }),
                            ...(accessibility.highContrast && { 
                              borderBottom: `2px solid ${themeColors.border}` 
                            })
                          }}
                        >
                          Message
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            fontWeight: 'bold',
                            ...(accessibility.largeText && { fontSize: '1.1rem', padding: '16px' }),
                            ...(accessibility.highContrast && { 
                              borderBottom: `2px solid ${themeColors.border}` 
                            })
                          }}
                        >
                          Date
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {messages.map((msg, index) => (
                        <TableRow 
                          key={msg.id}
                          sx={{
                            backgroundColor: index % 2 === 0 ? 'transparent' : themeColors.tableRow,
                            '&:hover': {
                              backgroundColor: `${themeColors.primary}10`,
                            }
                          }}
                        >
                          <TableCell
                            sx={{
                              ...(accessibility.largeText && { fontSize: '1.1rem', padding: '16px' }),
                              ...(accessibility.highContrast && { 
                                borderBottom: `1px solid ${themeColors.border}` 
                              })
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {getPlatformIcon(msg.platform)}
                              <Typography
                                component="span"
                                sx={{
                                  ...(accessibility.largeText && { fontSize: '1.1rem' }),
                                }}
                              >
                                {msg.platform}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell
                            sx={{
                              ...(accessibility.largeText && { fontSize: '1.1rem', padding: '16px' }),
                              ...(accessibility.highContrast && { 
                                borderBottom: `1px solid ${themeColors.border}` 
                              })
                            }}
                          >
                            {msg.sender}
                          </TableCell>
                          <TableCell
                            sx={{
                              maxWidth: '250px',
                              overflowWrap: 'break-word',
                              ...(accessibility.largeText && { fontSize: '1.1rem', padding: '16px' }),
                              ...(accessibility.highContrast && { 
                                borderBottom: `1px solid ${themeColors.border}` 
                              })
                            }}
                          >
                            {msg.message}
                          </TableCell>
                          <TableCell
                            sx={{
                              whiteSpace: 'nowrap',
                              ...(accessibility.largeText && { fontSize: '1.1rem', padding: '16px' }),
                              ...(accessibility.highContrast && { 
                                borderBottom: `1px solid ${themeColors.border}` 
                              })
                            }}
                          >
                            {new Date(msg.timestamp).toLocaleString()}
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
                    textAlign: 'center',
                    border: accessibility.highContrast ? `2px solid ${themeColors.border}` : 'none',
                    borderRadius: 1,
                  }}
                >
                  <Typography 
                    variant="body1"
                    sx={{
                      color: themeColors.textSecondary,
                      ...(accessibility.largeText && { fontSize: '1.1rem' })
                    }}
                  >
                    No social media messages found for this device.
                  </Typography>
                </Paper>
              )}
            </div>
          </Fade>
        )}

        {/* Social Media Call Logs Table */}
        {!loading && viewType === "calls" && (
          <Fade in timeout={accessibility.reduceMotion ? 0 : 500}>
            <div>
              {callLogs.length > 0 ? (
                <TableContainer 
                  component={Paper}
                  elevation={accessibility.highContrast ? 0 : 2}
                  sx={{ 
                    borderRadius: 1,
                    border: accessibility.highContrast ? `2px solid ${themeColors.border}` : 'none'
                  }}
                >
                  <Table aria-label="Social media call logs table">
                    <TableHead>
                      <TableRow
                        sx={{
                          backgroundColor: themeColors.tableHeader
                        }}
                      >
                        <TableCell 
                          sx={{ 
                            fontWeight: 'bold',
                            ...(accessibility.largeText && { fontSize: '1.1rem', padding: '16px' }),
                            ...(accessibility.highContrast && { 
                              borderBottom: `2px solid ${themeColors.border}` 
                            })
                          }}
                        >
                          Platform
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            fontWeight: 'bold',
                            ...(accessibility.largeText && { fontSize: '1.1rem', padding: '16px' }),
                            ...(accessibility.highContrast && { 
                              borderBottom: `2px solid ${themeColors.border}` 
                            })
                          }}
                        >
                          Contact
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            fontWeight: 'bold',
                            ...(accessibility.largeText && { fontSize: '1.1rem', padding: '16px' }),
                            ...(accessibility.highContrast && { 
                              borderBottom: `2px solid ${themeColors.border}` 
                            })
                          }}
                        >
                          Type
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            fontWeight: 'bold',
                            ...(accessibility.largeText && { fontSize: '1.1rem', padding: '16px' }),
                            ...(accessibility.highContrast && { 
                              borderBottom: `2px solid ${themeColors.border}` 
                            })
                          }}
                        >
                          Duration
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            fontWeight: 'bold',
                            ...(accessibility.largeText && { fontSize: '1.1rem', padding: '16px' }),
                            ...(accessibility.highContrast && { 
                              borderBottom: `2px solid ${themeColors.border}` 
                            })
                          }}
                        >
                          Date
                        </TableCell>
                        <TableCell 
                          sx={{ 
                            fontWeight: 'bold',
                            ...(accessibility.largeText && { fontSize: '1.1rem', padding: '16px' }),
                            ...(accessibility.highContrast && { 
                              borderBottom: `2px solid ${themeColors.border}` 
                            })
                          }}
                        >
                          Recording
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {callLogs.map((log, index) => (
                        <TableRow 
                          key={log.id}
                          sx={{
                            backgroundColor: index % 2 === 0 ? 'transparent' : themeColors.tableRow,
                            '&:hover': {
                              backgroundColor: `${themeColors.primary}10`,
                            }
                          }}
                        >
                          <TableCell
                            sx={{
                              ...(accessibility.largeText && { fontSize: '1.1rem', padding: '16px' }),
                              ...(accessibility.highContrast && { 
                                borderBottom: `1px solid ${themeColors.border}` 
                              })
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {getPlatformIcon(log.platform)}
                              <Typography
                                component="span"
                                sx={{
                                  ...(accessibility.largeText && { fontSize: '1.1rem' }),
                                }}
                              >
                                {log.platform}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell
                            sx={{
                              ...(accessibility.largeText && { fontSize: '1.1rem', padding: '16px' }),
                              ...(accessibility.highContrast && { 
                                borderBottom: `1px solid ${themeColors.border}` 
                              })
                            }}
                          >
                            {log.contact_number || "Unknown Contact"}
                          </TableCell>
                          <TableCell
                            sx={{
                              ...(accessibility.largeText && { fontSize: '1.1rem', padding: '16px' }),
                              ...(accessibility.highContrast && { 
                                borderBottom: `1px solid ${themeColors.border}` 
                              })
                            }}
                          >
                            <Chip 
                              label={log.call_type} 
                              color={log.call_type.toLowerCase() === "incoming" ? "success" : "info"}
                              size={accessibility.largeText ? "medium" : "small"}
                              sx={{
                                fontWeight: 500,
                                ...(accessibility.largeText && { fontSize: '1rem' }),
                                ...(accessibility.highContrast && {
                                  border: `1px solid ${themeColors.border}`,
                                  color: themeColors.text,
                                  backgroundColor: 'transparent'
                                })
                              }}
                            />
                          </TableCell>
                          <TableCell
                            sx={{
                              ...(accessibility.largeText && { fontSize: '1.1rem', padding: '16px' }),
                              ...(accessibility.highContrast && { 
                                borderBottom: `1px solid ${themeColors.border}` 
                              })
                            }}
                          >
                            <Typography
                              component="span"
                              aria-label={formatDuration(log.duration)}
                            >
                              {log.duration ? `${log.duration} sec` : "N/A"}
                            </Typography>
                          </TableCell>
                          <TableCell
                            sx={{
                              whiteSpace: 'nowrap',
                              ...(accessibility.largeText && { fontSize: '1.1rem', padding: '16px' }),
                              ...(accessibility.highContrast && { 
                                borderBottom: `1px solid ${themeColors.border}` 
                              })
                            }}
                          >
                            {new Date(log.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell
                            sx={{
                              ...(accessibility.largeText && { fontSize: '1.1rem', padding: '16px' }),
                              ...(accessibility.highContrast && { 
                                borderBottom: `1px solid ${themeColors.border}` 
                              })
                            }}
                          >
                            {log.file_url ? (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                {/* Hidden audio element for programmatic control */}
                                <audio id={`audio-${log.id}`}>
                                  <source src={log.file_url} type="audio/mpeg" />
                                  Your browser does not support the audio element.
                                </audio>
                                
                                {/* Accessible play/pause controls */}
                                {currentlyPlaying === `audio-${log.id}` ? (
                                  <Tooltip title="Stop playback">
                                    <IconButton
                                      onClick={() => handleStopAudio(`audio-${log.id}`)}
                                      aria-label={`Stop playing recording from ${log.contact_number}`}
                                      size={accessibility.largeText ? "large" : "medium"}
                                      sx={{
                                        ...(accessibility.highContrast && {
                                          border: `1px solid ${themeColors.border}`,
                                          borderRadius: '4px'
                                        })
                                      }}
                                    >
                                      <StopIcon sx={{
                                        color: themeColors.primary,
                                        ...(accessibility.largeText && { fontSize: '1.5rem' })
                                      }} />
                                    </IconButton>
                                  </Tooltip>
                                ) : (
                                  <Tooltip title="Play recording">
                                    <IconButton
                                      onClick={() => handlePlayAudio(`audio-${log.id}`)}
                                      aria-label={`Play recording from ${log.contact_number}`}
                                      size={accessibility.largeText ? "large" : "medium"}
                                      sx={{
                                        ...(accessibility.highContrast && {
                                          border: `1px solid ${themeColors.border}`,
                                          borderRadius: '4px'
                                        })
                                      }}
                                    >
                                      <PlayArrowIcon sx={{
                                        color: themeColors.primary,
                                        ...(accessibility.largeText && { fontSize: '1.5rem' })
                                      }} />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                
                                <Typography
                                  variant="body2"
                                  component="span"
                                  sx={{
                                    ml: 1,
                                    ...(accessibility.largeText && { fontSize: '1rem' })
                                  }}
                                >
                                  {currentlyPlaying === `audio-${log.id}` ? "Playing..." : "Recording available"}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography
                                variant="body2"
                                component="span"
                                sx={{
                                  color: themeColors.textSecondary,
                                  ...(accessibility.largeText && { fontSize: '1rem' })
                                }}
                              >
                                No recording
                              </Typography>
                            )}
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
                    textAlign: 'center',
                    border: accessibility.highContrast ? `2px solid ${themeColors.border}` : 'none',
                    borderRadius: 1,
                  }}
                >
                  <Typography 
                    variant="body1"
                    sx={{
                      color: themeColors.textSecondary,
                      ...(accessibility.largeText && { fontSize: '1.1rem' })
                    }}
                  >
                    No social media call logs found for this device.
                  </Typography>
                </Paper>
              )}
            </div>
          </Fade>
        )}
      </Box>
    </Container>
  );
};

export default SocialMediaLogs;
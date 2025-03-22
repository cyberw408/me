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
  Avatar,
  SelectChangeEvent,
  useTheme as useMuiTheme,
} from "@mui/material";
import { useTheme } from "../context/ThemeContext";
import AccessibilityAnnouncement from "../components/AccessibilityAnnouncement";
import 'remixicon/fonts/remixicon.css';

// ✅ Define Device & Contact Interfaces
interface Device {
  device_id: string;
  device_name: string;
}

interface Contact {
  id: string;
  contact_name?: string;
  name: string;
  phone_number: string;
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

const ContactAccess = () => {
  // ✅ Properly Typed States
  const [contacts, setContacts] = useState<Contact[]>([]);
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

  // ✅ Fetch Contacts (Memoized with token)
const fetchContacts = useCallback((deviceId: string) => {
  const token = localStorage.getItem("token");

  if (!token) {
    setError("Unauthorized: Please log in again.");
    window.location.href = "/login";
    return;
  }
  
  setLoading(true);
  
  // Update accessibility announcement for screen readers
  const deviceName = devices.find(d => d.device_id === deviceId)?.device_name || "selected device";
  setAnnouncement(`Loading contacts for ${deviceName}...`);

  axios
    .get<{ contact_access: Contact[] }>(`/api/tracker/device/contacts/?device_id=${deviceId}`, {
      headers: { Authorization: `Token ${token}` },
    })
    .then((response) => {
      console.log("✅ Fetched contacts:", response.data);

      if (Array.isArray(response.data.contact_access)) {
        // ✅ Transform API response to match UI requirements
        const formattedContacts: Contact[] = response.data.contact_access.map((contact) => ({
          id: contact.id.toString(), // Ensure ID is a string
          contact_name: contact.contact_name, // ✅ Keep original API field
          name: contact.contact_name || "Unknown", // ✅ Provide fallback for UI
          phone_number: contact.phone_number,
        }));

        setContacts(formattedContacts);
        setAnnouncement(`Loaded ${formattedContacts.length} contacts for ${deviceName}.`);
        setError(null);
      } else {
        setError("Invalid API response format.");
        setAnnouncement(`Error: Invalid API response format when loading contacts.`);
        setContacts([]);
      }
      setLoading(false);
    })
    .catch((error) => {
      console.error("❌ API Error:", error);
      if (error.response?.status === 401) {
        setError("Unauthorized: Invalid token. Please log in again.");
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else {
        setError("Error fetching contacts.");
      }
      setAnnouncement(`Error loading contacts. Please try again.`);
      setContacts([]);
      setLoading(false);
    });
}, [devices]);



  // ✅ Fetch Devices (Memoized)
  const fetchDevices = useCallback(() => {
    const token = localStorage.getItem("token");

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
            fetchContacts(firstDeviceId);
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
  }, [fetchContacts]);

  // ✅ Fetch Devices on Mount
  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // ✅ Fetch Contacts when selectedDevice changes
  useEffect(() => {
    if (selectedDevice) {
      fetchContacts(selectedDevice);
    }
  }, [selectedDevice, fetchContacts]);

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
          Device Contact List
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{
            fontSize: accessibility.largeText ? '1.1rem' : '1rem',
            lineHeight: 1.5
          }}
        >
          View contact information from monitored devices
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
              fetchContacts(deviceId);
              // Announce device selection to screen readers
              const selectedDeviceName = devices.find(d => d.device_id === deviceId)?.device_name || "Unknown device";
              setAnnouncement(`Selected device: ${selectedDeviceName}. Loading contacts.`);
            }}
            label="Device"
            aria-label="Select a device to view contacts"
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

      {/* Contacts List */}
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
            <i className="ri-contacts-book-line" style={{ color: themeColors.cardHeader, fontSize: '1.3rem' }}></i>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600,
                fontSize: accessibility.largeText ? '1.3rem' : '1.125rem'
              }}
            >
              Contacts
            </Typography>
          </Box>
          
          {loading ? (
            <Box 
              sx={{ p: 4, textAlign: 'center' }}
              role="status"
              aria-live="polite"
              aria-label="Loading contacts"
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
                Loading contacts...
              </Typography>
              {/* Hidden text for screen readers with more details */}
              <span className="sr-only">
                Please wait while we fetch the contacts for the selected device.
              </span>
            </Box>
          ) : contacts.length > 0 ? (
            <TableContainer>
              <Table 
                aria-label="Device contacts"
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
                        <i className="ri-user-line"></i>
                        Contact Name
                      </Box>
                    </TableCell>
                    <TableCell sx={{ 
                      fontWeight: 'bold',
                      fontSize: accessibility.largeText ? '1.1rem' : 'inherit',
                      color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <i className="ri-phone-line"></i>
                        Phone Number
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow 
                      key={contact.id}
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
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 2
                        }}>
                          <Avatar
                            sx={{ 
                              bgcolor: `${themeColors.primary}30`,
                              color: themeColors.primary,
                              width: accessibility.largeText ? 40 : 32,
                              height: accessibility.largeText ? 40 : 32,
                              ...(accessibility.highContrast && {
                                bgcolor: 'transparent',
                                border: `2px solid ${themeColors.primary}`,
                              })
                            }}
                          >
                            <i className="ri-user-line"></i>
                          </Avatar>
                          {contact.name}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={<i className="ri-phone-line" style={{ fontSize: '1rem' }}></i>}
                          label={contact.phone_number}
                          variant="outlined"
                          sx={{
                            borderColor: themeColors.secondary,
                            color: themeColors.secondary,
                            ...(accessibility.highContrast && {
                              borderColor: muiTheme.palette.text.primary,
                              color: muiTheme.palette.text.primary,
                              borderWidth: 2
                            }),
                            ...(accessibility.largeText && {
                              height: 36,
                              '& .MuiChip-label': {
                                fontSize: '1rem'
                              }
                            })
                          }}
                        />
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
              <i className="ri-contacts-book-line" style={{ fontSize: '3rem', opacity: 0.5, marginBottom: '16px' }}></i>
              <Typography 
                sx={{ 
                  fontSize: accessibility.largeText ? '1.2rem' : '1rem',
                  mt: 2 
                }}
              >
                No contacts available for this device.
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
                When contacts are synced from the monitored device, they will appear here.
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default ContactAccess;

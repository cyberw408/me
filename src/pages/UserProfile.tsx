import React, { useEffect, useState, ChangeEvent, KeyboardEvent } from "react";
import axios from "axios";
import { 
  Container, 
  TextField, 
  Button, 
  Typography, 
  Alert, 
  Paper, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Divider, 
  CircularProgress,
  IconButton,
  InputAdornment,
  Snackbar,
  useTheme as useMuiTheme,
  Tooltip,
  LinearProgress
} from "@mui/material";
import { Visibility, VisibilityOff, Save, Lock } from '@mui/icons-material';
import { useTheme } from "../context/ThemeContext";
import AccessibilityAnnouncement from "../components/AccessibilityAnnouncement";

// Define additional theme color constants for UI components and their TypeScript interface
interface ThemeExtras {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  gradient: string;
  // Additional custom properties
  card: string;
  border: string;
  input: string;
  headingSecondary: string;
  cardHeader: string;
  textSecondary: string;
  tableHeader: string;
  tableRow: string;
}

interface UserData {
  name: string;
  email: string;
  phone: string;
}

const UserProfile = () => {
  // Theme context for colors and accessibility
  const { colors, accessibility } = useTheme();
  const muiTheme = useMuiTheme();
  
  // Create customized theme colors object with accessibility support
  const themeColors: ThemeExtras = {
    // Base theme properties
    primary: colors.primary,
    secondary: colors.secondary,
    accent: colors.accent || colors.secondary,
    background: colors.background,
    surface: colors.surface,
    text: colors.text || '#212121',
    gradient: colors.gradient,
    
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

  // User data state
  const [userData, setUserData] = useState<UserData>({
    name: "",
    email: "",
    phone: "",
  });

  // UI state
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [profileSaving, setProfileSaving] = useState<boolean>(false);
  const [announcement, setAnnouncement] = useState<string>("");
  
  // Password visibility state
  const [showOldPassword, setShowOldPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Change Password State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState<boolean>(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Accessibility announcement effect
  useEffect(() => {
    if (announcement) {
      // The announcement will be read by screen readers
      setTimeout(() => setAnnouncement(""), 3000);
    }
  }, [announcement]);

  // Keyboard shortcuts for form navigation and submission
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      // Alt+S to save profile
      if (e.altKey && e.key === 's' && !profileSaving) {
        e.preventDefault();
        handleUpdateProfile();
        setAnnouncement("Saving profile with keyboard shortcut Alt+S");
      }
      
      // Alt+P to focus password section
      if (e.altKey && e.key === 'p') {
        e.preventDefault();
        const passwordSection = document.getElementById('password-section');
        if (passwordSection) {
          passwordSection.focus();
          setAnnouncement("Password section focused. Press Tab to navigate password fields.");
        }
      }
      
      // Alt+C to change password
      if (e.altKey && e.key === 'c' && !passwordSaving) {
        e.preventDefault();
        handleChangePassword();
        setAnnouncement("Changing password with keyboard shortcut Alt+C");
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [profileSaving, passwordSaving]);

  // ✅ Fetch User Profile with accessibility support
  const fetchUserProfile = () => {
    setLoading(true);
    setAnnouncement("Loading your profile information...");
    
    const token = localStorage.getItem("token");

    if (!token) {
      setError("Unauthorized: Token missing. Please log in.");
      setAnnouncement("Authentication error. Please log in to view your profile.");
      window.location.href = "/login";
      return;
    }

    axios
      .get("https://62.72.13.91/api/tracker/user/profile/", {
        headers: { Authorization: `Token ${token}` },
      })
      .then((response) => {
        console.log("✅ Fetched user profile:", response.data);
        setUserData(response.data);
        setAnnouncement("Profile loaded successfully. You can now edit your information.");
      })
      .catch((err) => {
        console.error("❌ API Error (Fetching Profile):", err);
        setError("Failed to fetch user profile.");
        setAnnouncement("Error loading your profile. Please try again later.");
        
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // ✅ Handle Input Changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  // ✅ Update User Profile with accessibility support
  const handleUpdateProfile = () => {
    setError(null);
    setMessage(null);
    setProfileSaving(true);
    setAnnouncement("Saving your profile information...");

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Unauthorized: Please log in.");
      setAnnouncement("Authentication error. Please log in to update your profile.");
      window.location.href = "/login";
      return;
    }

    // Basic input validation with accessibility feedback
    if (!userData.name.trim()) {
      setError("Name is required.");
      setAnnouncement("Error: Name field cannot be empty.");
      setProfileSaving(false);
      return;
    }

    if (!userData.email.trim()) {
      setError("Email is required.");
      setAnnouncement("Error: Email field cannot be empty.");
      setProfileSaving(false);
      return;
    }

    axios
      .post(
        "https://62.72.13.91/api/tracker/profile/update/",
        userData,
        {
          headers: { Authorization: `Token ${token}` },
        }
      )
      .then((response) => {
        console.log("✅ Profile updated successfully:", response.data);
        setMessage("Profile updated successfully!");
        setAnnouncement("Your profile has been updated successfully!");
      })
      .catch((err) => {
        console.error("❌ API Error (Updating Profile):", err);
        const errorMessage = err.response?.data?.error || "Failed to update profile.";
        setError(errorMessage);
        setAnnouncement(`Error: ${errorMessage}`);
        
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
      })
      .finally(() => {
        setProfileSaving(false);
      });
  };

  // ✅ Change Password with accessibility support
  const handleChangePassword = () => {
    setError(null);
    setMessage(null);
    setPasswordSaving(true);
    setAnnouncement("Verifying and changing your password...");

    // Validation with accessibility feedback
    if (!oldPassword) {
      setError("Current password is required.");
      setAnnouncement("Error: Please enter your current password.");
      setPasswordSaving(false);
      return;
    }

    if (!newPassword) {
      setError("New password is required.");
      setAnnouncement("Error: Please enter your new password.");
      setPasswordSaving(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      setAnnouncement("Error: New password and confirmation do not match. Please try again.");
      setPasswordSaving(false);
      return;
    }

    // Simple password strength check
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      setAnnouncement("Error: Password must be at least 8 characters long for security.");
      setPasswordSaving(false);
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("Unauthorized: Please log in.");
      setAnnouncement("Authentication error. Please log in to change your password.");
      window.location.href = "/login";
      return;
    }

    axios
      .post(
        "https://62.72.13.91/api/tracker/change-password/",
        {
          old_password: oldPassword,
          new_password: newPassword,
        },
        { headers: { Authorization: `Token ${token}` } }
      )
      .then((response) => {
        console.log("✅ Password changed successfully:", response.data);
        setMessage("Password changed successfully!");
        setAnnouncement("Your password has been changed successfully. Your account is now secure with the new password.");
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
      })
      .catch((err) => {
        console.error("❌ API Error (Changing Password):", err);
        const errorMessage = err.response?.data?.error || "Failed to change password.";
        setError(errorMessage);
        setAnnouncement(`Error: ${errorMessage}`);
        
        if (err.response?.status === 401) {
          setError("Current password is incorrect.");
          setAnnouncement("Error: Your current password appears to be incorrect. Please try again.");
        }
      })
      .finally(() => {
        setPasswordSaving(false);
      });
  };

  return (
    <Container sx={{ 
      padding: 3,
      backgroundColor: themeColors.background,
      color: themeColors.text,
      borderRadius: 2
    }}>
      {/* Accessibility announcement */}
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
        User Profile
      </Typography>

      {/* Messages and Errors */}
      {message && (
        <Alert 
          severity="success" 
          sx={{ 
            marginY: 2,
            backgroundColor: accessibility.highContrast ? '#004400' : undefined,
            color: accessibility.highContrast ? '#ffffff' : undefined
          }}
          role="status"
          aria-live="polite"
        >
          {message}
        </Alert>
      )}
      
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

      {/* Profile Info Card */}
      <Card 
        sx={{ 
          marginY: 3, 
          backgroundColor: themeColors.surface,
          borderRadius: 2,
          border: accessibility.highContrast ? `2px solid ${themeColors.primary}` : 'none'
        }}
      >
        <CardContent>
          <Typography 
            variant="h6" 
            component="h2"
            sx={{ 
              marginBottom: 2,
              color: themeColors.secondary,
              fontSize: accessibility.largeText ? '1.3rem' : '1.1rem',
              fontWeight: 'bold'
            }}
          >
            Personal Information
          </Typography>
          
          {/* Loading progress */}
          {loading && (
            <Box sx={{ width: '100%', marginY: 2 }}>
              <LinearProgress 
                color="primary" 
                aria-label="Loading profile" 
              />
            </Box>
          )}
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Name"
                name="name"
                fullWidth
                margin="normal"
                value={userData.name}
                onChange={handleInputChange}
                required
                inputProps={{
                  'aria-label': 'Your name',
                  'aria-required': 'true'
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: accessibility.highContrast ? themeColors.primary : undefined,
                      borderWidth: accessibility.highContrast ? 2 : undefined
                    },
                    '&:hover fieldset': {
                      borderColor: accessibility.highContrast ? themeColors.primary : undefined
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: themeColors.primary
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: themeColors.text,
                    fontSize: accessibility.largeText ? '1.1rem' : undefined
                  },
                  '& .MuiInputBase-input': {
                    fontSize: accessibility.largeText ? '1.1rem' : undefined
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Email"
                name="email"
                type="email"
                fullWidth
                margin="normal"
                value={userData.email}
                onChange={handleInputChange}
                required
                inputProps={{
                  'aria-label': 'Your email address',
                  'aria-required': 'true'
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: accessibility.highContrast ? themeColors.primary : undefined,
                      borderWidth: accessibility.highContrast ? 2 : undefined
                    },
                    '&:hover fieldset': {
                      borderColor: accessibility.highContrast ? themeColors.primary : undefined
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: themeColors.primary
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: themeColors.text,
                    fontSize: accessibility.largeText ? '1.1rem' : undefined
                  },
                  '& .MuiInputBase-input': {
                    fontSize: accessibility.largeText ? '1.1rem' : undefined
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Phone"
                name="phone"
                type="tel"
                fullWidth
                margin="normal"
                value={userData.phone}
                onChange={handleInputChange}
                inputProps={{
                  'aria-label': 'Your phone number'
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: accessibility.highContrast ? themeColors.primary : undefined,
                      borderWidth: accessibility.highContrast ? 2 : undefined
                    },
                    '&:hover fieldset': {
                      borderColor: accessibility.highContrast ? themeColors.primary : undefined
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: themeColors.primary
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: themeColors.text,
                    fontSize: accessibility.largeText ? '1.1rem' : undefined
                  },
                  '& .MuiInputBase-input': {
                    fontSize: accessibility.largeText ? '1.1rem' : undefined
                  }
                }}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpdateProfile}
              disabled={profileSaving}
              startIcon={profileSaving ? <CircularProgress size={20} /> : <Save />}
              aria-label="Save profile changes"
              sx={{ 
                padding: accessibility.largeText ? '12px 24px' : '8px 22px',
                fontSize: accessibility.largeText ? '1rem' : '0.875rem',
                backgroundColor: accessibility.highContrast ? '#00008B' : undefined,
                '&:hover': {
                  backgroundColor: accessibility.highContrast ? '#000066' : undefined
                },
                '&.Mui-disabled': {
                  backgroundColor: accessibility.highContrast ? '#666666' : undefined,
                  color: accessibility.highContrast ? '#cccccc' : undefined
                }
              }}
            >
              {profileSaving ? "Saving..." : "Update Profile"}
            </Button>
            
            <Tooltip title="Press Alt+S to save your profile" arrow>
              <Typography 
                variant="body2"
                sx={{ 
                  border: `1px dashed ${themeColors.secondary}`,
                  padding: '4px 8px',
                  borderRadius: 1,
                  fontSize: accessibility.largeText ? '0.9rem' : '0.75rem',
                  color: themeColors.secondary
                }}
              >
                Keyboard: Alt+S
              </Typography>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>

      {/* Change Password Section */}
      <Card 
        sx={{ 
          marginY: 3, 
          backgroundColor: themeColors.surface,
          borderRadius: 2,
          border: accessibility.highContrast ? `2px solid ${themeColors.secondary}` : 'none'
        }}
      >
        <CardContent>
          <Typography 
            variant="h6" 
            component="h2"
            id="password-section"
            tabIndex={-1}
            sx={{ 
              marginBottom: 2,
              color: themeColors.secondary,
              fontSize: accessibility.largeText ? '1.3rem' : '1.1rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <Lock fontSize="small" />
            Change Password
          </Typography>
          
          <Divider sx={{ marginY: 2 }} />
          
          <TextField
            label="Current Password"
            type={showOldPassword ? "text" : "password"}
            fullWidth
            margin="normal"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showOldPassword ? "Hide current password" : "Show current password"}
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    edge="end"
                  >
                    {showOldPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
            inputProps={{
              'aria-label': 'Your current password',
              'aria-required': 'true'
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: accessibility.highContrast ? themeColors.secondary : undefined,
                  borderWidth: accessibility.highContrast ? 2 : undefined
                },
                '&:hover fieldset': {
                  borderColor: accessibility.highContrast ? themeColors.secondary : undefined
                },
                '&.Mui-focused fieldset': {
                  borderColor: themeColors.secondary
                }
              },
              '& .MuiInputLabel-root': {
                color: themeColors.text,
                fontSize: accessibility.largeText ? '1.1rem' : undefined
              },
              '& .MuiInputBase-input': {
                fontSize: accessibility.largeText ? '1.1rem' : undefined
              }
            }}
          />
          
          <TextField
            label="New Password"
            type={showNewPassword ? "text" : "password"}
            fullWidth
            margin="normal"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    edge="end"
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
            inputProps={{
              'aria-label': 'Your new password',
              'aria-required': 'true'
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: accessibility.highContrast ? themeColors.secondary : undefined,
                  borderWidth: accessibility.highContrast ? 2 : undefined
                },
                '&:hover fieldset': {
                  borderColor: accessibility.highContrast ? themeColors.secondary : undefined
                },
                '&.Mui-focused fieldset': {
                  borderColor: themeColors.secondary
                }
              },
              '& .MuiInputLabel-root': {
                color: themeColors.text,
                fontSize: accessibility.largeText ? '1.1rem' : undefined
              },
              '& .MuiInputBase-input': {
                fontSize: accessibility.largeText ? '1.1rem' : undefined
              }
            }}
          />
          
          <TextField
            label="Confirm New Password"
            type={showConfirmPassword ? "text" : "password"}
            fullWidth
            margin="normal"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label={showConfirmPassword ? "Hide confirmed password" : "Show confirmed password"}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
            inputProps={{
              'aria-label': 'Confirm your new password',
              'aria-required': 'true'
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: accessibility.highContrast ? themeColors.secondary : undefined,
                  borderWidth: accessibility.highContrast ? 2 : undefined
                },
                '&:hover fieldset': {
                  borderColor: accessibility.highContrast ? themeColors.secondary : undefined
                },
                '&.Mui-focused fieldset': {
                  borderColor: themeColors.secondary
                }
              },
              '& .MuiInputLabel-root': {
                color: themeColors.text,
                fontSize: accessibility.largeText ? '1.1rem' : undefined
              },
              '& .MuiInputBase-input': {
                fontSize: accessibility.largeText ? '1.1rem' : undefined
              }
            }}
            helperText="Password must be at least 8 characters long"
            FormHelperTextProps={{
              sx: { fontSize: accessibility.largeText ? '0.9rem' : '0.75rem' }
            }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 3 }}>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleChangePassword}
              disabled={passwordSaving}
              startIcon={passwordSaving ? <CircularProgress size={20} /> : <Lock />}
              aria-label="Change password"
              sx={{ 
                padding: accessibility.largeText ? '12px 24px' : '8px 22px',
                fontSize: accessibility.largeText ? '1rem' : '0.875rem',
                backgroundColor: accessibility.highContrast ? '#800080' : undefined,
                '&:hover': {
                  backgroundColor: accessibility.highContrast ? '#600060' : undefined
                },
                '&.Mui-disabled': {
                  backgroundColor: accessibility.highContrast ? '#666666' : undefined,
                  color: accessibility.highContrast ? '#cccccc' : undefined
                }
              }}
            >
              {passwordSaving ? "Changing..." : "Change Password"}
            </Button>
            
            <Tooltip title="Press Alt+C to change your password" arrow>
              <Typography 
                variant="body2"
                sx={{ 
                  border: `1px dashed ${themeColors.secondary}`,
                  padding: '4px 8px',
                  borderRadius: 1,
                  fontSize: accessibility.largeText ? '0.9rem' : '0.75rem',
                  color: themeColors.secondary
                }}
              >
                Keyboard: Alt+C
              </Typography>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>
      
      {/* Keyboard Accessibility Instructions */}
      <Box 
        sx={{ 
          marginTop: 4, 
          padding: 2, 
          backgroundColor: themeColors.surface,
          borderRadius: 2,
          border: `1px solid ${themeColors.secondary}`
        }}
      >
        <Typography 
          variant="h6"
          component="h2"
          sx={{ 
            marginBottom: 1,
            color: themeColors.secondary,
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
            <li><strong>Alt+S</strong>: Save profile changes</li>
            <li><strong>Alt+P</strong>: Jump to password section</li>
            <li><strong>Alt+C</strong>: Change password</li>
            <li><strong>Tab</strong>: Navigate between form fields</li>
          </ul>
        </Typography>
      </Box>
    </Container>
  );
};

export default UserProfile;

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link as RouterLink } from "react-router-dom";
import { 
  Container, 
  TextField, 
  Button, 
  Typography, 
  Alert, 
  CircularProgress,
  Box,
  Paper,
  InputAdornment,
  Link,
  Divider,
  Fade,
  useTheme as useMuiTheme,
} from "@mui/material";
import "remixicon/fonts/remixicon.css";
import { useTheme } from "../context/ThemeContext";
import AccessibilityAnnouncement from "../components/AccessibilityAnnouncement";

const ForgotPassword = () => {
  const [email, setEmail] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Theme context for accessibility features
  const { colors, accessibility, themeMood } = useTheme();
  const muiTheme = useMuiTheme();
  
  // Combined theme colors with both original theme colors and custom extras
  const themeColors = {
    ...colors,
    primary: colors.primary,
    accent: colors.accent || colors.secondary,
    card: accessibility.highContrast ? 'transparent' : '#ffffff',
    border: accessibility.highContrast ? muiTheme.palette.text.primary : '#e0e0e0',
    input: accessibility.highContrast ? 'transparent' : colors.background || '#f5f5f5',
    headingSecondary: colors.secondary || '#666',
    cardHeader: '#f9f9f9',
    textSecondary: colors.secondary || '#666',
    text: colors.text || '#212121',
  };

  const validateEmail = (email: string): boolean => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleForgotPassword = async () => {
    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    setNewPassword(null);

    try {
      const response = await axios.post("https://62.72.13.91/api/tracker/forgot-password/", { email });
      setMessage(response.data.message);
      setNewPassword(response.data.new_password); // Show the new password in UI
    } catch (error: any) {
      setError("Failed to reset password: " + (error.response?.data?.error || "Unknown error."));
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleForgotPassword();
    }
  };

  // Effect to announce loading and errors to screen readers
  useEffect(() => {
    // Accessibility announcements are now handled by the AccessibilityAnnouncement component
    // which is declared in the return section of this component
  }, [loading, error, message]);

  return (
    <Container 
      maxWidth="sm" 
      sx={{ 
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: { xs: 2, sm: 3 }
      }}
    >
      {/* Accessibility announcer for screen readers */}
      {message && <AccessibilityAnnouncement message={message} />}
      {error && <AccessibilityAnnouncement message={error} assertive={true} />}
      {newPassword && <AccessibilityAnnouncement message="Password has been reset successfully. A new password has been generated." />}
      
      <Fade in={true} timeout={accessibility.reduceMotion ? 0 : 800}>
        <Paper 
          elevation={accessibility.highContrast ? 0 : 3} 
          sx={{
            padding: { xs: 3, sm: 4 },
            borderRadius: 2,
            backgroundColor: themeColors.card,
            border: accessibility.highContrast ? `2px solid ${themeColors.border}` : 'none',
          }}
          aria-labelledby="forgot-password-title"
        >
          {/* Logo and Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ 
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: accessibility.highContrast ? 'transparent' : `${themeColors.primary}15`,
              borderRadius: '50%',
              width: 72,
              height: 72,
              marginBottom: 2,
              border: accessibility.highContrast ? `2px solid ${themeColors.primary}` : 'none',
            }}
            aria-hidden="true"
            >
              <i className="ri-lock-unlock-line" style={{ 
                fontSize: '2.5rem', 
                color: themeColors.primary
              }}></i>
            </Box>
            <Typography 
              variant="h4" 
              component="h1" 
              id="forgot-password-title"
              sx={{ 
                fontWeight: 700,
                mb: 1,
                ...(accessibility.highContrast 
                  ? { color: themeColors.text }
                  : {
                      background: `linear-gradient(90deg, ${themeColors.primary} 0%, ${themeColors.accent} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }
                ),
                ...(accessibility.largeText && { fontSize: '2.5rem' })
              }}
            >
              Recover Password
            </Typography>
            <Typography 
              variant="body1" 
              color={themeColors.textSecondary}
              sx={{
                ...(accessibility.largeText && { fontSize: '1.1rem' })
              }}
            >
              Enter your email and we'll send you a new password
            </Typography>
          </Box>

          {/* Alerts */}
          {message && (
            <Fade in={Boolean(message)} timeout={accessibility.reduceMotion ? 0 : 300}>
              <Alert 
                severity="success" 
                sx={{ 
                  mb: 3, 
                  borderRadius: 1,
                  '& .MuiAlert-icon': { alignItems: 'center' }
                }}
                role="status"
              >
                {message}
              </Alert>
            </Fade>
          )}
          
          {newPassword && (
            <Fade in={Boolean(newPassword)} timeout={accessibility.reduceMotion ? 0 : 300}>
              <Alert 
                severity="info" 
                sx={{ 
                  mb: 3, 
                  borderRadius: 1,
                  '& .MuiAlert-icon': { alignItems: 'center' }
                }}
                role="status"
              >
                Your new password: <strong>{newPassword}</strong>
              </Alert>
            </Fade>
          )}
          
          {error && (
            <Fade in={Boolean(error)} timeout={accessibility.reduceMotion ? 0 : 300}>
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3, 
                  borderRadius: 1,
                  '& .MuiAlert-icon': { alignItems: 'center' }
                }}
                role="alert"
              >
                {error}
              </Alert>
            </Fade>
          )}

          {/* Password Reset Form */}
          <Box 
            component="form" 
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              handleForgotPassword();
            }}
          >
            <TextField
              label="Email Address"
              type="email"
              fullWidth
              margin="normal"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              autoFocus
              required
              aria-required="true"
              aria-invalid={!validateEmail(email) && email !== ''}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <i 
                      className="ri-mail-line" 
                      style={{ color: themeColors.textSecondary }}
                      aria-hidden="true"
                    ></i>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  ...(accessibility.highContrast && {
                    border: `2px solid ${themeColors.border}`,
                    '& fieldset': { border: 'none' }
                  })
                },
                ...(accessibility.largeText && {
                  '& .MuiInputLabel-root': { fontSize: '1.2rem' },
                  '& .MuiOutlinedInput-input': { fontSize: '1.2rem' }
                })
              }}
            />

            <Button
              variant="contained"
              fullWidth
              type="submit"
              onClick={handleForgotPassword}
              disabled={loading}
              aria-label="Reset password"
              aria-busy={loading}
              sx={{ 
                mt: 1, 
                mb: 2,
                py: accessibility.largeText ? 2 : 1.5, 
                borderRadius: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: accessibility.largeText ? '1.2rem' : '1rem',
                ...(accessibility.highContrast 
                  ? {
                      backgroundColor: themeColors.primary,
                      color: '#fff',
                      border: `2px solid ${themeColors.border}`,
                      '&:hover': {
                        backgroundColor: themeColors.accent,
                      }
                    }
                  : {
                      background: `linear-gradient(45deg, ${themeColors.primary} 30%, ${themeColors.accent} 90%)`,
                      boxShadow: '0 4px 20px 0 rgba(61, 71, 82, 0.1)',
                      '&:hover': {
                        background: `linear-gradient(45deg, ${themeColors.primary} 30%, ${themeColors.accent} 90%)`,
                        filter: 'brightness(0.9)',
                        boxShadow: '0 6px 20px rgba(61, 71, 82, 0.15)'
                      }
                    }
                )
              }}
            >
              {loading ? <CircularProgress size={24} aria-hidden="true" /> : "Reset Password"}
            </Button>

            <Divider 
              sx={{ 
                my: 3,
                ...(accessibility.highContrast && { 
                  backgroundColor: themeColors.border,
                  height: '2px'
                })
              }}
            >
              <Typography 
                variant="body2" 
                color={themeColors.textSecondary}
                sx={{
                  ...(accessibility.largeText && { fontSize: '1rem' })
                }}
              >
                OR
              </Typography>
            </Divider>

            {/* Back to Login Link */}
            <Box sx={{ textAlign: 'center' }}>
              <Link 
                component={RouterLink} 
                to="/login" 
                variant="body2"
                aria-label="Back to login page"
                sx={{ 
                  textDecoration: 'none',
                  color: themeColors.primary,
                  fontWeight: 500,
                  '&:hover': {
                    textDecoration: 'underline'
                  },
                  ...(accessibility.largeText && { fontSize: '1.1rem' }),
                  ...(accessibility.highContrast && { 
                    textDecoration: 'underline',
                    fontWeight: 600
                  })
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i 
                    className="ri-arrow-left-line" 
                    style={{ marginRight: '4px' }}
                    aria-hidden="true"
                  ></i>
                  Back to Login
                </Box>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Fade>
    </Container>
  );
};

export default ForgotPassword;

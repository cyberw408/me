import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { 
  Container, 
  TextField, 
  Button, 
  Typography, 
  Alert, 
  CircularProgress, 
  Link,
  Box,
  Paper,
  InputAdornment,
  IconButton,
  Divider,
  Fade,
  useTheme as useMuiTheme,
} from "@mui/material";
import { useTheme } from "../context/ThemeContext";
import "remixicon/fonts/remixicon.css";

// Define ThemeExtras interface for consistent theming
interface ThemeExtras {
  card: string;
  border: string;
  input: string;
  headingSecondary: string;
  cardHeader: string;
  textSecondary: string;
  accent: string;
}

const Login = ({
  setIsAuthenticated,
  setIsAdmin,
}: {
  setIsAuthenticated: (value: boolean) => void;
  setIsAdmin: (value: boolean) => void;
}) => {
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
    accent: colors.secondary || '#4caf50'
  };
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!username || !password) {
      setError("Both fields are required.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await axios.post("https://netramonitor.in/api/tracker/login/", { 
        username, 
        password 
      });

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);

        // Set authentication state
        setIsAuthenticated(true);

        // Check if user is Admin
        if (response.data.redirect === "/admin-dashboard/") {
          setIsAdmin(true);
          navigate("/admin-dashboard", { replace: true });
        } else {
          setIsAdmin(false);
          navigate("/dashboard", { replace: true });
        }

        // Show login success message
        setMessage(response.data.message || "Login successful! Redirecting...");
      }
    } catch (err) {
      console.error("Login error:", err);

      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.error || "Unknown error.";

        // Handle specific error messages
        if (errorMessage === "Invalid credentials") {
          setError("Incorrect username or password.");
        } else if (errorMessage === "User not found") {
          setError("No account found with this username.");
        } else if (errorMessage === "Admin approval pending") {
          setError("Your account is pending admin approval.");
        } else {
          setError("Login failed: " + errorMessage);
        }
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <Container maxWidth="sm" sx={{ 
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: { xs: 2, sm: 3 }
    }}>
      <Fade in={true} timeout={800}>
        <Paper elevation={accessibility.highContrast ? 0 : 3} sx={{
          padding: { xs: 3, sm: 4 },
          borderRadius: 2,
          backgroundColor: accessibility.highContrast ? 'transparent' : themeColors.card,
          border: accessibility.highContrast ? `2px solid ${muiTheme.palette.text.primary}` : `1px solid ${themeColors.border}`,
          boxShadow: accessibility.highContrast ? 'none' : '0 8px 24px rgba(0, 0, 0, 0.05)'
        }}>
          {/* Logo and Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box 
              sx={{ 
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: accessibility.highContrast ? 'transparent' : `${themeColors.primary}15`,
                borderRadius: '50%',
                width: 72,
                height: 72,
                marginBottom: 2,
                border: accessibility.highContrast ? `2px solid ${muiTheme.palette.text.primary}` : 'none'
              }}
              role="img"
              aria-label="Netra Monitor security logo"
              id="app-logo"
            >
              <i 
                className="ri-shield-keyhole-line" 
                aria-hidden="true"
                style={{ 
                  fontSize: '2.5rem', 
                  color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary
                }}
              ></i>
            </Box>
            <Box
              component="h1"
              id="login-title"
              sx={{ textAlign: 'center' }}
            >
              <Typography 
              variant="h4"
              sx={{ 
              fontWeight: 700,
              mb: 1,
              ...(accessibility.highContrast ? {
                color: muiTheme.palette.text.primary,
                textDecoration: 'underline',
                textUnderlineOffset: '5px'
              } : {
                background: `linear-gradient(90deg, ${themeColors.primary} 0%, ${themeColors.accent} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }),
              fontSize: accessibility.largeText ? '2.5rem' : '2rem',
            }}>
              Netra Monitor
            </Typography>
            </Box>
            <Box component="div">
            <Typography 
              variant="body1" 
              component="h2"
              align="center"
              id="login-subtitle"
              sx={{ 
                color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.textSecondary,
                fontWeight: accessibility.highContrast ? 500 : 400,
                fontSize: accessibility.largeText ? '1.1rem' : '1rem',
                marginBottom: '16px'
              }}
            >
              Sign in to access your monitoring dashboard
            </Typography>
            </Box>
          </Box>

          {/* Alerts */}
          {message && (
            <Fade in={Boolean(message)}>
              <Alert 
                severity="success" 
                role="status"
                aria-live="polite"
                id="login-success-message"
                sx={{ 
                  mb: 3, 
                  borderRadius: 1,
                  '& .MuiAlert-icon': { alignItems: 'center' },
                  ...(accessibility.highContrast ? {
                    backgroundColor: '#0f5132',
                    color: '#ffffff',
                    border: '2px solid #ffffff',
                    fontWeight: 600
                  } : {}),
                  ...(accessibility.largeText && {
                    fontSize: '1.1rem',
                    '& .MuiAlert-icon': { 
                      fontSize: '1.5rem' 
                    }
                  })
                }}
              >
                {message}
              </Alert>
            </Fade>
          )}
          
          {error && (
            <Fade in={Boolean(error)}>
              <Alert 
                severity="error" 
                role="alert"
                aria-live="assertive"
                id="login-error-message"
                sx={{ 
                  mb: 3, 
                  borderRadius: 1,
                  '& .MuiAlert-icon': { alignItems: 'center' },
                  ...(accessibility.highContrast ? {
                    backgroundColor: '#450a0a',
                    color: '#ffffff',
                    border: '2px solid #ffffff',
                    fontWeight: 600
                  } : {}),
                  ...(accessibility.largeText && {
                    fontSize: '1.1rem',
                    '& .MuiAlert-icon': { 
                      fontSize: '1.5rem' 
                    }
                  })
                }}
              >
                {error}
              </Alert>
            </Fade>
          )}

          {/* Login Form */}
          <Box 
            component="form" 
            noValidate
            role="form"
            aria-label="Login form"
            id="login-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}>
            <TextField
              label="Username"
              fullWidth
              margin="normal"
              variant="outlined"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              autoFocus
              aria-label="Username input"
              id="username-input"
              inputProps={{
                'aria-required': 'true',
                'aria-describedby': 'username-helper'
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <i className="ri-user-line" style={{ 
                      color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.textSecondary 
                    }}></i>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  bgcolor: accessibility.highContrast ? 'transparent' : themeColors.input,
                  ...(accessibility.highContrast && {
                    '& fieldset': {
                      borderWidth: '2px',
                      borderColor: muiTheme.palette.text.primary
                    }
                  })
                },
                '& .MuiInputLabel-root': {
                  color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.textSecondary,
                  ...(accessibility.largeText && {
                    fontSize: '1.1rem'
                  })
                },
                '& .MuiInputBase-input': {
                  ...(accessibility.largeText && {
                    fontSize: '1.1rem',
                    padding: '14px'
                  })
                }
              }}
            />
            
            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              margin="normal"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              aria-label="Password input"
              id="password-input"
              inputProps={{
                'aria-required': 'true',
                'aria-describedby': 'password-helper'
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <i className="ri-lock-2-line" style={{ 
                      color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.textSecondary 
                    }}></i>
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      <i 
                        className={showPassword ? "ri-eye-line" : "ri-eye-off-line"}
                        style={{ 
                          color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.textSecondary 
                        }}
                      ></i>
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  bgcolor: accessibility.highContrast ? 'transparent' : themeColors.input,
                  ...(accessibility.highContrast && {
                    '& fieldset': {
                      borderWidth: '2px',
                      borderColor: muiTheme.palette.text.primary
                    }
                  })
                },
                '& .MuiInputLabel-root': {
                  color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.textSecondary,
                  ...(accessibility.largeText && {
                    fontSize: '1.1rem'
                  })
                },
                '& .MuiInputBase-input': {
                  ...(accessibility.largeText && {
                    fontSize: '1.1rem',
                    padding: '14px'
                  })
                }
              }}
            />

            <Button
              variant="contained"
              fullWidth
              onClick={handleLogin}
              disabled={loading}
              aria-label="Sign in"
              id="login-button"
              role="button"
              aria-busy={loading}
              sx={{ 
                mt: 2, 
                mb: 2,
                py: 1.5, 
                borderRadius: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
                background: accessibility.highContrast 
                  ? muiTheme.palette.text.primary 
                  : `linear-gradient(45deg, ${themeColors.primary} 30%, ${themeColors.accent} 90%)`,
                color: accessibility.highContrast ? '#ffffff' : '#ffffff',
                boxShadow: accessibility.highContrast 
                  ? 'none' 
                  : '0 4px 20px 0 rgba(61, 71, 82, 0.1), 0 0 0 0 rgba(0, 127, 255, 0)',
                ...(accessibility.largeText && {
                  fontSize: '1.2rem',
                  padding: '16px'
                }),
                '&:hover': {
                  background: accessibility.highContrast 
                    ? muiTheme.palette.text.primary
                    : `linear-gradient(45deg, ${themeColors.primary} 20%, ${themeColors.accent} 100%)`,
                  boxShadow: accessibility.highContrast ? 'none' : '0 6px 20px rgba(61, 71, 82, 0.15)'
                }
              }}
            >
              {loading ? (
                <>
                  <CircularProgress size={24} />
                  <span className="sr-only" style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>
                    Loading, please wait...
                  </span>
                </>
              ) : "Sign In"}
            </Button>

            {/* Forgot Password Link */}
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link 
                component={RouterLink} 
                to="/forgot-password" 
                variant="body2"
                aria-label="Forgot password? Click to reset"
                sx={{ 
                  textDecoration: 'none',
                  color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary,
                  fontWeight: 500,
                  ...(accessibility.largeText && {
                    fontSize: '1.1rem'
                  }),
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                Forgot your password?
              </Link>
            </Box>

            <Divider sx={{ 
              my: 3,
              borderColor: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.border
            }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.textSecondary,
                  ...(accessibility.largeText && {
                    fontSize: '1rem'
                  })
                }}
              >
                OR
              </Typography>
            </Divider>

            {/* Register Link */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  display: 'inline',
                  color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.textSecondary,
                  ...(accessibility.largeText && {
                    fontSize: '1.1rem'
                  })
                }}
              >
                Don't have an account?{" "}
              </Typography>
              <Link 
                component={RouterLink} 
                to="/register" 
                variant="body2"
                aria-label="Register for a new account"
                sx={{ 
                  textDecoration: 'none',
                  color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary,
                  fontWeight: 500,
                  ...(accessibility.largeText && {
                    fontSize: '1.1rem'
                  }),
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                Register now
              </Link>
            </Box>
          </Box>
        </Paper>
      </Fade>
    </Container>
  );
};

export default Login;

import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate, Link as RouterLink } from "react-router-dom";
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
  IconButton,
  Divider,
  Fade,
  Link,
  useTheme as useMuiTheme,
} from "@mui/material";
import { useTheme } from "../context/ThemeContext";
import "remixicon/fonts/remixicon.css";

const Register = () => {
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  
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

  const handleRegister = async () => {
    // Reset error and message
    setError(null);
    setMessage(null);
    
    // Validate all fields
    if (!username || !email || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (!validateEmail(email)) {
      setError("Invalid email format.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      await axios.post("/api/tracker/register/", { username, email, password });
      setMessage("Registration successful. Awaiting admin approval.");
      
      // Optional: Redirect to login page after a delay
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      setError("Registration failed: " + (error.response?.data?.error || "Unknown error."));
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRegister();
    }
  };

  return (
    <Container maxWidth="sm" sx={{ 
      minHeight: '100vh',
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
                backgroundColor: accessibility.highContrast ? 'transparent' : 'rgba(33, 150, 243, 0.1)',
                borderRadius: '50%',
                width: accessibility.largeText ? 84 : 72,
                height: accessibility.largeText ? 84 : 72,
                marginBottom: 2,
                border: accessibility.highContrast ? `2px solid ${themeColors.primary}` : 'none'
              }}
              aria-hidden="true"
            >
              <i className="ri-user-add-line" style={{ 
                fontSize: accessibility.largeText ? '3rem' : '2.5rem', 
                color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary
              }}></i>
            </Box>
            <Typography 
              variant="h4" 
              component="h1" 
              id="register-title"
              sx={{ 
                fontWeight: 700,
                mb: 1,
                fontSize: accessibility.largeText ? '2.5rem' : '2rem',
                ...(accessibility.highContrast ? {
                  color: muiTheme.palette.text.primary,
                  textDecoration: 'underline',
                  textUnderlineOffset: '5px'
                } : {
                  background: `linear-gradient(90deg, ${themeColors.primary} 0%, ${themeColors.accent} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }),
              }}
            >
              Create Account
            </Typography>
            <Typography 
              variant="body1" 
              component="h2"
              id="register-subtitle"
              sx={{ 
                color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.textSecondary,
                fontSize: accessibility.largeText ? '1.1rem' : '1rem',
                fontWeight: accessibility.highContrast ? 500 : 400
              }}
            >
              Register to get access to Netra Monitor
            </Typography>
          </Box>

          {/* Alerts */}
          {message && (
            <Fade in={Boolean(message)}>
              <Alert 
                severity="success" 
                sx={{ 
                  mb: 3, 
                  borderRadius: 1,
                  '& .MuiAlert-icon': { alignItems: 'center' }
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
                sx={{ 
                  mb: 3, 
                  borderRadius: 1,
                  '& .MuiAlert-icon': { alignItems: 'center' }
                }}
              >
                {error}
              </Alert>
            </Fade>
          )}

          {/* Registration Form */}
          <Box component="form" noValidate>
            <TextField
              id="username"
              name="username"
              label="Username"
              fullWidth
              margin="normal"
              variant="outlined"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              autoFocus
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <i className="ri-user-line" style={{ 
                      color: accessibility.highContrast ? muiTheme.palette.text.primary : '#757575',
                      fontSize: accessibility.largeText ? '1.25rem' : '1rem'
                    }}></i>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  backgroundColor: accessibility.highContrast ? 'transparent' : themeColors.input,
                  borderColor: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.border,
                  '& fieldset': {
                    borderColor: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.border,
                    borderWidth: accessibility.highContrast ? 2 : 1,
                  },
                  '&:hover fieldset': {
                    borderColor: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: themeColors.primary,
                    borderWidth: accessibility.highContrast ? 2 : 1,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.textSecondary,
                  fontSize: accessibility.largeText ? '1.1rem' : '1rem',
                },
                '& .MuiInputBase-input': {
                  fontSize: accessibility.largeText ? '1.1rem' : '1rem',
                  padding: accessibility.largeText ? '14px 14px' : '12px 14px',
                }
              }}
              aria-label="Enter your username"
              aria-required="true"
            />
            
            <TextField
              id="email"
              name="email"
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              variant="outlined"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <i className="ri-mail-line" style={{ 
                      color: accessibility.highContrast ? muiTheme.palette.text.primary : '#757575',
                      fontSize: accessibility.largeText ? '1.25rem' : '1rem'
                    }}></i>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  backgroundColor: accessibility.highContrast ? 'transparent' : themeColors.input,
                  borderColor: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.border,
                  '& fieldset': {
                    borderColor: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.border,
                    borderWidth: accessibility.highContrast ? 2 : 1,
                  },
                  '&:hover fieldset': {
                    borderColor: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: themeColors.primary,
                    borderWidth: accessibility.highContrast ? 2 : 1,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.textSecondary,
                  fontSize: accessibility.largeText ? '1.1rem' : '1rem',
                },
                '& .MuiInputBase-input': {
                  fontSize: accessibility.largeText ? '1.1rem' : '1rem',
                  padding: accessibility.largeText ? '14px 14px' : '12px 14px',
                }
              }}
              aria-label="Enter your email address"
              aria-required="true"
            />
            
            <TextField
              id="password"
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              margin="normal"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <i className="ri-lock-2-line" style={{ 
                      color: accessibility.highContrast ? muiTheme.palette.text.primary : '#757575',
                      fontSize: accessibility.largeText ? '1.25rem' : '1rem'
                    }}></i>
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      <i className={showPassword ? "ri-eye-line" : "ri-eye-off-line"} style={{
                        color: accessibility.highContrast ? muiTheme.palette.text.primary : undefined
                      }}></i>
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  backgroundColor: accessibility.highContrast ? 'transparent' : themeColors.input,
                  borderColor: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.border,
                  '& fieldset': {
                    borderColor: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.border,
                    borderWidth: accessibility.highContrast ? 2 : 1,
                  },
                  '&:hover fieldset': {
                    borderColor: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: themeColors.primary,
                    borderWidth: accessibility.highContrast ? 2 : 1,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.textSecondary,
                  fontSize: accessibility.largeText ? '1.1rem' : '1rem',
                },
                '& .MuiInputBase-input': {
                  fontSize: accessibility.largeText ? '1.1rem' : '1rem',
                  padding: accessibility.largeText ? '14px 14px' : '12px 14px',
                }
              }}
              aria-label="Enter your password"
              aria-required="true"
              aria-describedby="password-helper-text"
            />
            
            <TextField
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? "text" : "password"}
              fullWidth
              margin="normal"
              variant="outlined"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <i className="ri-lock-2-line" style={{ 
                      color: accessibility.highContrast ? muiTheme.palette.text.primary : '#757575',
                      fontSize: accessibility.largeText ? '1.25rem' : '1rem'
                    }}></i>
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      aria-label={showConfirmPassword ? "Hide confirmation password" : "Show confirmation password"}
                    >
                      <i className={showConfirmPassword ? "ri-eye-line" : "ri-eye-off-line"} style={{
                        color: accessibility.highContrast ? muiTheme.palette.text.primary : undefined
                      }}></i>
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  backgroundColor: accessibility.highContrast ? 'transparent' : themeColors.input,
                  borderColor: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.border,
                  '& fieldset': {
                    borderColor: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.border,
                    borderWidth: accessibility.highContrast ? 2 : 1,
                  },
                  '&:hover fieldset': {
                    borderColor: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: themeColors.primary,
                    borderWidth: accessibility.highContrast ? 2 : 1,
                  },
                },
                '& .MuiInputLabel-root': {
                  color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.textSecondary,
                  fontSize: accessibility.largeText ? '1.1rem' : '1rem',
                },
                '& .MuiInputBase-input': {
                  fontSize: accessibility.largeText ? '1.1rem' : '1rem',
                  padding: accessibility.largeText ? '14px 14px' : '12px 14px',
                }
              }}
              aria-label="Confirm your password"
              aria-required="true"
            />

            <Button
              variant="contained"
              fullWidth
              onClick={handleRegister}
              disabled={loading}
              aria-label="Create account"
              id="register-button"
              sx={{ 
                mt: 2, 
                mb: 2,
                py: accessibility.largeText ? 2 : 1.5, 
                borderRadius: 1.5,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: accessibility.largeText ? '1.1rem' : '1rem',
                ...(accessibility.highContrast ? {
                  backgroundColor: muiTheme.palette.text.primary,
                  color: muiTheme.palette.background.default,
                  border: `2px solid ${muiTheme.palette.text.primary}`,
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: muiTheme.palette.text.primary,
                  }
                } : {
                  background: `linear-gradient(45deg, ${themeColors.primary} 30%, ${themeColors.accent} 90%)`,
                  boxShadow: '0 4px 20px 0 rgba(61, 71, 82, 0.1), 0 0 0 0 rgba(0, 127, 255, 0)',
                  '&:hover': {
                    background: `linear-gradient(45deg, ${themeColors.primary} 20%, ${themeColors.accent} 80%)`,
                    boxShadow: '0 6px 20px rgba(61, 71, 82, 0.15)'
                  }
                })
              }}
            >
              {loading ? (
                <CircularProgress 
                  size={accessibility.largeText ? 28 : 24} 
                  sx={{ color: accessibility.highContrast ? muiTheme.palette.background.default : '#fff' }} 
                />
              ) : (
                "Create Account"
              )}
            </Button>

            <Divider 
              sx={{ 
                my: 3,
                borderColor: accessibility.highContrast ? muiTheme.palette.text.primary : 'rgba(0, 0, 0, 0.12)',
                ...(accessibility.highContrast && { borderBottomWidth: 2 })
              }}
            >
              <Typography 
                variant="body2" 
                sx={{ 
                  color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.textSecondary,
                  fontSize: accessibility.largeText ? '1.05rem' : '0.875rem',
                  fontWeight: accessibility.highContrast ? 500 : 400,
                }}
              >
                OR
              </Typography>
            </Divider>

            {/* Login Link */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  display: 'inline',
                  color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.textSecondary,
                  fontSize: accessibility.largeText ? '1.05rem' : '0.875rem',
                }}
              >
                Already have an account?{" "}
              </Typography>
              <Link 
                component={RouterLink} 
                to="/login" 
                variant="body2"
                aria-label="Sign in to existing account"
                sx={{ 
                  textDecoration: accessibility.highContrast ? 'underline' : 'none',
                  color: accessibility.highContrast ? muiTheme.palette.text.primary : themeColors.primary,
                  fontWeight: accessibility.highContrast ? 700 : 500,
                  fontSize: accessibility.largeText ? '1.05rem' : '0.875rem',
                  ...(accessibility.highContrast ? {
                    padding: '0 4px',
                    '&:focus': {
                      outline: `2px solid ${muiTheme.palette.text.primary}`,
                      backgroundColor: 'rgba(0, 0, 0, 0.1)'
                    }
                  } : {
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  })
                }}
              >
                Sign in
              </Link>
            </Box>
          </Box>
        </Paper>
      </Fade>
    </Container>
  );
};

export default Register;

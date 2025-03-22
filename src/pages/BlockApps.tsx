import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  TextField,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  Alert,
  Paper,
  Box,
  Fade,
  Divider,
  IconButton,
  Tooltip,
  useTheme as useMuiTheme,
} from "@mui/material";
import { useTheme } from "../context/ThemeContext";
import AccessibilityAnnouncement from "../components/AccessibilityAnnouncement";

// Interface for theme extras
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

const BlockApps = () => {
  const [appPackage, setAppPackage] = useState<string>("");
  const [blockedApps, setBlockedApps] = useState<string[]>([]); // ✅ Explicit Type
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Theme context for accessibility features
  const { colors, accessibility, themeMood } = useTheme();
  const muiTheme = useMuiTheme();
  
  // Combined theme colors with both original theme colors and custom extras
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

  useEffect(() => {
    fetchBlockedApps();
  }, []);

  const fetchBlockedApps = () => {
    axios
      .get("/api/tracker/blocked-apps/")
      .then((response) => {
        if (Array.isArray(response.data.apps)) {
          setBlockedApps(response.data.apps);
        } else {
          setError("Invalid response format.");
        }
      })
      .catch(() => setError("Error fetching blocked apps."));
  };

  const handleBlockApp = () => {
    if (!appPackage.trim()) {
      setError("Please enter a valid app package name.");
      return;
    }

    setError(null);
    setSuccess(null);

    axios
      .post("/api/tracker/block-apps/", { app_package: appPackage })
      .then(() => {
        setBlockedApps((prevApps) => [...prevApps, appPackage]); // ✅ Fixed
        setAppPackage("");
        setSuccess("App blocked successfully!");
      })
      .catch((error) => {
        setError("Failed to block app: " + (error.response?.data?.error || "Unknown error."));
      });
  };

  // Effect for accessibility announcements
  useEffect(() => {
    // Accessibility announcements are now handled by the AccessibilityAnnouncement component
    // which is declared in the return section of this component
  }, [success, error]);

  // Handle keyboard enter press in the text field
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlockApp();
    }
  };

  return (
    <Container>
      {/* Accessibility announcements for screen readers */}
      {success && <AccessibilityAnnouncement message={success} />}
      {error && <AccessibilityAnnouncement message={error} assertive={true} />}
      
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
      >
        Block Apps
      </Typography>

      {/* Alert Messages */}
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
      
      {success && (
        <Fade in={Boolean(success)} timeout={accessibility.reduceMotion ? 0 : 300}>
          <Alert 
            severity="success" 
            sx={{ 
              marginTop: 2,
              borderRadius: 1,
              '& .MuiAlert-icon': { alignItems: 'center' }
            }}
            role="status"
          >
            {success}
          </Alert>
        </Fade>
      )}

      {/* Block App Form */}
      <Paper 
        elevation={accessibility.highContrast ? 0 : 2}
        sx={{ 
          marginTop: 3, 
          padding: 3,
          backgroundColor: themeColors.card,
          border: accessibility.highContrast ? `2px solid ${themeColors.border}` : 'none',
        }}
      >
        <Typography 
          variant="h6" 
          component="h2"
          id="block-app-title"
          sx={{ 
            mb: 2,
            fontWeight: 600,
            ...(accessibility.largeText && { fontSize: '1.5rem' }),
            color: themeColors.headingSecondary
          }}
        >
          Add App to Block List
        </Typography>
        
        <form onSubmit={(e) => { e.preventDefault(); handleBlockApp(); }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField
                label="App Package Name"
                fullWidth
                value={appPackage}
                onChange={(e) => setAppPackage(e.target.value)}
                onKeyPress={handleKeyPress}
                required
                aria-required="true"
                aria-invalid={appPackage.trim() === ''}
                placeholder="com.example.app"
                helperText="Enter the app package name (e.g., com.facebook.katana)"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                    ...(accessibility.highContrast && {
                      border: `2px solid ${themeColors.border}`,
                      '& fieldset': { border: 'none' }
                    })
                  },
                  ...(accessibility.largeText && {
                    '& .MuiInputLabel-root': { fontSize: '1.1rem' },
                    '& .MuiOutlinedInput-input': { fontSize: '1.1rem' },
                    '& .MuiFormHelperText-root': { fontSize: '0.9rem' }
                  })
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                color="error"
                fullWidth
                type="submit"
                onClick={handleBlockApp}
                aria-label="Block app"
                sx={{ 
                  height: '56px',
                  ...(accessibility.largeText && { fontSize: '1.1rem' }),
                  ...(accessibility.highContrast && {
                    border: `2px solid ${themeColors.border}`,
                    backgroundColor: '#d32f2f',
                    color: '#ffffff'
                  })
                }}
              >
                Block App
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Blocked Apps List */}
      <Box 
        sx={{ 
          mt: 4, 
          mb: 4,
          backgroundColor: themeColors.card,
          border: accessibility.highContrast ? `2px solid ${themeColors.border}` : 'none',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        <Typography 
          variant="h6" 
          component="h2"
          id="blocked-apps-title"
          sx={{ 
            p: 2,
            backgroundColor: themeColors.cardHeader,
            borderBottom: `1px solid ${themeColors.border}`,
            fontWeight: 600,
            ...(accessibility.largeText && { fontSize: '1.5rem' }),
            color: themeColors.headingSecondary
          }}
        >
          Blocked Apps
        </Typography>
        
        {blockedApps.length > 0 ? (
          <List 
            aria-labelledby="blocked-apps-title"
            sx={{ 
              padding: 0,
              maxHeight: '400px',
              overflow: 'auto',
            }}
          >
            {blockedApps.map((app, index) => (
              <React.Fragment key={index}>
                <ListItem
                  sx={{
                    backgroundColor: index % 2 === 0 ? 'transparent' : themeColors.tableRow,
                    padding: '12px 16px',
                    ...(accessibility.largeText && { py: 2 })
                  }}
                >
                  <ListItemText 
                    primary={app} 
                    primaryTypographyProps={{
                      sx: {
                        ...(accessibility.largeText && { fontSize: '1.1rem' }),
                        color: themeColors.text
                      }
                    }}
                  />
                </ListItem>
                {index < blockedApps.length - 1 && (
                  <Divider sx={{ 
                    borderColor: accessibility.highContrast ? themeColors.border : 'rgba(0, 0, 0, 0.08)'
                  }} />
                )}
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography 
              color={themeColors.textSecondary}
              sx={{
                ...(accessibility.largeText && { fontSize: '1.1rem' })
              }}
            >
              No blocked apps. Add an app package name above to start blocking.
            </Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default BlockApps;

import React, { useEffect } from 'react';
import { Box, Typography, Button, Paper, useTheme as useMuiTheme, Fade } from '@mui/material';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import AccessibilityAnnouncement from '../components/AccessibilityAnnouncement';

const NotFound: React.FC = () => {
  // Define ThemeExtras interface for consistent theming
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

  // Access theme contexts
  const { colors, accessibility } = useTheme();
  const muiTheme = useMuiTheme();
  const isHighContrast = accessibility.highContrast;
  
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
  
  // Add accessibility announcement for screen readers when component mounts
  useEffect(() => {
    // This will be announced to screen readers when the page loads
    document.title = "Page Not Found | 404 Error";
  }, []);
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 150px)',
        padding: 3,
        textAlign: 'center',
        backgroundColor: themeColors.background
      }}
    >
      {/* Accessibility announcement for screen readers */}
      <AccessibilityAnnouncement 
        message="Error 404. The page you're looking for could not be found. Please use the return to dashboard button to go back to the main page." 
      />
      <Paper
        elevation={3}
        sx={{
          p: 5,
          maxWidth: 600,
          width: '100%',
          borderRadius: 2,
          backgroundColor: themeColors.card,
          border: isHighContrast ? `2px solid ${themeColors.primary}` : 'none'
        }}
      >
        <Box sx={{ mb: 4 }} aria-hidden="true">
          <i
            className="ri-error-warning-line"
            style={{
              fontSize: '5rem',
              color: themeColors.primary,
              display: 'block',
              marginBottom: '1rem'
            }}
          ></i>
          <Typography
            variant="h1"
            sx={{
              fontWeight: 'bold',
              fontSize: '4rem',
              color: themeColors.primary,
              background: accessibility.reduceMotion ? 'none' : 
                `linear-gradient(135deg, ${themeColors.primary} 0%, ${themeColors.secondary || themeColors.accent} 100%)`,
              WebkitBackgroundClip: accessibility.highContrast ? 'none' : 'text',
              WebkitTextFillColor: accessibility.highContrast ? 'inherit' : 'transparent'
            }}
          >
            404
          </Typography>
        </Box>

        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          sx={{ 
            fontWeight: 'bold',
            color: themeColors.headingSecondary,
            fontSize: accessibility.largeText ? '2rem' : '1.75rem'
          }}
        >
          Page Not Found
        </Typography>
        
        <Typography 
          variant="body1" 
          sx={{ 
            mb: 4,
            color: themeColors.textSecondary,
            fontSize: accessibility.largeText ? '1.125rem' : '1rem',
            lineHeight: 1.6
          }}
        >
          The page you're looking for doesn't exist or has been moved. Please check the URL or navigate back to the dashboard.
        </Typography>
        
        <Button
          component={Link}
          to="/"
          variant="contained"
          color="primary"
          size="large"
          aria-label="Return to dashboard"
          sx={{
            fontWeight: 'bold',
            py: 1.5,
            px: 4,
            borderRadius: 2,
            boxShadow: isHighContrast ? 'none' : 3,
            border: isHighContrast ? `2px solid ${themeColors.primary}` : 'none',
            backgroundColor: themeColors.primary,
            '&:hover': {
              backgroundColor: themeColors.secondary || themeColors.accent,
              transform: accessibility.reduceMotion ? 'none' : 'translateY(-2px)',
              transition: accessibility.reduceMotion ? 'none' : 'all 0.2s ease'
            }
          }}
        >
          Return to Dashboard
        </Button>
      </Paper>
    </Box>
  );
};

export default NotFound;
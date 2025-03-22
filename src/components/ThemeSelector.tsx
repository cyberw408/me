import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Menu, 
  MenuItem, 
  Tooltip, 
  Switch, 
  Paper,
  Divider,
  Grid,
  Fade,
  Button
} from '@mui/material';
import { useTheme, ThemeMood, moodPalettes, highContrastPalettes } from '../context/ThemeContext';
import 'remixicon/fonts/remixicon.css';

// Theme mood options with labels and icons
const moodOptions: { value: ThemeMood; label: string; icon: string; description: string }[] = [
  { 
    value: 'calm', 
    label: 'Calm', 
    icon: 'ri-wind-line',
    description: 'Soothing teal and lavender tones for a peaceful experience'
  },
  { 
    value: 'focus', 
    label: 'Focus', 
    icon: 'ri-focus-3-line',
    description: 'Blue and cool gray tones designed for concentration'
  },
  { 
    value: 'energetic', 
    label: 'Energetic', 
    icon: 'ri-fire-line',
    description: 'Vibrant coral and yellow to boost energy levels'
  },
  { 
    value: 'professional', 
    label: 'Professional', 
    icon: 'ri-briefcase-line',
    description: 'Classic blue and indigo for a business-like appearance'
  },
  { 
    value: 'creative', 
    label: 'Creative', 
    icon: 'ri-lightbulb-line',
    description: 'Purple and pink hues to inspire creativity'
  }
];

const ThemeSelector: React.FC = () => {
  const { 
    themeMood, 
    themeMode, 
    setThemeMood, 
    toggleThemeMode, 
    isHighContrast,
    accessibility
  } = useTheme();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleMoodChange = (mood: ThemeMood) => {
    setThemeMood(mood);
    handleClose();
  };

  // Get color samples for current mode, respecting accessibility settings
  const getColorSamples = (mood: ThemeMood) => {
    // If high contrast mode is active, use high contrast colors instead of mood colors
    if (isHighContrast) {
      const colors = highContrastPalettes[themeMode];
      return [colors.primary, colors.secondary, colors.accent];
    } else {
      const colors = moodPalettes[mood][themeMode];
      return [colors.primary, colors.secondary, colors.accent];
    }
  };
  
  return (
    <>
      <Tooltip title="Change theme">
        <IconButton onClick={handleOpen} color="inherit">
          <i className="ri-palette-line" style={{ fontSize: '1.4rem' }}></i>
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            borderRadius: 2,
            minWidth: 300,
            maxWidth: 350,
            mt: 1,
            p: 2
          }
        }}
        TransitionComponent={Fade}
        transitionDuration={200}
      >
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Theme Settings
        </Typography>
        
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <i className={themeMode === 'dark' ? 'ri-moon-line' : 'ri-sun-line'} style={{ marginRight: 8 }}></i>
            <Typography>Dark Mode</Typography>
          </Box>
          <Switch 
            checked={themeMode === 'dark'} 
            onChange={toggleThemeMode} 
            color="primary" 
          />
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
          Select Mood
        </Typography>
        
        {isHighContrast && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 2,
              borderRadius: 1.5,
              backgroundColor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              border: '1px dashed',
              borderColor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <i className="ri-information-line" style={{ marginRight: 8, color: highContrastPalettes[themeMode].info }}></i>
              <Typography variant="body2">
                High contrast mode is currently active. Theme colors are optimized for accessibility.
              </Typography>
            </Box>
          </Paper>
        )}
        
        <Box sx={{ mb: 2, opacity: isHighContrast ? 0.7 : 1 }}>
          {moodOptions.map((option) => {
            const isSelected = option.value === themeMood;
            const colorSamples = getColorSamples(option.value);
            
            return (
              <Paper 
                key={option.value}
                elevation={0}
                onClick={() => handleMoodChange(option.value)}
                sx={{
                  p: 1.5,
                  mb: 1,
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  border: isSelected ? `2px solid ${colorSamples[0]}` : '2px solid transparent',
                  backgroundColor: isSelected ? `${colorSamples[0]}10` : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    backgroundColor: `${colorSamples[0]}20`,
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Box 
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: isSelected ? colorSamples[0] : `${colorSamples[0]}20`,
                      color: isSelected ? 'white' : colorSamples[0],
                      mr: 2
                    }}
                  >
                    <i className={option.icon} style={{ fontSize: '1.2rem' }}></i>
                  </Box>
                  
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                      {option.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.description}
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', mt: 1, ml: 7 }}>
                  {colorSamples.map((color, index) => (
                    <Box
                      key={index}
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        backgroundColor: color,
                        mr: 1,
                        border: '2px solid white',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}
                    />
                  ))}
                </Box>
              </Paper>
            );
          })}
        </Box>
      </Menu>
    </>
  );
};

export default ThemeSelector;
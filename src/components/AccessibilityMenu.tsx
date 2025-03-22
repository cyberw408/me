import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Badge,
  Switch,
  Box,
  Tooltip,
  Paper,
  Fade
} from '@mui/material';
import { useTheme } from '../context/ThemeContext';

interface AccessibilityMenuProps {
  iconStyle?: React.CSSProperties;
}

const AccessibilityMenu: React.FC<AccessibilityMenuProps> = ({ iconStyle = {} }) => {
  const {
    toggleHighContrast,
    toggleLargeText,
    toggleReduceMotion,
    toggleScreenReaderMode,
    accessibility,
    colors
  } = useTheme();
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [keyboardModalOpen, setKeyboardModalOpen] = useState(false);
  const menuOpen = Boolean(anchorEl);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  
  // Track active accessibility features
  const activeFeatures = Object.values(accessibility).filter(Boolean).length;
  
  // Handle menu opening/closing
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  // Setup keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+A to open accessibility menu
      if (e.altKey && e.key === 'a') {
        e.preventDefault();
        if (menuOpen) {
          handleClose();
        } else if (menuButtonRef.current) {
          menuButtonRef.current.click();
        }
      }
      
      // Toggle keyboard shortcuts modal with Alt+K
      if (e.altKey && e.key === 'k') {
        e.preventDefault();
        setKeyboardModalOpen(prev => !prev);
      }
      
      // Shortcut keys when menu is open
      if (menuOpen) {
        switch (e.key) {
          case 'c':
            toggleHighContrast();
            break;
          case 't':
            toggleLargeText();
            break;
          case 'm':
            toggleReduceMotion();
            break;
          case 's':
            toggleScreenReaderMode();
            break;
          case 'Escape':
            handleClose();
            break;
          default:
            break;
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    menuOpen,
    toggleHighContrast,
    toggleLargeText,
    toggleReduceMotion,
    toggleScreenReaderMode
  ]);
  
  return (
    <>
      <Tooltip title="Accessibility Options (Alt+A)">
        <Badge
          badgeContent={activeFeatures}
          color="primary"
          overlap="circular"
          sx={{ '& .MuiBadge-badge': { backgroundColor: colors.primary } }}
        >
          <Button
            ref={menuButtonRef}
            aria-label="Open accessibility menu"
            onClick={handleClick}
            color="inherit"
            sx={{
              minWidth: 'auto',
              borderRadius: '50%',
              p: 1,
              '&:focus-visible': {
                outline: `2px solid ${colors.primary}`,
                outlineOffset: 2
              }
            }}
          >
            <i 
              className="ri-accessible-line" 
              style={{ 
                fontSize: '1.5rem',
                color: activeFeatures > 0 ? colors.primary : 'inherit',
                ...iconStyle
              }}
            ></i>
          </Button>
        </Badge>
      </Tooltip>
      
      <Menu
        id="accessibility-menu"
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'accessibility-button',
          dense: false,
        }}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            minWidth: 280,
            borderRadius: 2,
            ...(accessibility.highContrast && {
              border: '2px solid',
              borderColor: 'text.primary'
            })
          }
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 'bold',
            px: 2,
            pt: 2,
            pb: 1,
            color: accessibility.highContrast ? 'text.primary' : colors.primary
          }}
        >
          Accessibility Options
        </Typography>
        
        <MenuItem onClick={toggleHighContrast}>
          <ListItemIcon>
            <i className="ri-contrast-2-line" style={{ fontSize: '1.25rem', color: colors.primary }}></i>
          </ListItemIcon>
          <ListItemText 
            primary="High Contrast Mode"
            secondary="Increases text visibility"
            primaryTypographyProps={{
              sx: { 
                fontWeight: accessibility.highContrast ? 'bold' : 'medium',
                fontSize: accessibility.largeText ? '1.1rem' : 'inherit'
              }
            }}
          />
          <Switch
            checked={accessibility.highContrast}
            edge="end"
            size={accessibility.largeText ? 'medium' : 'small'}
            sx={{ 
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: colors.primary
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: `${colors.primary}80`
              }
            }}
          />
        </MenuItem>
        
        <MenuItem onClick={toggleLargeText}>
          <ListItemIcon>
            <i className="ri-text-spacing" style={{ fontSize: '1.25rem', color: colors.primary }}></i>
          </ListItemIcon>
          <ListItemText 
            primary="Large Text"
            secondary="Increases text size"
            primaryTypographyProps={{
              sx: { 
                fontWeight: accessibility.largeText ? 'bold' : 'medium',
                fontSize: accessibility.largeText ? '1.1rem' : 'inherit'
              }
            }}
          />
          <Switch
            checked={accessibility.largeText}
            edge="end"
            size={accessibility.largeText ? 'medium' : 'small'}
            sx={{ 
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: colors.primary
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: `${colors.primary}80`
              }
            }}
          />
        </MenuItem>
        
        <MenuItem onClick={toggleReduceMotion}>
          <ListItemIcon>
            <i className="ri-pause-mini-line" style={{ fontSize: '1.25rem', color: colors.primary }}></i>
          </ListItemIcon>
          <ListItemText 
            primary="Reduce Motion"
            secondary="Minimize animations"
            primaryTypographyProps={{
              sx: { 
                fontWeight: accessibility.reduceMotion ? 'bold' : 'medium',
                fontSize: accessibility.largeText ? '1.1rem' : 'inherit'
              }
            }}
          />
          <Switch
            checked={accessibility.reduceMotion}
            edge="end"
            size={accessibility.largeText ? 'medium' : 'small'}
            sx={{ 
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: colors.primary
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: `${colors.primary}80`
              }
            }}
          />
        </MenuItem>
        
        <MenuItem onClick={toggleScreenReaderMode}>
          <ListItemIcon>
            <i className="ri-sound-module-line" style={{ fontSize: '1.25rem', color: colors.primary }}></i>
          </ListItemIcon>
          <ListItemText 
            primary="Screen Reader Optimized"
            secondary="Enhanced descriptions"
            primaryTypographyProps={{
              sx: { 
                fontWeight: accessibility.screenReaderOptimized ? 'bold' : 'medium',
                fontSize: accessibility.largeText ? '1.1rem' : 'inherit'
              }
            }}
          />
          <Switch
            checked={accessibility.screenReaderOptimized}
            edge="end"
            size={accessibility.largeText ? 'medium' : 'small'}
            sx={{ 
              '& .MuiSwitch-switchBase.Mui-checked': {
                color: colors.primary
              },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                backgroundColor: `${colors.primary}80`
              }
            }}
          />
        </MenuItem>
        
        <Divider sx={{ my: 1 }} />
        
        <Box sx={{ px: 2, pb: 1 }}>
          <Button 
            size="small" 
            onClick={() => {
              setKeyboardModalOpen(true);
              handleClose();
            }}
            startIcon={<i className="ri-keyboard-line"></i>}
            sx={{ 
              color: colors.primary,
              textTransform: 'none',
              fontSize: accessibility.largeText ? '0.95rem' : '0.875rem' 
            }}
          >
            Keyboard Shortcuts
          </Button>
        </Box>
      </Menu>
      
      {/* Keyboard Shortcuts Dialog */}
      {keyboardModalOpen && (
        <Fade in={keyboardModalOpen}>
          <Paper
            elevation={4}
            sx={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90%', sm: 400 },
              maxWidth: 500,
              p: 3,
              borderRadius: 2,
              zIndex: 1300,
              maxHeight: '80vh',
              overflow: 'auto',
              ...(accessibility.highContrast && {
                border: '2px solid',
                borderColor: 'text.primary'
              })
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 'bold',
                  color: accessibility.highContrast ? 'text.primary' : colors.primary,
                  fontSize: accessibility.largeText ? '1.5rem' : 'inherit'
                }}
              >
                Keyboard Shortcuts
              </Typography>
              <Button
                onClick={() => setKeyboardModalOpen(false)}
                aria-label="Close keyboard shortcuts"
                sx={{ minWidth: 'auto', p: 1 }}
              >
                <i className="ri-close-line" style={{ fontSize: '1.25rem' }}></i>
              </Button>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  mb: 1, 
                  fontWeight: 'bold',
                  fontSize: accessibility.largeText ? '1.1rem' : 'inherit'
                }}
              >
                Accessibility Menu
              </Typography>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 2fr',
                gap: 1,
                mb: 1,
                fontSize: accessibility.largeText ? '1rem' : '0.875rem'
              }}>
                <Box sx={{ fontWeight: 'bold' }}>Alt + A</Box>
                <Box>Open accessibility menu</Box>
                
                <Box sx={{ fontWeight: 'bold' }}>Alt + K</Box>
                <Box>Open keyboard shortcuts</Box>
              </Box>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  mb: 1, 
                  fontWeight: 'bold',
                  fontSize: accessibility.largeText ? '1.1rem' : 'inherit'
                }}
              >
                When Menu is Open
              </Typography>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 2fr',
                gap: 1,
                mb: 1,
                fontSize: accessibility.largeText ? '1rem' : '0.875rem'
              }}>
                <Box sx={{ fontWeight: 'bold' }}>C</Box>
                <Box>Toggle high contrast mode</Box>
                
                <Box sx={{ fontWeight: 'bold' }}>T</Box>
                <Box>Toggle large text</Box>
                
                <Box sx={{ fontWeight: 'bold' }}>M</Box>
                <Box>Toggle reduce motion</Box>
                
                <Box sx={{ fontWeight: 'bold' }}>S</Box>
                <Box>Toggle screen reader mode</Box>
                
                <Box sx={{ fontWeight: 'bold' }}>Esc</Box>
                <Box>Close menu</Box>
              </Box>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  mb: 1, 
                  fontWeight: 'bold',
                  fontSize: accessibility.largeText ? '1.1rem' : 'inherit'
                }}
              >
                Navigation
              </Typography>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 2fr',
                gap: 1,
                fontSize: accessibility.largeText ? '1rem' : '0.875rem'
              }}>
                <Box sx={{ fontWeight: 'bold' }}>Tab</Box>
                <Box>Move to next focusable element</Box>
                
                <Box sx={{ fontWeight: 'bold' }}>Shift + Tab</Box>
                <Box>Move to previous focusable element</Box>
                
                <Box sx={{ fontWeight: 'bold' }}>Enter / Space</Box>
                <Box>Activate buttons or links</Box>
              </Box>
            </Box>
            
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setKeyboardModalOpen(false)}
              sx={{ 
                mt: 2,
                color: accessibility.highContrast ? 'text.primary' : colors.primary,
                borderColor: accessibility.highContrast ? 'text.primary' : colors.primary,
                borderWidth: accessibility.highContrast ? 2 : 1,
                fontSize: accessibility.largeText ? '1rem' : 'inherit'
              }}
            >
              Close
            </Button>
          </Paper>
        </Fade>
      )}
      
      {/* Backdrop for keyboard shortcuts modal */}
      {keyboardModalOpen && (
        <Box
          onClick={() => setKeyboardModalOpen(false)}
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1200,
          }}
        />
      )}
    </>
  );
};

export default AccessibilityMenu;
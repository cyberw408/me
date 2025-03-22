import React, { useState } from "react";
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Menu, 
  MenuItem, 
  Avatar,
  Box,
  Badge,
  useMediaQuery,
  useTheme as useMuiTheme,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip
} from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import "remixicon/fonts/remixicon.css";
import ThemeSelector from "./ThemeSelector";
import AccessibilityMenu from "./AccessibilityMenu";
import { useTheme } from "../context/ThemeContext";

interface NavigationProps {
  is_authenticated: boolean;
  is_admin: boolean;
  handleLogout: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ is_authenticated, is_admin, handleLogout }) => {
  const muiTheme = useMuiTheme();
  const { themeMode, colors } = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsAnchor, setNotificationsAnchor] = useState<null | HTMLElement>(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const location = useLocation();

  if (!is_authenticated) return null; // ✅ Hide Navbar if user is not logged in

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClose = () => {
    setNotificationsAnchor(null);
    setUserMenuAnchor(null);
  };

  const isCurrentPath = (path: string) => {
    return location.pathname === path;
  };

  // Navigation menu items for user and admin
  const userMenuItems = [
    { icon: "ri-dashboard-line", text: "Dashboard", path: "/dashboard" },
    { icon: "ri-notification-line", text: "Notifications", path: "/notifications" },
    { icon: "ri-smartphone-line", text: "Devices", path: "/devices" },
    { icon: "ri-map-pin-line", text: "Location", path: "/location" },
    { icon: "ri-history-line", text: "My Activity Logs", path: "/user-activity-logs" }
  ];

  const adminMenuItems = [
    { icon: "ri-admin-line", text: "Admin Panel", path: "/admin-dashboard" },
    { icon: "ri-notification-3-line", text: "Push Notifications", path: "/push-notifications" },
    { icon: "ri-file-list-3-line", text: "View All Activity Logs", path: "/user-activity-logs" }
  ];

  const menuItems = is_admin ? adminMenuItems : userMenuItems;

  const drawer = (
    <Box sx={{ 
      bgcolor: themeMode === 'dark' ? colors.background : "#232738",
      color: "white", 
      height: "100%" 
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        p: 2,
        color: "white",
        background: colors.gradient
      }}>
        <Typography variant="h6" sx={{ fontWeight: "bold" }}>
          <i className="ri-shield-keyhole-line ri-lg" style={{ marginRight: "8px", verticalAlign: "middle" }}></i>
          Netra Monitor
        </Typography>
      </Box>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
      <List>
        {menuItems.map((item, index) => (
          <ListItem 
            key={index}
            disablePadding
          >
            <Box
              component={Link}
              to={item.path}
              sx={{
                display: 'flex',
                width: '100%',
                color: "white",
                padding: '8px 16px',
                textDecoration: 'none',
                backgroundColor: isCurrentPath(item.path) ? "rgba(255,255,255,0.1)" : "transparent",
                borderLeft: isCurrentPath(item.path) ? `4px solid ${colors.primary}` : "4px solid transparent",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.05)",
                }
              }}
            >
              <ListItemIcon sx={{ color: isCurrentPath(item.path) ? colors.primary : "white", minWidth: "40px" }}>
                <i className={item.icon}></i>
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </Box>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", mt: 2 }} />
      <List>
        <ListItem disablePadding>
          <Box
            component="button"
            onClick={handleLogout}
            sx={{
              display: 'flex',
              width: '100%',
              color: "#ff7675",
              padding: '8px 16px',
              textAlign: 'left',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              alignItems: 'center',
              "&:hover": {
                backgroundColor: "rgba(255,118,117,0.1)",
              }
            }}
          >
            <ListItemIcon sx={{ color: "#ff7675", minWidth: "40px" }}>
              <i className="ri-logout-box-line"></i>
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </Box>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar 
        position="fixed" 
        sx={{ 
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          backgroundColor: colors.surface, 
          color: colors.text,
          zIndex: muiTheme.zIndex.drawer + 1
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <i className="ri-menu-line"></i>
            </IconButton>
          )}
          
          <Typography 
            variant="h6" 
            sx={{ 
              flexGrow: 1, 
              fontWeight: "bold",
              display: { xs: 'none', sm: 'block' }
            }}
          >
            <Link to="/" style={{ color: colors.text, textDecoration: "none", display: "flex", alignItems: "center" }}>
              <i className="ri-shield-keyhole-line ri-lg" style={{ marginRight: "8px", color: colors.primary }}></i>
              Netra Monitor
            </Link>
          </Typography>

          {/* Search Bar - visible on larger screens */}
          <Box sx={{ 
            flexGrow: 1, 
            display: { xs: 'none', md: 'flex' }, 
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              bgcolor: 'rgba(0,0,0,0.04)', 
              borderRadius: '20px',
              padding: '2px 15px',
              width: '300px'
            }}>
              <i className="ri-search-line" style={{ color: '#777' }}></i>
              <input 
                placeholder="Search..." 
                style={{ 
                  border: 'none', 
                  outline: 'none', 
                  background: 'transparent',
                  padding: '8px 10px',
                  width: '100%',
                  fontSize: '14px'
                }} 
              />
            </Box>
          </Box>

          {/* Theme Selector */}
          <ThemeSelector />
          
          {/* Accessibility Menu */}
          <AccessibilityMenu 
            iconStyle={{ 
              margin: '0 4px',
              color: colors.text
            }} 
          />

          {/* Notification Icon */}
          <IconButton 
            aria-label="show notifications" 
            color="inherit"
            onClick={(e) => setNotificationsAnchor(e.currentTarget)}
          >
            <Badge badgeContent={3} color="error">
              <i className="ri-notification-3-line"></i>
            </Badge>
          </IconButton>
          
          {/* User Menu */}
          <IconButton 
            aria-label="user settings" 
            color="inherit"
            onClick={(e) => setUserMenuAnchor(e.currentTarget)}
            sx={{ ml: 1 }}
          >
            <Avatar 
              sx={{ 
                width: 32, 
                height: 32,
                bgcolor: is_admin ? colors.secondary : colors.primary
              }}
            >
              {is_admin ? 'A' : 'U'}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Notification Menu */}
      <Menu
        anchorEl={notificationsAnchor}
        open={Boolean(notificationsAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: 320,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            borderRadius: '8px'
          }
        }}
      >
        <Typography variant="subtitle1" sx={{ p: 2, fontWeight: 'bold', borderBottom: '1px solid #eee' }}>
          Recent Notifications
        </Typography>
        <MenuItem onClick={handleMenuClose} sx={{ display: 'block', py: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>New device connected</Typography>
          <Typography variant="caption" color="text.secondary">5 minutes ago</Typography>
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ display: 'block', py: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Location updated</Typography>
          <Typography variant="caption" color="text.secondary">10 minutes ago</Typography>
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ display: 'block', py: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>New login detected</Typography>
          <Typography variant="caption" color="text.secondary">1 hour ago</Typography>
        </MenuItem>
        <Box sx={{ p: 1, borderTop: '1px solid #eee', textAlign: 'center' }}>
          <Button 
            component={Link} 
            to="/notifications" 
            sx={{ fontSize: '0.8rem', textTransform: 'none' }}
            onClick={handleMenuClose}
          >
            View all notifications
          </Button>
        </Box>
      </Menu>

      {/* User Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            minWidth: 180,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            borderRadius: '8px'
          }
        }}
      >
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Avatar 
            sx={{ 
              width: 50, 
              height: 50, 
              margin: '0 auto 8px',
              bgcolor: is_admin ? colors.secondary : colors.primary
            }}
          >
            {is_admin ? 'A' : 'U'}
          </Avatar>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {is_admin ? 'Admin User' : 'Regular User'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {is_admin ? 'Administrator' : 'Standard Account'}
          </Typography>
        </Box>
        <Divider />
        <MenuItem component={Link} to="/profile" onClick={handleMenuClose}>
          <ListItemIcon>
            <i className="ri-user-settings-line"></i>
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        <MenuItem component={Link} to="/security-controls" onClick={handleMenuClose}>
          <ListItemIcon>
            <i className="ri-shield-check-line"></i>
          </ListItemIcon>
          <ListItemText>Security</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <i className="ri-logout-box-line" style={{ color: '#ff7675' }}></i>
          </ListItemIcon>
          <ListItemText sx={{ color: '#ff7675' }}>Logout</ListItemText>
        </MenuItem>
      </Menu>

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            '& .MuiDrawer-paper': { 
              width: 260,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* Desktop Drawer - always visible on larger screens */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: 260,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 260,
              boxSizing: 'border-box',
              top: '64px', // AppBar height
              height: 'calc(100% - 64px)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      )}
    </>
  );
};

export default Navigation;

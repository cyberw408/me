import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { Box, CssBaseline, CircularProgress, Typography } from "@mui/material";
import axios from "axios";
import "remixicon/fonts/remixicon.css";

// Import theme styles and context
import "./styles/theme.css";
import { ThemeProvider, useTheme } from "./context/ThemeContext";

// Import accessibility components
import SkipLink from "./components/SkipLink";
import AccessibilityAnnouncement from "./components/AccessibilityAnnouncement";
import AccessibilityMenu from "./components/AccessibilityMenu";

// Import components
import Navigation from "./components/Navigation";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import DeviceManagement from "./pages/DeviceManagement";
import LocationTracking from "./pages/LocationTracking";
import CallLogs from "./pages/CallLogs";
import SocialMediaLogs from "./pages/SocialMediaLogs";
import AppUsage from "./pages/AppUsage";
import BrowsingHistory from "./pages/BrowsingHistory";
import LiveScreen from "./pages/LiveScreen";
import SecurityControls from "./pages/SecurityControls";
import UserProfile from "./pages/UserProfile";
import Notifications from "./pages/Notifications";
import PushNotifications from "./pages/PushNotifications";
import UserActivityLogs from "./pages/UserActivityLogs";
import Geofencing from "./pages/Geofencing";
import Keylogger from "./pages/Keylogger";
import BlockApps from "./pages/BlockApps";
import FileAccess from "./pages/FileAccess";
import PhotoAccess from "./pages/PhotoAccess";
import ContactAccess from "./pages/ContactAccess";
import LiveAudio from "./pages/LiveAudio";
import LiveCamera from "./pages/LiveCamera";

const App = () => {
  const [is_authenticated, setIsAuthenticated] = useState(false);
  const [is_admin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Add keyboard navigation detection for better focus states
  useEffect(() => {
    // Function to add keyboard user class
    function handleFirstTab(e: KeyboardEvent) {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-user');
        
        // Remove the event listener once keyboard navigation is detected
        window.removeEventListener('keydown', handleFirstTab);
      }
    }
    
    // Add event listener to detect keyboard navigation
    window.addEventListener('keydown', handleFirstTab);
    
    // Function to remove keyboard user class on mouse use
    function handleMouseDown() {
      document.body.classList.remove('keyboard-user');
      
      // Re-add the keyboard detection
      window.addEventListener('keydown', handleFirstTab);
    }
    
    window.addEventListener('mousedown', handleMouseDown);
    
    return () => {
      window.removeEventListener('keydown', handleFirstTab);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // ✅ Check Authentication Status
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setIsAuthenticated(false);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get("/api/tracker/auth-status/", {
          headers: { Authorization: `Token ${token}` },
          withCredentials: true,
        });

        console.log("Auth Response:", response.data); // ✅ Debugging Log

        setIsAuthenticated(response.data.is_authenticated ?? false);
        setIsAdmin(response.data.is_admin ?? false);
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);


  // ✅ Handle Logout Functionality
  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setIsAdmin(false);
    window.location.href = "/login"; // ✅ Ensures Full Reload After Logout
  };

  // Custom loading component with accessibility considerations
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          bgcolor: '#f4f6f9' 
        }}
        role="alert"
        aria-live="assertive"
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
          p: 4,
          borderRadius: 2,
          bgcolor: 'white',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <Box sx={{ mb: 3 }} aria-hidden="true">
            <i className="ri-shield-keyhole-line" style={{ fontSize: '3rem', color: '#4FC3F7' }}></i>
          </Box>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
            Netra Monitor
          </Typography>
          <CircularProgress 
            color="primary" 
            aria-label="Loading application" 
          />
          <Typography sx={{ mt: 2, color: 'text.secondary' }}>
            Initializing application...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <ThemeProvider>
      <AppContent
        is_authenticated={is_authenticated}
        is_admin={is_admin}
        handleLogout={handleLogout}
      />
    </ThemeProvider>
  );
};

// AccessibleAppContent component to access theme context
const AppContent: React.FC<{
  is_authenticated: boolean;
  is_admin: boolean;
  handleLogout: () => void;
}> = ({ is_authenticated, is_admin, handleLogout }) => {
  const { accessibility } = useTheme();
  
  // Create dynamic accessibility class names
  const accessibilityClasses = [
    accessibility.highContrast ? 'high-contrast-mode' : '',
    accessibility.largeText ? 'large-text-mode' : '',
    accessibility.reduceMotion ? 'reduced-motion' : '',
    accessibility.screenReaderOptimized ? 'screen-reader-optimized' : '',
  ].filter(Boolean).join(' ');
  
  return (
    <Router>
      <CssBaseline />
      <Box 
        sx={{ display: 'flex' }}
        className={accessibilityClasses}
      >
        {/* Navigation component with sidebar */}
        {is_authenticated && (
          <Navigation 
            is_authenticated={is_authenticated} 
            is_admin={is_admin} 
            handleLogout={handleLogout} 
          />
        )}

        {/* Add Accessibility Menu */}
        {is_authenticated && (
          <Box 
            sx={{ 
              position: 'fixed', 
              top: 15, 
              right: 15,
              zIndex: 1200,
              display: 'flex'
            }}
          >
            <AccessibilityMenu />
          </Box>
        )}

        {/* Skip to main content link for accessibility */}
        <SkipLink />
        
        {/* Main content area */}
          <Box 
            component="main" 
            id="main-content"
            tabIndex={-1}
            sx={{ 
              flexGrow: 1, 
              p: 3, 
              width: { sm: `calc(100% - 260px)` },
              ml: { sm: '260px' },
              mt: '64px', // AppBar height
              bgcolor: '#f4f6f9',
              minHeight: 'calc(100vh - 64px)'
            }}
          >
            <Routes>
              {/* ✅ Public Routes */}
              <Route 
                path="/login" 
                element={
                  is_authenticated ? (
                    <Navigate to="/" replace />
                  ) : (
                    <Login />
                  )
                } 
              />
              <Route path="/register" element={is_authenticated ? <Navigate to="/" replace /> : <Register />} />
              <Route path="/forgot-password" element={is_authenticated ? <Navigate to="/" replace /> : <ForgotPassword />} />

              {/* ✅ Redirect Admins & Users to their respective dashboards */}
              {is_authenticated ? (
                is_admin ? (
                  <Route path="/" element={<Navigate to="/admin-dashboard" replace />} />
                ) : (
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                )
              ) : (
                <Route path="/" element={<Navigate to="/login" replace />} />
              )}

              {/* ✅ Protected Routes (Require Authentication) */}
              {is_authenticated && (
                <>
                  <Route path="/dashboard" element={<Dashboard />} />
                  {is_admin && <Route path="/admin-dashboard" element={<AdminDashboard />} />}

                  <Route path="/devices" element={<DeviceManagement />} />
                  <Route path="/location" element={<LocationTracking />} />
                  <Route path="/calls" element={<CallLogs />} />
                  <Route path="/social-media" element={<SocialMediaLogs />} />
                  <Route path="/app-usage" element={<AppUsage />} />
                  <Route path="/browsing-history" element={<BrowsingHistory />} />
                  <Route path="/live-screen" element={<LiveScreen />} />
                  <Route path="/security-controls" element={<SecurityControls />} />
                  <Route path="/profile" element={<UserProfile />} />
                  <Route path="/notifications" element={<Notifications />} />
                  {is_admin && <Route path="/admin" element={<AdminDashboard />} />}
                  <Route path="/push-notifications" element={<PushNotifications is_admin={is_admin} />} />
                  <Route path="/user-activity-logs" element={<UserActivityLogs isAdmin={is_admin} />} />
                  <Route path="/geofencing" element={<Geofencing />} />
                  <Route path="/keylogger" element={<Keylogger />} />
                  <Route path="/block-apps" element={<BlockApps />} />
                  <Route path="/file-access" element={<FileAccess />} />
                  <Route path="/photo-access" element={<PhotoAccess />} />
                  <Route path="/contact-access" element={<ContactAccess />} />
                  <Route path="/live-audio" element={<LiveAudio />} />
                  <Route path="/live-camera" element={<LiveCamera />} />
                </>
              )}

              {/* ✅ Not Found Page */}
              <Route path="/not-found" element={<NotFound />} />
              
              {/* ✅ Catch-All Redirects - Show NotFound for authenticated users, redirect to login for others */}
              <Route path="*" element={is_authenticated ? <NotFound /> : <Navigate to="/login" replace />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App;

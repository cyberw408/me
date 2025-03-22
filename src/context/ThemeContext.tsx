import React, { createContext, ReactNode, useContext, useState, useEffect } from 'react';

// Define theme mood and mode types
export type ThemeMood = 'calm' | 'focus' | 'energetic' | 'professional' | 'creative';
export type ThemeMode = 'light' | 'dark';

// Define accessibility preferences
export interface AccessibilityOptions {
  highContrast: boolean;
  largeText: boolean;
  reduceMotion: boolean;
  screenReaderOptimized: boolean;
}

// Define additional status colors for UI components
export interface StatusColors {
  success: string;
  warning: string;
  error: string;
  info: string;
}

// High contrast color palettes
export const highContrastPalettes = {
  light: {
    primary: '#000000', // Black
    secondary: '#0000AA', // Dark Blue
    accent: '#AA0000', // Dark Red
    background: '#FFFFFF', // White
    surface: '#F8F8F8', // Light Gray
    text: '#000000', // Black
    gradient: 'none', // No gradient for accessibility
    success: '#006600', // Dark Green
    warning: '#AA6600', // Dark Orange
    error: '#AA0000', // Dark Red
    info: '#000088', // Dark Blue
  },
  dark: {
    primary: '#FFFFFF', // White
    secondary: '#55AAFF', // Light Blue
    accent: '#FF5555', // Light Red
    background: '#000000', // Black
    surface: '#222222', // Dark Gray
    text: '#FFFFFF', // White
    gradient: 'none', // No gradient for accessibility
    success: '#55FF55', // Light Green
    warning: '#FFAA55', // Light Orange
    error: '#FF5555', // Light Red
    info: '#55AAFF', // Light Blue
  }
};

// Mood color palettes for both light and dark modes
export const moodPalettes = {
  calm: {
    light: {
      primary: '#4DB6AC', // Teal
      secondary: '#9575CD', // Lavender
      accent: '#81C784', // Light Green
      background: '#F5F7FA',
      surface: '#FFFFFF',
      text: '#2A3747',
      gradient: 'linear-gradient(45deg, #4DB6AC 30%, #9575CD 90%)',
      success: '#66BB6A', // Success Green
      warning: '#FFA726', // Warning Orange
      error: '#EF5350', // Error Red
      info: '#42A5F5', // Info Blue
    },
    dark: {
      primary: '#26A69A', // Darker Teal
      secondary: '#7986CB', // Darker Lavender
      accent: '#66BB6A', // Darker Green
      background: '#1A2130',
      surface: '#2A3747',
      text: '#ECEFF4',
      gradient: 'linear-gradient(45deg, #26A69A 30%, #7986CB 90%)',
      success: '#4CAF50', // Darker Success Green
      warning: '#FF9800', // Darker Warning Orange
      error: '#F44336', // Darker Error Red
      info: '#2196F3', // Darker Info Blue
    }
  },
  focus: {
    light: {
      primary: '#42A5F5', // Blue
      secondary: '#78909C', // Blue Grey
      accent: '#29B6F6', // Light Blue
      background: '#F5F7FA',
      surface: '#FFFFFF',
      text: '#2A3747',
      gradient: 'linear-gradient(45deg, #42A5F5 30%, #78909C 90%)'
    },
    dark: {
      primary: '#2196F3', // Darker Blue
      secondary: '#546E7A', // Darker Blue Grey
      accent: '#03A9F4', // Darker Light Blue
      background: '#1A2130',
      surface: '#2A3747',
      text: '#ECEFF4',
      gradient: 'linear-gradient(45deg, #2196F3 30%, #546E7A 90%)'
    }
  },
  energetic: {
    light: {
      primary: '#FF7043', // Deep Orange
      secondary: '#FFD54F', // Amber
      accent: '#FF8A65', // Light Orange
      background: '#FFFAF0',
      surface: '#FFFFFF',
      text: '#2A3747',
      gradient: 'linear-gradient(45deg, #FF7043 30%, #FFD54F 90%)'
    },
    dark: {
      primary: '#F4511E', // Darker Deep Orange
      secondary: '#FFB300', // Darker Amber
      accent: '#FF5722', // Darker Orange
      background: '#1A2130',
      surface: '#2A3747',
      text: '#ECEFF4',
      gradient: 'linear-gradient(45deg, #F4511E 30%, #FFB300 90%)'
    }
  },
  professional: {
    light: {
      primary: '#1976D2', // Dark Blue
      secondary: '#455A64', // Dark Blue Grey
      accent: '#00ACC1', // Cyan
      background: '#F5F7FA',
      surface: '#FFFFFF',
      text: '#2A3747',
      gradient: 'linear-gradient(45deg, #1976D2 30%, #455A64 90%)'
    },
    dark: {
      primary: '#0D47A1', // Darker Blue
      secondary: '#37474F', // Darker Blue Grey
      accent: '#0097A7', // Darker Cyan
      background: '#1A2130',
      surface: '#2A3747',
      text: '#ECEFF4',
      gradient: 'linear-gradient(45deg, #0D47A1 30%, #37474F 90%)'
    }
  },
  creative: {
    light: {
      primary: '#7E57C2', // Deep Purple
      secondary: '#EC407A', // Pink
      accent: '#AB47BC', // Purple
      background: '#F8F5FF',
      surface: '#FFFFFF',
      text: '#2A3747',
      gradient: 'linear-gradient(45deg, #7E57C2 30%, #EC407A 90%)'
    },
    dark: {
      primary: '#5E35B1', // Darker Purple
      secondary: '#D81B60', // Darker Pink
      accent: '#8E24AA', // Darker Purple
      background: '#1A2130',
      surface: '#2A3747',
      text: '#ECEFF4',
      gradient: 'linear-gradient(45deg, #5E35B1 30%, #D81B60 90%)'
    }
  }
};

// Theme context type
interface ThemeContextType {
  themeMood: ThemeMood;
  themeMode: ThemeMode;
  setThemeMood: (mood: ThemeMood) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
  accessibility: AccessibilityOptions;
  toggleHighContrast: () => void;
  toggleLargeText: () => void;
  toggleReduceMotion: () => void;
  toggleScreenReaderMode: () => void;
  colors: typeof moodPalettes.professional.light;
  isHighContrast: boolean;
}

// Create context with default values
const ThemeContext = createContext<ThemeContextType>({
  themeMood: 'professional',
  themeMode: 'light',
  setThemeMood: () => {},
  setThemeMode: () => {},
  toggleThemeMode: () => {},
  accessibility: {
    highContrast: false,
    largeText: false,
    reduceMotion: false,
    screenReaderOptimized: false
  },
  toggleHighContrast: () => {},
  toggleLargeText: () => {},
  toggleReduceMotion: () => {},
  toggleScreenReaderMode: () => {},
  colors: moodPalettes.professional.light,
  isHighContrast: false
});

// Props for ThemeProvider
interface ThemeProviderProps {
  children: ReactNode;
}

// Theme provider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Local storage keys
  const THEME_MOOD_KEY = 'app_theme_mood';
  const THEME_MODE_KEY = 'app_theme_mode';
  const ACCESSIBILITY_KEY = 'app_accessibility';
  
  // Initialize state with stored values or defaults
  const [themeMood, setThemeMoodState] = useState<ThemeMood>(() => {
    const storedMood = localStorage.getItem(THEME_MOOD_KEY) as ThemeMood;
    return storedMood && Object.keys(moodPalettes).includes(storedMood) 
      ? storedMood 
      : 'professional';
  });
  
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const storedMode = localStorage.getItem(THEME_MODE_KEY) as ThemeMode;
    return storedMode === 'dark' ? 'dark' : 'light';
  });
  
  // Initialize accessibility options
  const [accessibility, setAccessibility] = useState<AccessibilityOptions>(() => {
    const storedAccessibility = localStorage.getItem(ACCESSIBILITY_KEY);
    return storedAccessibility 
      ? JSON.parse(storedAccessibility) 
      : {
          highContrast: false,
          largeText: false,
          reduceMotion: false,
          screenReaderOptimized: false
        };
  });
  
  // Determine if high contrast mode is active
  const isHighContrast = accessibility.highContrast;
  
  // Get current color palette based on theme settings and accessibility
  const colors = isHighContrast 
    ? highContrastPalettes[themeMode] 
    : moodPalettes[themeMood][themeMode];
  
  // Update mood with localStorage persistence
  const setThemeMood = (mood: ThemeMood) => {
    setThemeMoodState(mood);
    localStorage.setItem(THEME_MOOD_KEY, mood);
  };
  
  // Update mode with localStorage persistence
  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem(THEME_MODE_KEY, mode);
  };
  
  // Toggle between light and dark modes
  const toggleThemeMode = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  };
  
  // Update accessibility settings with localStorage persistence
  const updateAccessibility = (newSettings: AccessibilityOptions) => {
    setAccessibility(newSettings);
    localStorage.setItem(ACCESSIBILITY_KEY, JSON.stringify(newSettings));
  };
  
  // Toggle high contrast mode
  const toggleHighContrast = () => {
    const newSettings = { 
      ...accessibility, 
      highContrast: !accessibility.highContrast 
    };
    updateAccessibility(newSettings);
  };
  
  // Toggle large text mode
  const toggleLargeText = () => {
    const newSettings = { 
      ...accessibility, 
      largeText: !accessibility.largeText 
    };
    updateAccessibility(newSettings);
  };
  
  // Toggle reduced motion mode
  const toggleReduceMotion = () => {
    const newSettings = { 
      ...accessibility, 
      reduceMotion: !accessibility.reduceMotion 
    };
    updateAccessibility(newSettings);
  };
  
  // Toggle screen reader optimized mode
  const toggleScreenReaderMode = () => {
    const newSettings = { 
      ...accessibility, 
      screenReaderOptimized: !accessibility.screenReaderOptimized 
    };
    updateAccessibility(newSettings);
  };
  
  // Update CSS variables when theme or accessibility changes
  useEffect(() => {
    const root = document.documentElement;
    
    // Apply colors to CSS variables
    root.style.setProperty('--primary-color', colors.primary);
    root.style.setProperty('--secondary-color', colors.secondary);
    root.style.setProperty('--accent-color', colors.accent);
    root.style.setProperty('--background-color', colors.background);
    root.style.setProperty('--surface-color', colors.surface);
    root.style.setProperty('--text-color', colors.text);
    root.style.setProperty('--gradient', colors.gradient);
    
    // Apply mode-specific class
    if (themeMode === 'dark') {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    
    // Apply accessibility classes
    if (accessibility.highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    
    if (accessibility.largeText) {
      document.body.classList.add('large-text');
      root.style.setProperty('--font-scale', '1.25');
    } else {
      document.body.classList.remove('large-text');
      root.style.setProperty('--font-scale', '1');
    }
    
    if (accessibility.reduceMotion) {
      document.body.classList.add('reduce-motion');
    } else {
      document.body.classList.remove('reduce-motion');
    }
    
    if (accessibility.screenReaderOptimized) {
      document.body.classList.add('screen-reader-optimized');
    } else {
      document.body.classList.remove('screen-reader-optimized');
    }
    
    // Add focus-visible class to improve keyboard focus visibility
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-user');
      }
    };
    
    const handleMouseDown = () => {
      document.body.classList.remove('keyboard-user');
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);
    
    // System preferences for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches && !accessibility.reduceMotion) {
      // If system prefers reduced motion but it's not set in our app, enable it
      const newSettings = { ...accessibility, reduceMotion: true };
      updateAccessibility(newSettings);
    }
    
    // Apply ARIA attributes for improved screen reader support
    if (accessibility.screenReaderOptimized) {
      document.querySelectorAll('button:not([aria-label])').forEach(btn => {
        if (btn.textContent) {
          btn.setAttribute('aria-label', btn.textContent.trim());
        }
      });
      
      // Ensure all images have alt text
      document.querySelectorAll('img:not([alt])').forEach(img => {
        img.setAttribute('alt', '');
      });
    }
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
    };
    
  }, [themeMood, themeMode, colors, accessibility]);
  
  // Context value
  const contextValue: ThemeContextType = {
    themeMood,
    themeMode,
    setThemeMood,
    setThemeMode,
    toggleThemeMode,
    accessibility,
    toggleHighContrast,
    toggleLargeText,
    toggleReduceMotion,
    toggleScreenReaderMode,
    colors,
    isHighContrast
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for using the theme context
export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
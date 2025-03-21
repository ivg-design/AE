import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Theme, defaultTheme } from './theme';
import { getAppBackgroundColor, subscribeBackgroundColor } from '../lib/utils/bolt';

interface ThemeContextType {
  theme: Theme;
  updateTheme: (newTheme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  const handleThemeChange = useCallback((color: string) => {
    setTheme(prevTheme => ({
      ...prevTheme,
      colors: {
        ...prevTheme.colors,
        background: {
          ...prevTheme.colors.background,
          primary: color
        }
      }
    }));
  }, []);

  useEffect(() => {
    // Initialize with current background color
    try {
      const bgColor = getAppBackgroundColor();
      handleThemeChange(bgColor.hex);
    } catch (error: unknown) {
      console.error('Error getting initial background color:', error);
    }

    // Subscribe to theme changes
    subscribeBackgroundColor(handleThemeChange);
    
    // No cleanup needed as the subscription is handled by CEP
  }, [handleThemeChange]);

  const updateTheme = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
  }, []);

  const value = useMemo(() => ({ 
    theme, 
    updateTheme 
  }), [theme, updateTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 
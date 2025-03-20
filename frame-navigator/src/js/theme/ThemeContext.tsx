import React, { createContext, useContext, useState, useEffect } from 'react';
import { Theme, defaultTheme } from './theme';
import { getAppBackgroundColor, subscribeBackgroundColor } from '../lib/utils/bolt';

interface ThemeContextType {
  theme: Theme;
  updateTheme: (newTheme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    // Subscribe to Adobe's theme changes
    const handleThemeChange = (color: string) => {
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
    };

    subscribeBackgroundColor(handleThemeChange);

    return () => {
      // Cleanup subscription if needed
    };
  }, []);

  const updateTheme = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
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
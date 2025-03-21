import React, { useRef, KeyboardEvent, useEffect } from "react";
import { FrameInput } from "../components/FrameInput";
import { useFrameNavigation } from "../hooks/useFrameNavigation";
import { ThemeProvider, useTheme } from "../theme/ThemeContext";
import { createStyles } from "../theme/styles";
import { WindowManager } from "../utils/windowManager";
import "./main.css";

// Check if we're running in CEP or dev mode
const isRunningInCEP = !!window.cep;

const ThemedContent = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  const {
    frameInfo,
    inputValue,
    setInputValue,
    isFrameMode,
    handleNavigate,
    toggleMode,
    handleArrowKeys
  } = useFrameNavigation();

  // Handle key press for dev mode
  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isRunningInCEP) {
      if (e.key === "Enter") {
        handleNavigate();
      } else if (e.key === "Tab") {
        e.preventDefault();
        toggleMode();
      }
    }
  };

  // Handle key events from CSInterface
  useEffect(() => {
    if (isRunningInCEP) {
      const handleKeyEvent = (e: globalThis.KeyboardEvent) => {
        if (e.keyCode === 13) { // Enter key
          handleNavigate();
          e.preventDefault();
        } else if (e.keyCode === 9) { // Tab key
          toggleMode();
          e.preventDefault();
        }
      };

      window.addEventListener('keydown', handleKeyEvent);
      return () => window.removeEventListener('keydown', handleKeyEvent);
    }
  }, [handleNavigate, toggleMode]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div style={styles.container}>
      <FrameInput
        value={inputValue}
        onChange={setInputValue}
        onKeyDown={handleKeyPress}
        isFrameMode={isFrameMode}
        frameInfo={frameInfo}
        inputRef={inputRef}
        handleArrowKeys={handleArrowKeys}
      />
    </div>
  );
};

const Main = () => {
  React.useEffect(() => {
    // Initialize window settings
    WindowManager.initialize();
  }, []);

  return (
    <ThemeProvider>
      <ThemedContent />
    </ThemeProvider>
  );
};

export default Main;
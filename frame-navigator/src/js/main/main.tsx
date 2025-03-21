import React, { useRef, useEffect, useCallback, memo } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import FrameInput from "../components/FrameInput";
import { useFrameNavigation } from "../hooks/useFrameNavigation";
import { ThemeProvider, useTheme } from "../theme/ThemeContext";
import { useStyles } from "../theme/styles";
import { WindowManager } from "../utils/windowManager";

// Check if we're running in CEP or dev mode
const isRunningInCEP = !!window.cep;

const ThemedContent = memo(() => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme } = useTheme();
  const styles = useStyles(theme);
  
  const {
    frameInfo,
    inputValue,
    setInputValue,
    isFrameMode,
    handleNavigate,
    toggleMode,
    handleArrowKeys
  } = useFrameNavigation();

  const handleKeyPress = useCallback((e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (!isRunningInCEP) {
      if (e.key === "Enter") {
        handleNavigate();
      } else if (e.key === "Tab") {
        e.preventDefault();
        toggleMode();
      }
    }
  }, [handleNavigate, toggleMode]);

  useEffect(() => {
    if (isRunningInCEP) {
      const handleKeyEvent = (e: globalThis.KeyboardEvent) => {
        if (e.keyCode === 13) {
          handleNavigate();
          e.preventDefault();
        } else if (e.keyCode === 9) {
          toggleMode();
          e.preventDefault();
        }
      };

      window.addEventListener('keydown', handleKeyEvent);
      return () => window.removeEventListener('keydown', handleKeyEvent);
    }
  }, [handleNavigate, toggleMode]);

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
});

ThemedContent.displayName = 'ThemedContent';

const Main = memo(() => {
  useEffect(() => {
    WindowManager.initialize();
  }, []);

  return (
    <ThemeProvider>
      <ThemedContent />
    </ThemeProvider>
  );
});

Main.displayName = 'Main';

export default Main;
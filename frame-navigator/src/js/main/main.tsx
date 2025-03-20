import React, { useRef, KeyboardEvent } from "react";
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
    toggleMode
  } = useFrameNavigation();

  // Handle key press
  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleNavigate();
    } else if (e.key === "Tab") {
      e.preventDefault();
      toggleMode();
    }
  };

  // Focus input on mount
  React.useEffect(() => {
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
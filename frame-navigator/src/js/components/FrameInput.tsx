import React, { KeyboardEvent, useEffect } from 'react';
import { FrameInfo } from '../types/frame';
import { useTheme } from '../theme/ThemeContext';
import { createStyles } from '../theme/styles';

interface FrameInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  isFrameMode: boolean;
  frameInfo: FrameInfo | null;
  inputRef: React.RefObject<HTMLInputElement>;
}

export const FrameInput: React.FC<FrameInputProps> = ({
  value,
  onChange,
  onKeyDown,
  isFrameMode,
  frameInfo,
  inputRef
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  // Select all text when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 100); // Increased timeout to ensure DOM is ready
    return () => clearTimeout(timer);
  }, []);

  // Handle focus to ensure text is selected
  const handleFocus = () => {
    if (inputRef.current) {
      inputRef.current.select();
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={handleFocus}
        style={styles.frameInput}
      />
      <div style={styles.statusText}>
        {isFrameMode 
          ? `${frameInfo?.timecode || "--:--:--:--"}`
          : `${frameInfo ? String(frameInfo.frame).padStart(5, '0') : "-----"}`}
        {frameInfo && ` (${frameInfo.frameRate} fps)`}
      </div>
    </>
  );
}; 
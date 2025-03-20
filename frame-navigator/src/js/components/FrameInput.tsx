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
    // Use a small timeout to ensure the input is mounted and has focus
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.select();
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
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
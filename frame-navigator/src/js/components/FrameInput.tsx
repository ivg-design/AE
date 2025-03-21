import React, { KeyboardEvent, useRef, useEffect } from 'react';
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
  handleArrowKeys: (e: KeyboardEvent<HTMLInputElement>) => void;
}

export const FrameInput: React.FC<FrameInputProps> = ({
  value,
  onChange,
  onKeyDown,
  isFrameMode,
  frameInfo,
  inputRef,
  handleArrowKeys
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const lastCaretPosition = useRef<number | null>(null);

  // Select all text when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Restore caret position after value changes
  useEffect(() => {
    if (lastCaretPosition.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(lastCaretPosition.current, lastCaretPosition.current);
      lastCaretPosition.current = null;
    }
  }, [value]);

  // Handle focus to ensure text is selected
  const handleFocus = () => {
    if (inputRef.current) {
      inputRef.current.select();
    }
  };

  // Combined key handler
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      // Store caret position before the change
      lastCaretPosition.current = e.currentTarget.selectionStart;
      handleArrowKeys(e);
    } else {
      onKeyDown(e);
    }
  };

  return (
    <div className="input-container" style={styles.container}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        className="input-field"
        style={styles.frameInput}
      />
      <div className="status-text" style={styles.statusText}>
        {isFrameMode 
          ? `${frameInfo?.timecode || "--:--:--:--"}`
          : `${frameInfo ? String(frameInfo.frame).padStart(5, '0') : "-----"}`}
        {frameInfo && ` (${frameInfo.frameRate} fps)`}
      </div>
    </div>
  );
}; 
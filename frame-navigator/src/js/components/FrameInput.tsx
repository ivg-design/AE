import React, { useRef, useEffect, useCallback, memo } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, ChangeEvent } from 'react';
import { FrameInfo } from '../types/frame';
import { useTheme } from '../theme/ThemeContext';
import { useStyles } from '../theme/styles';

interface FrameInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: ReactKeyboardEvent<HTMLInputElement>) => void;
  isFrameMode: boolean;
  frameInfo: FrameInfo | null;
  inputRef: React.RefObject<HTMLInputElement>;
  handleArrowKeys: (e: ReactKeyboardEvent<HTMLInputElement>) => void;
}

const FrameInput: React.FC<FrameInputProps> = memo(({
  value,
  onChange,
  onKeyDown,
  isFrameMode,
  frameInfo,
  inputRef,
  handleArrowKeys
}) => {
  const { theme } = useTheme();
  const styles = useStyles(theme);
  const lastCaretPosition = useRef<number | null>(null);
  const shouldSelect = useRef(true);

  // Initial mount effect - ensure selection happens after focus
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      // Use a small timeout to ensure selection happens after focus
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.select();
        }
      }, 0);
    }
  }, []);

  useEffect(() => {
    if (lastCaretPosition.current !== null && inputRef.current && !shouldSelect.current) {
      inputRef.current.setSelectionRange(lastCaretPosition.current, lastCaretPosition.current);
      lastCaretPosition.current = null;
    }
    shouldSelect.current = false;
  }, [value]);

  const handleFocus = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.select();
    }
  }, []);

  const handleKeyDown = useCallback((e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      lastCaretPosition.current = e.currentTarget.selectionStart;
      shouldSelect.current = false;
      handleArrowKeys(e);
    } else {
      lastCaretPosition.current = e.currentTarget.selectionStart;
      onKeyDown(e);
    }
  }, [handleArrowKeys, onKeyDown]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    shouldSelect.current = false;
    onChange(e.target.value);
  }, [onChange]);

  const statusText = frameInfo 
    ? `${isFrameMode ? frameInfo.timecode : String(frameInfo.frame).padStart(5, '0')}${` (${frameInfo.frameRate} fps)`}`
    : isFrameMode ? "--:--:--:--" : "-----";

  return (
    <div style={styles.container}>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        style={styles.frameInput}
      />
      <div style={styles.statusText}>
        {statusText}
      </div>
    </div>
  );
});

FrameInput.displayName = 'FrameInput';

export default FrameInput; 
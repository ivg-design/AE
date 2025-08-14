import { useState, useEffect, useRef, KeyboardEvent as ReactKeyboardEvent, useCallback } from 'react';
import { FrameInfo } from '../types/frame';
import { getCurrentFrameInfo, navigateToFrame, padNumber, framesToTimecode } from '../utils/frameUtils';
import CSInterface from '../lib/cep/csinterface';

export const useFrameNavigation = () => {
  const [frameInfo, setFrameInfo] = useState<FrameInfo | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isFrameMode, setIsFrameMode] = useState(true);
  const [lastUserInput, setLastUserInput] = useState<string | null>(null);
  const devModeFrameRef = useRef<number>(1000);
  const csInterface = useRef(new CSInterface());

  const isRunningInCEP = !!window.cep;

  const updateFrameInfo = useCallback(async () => {
    if (isRunningInCEP) {
      const info = await getCurrentFrameInfo();
      if (info) {
        setFrameInfo(info);
        if (lastUserInput === null) {
          setInputValue(isFrameMode ? padNumber(info.frame, 5) : info.timecode);
        }
      }
    } else {
      const mockInfo = {
        frame: devModeFrameRef.current,
        frameRate: 24,
        timecode: framesToTimecode(devModeFrameRef.current, 24)
      };
      setFrameInfo(mockInfo);
      if (lastUserInput === null) {
        setInputValue(isFrameMode ? padNumber(mockInfo.frame, 5) : mockInfo.timecode);
      }
    }
  }, [isFrameMode, lastUserInput]);

  const handleNavigate = useCallback(async () => {
    if (isRunningInCEP) {
      try {
        await navigateToFrame(inputValue, isFrameMode);
        setLastUserInput(null);
        setTimeout(() => csInterface.current.closeExtension(), 100);
      } catch (e) {
        console.error('Navigation failed:', e);
      }
    } else {
      try {
        const parsedValue = parseInt(inputValue.replace(/^0+/, ""), 10);
        if (!isNaN(parsedValue)) {
          devModeFrameRef.current = parsedValue;
          updateFrameInfo();
          setLastUserInput(null);
        }
      } catch (e) {
        console.error('Navigation failed:', e);
      }
    }
  }, [inputValue, isFrameMode, updateFrameInfo]);

  const toggleMode = useCallback(() => {
    if (!frameInfo) return;

    setIsFrameMode(prevMode => {
      const newMode = !prevMode;
      if (lastUserInput !== null) {
        try {
          if (prevMode) {
            // Converting from frames to timecode
            const frameNum = parseInt(lastUserInput.replace(/^0+/, ""), 10);
            if (!isNaN(frameNum)) {
              setInputValue(framesToTimecode(frameNum, frameInfo.frameRate));
            } else {
              setInputValue(frameInfo.timecode);
            }
          } else {
            // Converting from timecode to frames
            const [hours, minutes, seconds, frames] = lastUserInput.split(':').map(Number);
            if (!isNaN(hours) && !isNaN(minutes) && !isNaN(seconds) && !isNaN(frames)) {
              const totalFrames = hours * 3600 * frameInfo.frameRate +
                                minutes * 60 * frameInfo.frameRate +
                                seconds * frameInfo.frameRate +
                                frames;
              setInputValue(padNumber(totalFrames, 5));
            } else {
              setInputValue(padNumber(frameInfo.frame, 5));
            }
          }
        } catch {
          setInputValue(prevMode ? frameInfo.timecode : padNumber(frameInfo.frame, 5));
        }
      } else {
        setInputValue(prevMode ? frameInfo.timecode : padNumber(frameInfo.frame, 5));
      }
      return newMode;
    });
  }, [frameInfo, lastUserInput]);

  const handleFrameModeArrows = useCallback((e: ReactKeyboardEvent<HTMLInputElement>, currentFrame: number) => {
    const increment = e.shiftKey ? 10 : (e.metaKey ? 100 : 1);
    const newFrame = e.key === "ArrowUp" ? currentFrame + increment : currentFrame - increment;
    return Math.max(0, newFrame);
  }, []);

  const handleTimecodeModeArrows = useCallback((e: ReactKeyboardEvent<HTMLInputElement>, currentTimecode: string, caretPosition: number) => {
    if (!frameInfo) return currentTimecode;

    const parts = currentTimecode.split(':');
    if (parts.length !== 4) return currentTimecode;

    const [hours, minutes, seconds, frames] = parts.map(Number);
    const direction = e.key === "ArrowUp" ? 1 : -1;

    // Calculate the total frames first
    let totalFrames = hours * 3600 * frameInfo.frameRate +
                      minutes * 60 * frameInfo.frameRate +
                      seconds * frameInfo.frameRate +
                      frames;

    // Calculate which digit we're on (0-9) and which position (0-11)
    const digitPosition = caretPosition - (caretPosition > 2 ? 1 : 0) - (caretPosition > 5 ? 1 : 0) - (caretPosition > 8 ? 1 : 0);
    
    // Determine if we're in position 1 (before), 2 (between), or 3 (after) the zeros
    const positionInDigit = caretPosition % 3;
    
    // Calculate the multiplier based on position
    let multiplier = 1;
    if (caretPosition >= 9) {
      multiplier = 1; // frames
    } else if (caretPosition >= 6) {
      multiplier = frameInfo.frameRate; // seconds
    } else if (caretPosition >= 3) {
      multiplier = 60 * frameInfo.frameRate; // minutes
    } else {
      multiplier = 3600 * frameInfo.frameRate; // hours
    }

    // Apply the increment/decrement based on position
    let step = 1;
    if (positionInDigit === 1) { // Position 2 (between zeros)
      step = 1; // Change singles
    } else if (positionInDigit === 2) { // Position 3 (after zeros)
      step = 1; // Change singles
    } else { // Position 1 (before zeros)
      step = 10; // Change tens
    }

    totalFrames += direction * step * multiplier;

    // Ensure we don't go negative
    totalFrames = Math.max(0, totalFrames);

    // Convert back to timecode
    const newHours = Math.floor(totalFrames / (3600 * frameInfo.frameRate));
    totalFrames %= 3600 * frameInfo.frameRate;
    
    const newMinutes = Math.floor(totalFrames / (60 * frameInfo.frameRate));
    totalFrames %= 60 * frameInfo.frameRate;
    
    const newSeconds = Math.floor(totalFrames / frameInfo.frameRate);
    const newFrames = totalFrames % frameInfo.frameRate;

    return `${padNumber(newHours, 2)}:${padNumber(newMinutes, 2)}:${padNumber(newSeconds, 2)}:${padNumber(newFrames, 2)}`;
  }, [frameInfo]);

  const handleArrowKeys = useCallback((e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();

    if (isFrameMode) {
      const currentFrame = parseInt(inputValue.replace(/^0+/, "") || "0", 10);
      const newFrame = handleFrameModeArrows(e, currentFrame);
      const newValue = padNumber(newFrame, 5);
      setInputValue(newValue);
      setLastUserInput(newValue);
    } else {
      const caretPosition = e.currentTarget.selectionStart || 0;
      const newTimecode = handleTimecodeModeArrows(e, inputValue, caretPosition);
      setInputValue(newTimecode);
      setLastUserInput(newTimecode);
    }
  }, [isFrameMode, inputValue, handleFrameModeArrows, handleTimecodeModeArrows]);

  useEffect(() => {
    updateFrameInfo();
  }, [updateFrameInfo]);

  const setInput = useCallback((value: string) => {
    setLastUserInput(value);
    setInputValue(value);
  }, []);

  const handleFrameModeChange = useCallback((newValue: string) => {
    // Allow empty input for better UX
    if (!newValue) {
      setInputValue(newValue);
      return;
    }

    // Allow digits, operators (+, -, *, /), and parentheses
    if (!/^[\d+\-*/(). ]*$/.test(newValue)) {
      return;
    }

    // Update input value
    setInputValue(newValue);
  }, []);

  const handleTimecodeModeChange = useCallback((newValue: string) => {
    // Allow empty input for better UX
    if (!newValue) {
      setInputValue(newValue);
      return;
    }

    // Only allow digits and colons
    if (!/^[\d:]*$/.test(newValue)) {
      return;
    }

    // Update input value
    setInputValue(newValue);
  }, []);

  return {
    frameInfo,
    inputValue,
    setInputValue: setInput,
    isFrameMode,
    handleNavigate,
    toggleMode,
    handleArrowKeys,
    handleFrameModeChange,
    handleTimecodeModeChange
  };
}; 
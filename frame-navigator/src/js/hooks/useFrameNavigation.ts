import { useState, useEffect, useRef, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { FrameInfo } from '../types/frame';
import { getCurrentFrameInfo, navigateToFrame, padNumber, framesToTimecode } from '../utils/frameUtils';
import CSInterface from '../lib/cep/csinterface';

export const useFrameNavigation = () => {
  const [frameInfo, setFrameInfo] = useState<FrameInfo | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isFrameMode, setIsFrameMode] = useState(true);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [lastUserInput, setLastUserInput] = useState<string | null>(null);
  const devModeFrameRef = useRef<number>(1000);
  const csInterface = useRef(new CSInterface());
  const inputRef = useRef<HTMLInputElement | null>(null);

  const isRunningInCEP = !!window.cep;

  const updateFrameInfo = async () => {
    if (isRunningInCEP) {
      const info = await getCurrentFrameInfo();
      if (info) {
        setFrameInfo(info);
        // Only update input if there's no pending user input
        if (lastUserInput === null) {
          setInputValue(isFrameMode ? padNumber(info.frame, 5) : info.timecode);
        }
      }
    } else {
      // Dev mode simulation
      const mockInfo = {
        frame: devModeFrameRef.current,
        frameRate: 24,
        timecode: framesToTimecode(devModeFrameRef.current, 24)
      };
      setFrameInfo(mockInfo);
      // Only update input if there's no pending user input
      if (lastUserInput === null) {
        setInputValue(isFrameMode ? padNumber(mockInfo.frame, 5) : mockInfo.timecode);
      }
    }
  };

  const handleNavigate = async () => {
    if (isRunningInCEP) {
      try {
        await navigateToFrame(inputValue, isFrameMode);
        // Clear user input after navigation
        setLastUserInput(null);
        setIsUserTyping(false);
        // Close the extension using CSInterface
        setTimeout(() => {
          csInterface.current.closeExtension();
        }, 100); // Small delay to ensure navigation completes
      } catch (e) {
        console.error('Navigation failed:', e);
      }
    } else {
      // Dev mode navigation
      try {
        const parsedValue = parseInt(inputValue.replace(/^0+/, ""), 10);
        if (!isNaN(parsedValue)) {
          devModeFrameRef.current = parsedValue;
          updateFrameInfo();
          // Clear user input after navigation
          setLastUserInput(null);
          setIsUserTyping(false);
          console.log('Dev mode: Would close extension here');
        }
      } catch (e) {
        console.error('Navigation failed:', e);
      }
    }
  };

  const toggleMode = () => {
    setIsFrameMode(!isFrameMode);
    // Update input value when mode changes, but preserve user input if it exists
    if (frameInfo) {
      if (lastUserInput !== null) {
        // If there's user input, convert it to the new mode
        try {
          if (isFrameMode) {
            // Converting from frame to timecode
            const frameNum = parseInt(lastUserInput.replace(/^0+/, ""), 10);
            if (!isNaN(frameNum)) {
              setInputValue(framesToTimecode(frameNum, frameInfo.frameRate));
            }
          } else {
            // Converting from timecode to frame
            const [hours, minutes, seconds, frames] = lastUserInput.split(':').map(Number);
            if (!isNaN(hours) && !isNaN(minutes) && !isNaN(seconds) && !isNaN(frames)) {
              const totalFrames = hours * 3600 * frameInfo.frameRate +
                                minutes * 60 * frameInfo.frameRate +
                                seconds * frameInfo.frameRate +
                                frames;
              setInputValue(padNumber(totalFrames, 5));
            }
          }
        } catch (e) {
          // If conversion fails, fall back to current frame info
          setInputValue(isFrameMode ? frameInfo.timecode : padNumber(frameInfo.frame, 5));
        }
      } else {
        // No user input, use current frame info
        setInputValue(isFrameMode ? frameInfo.timecode : padNumber(frameInfo.frame, 5));
      }
    }
  };

  const handleFrameModeArrows = (e: ReactKeyboardEvent<HTMLInputElement>, currentFrame: number) => {
    const increment = e.shiftKey ? 10 : (e.metaKey ? 100 : 1);
    const newFrame = e.key === "ArrowUp" ? currentFrame + increment : currentFrame - increment;
    return Math.max(0, newFrame);
  };

  const handleTimecodeModeArrows = (e: ReactKeyboardEvent<HTMLInputElement>, currentTimecode: string, caretPosition: number) => {
    if (!frameInfo) return currentTimecode;

    const parts = currentTimecode.split(':');
    if (parts.length !== 4) return currentTimecode;

    const [hours, minutes, seconds, frames] = parts.map(Number);
    const direction = e.key === "ArrowUp" ? 1 : -1;

    // Calculate which part to increment based on caret position
    let newHours = hours;
    let newMinutes = minutes;
    let newSeconds = seconds;
    let newFrames = frames;

    // Determine increment based on caret position
    // Format is HH:MM:SS:FF (11 chars total)
    // Position 9-11: Frames (FF)
    // Position 6-8: Seconds (SS)
    // Position 3-5: Minutes (MM)
    // Position 0-2: Hours (HH)
    if (caretPosition >= 9) { // Frames position
      newFrames += direction;
    } else if (caretPosition >= 6) { // Seconds position
      newSeconds += direction;
    } else if (caretPosition >= 3) { // Minutes position
      newMinutes += direction;
    } else { // Hours position
      newHours += direction;
    }

    // Handle overflow/underflow
    if (newFrames >= frameInfo.frameRate) {
      newFrames = 0;
      newSeconds++;
    } else if (newFrames < 0) {
      newFrames = frameInfo.frameRate - 1;
      newSeconds--;
    }

    if (newSeconds >= 60) {
      newSeconds = 0;
      newMinutes++;
    } else if (newSeconds < 0) {
      newSeconds = 59;
      newMinutes--;
    }

    if (newMinutes >= 60) {
      newMinutes = 0;
      newHours++;
    } else if (newMinutes < 0) {
      newMinutes = 59;
      newHours--;
    }

    // Ensure hours doesn't go negative
    newHours = Math.max(0, newHours);

    return `${padNumber(newHours, 2)}:${padNumber(newMinutes, 2)}:${padNumber(newSeconds, 2)}:${padNumber(newFrames, 2)}`;
  };

  const handleArrowKeys = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
    e.preventDefault();

    if (isFrameMode) {
      // Frame mode
      const currentFrame = parseInt(inputValue.replace(/^0+/, "") || "0", 10);
      const newFrame = handleFrameModeArrows(e, currentFrame);
      setInputValue(padNumber(newFrame, 5));
      setLastUserInput(padNumber(newFrame, 5));
    } else {
      // Timecode mode
      const caretPosition = e.currentTarget.selectionStart || 0;
      const newTimecode = handleTimecodeModeArrows(e, inputValue, caretPosition);
      setInputValue(newTimecode);
      setLastUserInput(newTimecode);
    }
  };

  // Get initial frame info on mount
  useEffect(() => {
    updateFrameInfo();
  }, []);

  // Reset user typing state after 2 seconds of no input
  useEffect(() => {
    if (isUserTyping) {
      const timeout = setTimeout(() => {
        setIsUserTyping(false);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [isUserTyping]);

  return {
    frameInfo,
    inputValue,
    setInputValue: (value: string) => {
      setIsUserTyping(true);
      setLastUserInput(value);
      setInputValue(value);
    },
    isFrameMode,
    handleNavigate,
    toggleMode,
    handleArrowKeys
  };
}; 
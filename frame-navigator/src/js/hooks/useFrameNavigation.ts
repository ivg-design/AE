import { useState, useEffect, useRef } from 'react';
import { FrameInfo } from '../types/frame';
import { getCurrentFrameInfo, navigateToFrame, padNumber, framesToTimecode } from '../utils/frameUtils';

export const useFrameNavigation = () => {
  const [frameInfo, setFrameInfo] = useState<FrameInfo | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isFrameMode, setIsFrameMode] = useState(true);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [lastUserInput, setLastUserInput] = useState<string | null>(null);
  const devModeFrameRef = useRef<number>(1000);

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
      await navigateToFrame(inputValue, isFrameMode);
      // Clear user input after navigation
      setLastUserInput(null);
      setIsUserTyping(false);
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
    toggleMode
  };
}; 
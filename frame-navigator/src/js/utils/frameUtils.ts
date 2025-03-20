import { FrameInfo } from '../types/frame';
import { evalTS } from '../lib/utils/bolt';

export const padNumber = (num: number, size: number): string => {
  let s = num.toString();
  while (s.length < size) s = "0" + s;
  return s;
};

export const framesToTimecode = (frames: number, frameRate: number): string => {
  const framesPerSecond = Math.round(frameRate);
  const remainingFrames = frames % framesPerSecond;
  const totalSeconds = Math.floor(frames / framesPerSecond);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${hours}:${padNumber(minutes, 2)}:${padNumber(seconds, 2)}:${padNumber(remainingFrames, 2)}`;
};

export const getCurrentFrameInfo = async (): Promise<FrameInfo | null> => {
  try {
    const result = await evalTS('getCurrentFrameInfo');
    return result as FrameInfo;
  } catch (error) {
    console.error('Error getting current frame info:', error);
    return null;
  }
};

export const navigateToFrame = async (value: string, isFrameMode: boolean): Promise<boolean> => {
  try {
    const result = await evalTS('navigateToFrame', value, isFrameMode);
    return result as boolean;
  } catch (error) {
    console.error('Error navigating to frame:', error);
    return false;
  }
}; 
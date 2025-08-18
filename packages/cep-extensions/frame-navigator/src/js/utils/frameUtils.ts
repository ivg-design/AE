import { FrameInfo } from '../types/frame';
import { evalTS } from '../lib/utils/bolt';

// Cache frame rate calculations
const frameRateCache = new Map<number, number>();

export const padNumber = (num: number, size: number): string => {
  return num.toString().padStart(size, '0');
};

export const framesToTimecode = (frames: number, frameRate: number): string => {
  let framesPerSecond = frameRateCache.get(frameRate);
  if (framesPerSecond === undefined) {
    framesPerSecond = Math.round(frameRate);
    frameRateCache.set(frameRate, framesPerSecond);
  }

  const totalSeconds = Math.floor(frames / framesPerSecond);
  const remainingFrames = frames % framesPerSecond;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${padNumber(hours, 2)}:${padNumber(minutes, 2)}:${padNumber(seconds, 2)}:${padNumber(remainingFrames, 2)}`;
};

export const getCurrentFrameInfo = async (): Promise<FrameInfo | null> => {
  try {
    console.log('Calling getCurrentFrameInfo...');
    const result = await evalTS('getCurrentFrameInfo');
    console.log('getCurrentFrameInfo result:', result);
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
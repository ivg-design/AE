import { FrameInfo } from '../types/frame';
import { evalTS } from '../lib/utils/bolt';

// Cache for frame rate calculations
const frameRateCache = new Map<number, number>();

export const padNumber = (num: number, width: number): string => {
  return String(num).padStart(width, '0');
};

export const framesToTimecode = (frames: number, frameRate: number): string => {
  // Cache frame rate calculations
  if (!frameRateCache.has(frameRate)) {
    frameRateCache.set(frameRate, frameRate);
  }

  const hours = Math.floor(frames / (3600 * frameRate));
  frames %= 3600 * frameRate;
  
  const minutes = Math.floor(frames / (60 * frameRate));
  frames %= 60 * frameRate;
  
  const seconds = Math.floor(frames / frameRate);
  frames %= frameRate;

  return `${padNumber(hours, 2)}:${padNumber(minutes, 2)}:${padNumber(seconds, 2)}:${padNumber(frames, 2)}`;
};

export const getCurrentFrameInfo = async (): Promise<FrameInfo | null> => {
  try {
    const result = await evalTS<'getCurrentFrameInfo', () => { frame: number; frameRate: number; timecode: string; } | null>('getCurrentFrameInfo');
    return result;
  } catch (e) {
    console.error('Failed to get current frame info:', e);
    return null;
  }
};

export const navigateToFrame = async (value: string, isFrameMode: boolean): Promise<void> => {
  try {
    if (isFrameMode) {
      const frameNum = parseInt(value.replace(/^0+/, ""), 10);
      if (!isNaN(frameNum)) {
        await evalTS<'evaluateExpression', (expression: string) => any>('evaluateExpression', `app.project.activeItem.time = ${frameNum}`);
      }
    } else {
      const [hours, minutes, seconds, frames] = value.split(':').map(Number);
      if (!isNaN(hours) && !isNaN(minutes) && !isNaN(seconds) && !isNaN(frames)) {
        const frameRate = await evalTS<'evaluateExpression', (expression: string) => any>('evaluateExpression', 'app.project.activeItem.frameRate');
        if (frameRate !== null) {
          const totalFrames = hours * 3600 * frameRate +
                            minutes * 60 * frameRate +
                            seconds * frameRate +
                            frames;
          await evalTS<'evaluateExpression', (expression: string) => any>('evaluateExpression', `app.project.activeItem.time = ${totalFrames}`);
        }
      }
    }
  } catch (e) {
    console.error('Navigation failed:', e);
    throw e;
  }
}; 
export type Scripts = {
  padNumber: (num: number, size: number) => string;
  framesToTimecode: (frames: number, frameRate: number) => string;
  timecodeToFrames: (timecode: string, frameRate: number) => number;
  getCurrentFrameInfo: () => { frame: number; frameRate: number; timecode: string; } | null;
  navigateToFrame: (value: string, isFrameMode: boolean) => boolean;
  evaluateExpression: (expression: string) => any;
  setWindowSize: (width: number, height: number) => boolean;
  getWindowSize: () => { width: number; height: number; } | null;
  setWindowMinSize: (width: number, height: number) => boolean;
  setWindowMaxSize: (width: number, height: number) => boolean;
};

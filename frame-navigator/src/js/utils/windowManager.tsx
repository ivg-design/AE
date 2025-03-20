import CSInterface from '../lib/cep/csinterface';

const csi = new CSInterface();

export const WindowManager = {
  /**
   * Initialize the window with headless settings
   */
  initialize: () => {
    // Set window title
    csi.setWindowTitle("");
    
    // Remove flyout menu
    csi.setPanelFlyoutMenu("");
    
    // Set window size
    csi.resizeContent(300, 150);
  },

  /**
   * Close the extension window
   */
  close: () => {
    csi.closeExtension();
  },

  /**
   * Get current window visibility
   */
  isVisible: (): boolean => {
    return csi.isWindowVisible();
  },

  /**
   * Get current window title
   */
  getTitle: (): string => {
    return csi.getWindowTitle();
  }
}; 
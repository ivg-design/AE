import CSInterface from '../lib/cep/csinterface';

// Create singleton instance
const csi = new CSInterface();

export const WindowManager = {
  /**
   * Initialize the window with headless settings
   */
  initialize: () => {
    try {
      csi.setWindowTitle("");
      csi.setPanelFlyoutMenu("");
      csi.resizeContent(300, 150);
    } catch (error) {
      console.error('Error initializing window:', error);
    }
  },

  /**
   * Close the extension window
   */
  close: () => {
    try {
      csi.closeExtension();
    } catch (error) {
      console.error('Error closing window:', error);
    }
  },

  /**
   * Get current window visibility
   */
  isVisible: (): boolean => {
    try {
      return csi.isWindowVisible();
    } catch (error) {
      console.error('Error checking window visibility:', error);
      return false;
    }
  },

  /**
   * Get current window title
   */
  getTitle: (): string => {
    try {
      return csi.getWindowTitle();
    } catch (error) {
      console.error('Error getting window title:', error);
      return '';
    }
  }
}; 
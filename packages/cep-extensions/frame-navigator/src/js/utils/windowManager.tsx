import CSInterface from '../lib/cep/csinterface';

// Create singleton instance only in CEP environment
const csi = typeof window !== 'undefined' && window.cep ? new CSInterface() : null;

export const WindowManager = {
  /**
   * Initialize the window with headless settings
   */
  initialize: () => {
    if (!csi) return; // Skip if not in CEP environment
    
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
    if (!csi) return; // Skip if not in CEP environment
    
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
    if (!csi) return false; // Return false if not in CEP environment
    
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
    if (!csi) return ''; // Return empty string if not in CEP environment
    
    try {
      return csi.getWindowTitle();
    } catch (error) {
      console.error('Error getting window title:', error);
      return '';
    }
  }
}; 
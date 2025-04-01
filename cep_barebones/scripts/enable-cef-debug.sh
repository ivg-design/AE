#!/bin/bash

# Enable CEF debugging for the current user
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
defaults write com.adobe.CSXS.9 PlayerDebugMode 1
defaults write com.adobe.CSXS.8 PlayerDebugMode 1
defaults write com.adobe.CSXS.7 PlayerDebugMode 1

# Enable CEF debugging for After Effects specifically
defaults write com.adobe.AfterEffects PlayerDebugMode 1

# Enable CEF debugging globally
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
defaults write com.adobe.CSXS.9 PlayerDebugMode 1
defaults write com.adobe.CSXS.8 PlayerDebugMode 1
defaults write com.adobe.CSXS.7 PlayerDebugMode 1

# Enable CEF debugging in the system
defaults write com.adobe.CSXS.11 PlayerDebugMode 1
defaults write com.adobe.CSXS.10 PlayerDebugMode 1
defaults write com.adobe.CSXS.9 PlayerDebugMode 1
defaults write com.adobe.CSXS.8 PlayerDebugMode 1
defaults write com.adobe.CSXS.7 PlayerDebugMode 1

echo "CEF debugging has been enabled. Please restart Adobe applications for the changes to take effect." 
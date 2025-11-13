/**
 * ChromaBlenderizer - Advanced Color Interpolation System for Adobe After Effects
 *
 * A sophisticated color blending tool that provides linear interpolation and random
 * distribution of colors across multiple selected properties in After Effects compositions.
 *
 * @name ChromaBlenderizer
 * @namespace ChromaBlenderizer
 * @author IVG Design
 * @version 2.2.0
 * @date 2025-01-15
 * @license MIT
 *
 * @description
 * ChromaBlenderizer enables precise color control across multiple properties with
 * advanced interpolation algorithms. It supports both linear gradients and randomized
 * color distribution with full HSB control including hue, saturation, and brightness.
 *
 * @features
 * - Linear color interpolation across selected properties
 * - Random color distribution within defined ranges
 * - Full HSB (Hue, Saturation, Brightness) control
 * - Grayscale and full color gamut modes
 * - Shortest-path hue interpolation on color wheel
 * - Real-time color preview in UI
 * - Pick colors from existing properties
 * - Robust error handling and validation
 * - Support for any number of color properties (minimum 2)
 *
 * @usage
 * 1. Run the script (no pre-selection required)
 * 2. Use "Pick from Property" buttons to select colors from existing properties
 * 3. Or adjust start/end colors using HSB sliders
 * 4. Select target properties in the composition
 * 5. Choose between linear interpolation or randomization
 * 6. Select color mode (Grayscale or Color Gamut)
 * 7. Click Apply to set colors on selected properties
 *
 * @requirements
 * - Adobe After Effects CS6 or later
 * - Active composition
 *
 * @changelog
 * Version 2.2.0 (2025-01-15)
 * - ADDED: Post-launch property selection capability
 * - ADDED: Pick color from property buttons
 * - ADDED: Property selection counter in UI
 * - IMPROVED: UI flow - no longer requires pre-selection
 * - IMPROVED: Better user feedback with indicators
 *
 * Version 2.1.0 (2025-01-15)
 * - FIXED: Division by zero error when calculating color ratios
 * - FIXED: Missing validation for active composition
 * - FIXED: Variable name collision in rgbToHsb function (b parameter vs local variable)
 * - FIXED: Incorrect property counting that mixed color and non-color properties
 * - FIXED: Hue interpolation now takes shortest path on color wheel
 * - ADDED: Saturation control slider for full HSB manipulation
 * - ADDED: Pre-filtering of color properties for better performance
 * - ADDED: Comprehensive error handling with try-catch blocks
 * - ADDED: Better user feedback showing selected vs color properties count
 * - IMPROVED: Code structure with configuration object
 * - IMPROVED: Function naming and organization
 * - IMPROVED: Error messages with more context
 *
 * Version 2.0.0 (2025-01-13)
 * - Initial release with color picker integration
 * - Basic linear interpolation functionality
 * - Random color distribution feature
 * - Grayscale and color gamut modes
 */

(function () {
    // =====================================================
    // COLOR PICKER CODE PLACEHOLDER - START
    // =====================================================
    // PASTE THE COMPLETE COLOR PICKER CODE HERE
    // The color picker function should be available as colorPicker()
    // and should return [R, G, B] values in 0-1 range
    // =====================================================
    // COLOR PICKER CODE PLACEHOLDER - END
    // =====================================================

    // Validation: Check for active composition
    if (!app.project || !app.project.activeItem || !(app.project.activeItem instanceof CompItem)) {
        alert('Please open an active composition.');
        return;
    }

    // Configuration object with defaults
    var config = {
        startHue: 0,
        endHue: 0,
        saturation: 1,
        startBrightness: 1,
        endBrightness: 1,
        startColorPicked: false,
        endColorPicked: false
    };

    // Helper function to filter color properties
    function getColorProperties(properties) {
        var colorProps = [];
        if (!properties) return colorProps;
        
        for (var i = 0; i < properties.length; i++) {
            try {
                if (properties[i].propertyValueType === PropertyValueType.COLOR) {
                    colorProps.push(properties[i]);
                }
            } catch (e) {
                // Skip invalid properties silently
            }
        }
        return colorProps;
    }

    // Function to check if selected properties are valid
    function validColorProperties(colorProperties) {
        return colorProperties && colorProperties.length >= 2;
    }

    // Fixed HSB to RGB conversion
    function hsbToRgb(h, s, brightness) {
        var i = Math.floor(h * 6);
        var f = h * 6 - i;
        var p = brightness * (1 - s);
        var q = brightness * (1 - f * s);
        var t = brightness * (1 - (1 - f) * s);
        var r, g, b;
        
        switch (i % 6) {
            case 0: r = brightness; g = t; b = p; break;
            case 1: r = q; g = brightness; b = p; break;
            case 2: r = p; g = brightness; b = t; break;
            case 3: r = p; g = q; b = brightness; break;
            case 4: r = t; g = p; b = brightness; break;
            case 5: r = brightness; g = p; b = q; break;
        }
        return [r, g, b, 1];
    }

    // Fixed RGB to HSB conversion
    function rgbToHsb(r, g, b) {
        var max = Math.max(r, g, b);
        var min = Math.min(r, g, b);
        var h, s;
        var brightness = max;
        var d = max - min;
        s = max === 0 ? 0 : d / max;

        if (max === min) {
            h = 0; // achromatic
        } else {
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return [h, s, brightness];
    }

    // Calculate shortest path hue interpolation
    function interpolateHue(startHue, endHue, ratio) {
        var hueDiff = endHue - startHue;
        // Normalize to [-0.5, 0.5] for shortest path
        if (hueDiff > 0.5) hueDiff -= 1;
        if (hueDiff < -0.5) hueDiff += 1;
        return (startHue + hueDiff * ratio + 1) % 1;
    }

    // Get color from selected property
    function getColorFromSelectedProperty() {
        var comp = app.project.activeItem;
        if (!comp) {
            alert('No active composition found.');
            return null;
        }
        
        var props = comp.selectedProperties;
        if (!props || props.length === 0) {
            alert('Please select a color property first.');
            return null;
        }
        
        // Find first color property
        for (var i = 0; i < props.length; i++) {
            try {
                if (props[i].propertyValueType === PropertyValueType.COLOR) {
                    var colorValue = props[i].value;
                    return [colorValue[0], colorValue[1], colorValue[2]];
                }
            } catch (e) {
                // Skip invalid properties
            }
        }
        
        alert('No color property selected. Please select a color property.');
        return null;
    }

    // Create color button with preview
    function createColorButton(parent, initialColor) {
        var button = parent.add('button', undefined, '');
        button.size = [100, 20];
        button.color = initialColor;
        button.onDraw = function () {
            var g = this.graphics;
            g.newPath();
            g.rectPath(0, 0, this.size.width, this.size.height);
            g.fillPath(g.newBrush(g.BrushType.SOLID_COLOR, this.color));
        };
        button.onClick = function () {
            // Use color picker if available
            if (typeof colorPicker !== 'undefined') {
                var pickedColor = colorPicker();
                if (pickedColor) {
                    this.color = [pickedColor[0], pickedColor[1], pickedColor[2], 1];
                    this.notify('onDraw');
                    return pickedColor;
                }
            } else {
                alert('Color picker not available.\nPlease use the "Pick from Property" buttons or sliders.');
            }
        };
        return button;
    }

    // Create main dialog
    var dialog = new Window('dialog', 'ChromaBlenderizer v2.2.0');
    dialog.orientation = 'column';
    dialog.alignChildren = ['fill', 'top'];
    dialog.preferredSize.width = 380;

    // Title and instructions
    var header = dialog.add('panel', undefined, 'Color Selection');
    header.orientation = 'column';
    header.alignChildren = 'fill';
    header.add('statictext', undefined, 'Set your start and end colors, then select target properties');

    // Property Selection Section (NEW - placed at top for better workflow)
    var propPickerPanel = dialog.add('panel', undefined, 'Pick Colors from Properties');
    propPickerPanel.orientation = 'column';
    propPickerPanel.alignChildren = 'fill';
    
    var pickInstructions = propPickerPanel.add('statictext', undefined, 'Select a color property in comp, then click button:');
    pickInstructions.graphics.font = ScriptUI.newFont('dialog', 'ITALIC', 10);
    
    var pickButtonGroup = propPickerPanel.add('group');
    pickButtonGroup.alignment = 'center';
    
    var pickStartBtn = pickButtonGroup.add('button', undefined, '↓ Pick Start Color');
    pickStartBtn.preferredSize.width = 120;
    var startIndicator = pickButtonGroup.add('statictext', undefined, '○');
    
    pickButtonGroup.add('statictext', undefined, '  '); // spacer
    
    var pickEndBtn = pickButtonGroup.add('button', undefined, '↓ Pick End Color');
    pickEndBtn.preferredSize.width = 120;
    var endIndicator = pickButtonGroup.add('statictext', undefined, '○');

    // Color Display Section
    var colorPanel = dialog.add('panel', undefined, 'Color Settings');
    colorPanel.orientation = 'column';
    colorPanel.alignChildren = 'fill';
    
    var startColorGroup = colorPanel.add('group');
    startColorGroup.add('statictext', undefined, 'Start Color:');
    var startColorButton = createColorButton(startColorGroup, hsbToRgb(config.startHue, config.saturation, config.startBrightness));
    startColorGroup.add('statictext', undefined, '(click to use color picker)');

    var endColorGroup = colorPanel.add('group');
    endColorGroup.add('statictext', undefined, 'End Color:  ');
    var endColorButton = createColorButton(endColorGroup, hsbToRgb(config.endHue, config.saturation, config.endBrightness));
    endColorGroup.add('statictext', undefined, '(click to use color picker)');

    // HSB Controls
    var hsbPanel = dialog.add('panel', undefined, 'HSB Adjustments');
    hsbPanel.orientation = 'column';
    hsbPanel.alignChildren = 'fill';

    // Hue controls
    hsbPanel.add('statictext', undefined, 'Start Hue:');
    var startHueGroup = hsbPanel.add('group');
    var startHueSlider = startHueGroup.add('slider', undefined, config.startHue, 0, 1);
    startHueSlider.size = [200, 20];
    var startHueText = startHueGroup.add('statictext', undefined, Math.round(config.startHue * 360) + '°');
    startHueText.preferredSize.width = 40;

    hsbPanel.add('statictext', undefined, 'End Hue:');
    var endHueGroup = hsbPanel.add('group');
    var endHueSlider = endHueGroup.add('slider', undefined, config.endHue, 0, 1);
    endHueSlider.size = [200, 20];
    var endHueText = endHueGroup.add('statictext', undefined, Math.round(config.endHue * 360) + '°');
    endHueText.preferredSize.width = 40;

    // Saturation control
    hsbPanel.add('statictext', undefined, 'Saturation:');
    var saturationGroup = hsbPanel.add('group');
    var saturationSlider = saturationGroup.add('slider', undefined, config.saturation, 0, 1);
    saturationSlider.size = [200, 20];
    var saturationText = saturationGroup.add('statictext', undefined, Math.round(config.saturation * 100) + '%');
    saturationText.preferredSize.width = 40;

    // Brightness controls
    hsbPanel.add('statictext', undefined, 'Start Brightness:');
    var startBrightnessGroup = hsbPanel.add('group');
    var startBrightnessSlider = startBrightnessGroup.add('slider', undefined, config.startBrightness, 0, 1);
    startBrightnessSlider.size = [200, 20];
    var startBrightnessText = startBrightnessGroup.add('statictext', undefined, Math.round(config.startBrightness * 100) + '%');
    startBrightnessText.preferredSize.width = 40;

    hsbPanel.add('statictext', undefined, 'End Brightness:');
    var endBrightnessGroup = hsbPanel.add('group');
    var endBrightnessSlider = endBrightnessGroup.add('slider', undefined, config.endBrightness, 0, 1);
    endBrightnessSlider.size = [200, 20];
    var endBrightnessText = endBrightnessGroup.add('statictext', undefined, Math.round(config.endBrightness * 100) + '%');
    endBrightnessText.preferredSize.width = 40;

    // Options Panel
    var optionsPanel = dialog.add('panel', undefined, 'Options');
    optionsPanel.orientation = 'column';
    optionsPanel.alignChildren = 'left';

    var randomizeCheckbox = optionsPanel.add('checkbox', undefined, 'Randomize Colors');
    randomizeCheckbox.value = false;

    var modeGroup = optionsPanel.add('group');
    modeGroup.add('statictext', undefined, 'Mode:');
    var grayscaleRadio = modeGroup.add('radiobutton', undefined, 'Grayscale');
    var colorGamutRadio = modeGroup.add('radiobutton', undefined, 'Color Gamut');
    colorGamutRadio.value = true;

    // Target Properties Section
    var targetPanel = dialog.add('panel', undefined, 'Target Properties');
    targetPanel.orientation = 'column';
    targetPanel.alignChildren = 'fill';
    
    var propCountText = targetPanel.add('statictext', undefined, 'No properties selected');
    var selectPropsBtn = targetPanel.add('button', undefined, 'Select Color Properties');
    selectPropsBtn.onClick = function() {
        alert('Select color properties in your composition,\nthen click "Apply Colors"');
    };

    // Event Handlers for Pick from Property buttons
    pickStartBtn.onClick = function () {
        var color = getColorFromSelectedProperty();
        if (color) {
            var hsb = rgbToHsb(color[0], color[1], color[2]);
            config.startHue = hsb[0];
            config.saturation = hsb[1];
            config.startBrightness = hsb[2];
            
            // Update UI
            startHueSlider.value = config.startHue;
            startHueText.text = Math.round(config.startHue * 360) + '°';
            saturationSlider.value = config.saturation;
            saturationText.text = Math.round(config.saturation * 100) + '%';
            startBrightnessSlider.value = config.startBrightness;
            startBrightnessText.text = Math.round(config.startBrightness * 100) + '%';
            
            startColorButton.color = [color[0], color[1], color[2], 1];
            startColorButton.notify('onDraw');
            
            // Update indicator
            startIndicator.text = '●';
            config.startColorPicked = true;
        }
    };

    pickEndBtn.onClick = function () {
        var color = getColorFromSelectedProperty();
        if (color) {
            var hsb = rgbToHsb(color[0], color[1], color[2]);
            config.endHue = hsb[0];
            config.endBrightness = hsb[2];
            
            // Update UI
            endHueSlider.value = config.endHue;
            endHueText.text = Math.round(config.endHue * 360) + '°';
            endBrightnessSlider.value = config.endBrightness;
            endBrightnessText.text = Math.round(config.endBrightness * 100) + '%';
            
            endColorButton.color = [color[0], color[1], color[2], 1];
            endColorButton.notify('onDraw');
            
            // Update indicator
            endIndicator.text = '●';
            config.endColorPicked = true;
        }
    };

    // Slider event handlers
    startHueSlider.onChanging = function () {
        config.startHue = this.value;
        startHueText.text = Math.round(config.startHue * 360) + '°';
        startColorButton.color = hsbToRgb(config.startHue, config.saturation, config.startBrightness);
        startColorButton.notify('onDraw');
    };

    endHueSlider.onChanging = function () {
        config.endHue = this.value;
        endHueText.text = Math.round(config.endHue * 360) + '°';
        endColorButton.color = hsbToRgb(config.endHue, config.saturation, config.endBrightness);
        endColorButton.notify('onDraw');
    };

    saturationSlider.onChanging = function () {
        config.saturation = this.value;
        saturationText.text = Math.round(config.saturation * 100) + '%';
        startColorButton.color = hsbToRgb(config.startHue, config.saturation, config.startBrightness);
        endColorButton.color = hsbToRgb(config.endHue, config.saturation, config.endBrightness);
        startColorButton.notify('onDraw');
        endColorButton.notify('onDraw');
    };

    startBrightnessSlider.onChanging = function () {
        config.startBrightness = this.value;
        startBrightnessText.text = Math.round(config.startBrightness * 100) + '%';
        startColorButton.color = hsbToRgb(config.startHue, config.saturation, config.startBrightness);
        startColorButton.notify('onDraw');
    };

    endBrightnessSlider.onChanging = function () {
        config.endBrightness = this.value;
        endBrightnessText.text = Math.round(config.endBrightness * 100) + '%';
        endColorButton.color = hsbToRgb(config.endHue, config.saturation, config.endBrightness);
        endColorButton.notify('onDraw');
    };

    // Action Buttons
    var buttonGroup = dialog.add('group');
    buttonGroup.alignment = 'center';
    var applyButton = buttonGroup.add('button', undefined, 'Apply Colors');
    var cancelButton = buttonGroup.add('button', undefined, 'Cancel');

    // Apply colors handler
    applyButton.onClick = function () {
        var allProperties = app.project.activeItem.selectedProperties;
        var colorProperties = getColorProperties(allProperties);
        
        // Update count display
        propCountText.text = 'Color properties found: ' + colorProperties.length;
        
        if (!validColorProperties(colorProperties)) {
            alert('Please select at least two color properties.\n\n' +
                  'Selected: ' + (allProperties ? allProperties.length : 0) + ' properties\n' +
                  'Color properties found: ' + colorProperties.length);
            return;
        }

        try {
            app.beginUndoGroup('ChromaBlenderizer');
            
            var numProps = colorProperties.length;
            
            for (var i = 0; i < numProps; i++) {
                var ratio = numProps === 1 ? 0 : i / (numProps - 1);
                var colorValue;
                
                if (randomizeCheckbox.value) {
                    if (grayscaleRadio.value) {
                        var brightness = config.startBrightness + Math.random() * (config.endBrightness - config.startBrightness);
                        colorValue = hsbToRgb(0, 0, brightness);
                    } else {
                        var hue = config.startHue + Math.random() * (config.endHue - config.startHue);
                        var brightness = config.startBrightness + Math.random() * (config.endBrightness - config.startBrightness);
                        colorValue = hsbToRgb(hue % 1, config.saturation, brightness);
                    }
                } else {
                    if (grayscaleRadio.value) {
                        var brightness = config.startBrightness + (config.endBrightness - config.startBrightness) * ratio;
                        colorValue = hsbToRgb(0, 0, brightness);
                    } else {
                        var hue = interpolateHue(config.startHue, config.endHue, ratio);
                        var brightness = config.startBrightness + (config.endBrightness - config.startBrightness) * ratio;
                        colorValue = hsbToRgb(hue, config.saturation, brightness);
                    }
                }
                
                try {
                    colorProperties[i].setValue(colorValue);
                } catch (propError) {
                    $.writeln('Error setting property ' + i + ': ' + propError.toString());
                }
            }
            
            app.endUndoGroup();
            dialog.close();
            
        } catch (error) {
            alert('Error applying colors: ' + error.toString());
            try {
                app.endUndoGroup();
            } catch (e) {
                // Silent fail
            }
        }
    };

    cancelButton.onClick = function () {
        dialog.close();
    };

    dialog.show();
})();
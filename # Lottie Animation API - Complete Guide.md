# Lottie Animation API - Complete Guide

This guide covers the full Lottie Animation API, with comprehensive details, advanced usage examples, and in-depth explanations.

## Contents

- Initialization
- Playback Controls
- Layer Hierarchy
  - Finding Layers
  - Layer Properties
- Keypaths
  - Using Keypaths
  - Keypath Best Practices 
- Timelines
  - Time Remapping
  - Sequencing Animations
- Events
  - Enter Frame
  - Complete
  - Segment Start  
- External Values
- Async Animations
  - Callbacks
  - Sequencing Timelines
- Mouse Interactivity
- Multi-property Callbacks 
- Utility Methods

## Initialization

Load and initialize animation:

```js
const animation = lottie.loadAnimation({
  container: element,
  path: 'animation.json'
})
```

Main options:

- `container` - Element to contain animation
- `path` - Path to .json file 
- `renderer` - 'svg', 'canvas', 'html'
- `loop` - True to loop
- `autoplay` - True to autoplay on load

## Playback Controls

Control playback:

```js
animation.play();
animation.pause();
animation.stop(); 

animation.goToAndStop(15); // Go to frame

animation.setSpeed(2); // Set playback speed 

animation.setDirection(1); // Forward
```

Methods:

- `play()` - Start playback
- `pause()` - Pause on current frame
- `stop()` - Stop and reset to start frame
- `goToAndStop(frame)` - Go to specific frame
- `setSpeed(speed)` - Set playback speed 
- `setDirection(direction)` - Set playback direction

## Layer Hierarchy

### Finding Layers

Get layers:

```js
const layers = animation.getLayers();

const layer = layers.getLayer('Layer 1');
```

Find layers:

- `getLayers()` - Get all layers
- `getLayer(name)` - Get by name
- `getLayersByType(type)` - Get by layer type

Layer types:

- `shape` 
- `precomp`
- `solid`
- `image`
- `null`

### Layer Properties

Get layer properties:

```js
const layer = animation.getLayer('Layer 1');

const properties = layer.getProperties();

const position = properties.Position;
```

Common properties:

- `Transform` 
- `Position`
- `Scale`
- `Rotation`
- `Opacity`
- `Anchor Point`
- `Fill Color` 
- `Stroke Width`
- `Text`
- `Effects`

## Keypaths

### Using Keypaths

Resolve keypath to property:

```js
const fill = animation.resolveKeypath('Layer 1.Group 1.Shape.Fill');

fill.color.setValue('#ff0000');
```

Keypaths follow dot notation for layer hierarchy and properties.

Target deep nested properties:

```js  
const xPos = animation.resolveKeypath('Layer 1.Transform.Anchor Point.X');

xPos.setValue(100);
```

Works for properties in layer effects:

```js
const blurAmount = animation.resolveKeypath('Layer 1.Blur.Blurriness');

blurAmount.setValue(5);
```

### Keypath Best Practices

Tips:

- Log layers and properties to discover keypaths
- Keep keypath strings modular
- Test resolve before animating
- Limit depth for simplicity

Keypaths provide precise targeting of animations.

## Timelines

### Time Remapping

Remap layer timeline speed/direction:

```js
const timeRemap = layer.getTimeRemapping();

timeRemap.setValue(t => {
  return t / 2; // 2x speed
});
```

Reverse playback:

```js
timeRemap.setValue(t => {
  return layer.outPoint - t; 
});
```

### Sequencing Animations

Use `onEnterFrame` callback:

```js 
let playhead = 0;

animation.onEnterFrame = () => {

  if(playhead < 100) {
    animation.playSegments([playhead, playhead+5]);
    playhead += 5;
  }

}
```

Build complex sequenced animations.

## Events Callbacks

### Enter Frame

```js
animation.onEnterFrame = () => {
  // Fires every frame
} 
```

Run code each frame.

### Complete

```js
animation.onComplete = () => {
  // Runs when finished
}
``` 

Trigger logic when animation completes.

## External Values

Link animations to external values:

```js
const xPos = new ValueProperty(0);

layer.addValueCallback(xPos);

xPos.setValue(100); 
```

The layer's x position will track `xPos`.

Works for multiple properties:

```js
const xPos = new ValueProperty(0);
const yPos = new ValueProperty(0);

layer.addValueCallback([xPos, yPos], (values) => {
  // Update multiple properties
});
```

## Multi-property Callbacks

Target multiple properties in a single callback:

```js
layer.addValueCallback([prop1, prop2], (values) => {
  
});
```

## Mouse Interactivity 

Use mouse values to drive animations:

```js
function onMouseMove(evt) {

  const xPos = new ValueProperty(evt.clientX);
  const yPos = new ValueProperty(evt.clientY);

  layer.addValueCallback([xPos, yPos]);

}
```

Track mouse position and movement.

## Async Animations

### Callbacks

Use `onEnterFrame` callback to sequence animations:

```js 
let playhead = 0;

animation.onEnterFrame = () => {
  
  if(playhead < 100) {
    animation.playSegments([playhead, playhead+5]);
    playhead += 5;
  }

} 
```

Inspect timeline and trigger animations.

## Utility Methods

```js
const currentFrame = animation.getCurrentFrame();
const totalFrames = animation.getDuration();
```

- `getCurrentFrame()` - Get current frame
- `getDuration()` - Get total duration


# Lottie Animation API Documentation

## Table of Contents

1. [Initialization](#initialization)
    - [Standard Initialization](#standard-initialization)
    - [Advanced Initialization: Platform-Specific Rendering](#advanced-initialization-platform-specific-rendering)
2. [Playback Controls](#playback-controls)
3. [Layer Hierarchy](#layer-hierarchy)
4. [Keypaths](#keypaths)
5. [Timelines](#timelines)
6. [Events](#events)
7. [External Values](#external-values)
8. [Async Animations](#async-animations)
9. [Mouse Interactivity](#mouse-interactivity)
10. [Multi-property Callbacks](#multi-property-callbacks)
11. [Utility Methods](#utility-methods)

---

## Initialization

### Standard Initialization

#### Explanation

The entry point to creating a Lottie animation is through the `lottie.loadAnimation()` method. The method takes an `animData` object, which is a configuration object containing a set of key-value pairs that define how your animation behaves.

#### Parameters

- `container`: The DOM element where your animation will be attached.
- `renderer`: The rendering engine ('svg', 'canvas', 'html').
- `loop`: Whether to loop the animation or not.
- `autoplay`: Whether the animation starts automatically.
- `path`: The JSON data file path.

#### Simple Example:

```js
const animData = {
  container: document.getElementById('animation-container'),
  renderer: 'svg',
  loop: true,
  autoplay: true,
  path: 'data.json'
};

const anim = lottie.loadAnimation(animData);
```

#### Advanced Example: Dynamic Loading

In some cases, you might want to load the animation JSON dynamically, perhaps from an API endpoint:

```js
fetch('/api/animation-data')
  .then(response => response.json())
  .then(data => {
    const animData = {
      container: document.getElementById('animation-container'),
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: data
    };
    const anim = lottie.loadAnimation(animData);
  });
```

### Advanced Initialization: Platform-Specific Rendering

#### Explanation

If you need platform-specific initialization, you can use browser APIs to determine the platform and conditionally set properties. This is useful when you have performance considerations that are platform-specific.

#### Advanced Example:

```js
const isMacLike = navigator.platform.match(/(Mac|iPhone|iPod|iPad)/i) ? true : false;
const animData = {
  container: document.getElementById('animation-container'),
  renderer: isMacLike ? 'canvas' : 'svg',  // Using canvas for Mac-like platforms
  loop: true,
  autoplay: true,
  path: 'data.json'
};
const anim = lottie.loadAnimation(animData);
```


## Playback Controls

#### `getCurrentFrame` / `getCurrentTime`

These methods return the current time of the animation.

- `getCurrentFrame`: Returns the current animation time in frames.
- `getCurrentTime`: Returns the current animation time in seconds.

##### Example

```javascript
const currentFrame = animationAPI.getCurrentFrame();
const currentTime = animationAPI.getCurrentTime();
```


### Play

#### Explanation

The `play()` method starts the animation from its current position. If the animation has reached its end, calling `play()` will restart the animation.

#### Example

```js
anim.play();
```

### Pause

#### Explanation

The `pause()` method halts the animation at its current frame.

#### Example

```js
anim.pause();
```

### Stop

#### Explanation

The `stop()` method stops the animation and resets it to its initial state. This is different from `pause()` as it doesn't maintain the current frame.

#### Example

```js
anim.stop();
```

### Set Direction

#### Explanation

The `setDirection()` method allows you to set the direction of the animation. A value of `1` is normal direction, and `-1` is reverse.

#### Parameters

- `direction`: The direction value. It can be `1` or `-1`.

#### Example

```js
anim.setDirection(-1);  // Reverse the animation
```

### Go to and Stop/Play Specific Frame

#### Explanation

The `goToAndStop()` and `goToAndPlay()` methods allow you to go to a specific frame and either stop or play the animation from that point.

#### Parameters

- `value`: The frame number or time in seconds.
- `isFrame`: A boolean specifying whether the value is a frame number (`true`) or time in seconds (`false`).

#### Example

```js
anim.goToAndStop(45, true);  // Stop at frame 45
anim.goToAndPlay(2, false);  // Play from 2 seconds
```



## Layer Hierarchy

#### `addValueCallback`

The `addValueCallback` method allows you to add a callback function to an animation property. The callback function is invoked every time the property changes, providing a way to dynamically update the property.

##### Example

```javascript
const positionKeyPath = animationAPI.getKeyPath('LayerName,Transform,Position');
animationAPI.addValueCallback(positionKeyPath, (currentValue) => {
  return [currentValue[0], currentValue[1] + 10];
});
```


### Finding Layers

#### Explanation

Layers in a Lottie animation can be accessed and manipulated through the API. This is often done using keypaths, which are strings that specify the layer's location within the animation hierarchy.

#### Example

```js
const layer = animationAPI.getKeyPath('LayerName,SubLayer,Shape');
```

### Layer Properties

#### Explanation

Once you have a reference to a layer, you can get or set its properties. These properties can include transformations like position, scale, and rotation, as well as other attributes like opacity.

#### Example

```js
// Getting the position property of a layer
const position = layer.transform.position;

// Setting the scale property of a layer
layer.transform.scale.setValue([50, 50]);
```

#### Advanced Example: Dynamic Scaling

You can dynamically scale a layer based on user interaction or other conditions. This is useful for creating responsive animations.

```js
window.addEventListener('resize', () => {
  const scale = window.innerWidth / 1000;
  layer.transform.scale.setValue([scale * 100, scale * 100]);
});
```



## Keypaths

### Using Keypaths

#### Explanation

Keypaths are strings that represent a layer's hierarchical location within the animation. They are used to target specific layers or properties for manipulation.

#### Example

```js
const keyPath = animationAPI.getKeyPath('LayerName,SubLayer,Shape');
```

### Keypath Best Practices

#### Explanation

While keypaths are powerful, they should be used wisely to ensure maintainability and performance.

1. **Be Specific**: The more specific your keypath, the less the API has to search, improving performance.
2. **Use IDs**: If possible, use unique IDs to quickly identify layers.
3. **Avoid Wildcards**: Wildcards can match multiple layers, which might not be what you intend.

#### Advanced Example: Conditional Manipulation

You can use keypaths along with conditional statements to selectively manipulate layers.

```js
const keyPath = animationAPI.getKeyPath('LayerName,SubLayer,Shape');
if (someCondition) {
  keyPath.property.setValue(someValue);
}
```



## Timelines

### Time Remapping

#### Explanation

Time remapping allows you to control the playback speed and direction of specific parts of the animation. This is useful for creating slow-motion effects, fast-forwarding, or rewinding.

#### Example

```js
// Slow down the animation to half speed
animationAPI.getKeyPath('LayerName,Time Remap').setValue(value => value / 2);
```

### Sequencing Animations

#### Explanation

Sequencing refers to playing multiple animations back-to-back or simultaneously. You can use API methods to control the sequence of animations.

#### Example

```js
// Play second animation after the first one finishes
firstAnim.addEventListener('complete', () => secondAnim.play());
```

#### Advanced Example: Chaining Animations

You can create complex sequences by chaining animations together, possibly even with conditional logic.

```js
firstAnim.addEventListener('complete', () => {
  if (someCondition) {
    secondAnim.play();
  } else {
    thirdAnim.play();
  }
});
```



## Events

### Enter Frame

#### Explanation

The `enterFrame` event is triggered each time the animation enters a new frame. You can use this event to sync other elements or execute custom logic.

#### Example

```js
anim.addEventListener('enterFrame', function(event) {
  console.log('Current frame: ', event.currentTime);
});
```

### Complete

#### Explanation

The `complete` event is triggered when the animation finishes playing. This is useful for chaining animations or executing code once the animation is over.

#### Example

```js
anim.addEventListener('complete', function() {
  console.log('Animation completed');
});
```

### Segment Start

#### Explanation

The `segmentStart` event is triggered when a new segment of the animation starts playing. This is useful for tracking the progress of the animation.

#### Example

```js
anim.addEventListener('segmentStart', function() {
  console.log('New segment started');
});
```



## External Values

### Explanation

External values refer to data that can be fed into the animation from an outside source, such as user input or API calls. Lottie allows you to link animation properties to these external values.

### Example

```javascript
// Linking a layer's position to mouse movement
window.addEventListener('mousemove', (e) => {
  const layer = animationAPI.getKeyPath('LayerName,Transform,Position');
  layer.setValue([e.clientX, e.clientY]);
});
```

### Advanced Example: Data-Driven Animation

You can make your animations respond to dynamic data. For example, you might want to change the color of a shape based on a user's selection.

```javascript
// Change color based on user input
const colorPicker = document.getElementById('colorPicker');
colorPicker.addEventListener('change', (e) => {
  const layer = animationAPI.getKeyPath('LayerName,Contents,Shape,Fill,Color');
  layer.setValue(e.target.value);
});
```



## Async Animations

### Callbacks

#### Explanation

Asynchronous animations often require callbacks to handle events or state changes. Lottie provides a way to attach callbacks to different stages of the animation.

#### Example

```js
// Log a message when the animation is loaded
anim.addEventListener('DOMLoaded', () => {
  console.log('Animation loaded');
});
```

### Sequencing Timelines

#### Explanation

In complex animations, you may need to sequence multiple timelines asynchronously. This can be achieved using callbacks and custom logic.

#### Example

```js
// Play the second animation only after the first one is complete
firstAnim.addEventListener('complete', () => {
  secondAnim.play();
});
```

#### Advanced Example: Asynchronous Control Flow

Combine callbacks and promises to create complex animation sequences.

```js
async function playAnimationsInSequence(firstAnim, secondAnim) {
  await new Promise(resolve => firstAnim.addEventListener('complete', resolve));
  secondAnim.play();
}

playAnimationsInSequence(firstAnim, secondAnim);
```



## Mouse Interactivity

### Explanation

Lottie allows you to make your animations interactive based on mouse events. This can be achieved by attaching event listeners to the animation container or using the animation API.

### Example

```js
// Rotate a layer based on mouse movement
const layer = animationAPI.getKeyPath('LayerName,Transform,Rotation');
window.addEventListener('mousemove', (e) => {
  const angle = (e.clientX / window.innerWidth) * 360;
  layer.setValue(angle);
});
```

### Advanced Example: Interactive Elements

You can make specific elements within the animation interactive. For example, you could make a button within the animation clickable.

```js
const buttonLayer = animationAPI.getKeyPath('ButtonLayerName');
buttonLayer.addEventListener('click', () => {
  // Execute some action when the button is clicked
});
```



## Multi-property Callbacks

### Explanation

Sometimes you may need to change multiple properties of an animation in response to a single event or condition. Lottie allows you to set callbacks that affect multiple properties.

### Example

```javascript
// Change both position and scale of a layer based on some condition
const position = animationAPI.getKeyPath('LayerName,Transform,Position');
const scale = animationAPI.getKeyPath('LayerName,Transform,Scale');

if (someCondition) {
  position.setValue([50, 50]);
  scale.setValue([100, 100]);
}
```

### Advanced Example: Coordinated Movements

You can coordinate multiple properties to create more complex animations.

```javascript
// Animate both position and rotation based on mouse movement
const position = animationAPI.getKeyPath('LayerName,Transform,Position');
const rotation = animationAPI.getKeyPath('LayerName,Transform,Rotation');

window.addEventListener('mousemove', (e) => {
  const xPos = e.clientX;
  const yPos = e.clientY;
  const angle = (xPos / window.innerWidth) * 360;

  position.setValue([xPos, yPos]);
  rotation.setValue(angle);
});
```



## Utility Methods

#### `recalculateSize`

If the animation container is resized, you can call `recalculateSize` to adjust the animation accordingly.

##### Example

```javascript
window.addEventListener('resize', () => {
  animationAPI.recalculateSize();
});
```
    
#### `toContainerPoint` / `fromContainerPoint`

These methods convert points between the animation's coordinate system and the global coordinate system.

- `toContainerPoint`: Converts a point from animation coordinates to global coordinates.
- `fromContainerPoint`: Converts a point from global coordinates to animation coordinates.

##### Example

```javascript
const globalPoint = [100, 100];
const localPoint = animationAPI.fromContainerPoint(globalPoint);
const backToGlobal = animationAPI.toContainerPoint(localPoint);
```
    
#### `toKeypathLayerPoint` / `fromKeypathLayerPoint`

These methods convert points between global animation coordinates and property animation coordinates.

- `toKeypathLayerPoint`: Converts a point from global animation coordinates to property animation coordinates.
- `fromKeypathLayerPoint`: Converts a point from property animation coordinates to global animation coordinates.

##### Example

```javascript
const globalPoint = [100, 100];
const keyPath = animationAPI.getKeyPath('LayerName,Transform,Position');
const propertyPoint = animationAPI.toKeypathLayerPoint(keyPath, globalPoint);
const backToGlobal = animationAPI.fromKeypathLayerPoint(keyPath, propertyPoint);
```


### Explanation

Utility methods are helper functions that make it easier to perform common tasks. These methods are part of the Lottie API and can be used to simplify your code.

### Example

```js
// Convert global position to a layer's local coordinate system
const localPoint = animationAPI.toKeypathLayerPoint(keyPath, globalPoint);
```

### Advanced Example: Dynamic Resizing

You can use utility methods to dynamically resize the animation based on the window size.

```js
window.addEventListener('resize', () => {
  animationAPI.recalculateSize();
});
```



### getKeyPath: Returns a Keypath Pointing to an Animation Property

#### Explanation

The `getKeyPath` method returns a keypath that points to a specific animation property. Keypaths are used to reference specific properties within the animation hierarchy.

#### Example

```js
const positionKeyPath = animationAPI.getKeyPath('LayerName,Transform,Position');
```

### addValueCallback: Adds a Callback to an Animation Property

#### Explanation

The `addValueCallback` method allows you to add a callback function that will be triggered when a specific animation property changes.

#### Example

```js
const scaleKeyPath = animationAPI.getKeyPath('LayerName,Transform,Scale');
animationAPI.addValueCallback(scaleKeyPath, (currentValue) => {
  return [currentValue[0] * 2, currentValue[1] * 2];
});
```

### recalculateSize: Call This Method If the Element Gets Resized

#### Explanation

If the container element of the animation gets resized, you can call `recalculateSize` to adjust the animation dimensions accordingly.

#### Example

```js
window.addEventListener('resize', () => {
  animationAPI.recalculateSize();
});
```

### toContainerPoint: Converts a Point from Animation Coordinates to Global Coordinates

#### Explanation

The `toContainerPoint` method converts a point from the animation's local coordinate system to the global coordinate system.

#### Example

```js
const globalPoint = animationAPI.toContainerPoint([50, 50]);
```

### fromContainerPoint: Converts a Point from Global Coordinates to Animation Coordinates

#### Explanation

The `fromContainerPoint` method converts a point from the global coordinate system to the animation's local coordinate system.

#### Example

```js
const localPoint = animationAPI.fromContainerPoint([100, 100]);
```

### toKeypathLayerPoint: Converts a Point from Global Animation Coordinates to Property Animation Coordinates

#### Explanation

The `toKeypathLayerPoint` method converts a point from the global animation coordinates to specific property animation coordinates.

#### Example

```js
const propertyPoint = animationAPI.toKeypathLayerPoint(keyPath, [100, 100]);
```

### fromKeypathLayerPoint: Converts a Point from Property Animation Coordinates to Global Animation Coordinates

#### Explanation

The `fromKeypathLayerPoint` method converts a point from specific property animation coordinates to global animation coordinates.

#### Example

```js
const globalAnimPoint = animationAPI.fromKeypathLayerPoint(keyPath, [50, 50]);
```

### getCurrentFrame: Return Current Animation Time in Frames

#### Explanation

The `getCurrentFrame` method returns the current time of the animation in frames.

#### Example

```js
const currentFrame = animationAPI.getCurrentFrame();
```

### getCurrentTime: Return Current Animation Time in Seconds

#### Explanation

The `getCurrentTime` method returns the current time of the animation in seconds.

#### Example

```js
const currentTime = animationAPI.getCurrentTime();
```



### `getKeyPath`

#### Explanation

The `getKeyPath` method returns a keypath pointing to a specific animation property. A keypath is a comma-separated string that identifies a property within the animation hierarchy.

#### Example

```javascript
const positionKeyPath = animationAPI.getKeyPath('LayerName,Transform,Position');
```

### `addValueCallback`

#### Explanation

The `addValueCallback` method allows you to add a callback function to an animation property. The callback function is invoked every time the property changes, providing a way to dynamically update the property.

#### Example

```javascript
const positionKeyPath = animationAPI.getKeyPath('LayerName,Transform,Position');
animationAPI.addValueCallback(positionKeyPath, (currentValue) => {
  return [currentValue[0], currentValue[1] + 10];
});
```

### `recalculateSize`

#### Explanation

If the animation container is resized, you can call `recalculateSize` to adjust the animation accordingly.

#### Example

```javascript
window.addEventListener('resize', () => {
  animationAPI.recalculateSize();
});
```

### `toContainerPoint` / `fromContainerPoint`

#### Explanation

These methods convert points between the animation's coordinate system and the global coordinate system.

- `toContainerPoint`: Converts a point from animation coordinates to global coordinates.
- `fromContainerPoint`: Converts a point from global coordinates to animation coordinates.

#### Example

```javascript
const globalPoint = [100, 100];
const localPoint = animationAPI.fromContainerPoint(globalPoint);
const backToGlobal = animationAPI.toContainerPoint(localPoint);
```

### `toKeypathLayerPoint` / `fromKeypathLayerPoint`

#### Explanation

These methods convert points between global animation coordinates and property animation coordinates.

- `toKeypathLayerPoint`: Converts a point from global animation coordinates to property animation coordinates.
- `fromKeypathLayerPoint`: Converts a point from property animation coordinates to global animation coordinates.

#### Example

```javascript
const globalPoint = [100, 100];
const keyPath = animationAPI.getKeyPath('LayerName,Transform,Position');
const propertyPoint = animationAPI.toKeypathLayerPoint(keyPath, globalPoint);
const backToGlobal = animationAPI.fromKeypathLayerPoint(keyPath, propertyPoint);
```

### `getCurrentFrame` / `getCurrentTime`

#### Explanation

These methods return the current time of the animation.

- `getCurrentFrame`: Returns the current animation time in frames.
- `getCurrentTime`: Returns the current animation time in seconds.

#### Example

```javascript
const currentFrame = animationAPI.getCurrentFrame();
const currentTime = animationAPI.getCurrentTime();
```


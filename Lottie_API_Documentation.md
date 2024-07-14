# Lottie Animation API Documentation

## Table of Contents
zz  
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

#### ADVANCED EXAMPLE CODEPEN CHAMELEON - https://codepen.io/airnan/pen/gvBMPV?editors=0010


```js 
var chamecolor = "";
var degToRads = Math.PI / 180;
var valueArr = [100, 500, 100];
var mouse_changed = false;
var minTongueRadius = 405,
  maxTongueRadius = 415;
var angle = 0,
  distanceToMouse = 0,
  isActive = false;
var camouflage_timeout = null;
var colorSelector = document.querySelector(":root");
var mouse_container = document.getElementById("mouse-container");
var animationContainer = document.getElementById("lottie");
var isMacLike = navigator.platform.match(/(Mac|iPhone|iPod|iPad)/i)?true:false;

animationContainer.setAttribute('class',isMacLike ? 'default_hidden' : 'mac_hidden')
var animData = {
  container: animationContainer,
  renderer: "svg",
  loop: true,
  autoplay: true,
  rendererSettings: {
    preserveAspectRatio: "xMidYMid meet"
  },
  path: "https://labs.nearpod.com/bodymovin/demo/chameleon/chameleon2.json"
};
anim = lottie.loadAnimation(animData);
var animationAPI;

var leftEyeCircles = [
  {
    name: "Group 12",
    radius: 27,
    divisor: 20
  },
  {
    name: "Group 13",
    radius: 27,
    divisor: 20
  },
  {
    name: "Group 14",
    radius: 27,
    divisor: 20
  },
  {
    name: "Group 15",
    radius: 23,
    divisor: 20
  },
  {
    name: "Group 16",
    radius: 21,
    divisor: 35
  },
  {
    name: "Group 17",
    radius: 19,
    divisor: 50
  },
  {
    name: "Group 18",
    radius: 17,
    divisor: 65
  },
  {
    name: "Group 19",
    radius: 15,
    divisor: 80
  },
  {
    name: "Group 20",
    radius: 13,
    divisor: 95
  },
  {
    name: "Group 21",
    radius: 5,
    divisor: 75
  }
];
var rightEyeCircles = [
  {
    name: "Group 1",
    radius: 27,
    divisor: 20
  },
  {
    name: "Group 2",
    radius: 27,
    divisor: 20
  },
  {
    name: "Group 3",
    radius: 27,
    divisor: 20
  },
  {
    name: "Group 4",
    radius: 23,
    divisor: 20
  },
  {
    name: "Group 5",
    radius: 21,
    divisor: 35
  },
  {
    name: "Group 6",
    radius: 19,
    divisor: 50
  },
  {
    name: "Group 7",
    radius: 17,
    divisor: 65
  },
  {
    name: "Group 8",
    radius: 15,
    divisor: 80
  },
  {
    name: "Group 9",
    radius: 13,
    divisor: 95
  },
  {
    name: "Group 10",
    radius: 5,
    divisor: 75
  }
];

var leaves = ["leaf_1", "leaf_2", "leaf_3", "leaf_4"];

anim.addEventListener("DOMLoaded", function() {
  //anim.setSubframe(false);
  camouflage_timeout = setTimeout(function() {
            colorSelector.style.setProperty('--chame-color', 'rgba(240,237,231,1)');
            colorSelector.style.setProperty('--chame-color-eyes', 'rgba(228,225,218,1)');
            camouflage_timeout = null;
        }, 1000);

  animationAPI = lottie_api.createAnimationApi(anim);

  window.addEventListener("mousemove", updateValue);
  window.addEventListener("touchmove", updateValue);
  window.addEventListener("resize", onWindowResized);

  addMouthProperties();
  addTongueProperties();
  addArrowProperties();
  addEyeCircles();
  addLeavesListeners();
});

function addEyeCircleProperty(circleData, eye, cachedMouseEyeData) {
  //
  var eyeContainer = animationAPI.getKeyPath(
    eye + ",Contents," + circleData.name + ",Transform,Position"
  );
  var lastValue = null,
    eye_angle;
  animationAPI.addValueCallback(eyeContainer, function(currentValue) {
    if (!lastValue) {
      lastValue = [currentValue[0], currentValue[1]];
    }
    if (!isActive) {
      var trasformedPoint = animationAPI.toContainerPoint(valueArr);
      trasformedPoint = animationAPI.toKeypathLayerPoint(
        eyeContainer,
        trasformedPoint
      );
      cachedMouseEyeData.distance = Math.sqrt(
        Math.pow(trasformedPoint[0], 2) + Math.pow(trasformedPoint[1], 2)
      );
      cachedMouseEyeData.eye_angle =
        Math.atan2(0 - trasformedPoint[1], 0 - trasformedPoint[0]) / degToRads +
        179;
      cachedMouseEyeData.current[0] = valueArr[0];
      cachedMouseEyeData.current[1] = valueArr[1];
    }
    eye_angle = cachedMouseEyeData.eye_angle;
    var distance = cachedMouseEyeData.distance;
    distance = distance > circleData.radius ? circleData.radius : distance;
    var newValueX =
      currentValue[0] + distance * Math.cos(eye_angle * degToRads);
    var newValueY =
      currentValue[1] + distance * Math.sin(eye_angle * degToRads);
    lastValue[0] =
      lastValue[0] + (newValueX - lastValue[0]) / circleData.divisor * 3;
    lastValue[1] =
      lastValue[1] + (newValueY - lastValue[1]) / circleData.divisor * 3;
    //return currentValue;
    return lastValue;
  });
}

function addEyeCircles() {
  var i,
    len = leftEyeCircles.length;
  // len = 1;
  var cachedMouseEyeData = {
    current: [-1, -1],
    distance: 0,
    eye_angle: 0
  };
  for (i = 0; i < len; i += 1) {
    addEyeCircleProperty(
      leftEyeCircles[i],
      "Loop,left_eye",
      cachedMouseEyeData
    );
  }
  len = rightEyeCircles.length;
  cachedMouseEyeData = {
    current: [-1, -1],
    distance: 0,
    eye_angle: 0
  };
  // len = 1;
  for (i = 0; i < len; i += 1) {
    addEyeCircleProperty(
      rightEyeCircles[i],
      "Loop,right_eye",
      cachedMouseEyeData
    );
  }
}

function changeColor(leave_name) {
  var leafColorKey = animationAPI.getKeyPath(
    "#" + leave_name + ",Contents,color_group,fill_prop,Color"
  );
  var colorValue = leafColorKey.getPropertyAtIndex(0).getValue();
  var colorString = "rgba(";
  colorString += Math.round(colorValue[0]);
  colorString += ",";
  colorString += Math.round(colorValue[1]);
  colorString += ",";
  colorString += Math.round(colorValue[2]);
  colorString += ",1)";
  colorSelector.style.setProperty("--chame-color", colorString);
  colorSelector.style.setProperty("--chame-color-eyes", colorString);
  if (camouflage_timeout) {
    clearTimeout(camouflage_timeout);
  }
  camouflage_timeout = setTimeout(function() {
    colorSelector.style.setProperty("--chame-color", "rgba(240,237,231,1)");
    colorSelector.style.setProperty("--chame-color-eyes", "rgba(228,225,218,1)");
    camouflage_timeout = null;
  }, 15000);
}

function addLeaveListener(leave_name) {
  var leaveElement = document.getElementById(leave_name);
  leaveElement.addEventListener("mouseover", function() {
    changeColor(leave_name);
  });
  leaveElement.addEventListener("touchmove", function() {
    changeColor(leave_name);
  });
}

function addLeavesListeners() {
  var i,
    len = leaves.length;
  for (i = 0; i < len; i += 1) {
    addLeaveListener(leaves[i]);
  }
}

function addMouthProperties() {
  var keyPathMouthInner = animationAPI.getKeyPath("Mouth,ReferencePoint");
  var keyPathMouthContainerTimeRemap = animationAPI.getKeyPath(
    "Mouth,Time Remap"
  );
  var perc = 0;
  animationAPI.addValueCallback(keyPathMouthContainerTimeRemap, function(
    currentValue
  ) {
    if (!isActive && mouse_changed) {
      var point2 = animationAPI.toContainerPoint(valueArr);
      point2 = animationAPI.toKeypathLayerPoint(keyPathMouthInner, point2);
      angle = Math.atan2(0 - point2[1], 0 - point2[0]) / degToRads + 170;
      distanceToMouse = Math.sqrt(
        Math.pow(0 - point2[0], 2) + Math.pow(0 - point2[1], 2)
      );
      mouse_changed = false;
    }

    if (distanceToMouse < minTongueRadius) {
      perc = distanceToMouse / minTongueRadius;
      return perc * 9 / 30;
    } else if (distanceToMouse > maxTongueRadius) {
      perc =
        1 -
        Math.min(
          1,
          (distanceToMouse - maxTongueRadius) / (maxTongueRadius + 100)
        );
      return perc * (9 / 30);
    } else if (distanceToMouse >= minTongueRadius) {
      return 9 / 30;
    }
    return 0;
  });
}

function addArrowProperties() {
  var scalePath = "Mouth,Tongue_Comp,arrow,Contents,Shape 1,Transform,Scale";
  var rotationPath = "Mouth,Tongue_Comp,arrow,Contents,Shape 1,Transform,Rotation";
  var scaleKeyPath, rotationKeyPath;
  if(isMacLike) {
    scaleKeyPath = "Mouth,Tongue_Comp,.mac_arrow,Contents,Shape 1,Transform,Scale";
    rotationKeyPath = "Mouth,Tongue_Comp,.mac_arrow,Contents,Shape 1,Transform,Rotation";
  } else {
    scaleKeyPath = "Mouth,Tongue_Comp,.default_arrow,Contents,Shape 1,Transform,Scale";
    rotationKeyPath = "Mouth,Tongue_Comp,.default_arrow,Contents,Shape 1,Transform,Rotation";
  }
  var keyPathArrowScale = animationAPI.getKeyPath(
    scaleKeyPath
  );
  var currentScale = -1;
  var currentScaleValue = [-1, -1];
  animationAPI.addValueCallback(keyPathArrowScale, function(currentValue) {
    var scale = animationAPI.getScaleData().scale;
    if (currentScale !== scale) {
      currentScaleValue[0] = currentValue[0] / scale;
      currentScaleValue[1] = currentValue[1] / scale;
      currentScale = scale;
    }
    return currentScaleValue;
  });

  var keyPathArrowRotation = animationAPI.getKeyPath(
    rotationKeyPath
  );
  animationAPI.addValueCallback(keyPathArrowRotation, function(currentValue) {
    return -angle;
  });
}

function addTongueProperties() {
  var tongueInitialAnimationTime = 0;
  var tongueCurrentTime = 0;

  function animateTongue() {
    tongueInitialAnimationTime = Date.now() - 1500 / 30;
    isActive = true;
    mouse_container.setAttribute("class", "active");
  }

  function resetTongue() {
    isActive = false;
    mouse_container.setAttribute("class", "");
  }
  var keyPathTongueContainerTimeRemap = animationAPI.getKeyPath(
    "Mouth,Tongue_Comp,Time Remap"
  );
  animationAPI.addValueCallback(keyPathTongueContainerTimeRemap, function(
    currentValue
  ) {
    if (
      distanceToMouse > minTongueRadius &&
      distanceToMouse < maxTongueRadius &&
      !isActive
    ) {
      animateTongue();
    }
    if (isActive) {
      tongueCurrentTime = 2 * (Date.now() - tongueInitialAnimationTime) / 1000;
    }
    if (tongueCurrentTime > 2) {
      tongueCurrentTime = 0;
      resetTongue();
    }
    return tongueCurrentTime;
  });

  var keyPathTongueContainer = animationAPI.getKeyPath(
    "Mouth,Tongue_Comp,Transform,Rotation"
  );
  animationAPI.addValueCallback(keyPathTongueContainer, function(currentValue) {
    return angle;
  });
}

function updateValue(ev) {
  mouse_changed = true;
  var mouseX, mouseY;
  if (ev.touches && ev.touches.length) {
    var mouseX = ev.touches[0].pageX;
    var mouseY = ev.touches[0].pageY;
  } else if (ev.pageX !== undefined) {
    mouseX = ev.pageX;
    mouseY = ev.pageY;
  }
  valueArr[0] = mouseX;
  valueArr[1] = mouseY;
}

function onWindowResized() {
  if (animationAPI) {
    anim.resize();
    animationAPI.recalculateSize();
  }
}
```
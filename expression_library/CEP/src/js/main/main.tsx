// main.tsx
import React from 'react';

const App: React.FC = () => {
  const csInterface = new CSInterface();

  const handleButtonClick = () => {
    // Example: Use csInterface to evaluate a script in the After Effects context
    csInterface.evalScript('alert("Hello from After Effects!")', (result) => {
      console.log(result);
    });
  };

  return (
    <div>
      <h1>Expression Library</h1>
      <button onClick={handleButtonClick}>Test CSInterface</button>
      {/* ... other components ... */}
    </div>
  );
};

export default App;

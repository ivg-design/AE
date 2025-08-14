import React, { useEffect, useState } from 'react';

declare const CSInterface: any;

const App: React.FC = () => {
  const [status, setStatus] = useState<string>('Loading...');

  useEffect(() => {
    // Check if we're in development or production
    const isDevelopment = window.location.hostname === 'localhost';
    
    if (isDevelopment) {
      setStatus('Running in development mode');
      console.log('Development mode: CSInterface not available');
      return;
    }

    try {
      console.log('Attempting to initialize CSInterface...');
      // Initialize CSInterface
      const cs = new CSInterface();
      
      // Get host environment
      const hostEnv = cs.getHostEnvironment();
      console.log('Host Environment:', hostEnv);

      // Test ExtendScript communication
      cs.evalScript('$.writeln("Hello from ExtendScript!")', (result: string) => {
        console.log('ExtendScript result:', result);
        setStatus('Extension loaded successfully!');
      });
    } catch (error) {
      console.error('Error initializing CSInterface:', error);
      setStatus('Error loading extension');
    }
  }, []);

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#2D2D2D',
      color: '#FFFFFF',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ fontSize: '18px', marginBottom: '20px' }}>
        CEP Barebones Extension
      </h1>
      <div style={{
        padding: '10px',
        backgroundColor: '#3D3D3D',
        borderRadius: '4px',
        marginTop: '10px'
      }}>
        {status}
      </div>
    </div>
  );
};

export default App; 
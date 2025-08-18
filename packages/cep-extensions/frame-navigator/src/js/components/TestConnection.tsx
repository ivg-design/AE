import React, { useEffect, useState } from 'react';
import { evalES } from '../lib/utils/bolt';

export const TestConnection: React.FC = () => {
  const [status, setStatus] = useState<string>('Testing connection...');
  
  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test 1: Simple direct eval
        const result1 = await evalES('1 + 1', true);
        console.log('Direct eval test:', result1);
        
        // Test 2: Check if our namespace exists
        const result2 = await evalES(`typeof $["com.frame-navigator.cep"]`, true);
        console.log('Namespace exists:', result2);
        
        // Test 3: Try to call testConnection directly
        const result3 = await evalES(`
          if (typeof $ !== 'undefined' && $["com.frame-navigator.cep"] && $["com.frame-navigator.cep"].testConnection) {
            $["com.frame-navigator.cep"].testConnection();
          } else {
            "Function not found";
          }
        `, true);
        console.log('Test function result:', result3);
        
        // Test 4: List all functions in namespace
        const result4 = await evalES(`
          var funcs = [];
          if (typeof $ !== 'undefined' && $["com.frame-navigator.cep"]) {
            for (var key in $["com.frame-navigator.cep"]) {
              funcs.push(key);
            }
          }
          funcs.join(", ");
        `, true);
        console.log('Available functions:', result4);
        
        setStatus(`Connection test results logged to console`);
      } catch (error) {
        console.error('Connection test failed:', error);
        setStatus(`Connection test failed: ${error}`);
      }
    };
    
    testConnection();
  }, []);
  
  return <div style={{ padding: 10, fontSize: 10 }}>{status}</div>;
};
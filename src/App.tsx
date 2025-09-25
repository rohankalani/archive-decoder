import React from 'react';

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>RosaiQ Air Quality Dashboard</h1>
      <p>Testing minimal React setup...</p>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '16px',
        marginTop: '20px'
      }}>
        <div style={{ 
          border: '1px solid #ddd', 
          borderRadius: '8px', 
          padding: '16px',
          backgroundColor: '#f9f9f9'
        }}>
          <h3>Abu Dhabi Estimada</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>
            AQI: 45
          </div>
          <p style={{ color: '#666', fontSize: '14px' }}>Good • 2/2 devices online</p>
        </div>
        
        <div style={{ 
          border: '1px solid #ddd', 
          borderRadius: '8px', 
          padding: '16px',
          backgroundColor: '#f9f9f9'
        }}>
          <h3>Burjeel Hospital</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#eab308' }}>
            AQI: 78
          </div>
          <p style={{ color: '#666', fontSize: '14px' }}>Moderate • 1/2 devices online</p>
        </div>
        
        <div style={{ 
          border: '1px solid #ddd', 
          borderRadius: '8px', 
          padding: '16px',
          backgroundColor: '#f9f9f9'
        }}>
          <h3>Dubai Green Building</h3>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>
            AQI: 32
          </div>
          <p style={{ color: '#666', fontSize: '14px' }}>Good • 2/2 devices online</p>
        </div>
      </div>

      <div style={{ 
        marginTop: '32px',
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
      }}>
        <h3>ULTRADETEKT 03M Device Status</h3>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '16px', color: '#666' }}>
            📡 MQTT Connection: Active
          </div>
          <div style={{ fontSize: '14px', color: '#999', marginTop: '8px' }}>
            Monitoring: PM2.5, PM10, CO₂, HCHO, VOC, NOₓ
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
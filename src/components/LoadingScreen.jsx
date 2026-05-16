import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = ({ message = 'Cargando...' }) => {
  return (
    <div className="loading-screen-container">
      <div className="loading-logo">E</div>
      <div className="loading-bar-container">
        <div className="loading-bar-progress"></div>
      </div>
      <p>{message}</p>
    </div>
  );
};

export default LoadingScreen;

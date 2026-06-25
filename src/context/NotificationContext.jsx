import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import './Notification.css';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmData, setConfirmData] = useState(null);

  const showNotification = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    
    // Auto-detect type based on message keywords
    let detectedType = type;
    if (type === 'info') {
      const msgLower = message.toLowerCase();
      if (
        msgLower.includes('error') ||
        msgLower.includes('falló') ||
        msgLower.includes('no se pudo') ||
        msgLower.includes('error') ||
        msgLower.includes('incorrecto') ||
        msgLower.includes('invalid') ||
        msgLower.includes('excepción')
      ) {
        detectedType = 'error';
      } else if (
        msgLower.includes('correcto') ||
        msgLower.includes('exito') ||
        msgLower.includes('éxito') ||
        msgLower.includes('creado') ||
        msgLower.includes('creada') ||
        msgLower.includes('guardado') ||
        msgLower.includes('guardada') ||
        msgLower.includes('exito') ||
        msgLower.includes('aprobada') ||
        msgLower.includes('eliminada') ||
        msgLower.includes('eliminado') ||
        msgLower.includes('pagado') ||
        msgLower.includes('pagada') ||
        msgLower.includes('actualizada') ||
        msgLower.includes('actualizado')
      ) {
        detectedType = 'success';
      }
    }

    setToasts((prev) => [...prev, { id, message, type: detectedType }]);

    setTimeout(() => {
      removeNotification(id);
    }, duration);
  }, []);

  const removeNotification = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showConfirm = useCallback((message, title = 'Confirmar Acción') => {
    return new Promise((resolve) => {
      setConfirmData({
        message,
        title,
        resolve: (value) => {
          setConfirmData(null);
          resolve(value);
        }
      });
    });
  }, []);

  // Intercept window.alert
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message) => {
      if (message !== undefined && message !== null) {
        showNotification(String(message));
      }
    };
    return () => {
      window.alert = originalAlert;
    };
  }, [showNotification]);

  return (
    <NotificationContext.Provider value={{ showNotification, showConfirm, removeNotification, toasts }}>
      {children}
      
      {/* Toast Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-card toast-${toast.type}`}>
            <div className="toast-icon-wrapper">
              {toast.type === 'success' && <span className="toast-icon success-icon" />}
              {toast.type === 'error' && <span className="toast-icon error-icon" />}
              {toast.type === 'info' && <span className="toast-icon info-icon" />}
            </div>
            <div className="toast-message">{toast.message}</div>
            <button className="toast-close" onClick={() => removeNotification(toast.id)}>×</button>
          </div>
        ))}
      </div>

      {/* Custom Confirm Modal */}
      {confirmData && (
        <div className="confirm-modal-backdrop" onClick={() => confirmData.resolve(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-modal-header">
              <span className="confirm-modal-warning-icon" />
              <h4>{confirmData.title}</h4>
            </div>
            <p className="confirm-modal-message">{confirmData.message}</p>
            <div className="confirm-modal-actions">
              <button 
                type="button" 
                className="confirm-btn confirm-btn-cancel" 
                onClick={() => confirmData.resolve(false)}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="confirm-btn confirm-btn-confirm" 
                onClick={() => confirmData.resolve(true)}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

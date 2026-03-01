import { useState, useEffect } from 'react';

const Alert = ({ message, type = 'info', onClose, duration = 5000 }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                handleClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            if (onClose) onClose();
        }, 300);
    };

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ',
    };

    if (!isVisible) return null;

    return (
        <div className={`alert alert-${type} ${isVisible ? 'alert-enter' : 'alert-exit'}`}>
            <div className="alert-icon">{icons[type]}</div>
            <div className="alert-content">
                <p className="alert-message">{message}</p>
            </div>
            <button className="alert-close" onClick={handleClose} aria-label="Cerrar">
                ✕
            </button>
        </div>
    );
};

export default Alert;

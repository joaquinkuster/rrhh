/**
 * AlertMessage - Componente reutilizable para mensajes de alerta
 */
const AlertMessage = ({ type, message, onClose }) => {
    if (!message) return null;

    const alertClass = type === 'error' ? 'alert-error' : 'alert-success';

    return (
        <div className={`alert ${alertClass}`}>
            {message}
            <button
                onClick={onClose}
                style={{
                    float: 'right',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.25rem',
                    lineHeight: 1,
                }}
            >
                ×
            </button>
        </div>
    );
};

export default AlertMessage;

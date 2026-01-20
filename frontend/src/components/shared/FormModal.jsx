/**
 * FormModal - Componente reutilizable para modales de formulario
 */
const FormModal = ({
    isOpen,
    onClose,
    headerTitle,
    contentTitle,
    contentSubtitle,
    children,
    maxWidth = '950px'
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal"
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth }}
            >
                <div className="modal-header">
                    <h2 className="modal-title">{headerTitle}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            style={{ width: 24, height: 24 }}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>
                <div className="modal-body">
                    {(contentTitle || contentSubtitle) && (
                        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                            {contentTitle && (
                                <h3 style={{
                                    fontSize: '1.5rem',
                                    fontWeight: '600',
                                    color: 'var(--text-primary)',
                                    marginBottom: '0.5rem'
                                }}>
                                    {contentTitle}
                                </h3>
                            )}
                            {contentSubtitle && (
                                <p style={{
                                    fontSize: '0.875rem',
                                    color: 'var(--text-secondary)'
                                }}>
                                    {contentSubtitle}
                                </p>
                            )}
                        </div>
                    )}
                    {children}
                </div>
            </div>
        </div>
    );
};

export default FormModal;

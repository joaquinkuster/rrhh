import React from 'react';

const StepTracker = ({ currentStep, totalSteps = 5 }) => {
    const primaryColor = '#0d9488';

    return (
        <div className="step-tracker-container">
            <div className="step-header">
                <span className="step-count" style={{ fontWeight: '600' }}>Paso {currentStep} de {totalSteps}</span>
                <span className="step-percentage" style={{ fontWeight: '600', color: primaryColor }}>
                    {Math.round((currentStep / totalSteps) * 100)}%
                </span>
            </div>
            <div className="step-progress-bar" style={{ background: 'rgba(100, 100, 100, 0.15)', height: '6px', borderRadius: '3px' }}>
                <div
                    className="step-progress-fill"
                    style={{
                        width: `${(currentStep / totalSteps) * 100}%`,
                        background: primaryColor,
                        height: '100%',
                        borderRadius: '3px',
                        boxShadow: `0 0 8px ${primaryColor}40`
                    }}
                ></div>
            </div>

            <div className="steps-indicators" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', position: 'relative' }}>
                {Array.from({ length: totalSteps }).map((_, index) => {
                    const stepNum = index + 1;
                    const isCompleted = stepNum < currentStep;
                    const isCurrent = stepNum === currentStep;
                    const isPending = stepNum > currentStep;
                    const isLast = stepNum === totalSteps;

                    return (
                        <div
                            key={stepNum}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                flex: isLast ? '0 0 auto' : 1,
                                position: 'relative'
                            }}
                        >
                            {/* Círculo del paso */}
                            <div
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: isCompleted || isCurrent ? primaryColor : 'var(--card-bg, #fff)',
                                    border: isPending ? '3px solid rgba(100, 100, 100, 0.25)' : 'none',
                                    color: isCompleted || isCurrent ? '#fff' : 'var(--text-secondary, #666)',
                                    fontWeight: isCurrent ? '700' : '500',
                                    fontSize: '0.875rem',
                                    boxShadow: isCurrent
                                        ? `0 0 0 4px ${primaryColor}30`
                                        : isCompleted
                                            ? '0 2px 6px rgba(0, 0, 0, 0.15)'
                                            : 'none',
                                    transform: isCurrent ? 'scale(1.1)' : 'scale(1)',
                                    transition: 'all 0.3s ease',
                                    flexShrink: 0,
                                    zIndex: 2
                                }}
                            >
                                {isCompleted ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                    </svg>
                                ) : (
                                    stepNum
                                )}
                            </div>

                            {/* Línea conectora - NO mostrar después del último paso */}
                            {!isLast && (
                                <div style={{
                                    flex: 1,
                                    height: '3px',
                                    marginLeft: '8px',
                                    marginRight: '8px',
                                    background: isCompleted ? primaryColor : 'rgba(100, 100, 100, 0.15)',
                                    transition: 'background 0.3s ease'
                                }} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StepTracker;

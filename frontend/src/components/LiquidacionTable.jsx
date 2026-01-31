import React from 'react';

const LiquidacionTable = ({ empleado, periodo, detalles, totales }) => {
    if (!empleado || !detalles || !totales) return null;

    // Helper to find amount by concept name safely
    const getMonto = (nombre) => {
        const det = detalles.find(d => d.conceptoNombre === nombre);
        return det ? parseFloat(det.monto).toFixed(2) : '';
    };

    // Helper to get percentage from configured concepts
    const getPercentage = (nombre) => {
        const det = detalles.find(d => d.conceptoNombre === nombre);
        return det && det.cantidad ? `${det.cantidad}%` : '';
    };

    // Helper for styles
    const styles = {
        remunerative: { textAlign: 'right', padding: '8px', borderBottom: '1px solid #eee', color: '#2e7d32', fontWeight: '500' },
        deduction: { textAlign: 'right', padding: '8px', borderBottom: '1px solid #eee', color: '#c62828', fontWeight: '500' },
        label: { padding: '8px', borderBottom: '1px solid #eee' }
    };

    // Identify extra concepts
    const standardNames = ['BASICO', 'ANTIGUEDAD', 'PRESENTISMO', 'JUBILACION', 'OBRA SOCIAL', 'PAMI', 'CUOTA SINDICAL'];
    const normalize = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase() : '';

    // Check if a detailed item is standard
    const isStandard = (nombre) => standardNames.some(std => normalize(nombre).includes(normalize(std)));

    const extraRemunerative = detalles.filter(d => d.tipo === 'remunerativo' && !isStandard(d.conceptoNombre));
    const extraDeductions = detalles.filter(d => d.tipo === 'deduccion' && !isStandard(d.conceptoNombre));

    return (
        <div className="table-container" style={{ maxWidth: '800px', margin: '0 auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            {/* Header Info */}
            <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem', padding: '1.5rem 1.5rem 0' }}>
                <h4 style={{ margin: 0, color: '#0070c0' }}>
                    {empleado.apellido.toUpperCase()} {empleado.nombre}
                </h4>
                <div style={{ color: '#666', fontSize: '0.9em' }}>
                    CUIL: {empleado.cuil} | Fecha de emisión: {periodo}
                </div>
            </div>

            <table className="table table-bordered" style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Arial, sans-serif' }}>
                <tbody>
                    {/* HEADERS */}
                    <tr style={{ background: '#0070c0', color: 'white' }}>
                        <th style={{ textAlign: 'left', padding: '10px', width: '50%' }}>CONCEPTO</th>
                        <th style={{ textAlign: 'right', padding: '10px' }}>IMPORTE</th>
                    </tr>

                    {/* BASICO */}
                    <tr>
                        <td style={styles.label}>BASICO</td>
                        <td style={styles.remunerative}>
                            {getMonto('BASICO')}
                        </td>
                    </tr>

                    {/* ANTIGUEDAD */}
                    <tr>
                        <td style={styles.label}>ANTIGUEDAD</td>
                        <td style={styles.remunerative}>
                            {getMonto('ANTIGUEDAD')}
                        </td>
                    </tr>

                    {/* PRESENTISMO */}
                    <tr>
                        <td style={styles.label}>PRESENTISMO</td>
                        <td style={styles.remunerative}>
                            {getMonto('PRESENTISMO')}
                        </td>
                    </tr>

                    {/* DYNAMIC EXTRA REMUNERATIVE */}
                    {extraRemunerative.map((item, idx) => (
                        <tr key={`rem-${idx}`}>
                            <td style={styles.label}>
                                {item.cantidad && item.cantidad !== 1 ? <span style={{ color: '#666', fontSize: '0.85em', marginRight: '5px' }}>{item.cantidad}%</span> : ''}
                                {item.conceptoNombre}
                            </td>
                            <td style={styles.remunerative}>
                                {parseFloat(item.monto).toFixed(2)}
                            </td>
                        </tr>
                    ))}

                    {/* TOTAL BRUTO */}
                    <tr style={{ background: '#e8f5e9', fontWeight: 'bold' }}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #ccc', color: '#1b5e20' }}>TOTAL BRUTO</td>
                        <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ccc', color: '#1b5e20' }}>
                            {parseFloat(totales.bruto || totales.totalBruto).toFixed(2)}
                        </td>
                    </tr>

                    {/* RETENCIONES Header */}
                    <tr style={{ background: '#ddd', fontWeight: 'bold' }}>
                        <td colSpan="2" style={{ padding: '8px', textAlign: 'center', letterSpacing: '1px' }}>RETENCIONES</td>
                    </tr>

                    {/* ALL DEDUCTIONS - Fully Dynamic */}
                    {detalles.filter(d => d.tipo === 'deduccion').map((item, idx) => (
                        <tr key={`ded-${idx}`}>
                            <td style={styles.label}>
                                {item.cantidad && item.cantidad !== 1 ? <span style={{ color: '#666', fontSize: '0.85em', marginRight: '5px' }}>{item.cantidad}%</span> : ''}
                                {item.conceptoNombre}
                            </td>
                            <td style={styles.deduction}>
                                {parseFloat(item.monto).toFixed(2)}
                            </td>
                        </tr>
                    ))}

                    {/* TOTAL RET. */}
                    <tr style={{ background: '#ffebee', fontWeight: 'bold' }}>
                        <td style={{ padding: '8px', borderBottom: '1px solid #ccc', color: '#b71c1c' }}>TOTAL RET.</td>
                        <td style={{ textAlign: 'right', padding: '8px', borderBottom: '1px solid #ccc', color: '#b71c1c' }}>
                            {parseFloat(totales.deducciones || totales.totalDeducciones || 0).toFixed(2)}
                        </td>
                    </tr>

                    {/* NETO A COBRAR */}
                    <tr style={{ background: 'white', fontWeight: 'bold', border: '2px solid #000' }}>
                        <td style={{ padding: '12px', fontSize: '1.1em' }}>NETO A COBRAR</td>
                        <td style={{ textAlign: 'right', padding: '12px', fontSize: '1.1em' }}>
                            {parseFloat(totales.neto || totales.totalNeto).toFixed(2)}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default LiquidacionTable;

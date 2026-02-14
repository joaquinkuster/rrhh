import React, { useState, useEffect } from 'react';
import { getEmpresas, getEmpresaById, getContratos } from '../services/api';

// Reusable CounterCard component (from EmpresaDetail)
const CounterCard = ({ value, label, color }) => (
    <div style={{
        padding: '1rem',
        textAlign: 'center'
    }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{label}</div>
    </div>
);

// Simple Bar Chart Component
const BarChart = ({ data }) => {
    const [hoveredIndex, setHoveredIndex] = React.useState(null);
    if (!data || data.length === 0) return <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Sin datos</p>;

    const maxValue = Math.max(...data.map(d => d.value));
    const chartHeight = 300;

    return (
        <svg width="100%" height={chartHeight + 100} style={{ display: 'block' }}>
            <text x="15" y="150" fontSize="12" fontWeight="600" fill="var(--text-secondary)" transform="rotate(-90, 15, 150)" textAnchor="middle">Empleados</text>
            <text x="50%" y={chartHeight + 90} fontSize="12" fontWeight="600" fill="var(--text-secondary)" textAnchor="middle">Tipo de Contrato</text>
            {data.map((item, index) => {
                const xPercent = ((index + 0.5) / data.length) * 100;
                const barHeight = (item.value / maxValue) * (chartHeight - 40);
                const isHovered = hoveredIndex === index;
                return (
                    <g key={index} onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)} style={{ cursor: 'pointer' }}>
                        <rect x={`${xPercent - 5}%`} y={chartHeight - barHeight + 20} width="10%" height={barHeight} fill={isHovered ? '#a78bfa' : '#8b5cf6'} rx="4" style={{ transition: 'fill 0.2s' }} />
                        <text x={`${xPercent}%`} y={chartHeight - barHeight + 10} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--text-primary)">{item.value}</text>
                        <text x={`${xPercent}%`} y={chartHeight + 50} textAnchor="middle" fontSize="11" fill="var(--text-secondary)">{item.label}</text>
                    </g>
                );
            })}
        </svg>
    );
};

// Timeline Chart Component  
const TimelineChart = ({ data }) => {
    const [hoveredIndex, setHoveredIndex] = React.useState(null);
    if (!data || data.length === 0) return <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Sin datos</p>;
    const maxValue = Math.max(...data.map(d => d.value));
    const chartHeight = 250;
    return (
        <svg width="100%" height={chartHeight + 80} style={{ display: 'block' }}>
            <text x="15" y="150" fontSize="12" fontWeight="600" fill="var(--text-secondary)" transform="rotate(-90, 15, 150)" textAnchor="middle">Contratos</text>
            <text x="50%" y={chartHeight + 75} fontSize="12" fontWeight="600" fill="var(--text-secondary)" textAnchor="middle">Mes</text>
            {data.map((item, index) => {
                const xPercent = ((index + 0.5) / data.length) * 100;
                const y = chartHeight - ((item.value / maxValue) * (chartHeight - 40)) + 20;
                const nextItem = data[index + 1];
                const nextX = nextItem ? ((index + 1.5) / data.length) * 100 : null;
                const nextY = nextItem ? chartHeight - ((nextItem.value / maxValue) * (chartHeight - 40)) + 20 : null;
                const isHovered = hoveredIndex === index;
                return (
                    <g key={index} onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)} style={{ cursor: 'pointer' }}>
                        {nextItem && <line x1={`${xPercent}%`} y1={y} x2={`${nextX}%`} y2={nextY} stroke="#0d9488" strokeWidth="2" />}
                        <circle cx={`${xPercent}%`} cy={y} r={isHovered ? 6 : 4} fill={isHovered ? '#14b8a6' : '#0d9488'} style={{ transition: 'all 0.2s' }} />
                        <text x={`${xPercent}%`} y={y - 10} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text-primary)">{item.value}</text>
                        <text x={`${xPercent}%`} y={chartHeight + 50} textAnchor="middle" fontSize="10" fill="var(--text-secondary)">{item.label}</text>
                    </g>
                );
            })}
        </svg>
    );
};

const Reportes = () => {
    const [empresas, setEmpresas] = useState([]);
    const [selectedEmpresaId, setSelectedEmpresaId] = useState('');
    const [empresaData, setEmpresaData] = useState(null);
    const [contratos, setContratos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const primaryColor = '#0d9488';

    // Load companies
    useEffect(() => {
        const loadEmpresas = async () => {
            try {
                const result = await getEmpresas({ activo: 'true', limit: 100 });
                setEmpresas(result.data);
                // Auto-select first company
                if (result.data.length > 0) {
                    setSelectedEmpresaId(result.data[0].id.toString());
                }
            } catch (err) {
                setError(err.message);
            }
        };
        loadEmpresas();
    }, []);

    // Load company data when selection changes
    useEffect(() => {
        if (!selectedEmpresaId) return;

        const loadEmpresaData = async () => {
            try {
                setLoading(true);
                setEmpresaData(null);
                setContratos([]);
                const [empresa, contratosResult] = await Promise.all([
                    getEmpresaById(selectedEmpresaId),
                    getContratos({ limit: 1000 })
                ]);
                // Filter contracts by company
                const filteredContratos = contratosResult.data.filter(c =>
                    empresa.areas?.some(a =>
                        a.departamentos?.some(d =>
                            d.puestos?.some(p =>
                                p.contratos?.some(pc => pc.id === c.id)
                            )
                        )
                    )
                );
                setEmpresaData(empresa);
                setContratos(filteredContratos);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadEmpresaData();
    }, [selectedEmpresaId]);

    // Calculate statistics - only count active employees with "en_curso" contracts
    const totalAreas = empresaData?.areas?.length || 0;
    const totalDepartamentos = empresaData?.areas?.reduce((acc, area) => acc + (area.departamentos?.length || 0), 0) || 0;
    const totalPuestos = empresaData?.areas?.reduce((acc, area) =>
        acc + (area.departamentos?.reduce((acc2, depto) => acc2 + (depto.puestos?.length || 0), 0) || 0), 0) || 0;
    const totalEmpleados = empresaData?.areas?.reduce((acc, area) =>
        acc + (area.departamentos?.reduce((acc2, depto) =>
            acc2 + (depto.puestos?.reduce((acc3, puesto) =>
                acc3 + (puesto.contratos?.filter(c => c.activo && c.estado === 'en_curso')?.length || 0), 0) || 0), 0) || 0), 0) || 0;

    // Employees by contract type - only en_curso contracts
    const contratosEnCurso = contratos.filter(c => c.estado === 'en_curso');
    const formatContractType = (type) => {
        const types = {
            'tiempo_indeterminado': 'Tiempo Indeterminado',
            'plazo_fijo': 'Plazo Fijo',
            'periodo_prueba': 'Período de Prueba',
            'pasantia_educativa': 'Pasantía Educativa',
            'eventual': 'Eventual',
            'temporada': 'Temporada'
        };
        return types[type] || type;
    };

    const empleadosPorTipoContrato = contratosEnCurso.reduce((acc, contrato) => {
        const tipo = formatContractType(contrato.tipoContrato) || 'Sin especificar';
        acc[tipo] = (acc[tipo] || 0) + 1;
        return acc;
    }, {});

    const contratoTypeChartData = Object.entries(empleadosPorTipoContrato).map(([tipo, count]) => ({
        label: tipo,
        value: count
    }));

    // Contract history by month - all contracts
    const contratosPorMes = contratos.reduce((acc, contrato) => {
        if (!contrato.fechaInicio) return acc;
        const date = new Date(contrato.fechaInicio);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        acc[monthKey] = (acc[monthKey] || 0) + 1;
        return acc;
    }, {});

    const timelineChartData = Object.entries(contratosPorMes)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({
            label: month,
            value: count
        }));

    // Recent contracts (last 10)
    const contratosRecientes = [...contratos]
        .sort((a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio))
        .slice(0, 10);

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    // Helper functions for employee counts - only en_curso contracts
    const getAreaEmployeeCount = (area) => {
        return area.departamentos?.reduce((acc, depto) =>
            acc + (depto.puestos?.reduce((acc2, puesto) =>
                acc2 + (puesto.contratos?.filter(c => c.activo && c.estado === 'en_curso')?.length || 0), 0) || 0), 0) || 0;
    };

    const getDeptoEmployeeCount = (depto) => {
        return depto.puestos?.reduce((acc, puesto) =>
            acc + (puesto.contratos?.filter(c => c.activo && c.estado === 'en_curso')?.length || 0), 0) || 0;
    };

    const getPuestoEmployeeCount = (puesto) => {
        return puesto.contratos?.filter(c => c.activo && c.estado === 'en_curso')?.length || 0;
    };

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Reportes</h1>
                    <p className="page-subtitle">Análisis y estadísticas por empresa</p>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                    {error}
                    <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
            )}

            {/* Company Filter */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header">
                    <h3 className="card-title">Filtro de Empresa</h3>
                </div>
                <div style={{ padding: '1rem' }}>
                    <select
                        className="filter-input"
                        value={selectedEmpresaId}
                        onChange={(e) => setSelectedEmpresaId(e.target.value)}
                        style={{ width: '100%', maxWidth: '400px' }}
                    >
                        {empresas.map(empresa => (
                            <option key={empresa.id} value={empresa.id}>
                                {empresa.nombre}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? (
                <div className="loading"><div className="spinner"></div></div>
            ) : !empresaData ? (
                <div className="empty-state">
                    <p>Selecciona una empresa para ver los reportes</p>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <div className="card-header">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20, color: 'var(--primary-color)' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                                    </svg>
                                    <h3 className="card-title">Resumen Estructural</h3>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => alert('Exportar PDF en desarrollo')}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            padding: '0.5rem 0.9rem',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '0.5rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 14, height: 14 }}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                        </svg>
                                        PDF
                                    </button>
                                    <button
                                        onClick={() => alert('Exportar Excel en desarrollo')}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            padding: '0.5rem 0.9rem',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '0.5rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 14, height: 14 }}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5" />
                                        </svg>
                                        Excel
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: 'var(--card-bg)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                            <CounterCard value={totalAreas} label="Áreas" color={primaryColor} />
                            <CounterCard value={totalDepartamentos} label="Departamentos" color="#22c55e" />
                            <CounterCard value={totalPuestos} label="Puestos" color="#3b82f6" />
                            <CounterCard value={totalEmpleados} label="Empleados" color="#8b5cf6" />
                        </div>
                    </div>

                    {/* Organizational Distribution Tree */}
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <div className="card-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20, color: 'var(--primary-color)' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                                </svg>
                                <h3 className="card-title">Distribución Organizacional</h3>
                            </div>
                        </div>
                        <div style={{ padding: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
                            {!empresaData.areas || empresaData.areas.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem' }}>Sin estructura definida</p>
                            ) : (
                                <div style={{ paddingLeft: '0.5rem' }}>
                                    {empresaData.areas.map((area, areaIndex) => (
                                        <div key={area.id} style={{ position: 'relative', paddingLeft: '1.5rem', marginBottom: areaIndex === empresaData.areas.length - 1 ? 0 : '1rem' }}>
                                            {/* Vertical line */}
                                            <div style={{ position: 'absolute', left: 0, top: '0.75rem', bottom: area.departamentos?.length > 0 ? '0.75rem' : 0, width: '2px', background: primaryColor }} />
                                            {/* Horizontal line */}
                                            <div style={{ position: 'absolute', left: 0, top: '0.75rem', width: '1rem', height: '2px', background: primaryColor }} />

                                            {/* Area row */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: primaryColor, flexShrink: 0 }} />
                                                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{area.nombre}</span>
                                                <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', background: `${primaryColor}15`, color: primaryColor, borderRadius: '1rem', fontWeight: 500 }}>
                                                    {area.departamentos?.length || 0} Depto(s)
                                                </span>
                                                <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', background: '#8b5cf615', color: '#8b5cf6', borderRadius: '1rem', fontWeight: 500 }}>
                                                    {getAreaEmployeeCount(area)} Empleado(s) activos
                                                </span>
                                            </div>

                                            {/* Departments */}
                                            {area.departamentos?.map((depto, deptoIndex) => (
                                                <div key={depto.id} style={{ position: 'relative', paddingLeft: '1.5rem', marginBottom: deptoIndex === area.departamentos.length - 1 ? 0 : '0.5rem' }}>
                                                    {/* Vertical line for puestos */}
                                                    {depto.puestos?.length > 0 && (
                                                        <div style={{ position: 'absolute', left: '0.75rem', top: '0.4rem', bottom: '0.4rem', width: '2px', background: '#22c55e' }} />
                                                    )}
                                                    {/* Horizontal line */}
                                                    <div style={{ position: 'absolute', left: 0, top: '0.4rem', width: '1.25rem', height: '2px', background: '#22c55e' }} />

                                                    {/* Department row */}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: depto.puestos?.length > 0 ? '0.4rem' : 0, flexWrap: 'wrap' }}>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                                                        <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{depto.nombre}</span>
                                                        <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', background: '#22c55e20', color: '#22c55e', borderRadius: '1rem' }}>
                                                            {depto.puestos?.length || 0} Puesto(s)
                                                        </span>
                                                        <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', background: '#8b5cf615', color: '#8b5cf6', borderRadius: '1rem' }}>
                                                            {getDeptoEmployeeCount(depto)} Empleado(s) activos
                                                        </span>
                                                    </div>

                                                    {/* Positions */}
                                                    {depto.puestos?.map((puesto, puestoIndex) => (
                                                        <div key={puesto.id} style={{ position: 'relative', paddingLeft: '1.5rem', marginBottom: puestoIndex === depto.puestos.length - 1 ? 0 : '0.25rem' }}>
                                                            {/* Horizontal line */}
                                                            <div style={{ position: 'absolute', left: '0.25rem', top: '0.4rem', width: '1rem', height: '2px', background: 'var(--text-secondary)', opacity: 0.3 }} />

                                                            {/* Position row */}
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-secondary)', opacity: 0.5, flexShrink: 0 }} />
                                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{puesto.nombre}</span>
                                                                <span style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem', background: '#8b5cf615', color: '#8b5cf6', borderRadius: '1rem' }}>
                                                                    {getPuestoEmployeeCount(puesto)} Empleado(s) activos
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Employees by Contract Type Chart */}
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <div className="card-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20, color: 'var(--primary-color)' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                                </svg>
                                <h3 className="card-title">Empleados por Tipo de Contrato</h3>
                            </div>
                        </div>
                        <div style={{ padding: '1rem' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                Distribución de empleados activos según el tipo de contrato vigente
                            </p>
                            <BarChart data={contratoTypeChartData} />
                        </div>
                    </div>

                    {/* Contract History Chart */}
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <div className="card-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20, color: 'var(--primary-color)' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                                </svg>
                                <h3 className="card-title">Historial de Contratos</h3>
                            </div>
                        </div>
                        <div style={{ padding: '1rem' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                Evolución mensual de nuevos contratos iniciados
                            </p>
                            <TimelineChart data={timelineChartData} />
                        </div>
                    </div>

                    {/* Recent Contracts */}
                    <div className="card">
                        <div className="card-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20, color: 'var(--primary-color)' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <h3 className="card-title">Últimos Contratos</h3>
                            </div>
                        </div>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Empleado</th>
                                        <th>Tipo de Contrato</th>
                                        <th>Fecha de Inicio</th>
                                        <th>Salario</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {contratosRecientes.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                                No hay contratos registrados
                                            </td>
                                        </tr>
                                    ) : (
                                        contratosRecientes.map((contrato) => (
                                            <tr key={contrato.id}>
                                                <td>
                                                    <strong>{contrato.empleado ? `${contrato.empleado.apellido}, ${contrato.empleado.nombre}` : '-'}</strong>
                                                </td>
                                                <td>{formatContractType(contrato.tipoContrato) || '-'}</td>
                                                <td>{formatDate(contrato.fechaInicio)}</td>
                                                <td>${contrato.salario?.toLocaleString('es-AR') || '-'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Reportes;

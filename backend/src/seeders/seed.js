/**
 * Semilla de datos iniciales para la base de datos
 * Se ejecuta automáticamente al iniciar el servidor si no existen datos
 */

const {
    Empleado,
    Empresa,
    Area,
    Departamento,
    Puesto,
    Contrato,
    ContratoPuesto,
    RegistroSalud,
    Evaluacion,
    Contacto,
} = require('../models');

/**
 * Verificar si ya existen datos en la base de datos
 */
const hasData = async () => {
    const empleadosCount = await Empleado.count();
    const empresasCount = await Empresa.count();
    return empleadosCount > 0 || empresasCount > 0;
};

/**
 * Ejecutar la semilla de datos
 */
const runSeed = async () => {
    try {
        // Verificar si ya existen datos
        if (await hasData()) {
            console.log('📦 Los datos ya existen, omitiendo semilla.');
            return false;
        }

        console.log('🌱 Iniciando carga de datos de semilla...');

        // ==========================================
        // EMPRESAS
        // ==========================================
        const empresas = await Empresa.bulkCreate([
            {
                nombre: 'TechCorp Argentina SA',
                email: 'info@techcorp.com.ar',
                telefono: '+54 11 4555-1234',
                industria: 'Tecnología',
                direccion: 'Av. Libertador 1234, CABA',
                activo: true,
            },
            {
                nombre: 'Industrias del Sur SRL',
                email: 'contacto@industrias-sur.com.ar',
                telefono: '+54 11 4666-5678',
                industria: 'Manufactura',
                direccion: 'Calle Industrial 567, Avellaneda',
                activo: true,
            },
        ]);

        // ==========================================
        // ÁREAS (para cada empresa)
        // ==========================================
        const areasData = [
            // TechCorp
            { nombre: 'Recursos Humanos', descripcion: 'Gestión del personal', empresaId: empresas[0].id },
            { nombre: 'Desarrollo', descripcion: 'Desarrollo de software', empresaId: empresas[0].id },
            { nombre: 'Administración', descripcion: 'Administración general', empresaId: empresas[0].id },
            // Industrias del Sur
            { nombre: 'Producción', descripcion: 'Líneas de producción', empresaId: empresas[1].id },
            { nombre: 'Logística', descripcion: 'Gestión de almacenes y transporte', empresaId: empresas[1].id },
        ];
        const areas = await Area.bulkCreate(areasData);

        // ==========================================
        // DEPARTAMENTOS (para cada área)
        // ==========================================
        const departamentosData = [
            // RRHH - TechCorp
            { nombre: 'Selección', descripcion: 'Reclutamiento y selección', areaId: areas[0].id },
            { nombre: 'Nómina', descripcion: 'Liquidación de sueldos', areaId: areas[0].id },
            // Desarrollo - TechCorp
            { nombre: 'Frontend', descripcion: 'Desarrollo de interfaces', areaId: areas[1].id },
            { nombre: 'Backend', descripcion: 'Desarrollo de servidores', areaId: areas[1].id },
            { nombre: 'QA', descripcion: 'Control de calidad', areaId: areas[1].id },
            // Administración - TechCorp
            { nombre: 'Contabilidad', descripcion: 'Gestión contable', areaId: areas[2].id },
            // Producción - Industrias del Sur
            { nombre: 'Línea A', descripcion: 'Línea de ensamblaje A', areaId: areas[3].id },
            { nombre: 'Línea B', descripcion: 'Línea de ensamblaje B', areaId: areas[3].id },
            // Logística - Industrias del Sur
            { nombre: 'Almacén', descripcion: 'Gestión de inventarios', areaId: areas[4].id },
            { nombre: 'Transporte', descripcion: 'Flota y distribución', areaId: areas[4].id },
        ];
        const departamentos = await Departamento.bulkCreate(departamentosData);

        // ==========================================
        // PUESTOS (para cada departamento)
        // ==========================================
        const puestosData = [
            // Selección
            { nombre: 'Analista de Selección', descripcion: 'Entrevistas y evaluaciones', departamentoId: departamentos[0].id },
            { nombre: 'Coordinador de RRHH', descripcion: 'Coordinación general de RRHH', departamentoId: departamentos[0].id },
            // Nómina
            { nombre: 'Analista de Nómina', descripcion: 'Liquidación mensual', departamentoId: departamentos[1].id },
            // Frontend
            { nombre: 'Desarrollador Frontend Jr', descripcion: 'React/Vue desarrollo', departamentoId: departamentos[2].id },
            { nombre: 'Desarrollador Frontend Sr', descripcion: 'Lead técnico frontend', departamentoId: departamentos[2].id },
            // Backend
            { nombre: 'Desarrollador Backend Jr', descripcion: 'Node.js/Python desarrollo', departamentoId: departamentos[3].id },
            { nombre: 'Desarrollador Backend Sr', descripcion: 'Arquitectura de sistemas', departamentoId: departamentos[3].id },
            // QA
            { nombre: 'Tester QA', descripcion: 'Testing manual y automatizado', departamentoId: departamentos[4].id },
            // Contabilidad
            { nombre: 'Contador', descripcion: 'Gestión contable general', departamentoId: departamentos[5].id },
            // Línea A
            { nombre: 'Operario Línea A', descripcion: 'Operación de maquinaria', departamentoId: departamentos[6].id },
            { nombre: 'Supervisor Línea A', descripcion: 'Supervisión de producción', departamentoId: departamentos[6].id },
            // Línea B
            { nombre: 'Operario Línea B', descripcion: 'Operación de maquinaria', departamentoId: departamentos[7].id },
            // Almacén
            { nombre: 'Encargado de Almacén', descripcion: 'Control de inventarios', departamentoId: departamentos[8].id },
            // Transporte
            { nombre: 'Chofer', descripcion: 'Distribución de productos', departamentoId: departamentos[9].id },
        ];
        const puestos = await Puesto.bulkCreate(puestosData);

        // ==========================================
        // EMPLEADOS
        // ==========================================
        const empleadosData = [
            {
                nombre: 'Juan',
                apellido: 'García',
                email: 'juan.garcia@ejemplo.com',
                telefono: '+54 11 5555-0001',
                tipoDocumento: 'cedula',
                numeroDocumento: '30123456',
                cuil: '20-30123456-5',
                fechaNacimiento: '1990-05-15',
                nacionalidad: 'Argentina',
                genero: 'masculino',
                estadoCivil: 'casado',
                calle: 'Av. Corrientes',
                numero: '1234',
                piso: '5',
                departamento: 'A',
                codigoPostal: '1043',
                provinciaId: '02',
                provinciaNombre: 'Buenos Aires',
                ciudadId: '001',
                ciudadNombre: 'CABA',
                activo: true,
            },
            {
                nombre: 'María',
                apellido: 'Rodríguez',
                email: 'maria.rodriguez@ejemplo.com',
                telefono: '+54 11 5555-0002',
                tipoDocumento: 'cedula',
                numeroDocumento: '35678901',
                cuil: '27-35678901-4',
                fechaNacimiento: '1988-09-22',
                nacionalidad: 'Argentina',
                genero: 'femenino',
                estadoCivil: 'soltero',
                calle: 'Calle Florida',
                numero: '567',
                piso: null,
                departamento: null,
                codigoPostal: '1005',
                provinciaId: '02',
                provinciaNombre: 'Buenos Aires',
                ciudadId: '001',
                ciudadNombre: 'CABA',
                activo: true,
            },
            {
                nombre: 'Carlos',
                apellido: 'López',
                email: 'carlos.lopez@ejemplo.com',
                telefono: '+54 11 5555-0003',
                tipoDocumento: 'cedula',
                numeroDocumento: '28456789',
                cuil: '20-28456789-3',
                fechaNacimiento: '1985-03-10',
                nacionalidad: 'Argentina',
                genero: 'masculino',
                estadoCivil: 'divorciado',
                calle: 'Av. Santa Fe',
                numero: '890',
                piso: '3',
                departamento: 'B',
                codigoPostal: '1059',
                provinciaId: '02',
                provinciaNombre: 'Buenos Aires',
                ciudadId: '001',
                ciudadNombre: 'CABA',
                activo: true,
            },
            {
                nombre: 'Ana',
                apellido: 'Martínez',
                email: 'ana.martinez@ejemplo.com',
                telefono: '+54 11 5555-0004',
                tipoDocumento: 'cedula',
                numeroDocumento: '32789012',
                cuil: '27-32789012-6',
                fechaNacimiento: '1992-11-30',
                nacionalidad: 'Argentina',
                genero: 'femenino',
                estadoCivil: 'casado',
                calle: 'Calle Lavalle',
                numero: '456',
                piso: '7',
                departamento: 'C',
                codigoPostal: '1047',
                provinciaId: '02',
                provinciaNombre: 'Buenos Aires',
                ciudadId: '001',
                ciudadNombre: 'CABA',
                activo: true,
            },
            {
                nombre: 'Pedro',
                apellido: 'Fernández',
                email: 'pedro.fernandez@ejemplo.com',
                telefono: '+54 11 5555-0005',
                tipoDocumento: 'pasaporte',
                numeroDocumento: 'M1234567',
                cuil: '20-91234567-8',
                fechaNacimiento: '1995-07-08',
                nacionalidad: 'Paraguay',
                genero: 'masculino',
                estadoCivil: 'soltero',
                calle: 'Av. Belgrano',
                numero: '123',
                piso: null,
                departamento: null,
                codigoPostal: '1092',
                provinciaId: '02',
                provinciaNombre: 'Buenos Aires',
                ciudadId: '001',
                ciudadNombre: 'CABA',
                activo: true,
            },
            {
                nombre: 'Laura',
                apellido: 'Sánchez',
                email: 'laura.sanchez@ejemplo.com',
                telefono: '+54 11 5555-0006',
                tipoDocumento: 'cedula',
                numeroDocumento: '37890123',
                cuil: '27-37890123-7',
                fechaNacimiento: '1998-02-14',
                nacionalidad: 'Argentina',
                genero: 'femenino',
                estadoCivil: 'soltero',
                calle: 'Calle Tucumán',
                numero: '789',
                piso: '2',
                departamento: 'D',
                codigoPostal: '1050',
                provinciaId: '02',
                provinciaNombre: 'Buenos Aires',
                ciudadId: '001',
                ciudadNombre: 'CABA',
                activo: true,
            },
        ];
        const empleados = await Empleado.bulkCreate(empleadosData);

        // ==========================================
        // CONTRATOS (sin validaciones de fecha)
        // ==========================================
        // Deshabilitamos temporalmente las validaciones de fecha
        const today = new Date();
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + 1);
        const futureDateStr = futureDate.toISOString().split('T')[0];

        const endDate = new Date(today);
        endDate.setFullYear(today.getFullYear() + 1);
        const endDateStr = endDate.toISOString().split('T')[0];

        // Crear contratos usando create individual para bypass validation
        const contratosData = [
            {
                empleadoId: empleados[0].id,
                tipoContrato: 'tiempo_indeterminado',
                fechaInicio: futureDateStr,
                fechaFin: null,
                horario: 'Lunes a Viernes 9:00 a 18:00',
                salario: 150000.00,
                compensacion: 'Bono anual + OSDE 310',
                activo: true,
            },
            {
                empleadoId: empleados[1].id,
                tipoContrato: 'tiempo_indeterminado',
                fechaInicio: futureDateStr,
                fechaFin: null,
                horario: 'Lunes a Viernes 9:00 a 18:00',
                salario: 180000.00,
                compensacion: 'Bono anual + OSDE 410 + Home Office',
                activo: true,
            },
            {
                empleadoId: empleados[2].id,
                tipoContrato: 'plazo_fijo',
                fechaInicio: futureDateStr,
                fechaFin: endDateStr,
                horario: 'Lunes a Viernes 8:00 a 17:00',
                salario: 120000.00,
                compensacion: 'OSDE 210',
                activo: true,
            },
            {
                empleadoId: empleados[3].id,
                tipoContrato: 'tiempo_indeterminado',
                fechaInicio: futureDateStr,
                fechaFin: null,
                horario: 'Lunes a Viernes 10:00 a 19:00',
                salario: 95000.00,
                compensacion: 'Obra social + Almuerzo',
                activo: true,
            },
            {
                empleadoId: empleados[4].id,
                tipoContrato: 'pasantia_educativa',
                fechaInicio: futureDateStr,
                fechaFin: endDateStr,
                horario: 'Lunes a Viernes 9:00 a 13:00',
                salario: 45000.00,
                compensacion: 'ART + Viáticos',
                activo: true,
            },
            {
                empleadoId: empleados[5].id,
                tipoContrato: 'periodo_prueba',
                fechaInicio: futureDateStr,
                fechaFin: endDateStr,
                horario: 'Lunes a Viernes 9:00 a 18:00',
                salario: 110000.00,
                compensacion: 'OSDE 210 + Gimnasio',
                activo: true,
            },
        ];

        const contratos = [];
        for (const contratoData of contratosData) {
            const contrato = await Contrato.create(contratoData);
            contratos.push(contrato);
        }

        // ==========================================
        // CONTRATO-PUESTO (relación M:N)
        // ==========================================
        const contratoPuestosData = [
            { contratoId: contratos[0].id, puestoId: puestos[1].id }, // Coordinador RRHH
            { contratoId: contratos[1].id, puestoId: puestos[4].id }, // Frontend Sr
            { contratoId: contratos[2].id, puestoId: puestos[6].id }, // Backend Sr
            { contratoId: contratos[3].id, puestoId: puestos[8].id }, // Contador
            { contratoId: contratos[4].id, puestoId: puestos[3].id }, // Frontend Jr (pasante)
            { contratoId: contratos[5].id, puestoId: puestos[7].id }, // Tester QA
        ];
        await ContratoPuesto.bulkCreate(contratoPuestosData);

        // ==========================================
        // REGISTROS DE SALUD
        // ==========================================
        const hoy = new Date();
        const fechaRealizacion = new Date(hoy);
        fechaRealizacion.setMonth(hoy.getMonth() - 1);
        const fechaRealizacionStr = fechaRealizacion.toISOString().split('T')[0];

        const fechaVencimiento = new Date(hoy);
        fechaVencimiento.setFullYear(hoy.getFullYear() + 1);
        const fechaVencimientoStr = fechaVencimiento.toISOString().split('T')[0];

        const fechaVencimientoCorta = new Date(hoy);
        fechaVencimientoCorta.setMonth(hoy.getMonth() + 3);
        const fechaVencimientoCortaStr = fechaVencimientoCorta.toISOString().split('T')[0];

        const fechaVencida = new Date(hoy);
        fechaVencida.setMonth(hoy.getMonth() - 1);
        const fechaVencidaStr = fechaVencida.toISOString().split('T')[0];

        const fechaRealizacionAnterior = new Date(hoy);
        fechaRealizacionAnterior.setFullYear(hoy.getFullYear() - 2);
        const fechaRealizacionAnteriorStr = fechaRealizacionAnterior.toISOString().split('T')[0];

        const registrosSaludData = [
            {
                empleadoId: empleados[0].id,
                tipoExamen: 'pre_ocupacional',
                resultado: 'apto',
                fechaRealizacion: fechaRealizacionStr,
                fechaVencimiento: fechaVencimientoStr,
                activo: true,
            },
            {
                empleadoId: empleados[1].id,
                tipoExamen: 'periodico',
                resultado: 'apto',
                fechaRealizacion: fechaRealizacionStr,
                fechaVencimiento: fechaVencimientoStr,
                activo: true,
            },
            {
                empleadoId: empleados[2].id,
                tipoExamen: 'pre_ocupacional',
                resultado: 'apto_preexistencias',
                fechaRealizacion: fechaRealizacionStr,
                fechaVencimiento: fechaVencimientoCortaStr,
                activo: true,
            },
            {
                empleadoId: empleados[3].id,
                tipoExamen: 'periodico',
                resultado: 'apto',
                fechaRealizacion: fechaRealizacionAnteriorStr,
                fechaVencimiento: fechaVencidaStr, // Vencido
                activo: true,
            },
            {
                empleadoId: empleados[4].id,
                tipoExamen: 'pre_ocupacional',
                resultado: 'apto',
                fechaRealizacion: fechaRealizacionStr,
                fechaVencimiento: fechaVencimientoStr,
                activo: true,
            },
            {
                empleadoId: empleados[5].id,
                tipoExamen: 'pre_ocupacional',
                resultado: 'apto',
                fechaRealizacion: fechaRealizacionStr,
                fechaVencimiento: fechaVencimientoStr,
                activo: true,
            },
        ];
        await RegistroSalud.bulkCreate(registrosSaludData);

        // ==========================================
        // EVALUACIONES
        // ==========================================
        const fechaEvalAnterior = new Date(hoy);
        fechaEvalAnterior.setMonth(hoy.getMonth() - 2);
        const fechaEvalAnteriorStr = fechaEvalAnterior.toISOString().split('T')[0];

        const fechaEvalReciente = new Date(hoy);
        fechaEvalReciente.setDate(hoy.getDate() - 7);
        const fechaEvalRecienteStr = fechaEvalReciente.toISOString().split('T')[0];

        const evaluacionesData = [
            {
                periodo: 'anual',
                tipoEvaluacion: 'descendente_90',
                fecha: fechaEvalAnteriorStr,
                contratoEvaluadoId: contratos[0].id,
                estado: 'firmada',
                puntaje: 85,
                escala: 'supera_expectativas',
                feedback: 'Excelente desempeño durante el año. Ha demostrado liderazgo y proactividad en la gestión de recursos humanos.',
                reconocidoPorEmpleado: true,
                fechaReconocimiento: fechaEvalAnteriorStr,
                notas: 'Candidato a promoción',
                activo: true,
            },
            {
                periodo: 'semestre_1',
                tipoEvaluacion: 'pares_jefe_180',
                fecha: fechaEvalRecienteStr,
                contratoEvaluadoId: contratos[1].id,
                estado: 'en_curso',
                puntaje: 78,
                escala: 'cumple',
                feedback: 'Buen desempeño técnico. Se recomienda mejorar la comunicación con el equipo de backend.',
                reconocidoPorEmpleado: false,
                notas: null,
                activo: true,
            },
            {
                periodo: 'cierre_prueba',
                tipoEvaluacion: 'descendente_90',
                fecha: fechaEvalRecienteStr,
                contratoEvaluadoId: contratos[5].id,
                estado: 'pendiente',
                puntaje: 72,
                escala: 'cumple',
                feedback: 'Buen progreso durante el período de prueba. Demuestra conocimientos técnicos sólidos y disposición para aprender.',
                reconocidoPorEmpleado: false,
                notas: 'Evaluar extensión de contrato',
                activo: true,
            },
            {
                periodo: 'q1',
                tipoEvaluacion: 'objetivos',
                fecha: fechaEvalAnteriorStr,
                contratoEvaluadoId: contratos[2].id,
                estado: 'finalizada',
                puntaje: 65,
                escala: 'necesita_mejora',
                feedback: 'Se cumplieron la mayoría de los objetivos pero hubo retrasos en las entregas. Se recomienda mejorar la planificación.',
                reconocidoPorEmpleado: true,
                fechaReconocimiento: fechaEvalAnteriorStr,
                notas: 'Seguimiento mensual',
                activo: true,
            },
        ];

        for (const evalData of evaluacionesData) {
            const evaluacion = await Evaluacion.create(evalData);
            // Agregar evaluadores (el primer contrato evalúa a los demás)
            if (evalData.contratoEvaluadoId !== contratos[0].id) {
                await evaluacion.addEvaluadores([contratos[0].id]);
            }
        }

        // ==========================================
        // CONTACTOS
        // ==========================================
        const contactosData = [
            {
                empleadoId: empleados[0].id,
                esFamiliar: true,
                esContactoEmergencia: true,
                nombreCompleto: 'María García de López',
                dni: '29876543',
                fechaNacimiento: '1991-08-20',
                parentesco: 'Esposa',
                discapacidad: false,
                dependiente: false,
                escolaridad: false,
                telefonoPrincipal: '+54 11 5555-1001',
                telefonoSecundario: '+54 11 5555-1002',
                direccion: 'Av. Corrientes 1234 5A, CABA',
                activo: true,
            },
            {
                empleadoId: empleados[0].id,
                esFamiliar: true,
                esContactoEmergencia: false,
                nombreCompleto: 'Sofía García López',
                dni: '50123456',
                fechaNacimiento: '2015-03-10',
                parentesco: 'Hija',
                discapacidad: false,
                dependiente: true,
                escolaridad: true,
                telefonoPrincipal: '+54 11 5555-1001',
                direccion: 'Av. Corrientes 1234 5A, CABA',
                activo: true,
            },
            {
                empleadoId: empleados[1].id,
                esFamiliar: true,
                esContactoEmergencia: true,
                nombreCompleto: 'Roberto Rodríguez',
                dni: '15678901',
                fechaNacimiento: '1960-01-15',
                parentesco: 'Padre',
                discapacidad: false,
                dependiente: false,
                escolaridad: false,
                telefonoPrincipal: '+54 11 5555-2001',
                direccion: 'Calle Belgrano 789, CABA',
                activo: true,
            },
            {
                empleadoId: empleados[2].id,
                esFamiliar: false,
                esContactoEmergencia: true,
                nombreCompleto: 'Lucía Gómez',
                dni: '31456789',
                fechaNacimiento: '1987-06-25',
                parentesco: 'Amiga',
                discapacidad: false,
                dependiente: false,
                escolaridad: false,
                telefonoPrincipal: '+54 11 5555-3001',
                direccion: 'Av. Callao 456, CABA',
                activo: true,
            },
            {
                empleadoId: empleados[3].id,
                esFamiliar: true,
                esContactoEmergencia: true,
                nombreCompleto: 'Diego Martínez',
                dni: '33789012',
                fechaNacimiento: '1990-12-05',
                parentesco: 'Esposo',
                discapacidad: false,
                dependiente: false,
                escolaridad: false,
                telefonoPrincipal: '+54 11 5555-4001',
                telefonoSecundario: '+54 11 5555-4002',
                direccion: 'Calle Lavalle 456 7C, CABA',
                activo: true,
            },
            {
                empleadoId: empleados[4].id,
                esFamiliar: true,
                esContactoEmergencia: true,
                nombreCompleto: 'Rosa Fernández',
                dni: 'M9876543',
                fechaNacimiento: '1970-04-18',
                parentesco: 'Madre',
                discapacidad: false,
                dependiente: false,
                escolaridad: false,
                telefonoPrincipal: '+595 21 555-5001',
                direccion: 'Asunción, Paraguay',
                activo: true,
            },
        ];

        // Crear contactos filtrando la validación de edad mínima para familiares menores
        for (const contactoData of contactosData) {
            await Contacto.create(contactoData, { validate: contactoData.dependiente ? false : true });
        }

        console.log('✅ Semilla de datos cargada exitosamente:');
        console.log(`   📊 ${empresas.length} empresas`);
        console.log(`   📊 ${areas.length} áreas`);
        console.log(`   📊 ${departamentos.length} departamentos`);
        console.log(`   📊 ${puestos.length} puestos`);
        console.log(`   📊 ${empleados.length} empleados`);
        console.log(`   📊 ${contratos.length} contratos`);
        console.log(`   📊 ${registrosSaludData.length} registros de salud`);
        console.log(`   📊 ${evaluacionesData.length} evaluaciones`);
        console.log(`   📊 ${contactosData.length} contactos`);

        return true;
    } catch (error) {
        console.error('❌ Error al cargar semilla:', error);
        throw error;
    }
};

module.exports = { runSeed, hasData };

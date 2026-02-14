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
    ConceptoSalarial,
    ParametroLaboral,
    Solicitud,
    Vacaciones,
    Rol,
    Permiso,
    RolPermiso,
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
        // USUARIO ADMINISTRADOR
        // Email: admin@cataratasrh.com | Contraseña: Admin123!
        const adminEmpleado = {
            nombre: 'Admin',
            apellido: 'Sistema',
            email: 'admin@cataratasrh.com',
            telefono: '+54 11 5555-9999',
            tipoDocumento: 'cedula',
            numeroDocumento: '99999999',
            cuil: '20-99999999-9',
            fechaNacimiento: '1990-01-01',
            nacionalidadId: 1, // Argentina
            genero: 'masculino',
            estadoCivil: 'soltero',
            calle: 'Av. Administración',
            numero: '1',
            piso: null,
            departamento: null,
            codigoPostal: '1000',
            provinciaId: 1, // CABA
            ciudadId: 1, // CABA
            activo: true,
            esAdministrador: true,
            contrasena: 'Admin123!',
            creadoPorRrhh: true,
        };

        // EMPLEADOS REGULARES
        // Email: juan.garcia@ejemplo.com | Contraseña: Juan2024!
        // Email: maria.rodriguez@ejemplo.com | Contraseña: Maria2024!
        // Email: carlos.lopez@ejemplo.com | Contraseña: Carlos2024!
        // Email: ana.martinez@ejemplo.com | Contraseña: Ana2024!
        // Email: pedro.fernandez@ejemplo.com | Contraseña: Pedro2024!
        // Email: laura.sanchez@ejemplo.com | Contraseña: Laura2024!
        const empleadosData = [
            adminEmpleado,
            {
                nombre: 'Juan',
                apellido: 'García',
                email: 'juan.garcia@ejemplo.com',
                telefono: '+54 11 5555-0001',
                tipoDocumento: 'cedula',
                numeroDocumento: '30123456',
                cuil: '20-30123456-5',
                fechaNacimiento: '1990-05-15',
                nacionalidadId: 1, // Argentina
                genero: 'masculino',
                estadoCivil: 'casado',
                calle: 'Av. Corrientes',
                numero: '1234',
                piso: '5',
                departamento: 'A',
                codigoPostal: '1043',
                provinciaId: 1, // CABA
                ciudadId: 1, // CABA
                contrasena: 'Juan2024!',
                creadoPorRrhh: true,
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
                nacionalidadId: 1, // Argentina
                genero: 'femenino',
                estadoCivil: 'soltero',
                calle: 'Calle Florida',
                numero: '567',
                piso: null,
                departamento: null,
                codigoPostal: '1005',
                provinciaId: 1, // CABA
                ciudadId: 1, // CABA
                contrasena: 'Maria2024!',
                creadoPorRrhh: true,
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
                nacionalidadId: 1, // Argentina
                genero: 'masculino',
                estadoCivil: 'divorciado',
                calle: 'Av. Santa Fe',
                numero: '890',
                piso: '3',
                departamento: 'B',
                codigoPostal: '1059',
                provinciaId: 1, // CABA
                ciudadId: 1, // CABA
                contrasena: 'Carlos2024!',
                creadoPorRrhh: true,
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
                nacionalidadId: 1, // Argentina
                genero: 'femenino',
                estadoCivil: 'casado',
                calle: 'Calle Lavalle',
                numero: '456',
                piso: '7',
                departamento: 'C',
                codigoPostal: '1047',
                provinciaId: 1, // CABA
                ciudadId: 1, // CABA
                contrasena: 'Ana2024!',
                creadoPorRrhh: true,
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
                nacionalidadId: 7, // Paraguay
                genero: 'masculino',
                estadoCivil: 'soltero',
                calle: 'Av. Belgrano',
                numero: '123',
                piso: null,
                departamento: null,
                codigoPostal: '1092',
                provinciaId: 1, // CABA
                ciudadId: 1, // CABA
                contrasena: 'Pedro2024!',
                creadoPorRrhh: true,
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
                nacionalidadId: 1, // Argentina
                genero: 'femenino',
                estadoCivil: 'soltero',
                calle: 'Calle Tucumán',
                numero: '789',
                piso: '2',
                departamento: 'D',
                codigoPostal: '1050',
                provinciaId: 1, // CABA
                ciudadId: 1, // CABA
                contrasena: 'Laura2024!',
                creadoPorRrhh: true,
                activo: true,
            },
        ];
        const empleados = await Empleado.bulkCreate(empleadosData, {
            individualHooks: true, // Ejecuta hooks para hashear contraseñas
        });

        // ==========================================
        // CONTRATOS (sin validaciones de fecha)
        // ==========================================

        // Crear contratos usando create individual para bypass validation
        const contratosData = [
            {
                empleadoId: empleados[0].id,
                tipoContrato: 'tiempo_indeterminado',
                fechaInicio: '2025-03-01',
                fechaFin: '2026-01-29',
                horario: 'Lunes a Viernes 9:00 a 18:00',
                salario: 150000.00,
                compensacion: 'Bono anual + OSDE 310',
                estado: 'finalizado',
                activo: true,
            },
            {
                empleadoId: empleados[1].id,
                tipoContrato: 'tiempo_indeterminado',
                fechaInicio: '2024-03-01',
                fechaFin: null,
                horario: 'Lunes a Viernes 9:00 a 18:00',
                salario: 180000.00,
                compensacion: 'Bono anual + OSDE 410 + Home Office',
                estado: 'en_curso',
                activo: true,
            },
            {
                empleadoId: empleados[2].id,
                tipoContrato: 'plazo_fijo',
                fechaInicio: '2020-01-01',
                fechaFin: '2027-01-01',
                horario: 'Lunes a Viernes 8:00 a 17:00',
                salario: 120000.00,
                compensacion: 'OSDE 210',
                estado: 'en_curso',
                activo: true,
            },
            {
                empleadoId: empleados[3].id,
                tipoContrato: 'tiempo_indeterminado',
                fechaInicio: '2010-01-01',
                fechaFin: null,
                horario: 'Lunes a Viernes 10:00 a 19:00',
                salario: 95000.00,
                compensacion: 'Obra social + Almuerzo',
                estado: 'en_curso',
                activo: true,
            },
            {
                empleadoId: empleados[4].id,
                tipoContrato: 'pasantia_educativa',
                fechaInicio: '1990-01-01',
                fechaFin: '2030-01-01',
                horario: 'Lunes a Viernes 9:00 a 13:00',
                salario: 45000.00,
                compensacion: 'ART + Viáticos',
                estado: 'en_curso',
                activo: true,
            },
            {
                empleadoId: empleados[5].id,
                tipoContrato: 'periodo_prueba',
                fechaInicio: '2026-01-02',
                fechaFin: null,
                horario: 'Lunes a Viernes 9:00 a 18:00',
                salario: 110000.00,
                compensacion: 'OSDE 210 + Gimnasio',
                estado: 'pendiente',
                activo: true,
            },
            {
                empleadoId: empleados[1].id,
                tipoContrato: 'tiempo_indeterminado',
                fechaInicio: '2026-02-01',
                fechaFin: null,
                horario: 'Lunes a Viernes 10:00 a 19:00',
                salario: 95000.00,
                compensacion: 'Obra social + Almuerzo',
                estado: 'en_curso',
                activo: true,
            },
            {
                empleadoId: empleados[2].id,
                tipoContrato: 'tiempo_indeterminado',
                fechaInicio: '2026-02-01',
                fechaFin: null,
                horario: 'Lunes a Viernes 10:00 a 19:00',
                salario: 1000.00,
                compensacion: 'Obra social + Almuerzo',
                estado: 'en_curso',
                activo: true,
            },
        ];

        const contratos = [];
        for (const contratoData of contratosData) {
            const contrato = await Contrato.create(contratoData, { validate: false, hooks: false });
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
            { contratoId: contratos[6].id, puestoId: puestos[7].id }, // Tester QA
            { contratoId: contratos[7].id, puestoId: puestos[7].id }, // Tester QA
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
                vigente: true,
                activo: true,
            },
            {
                empleadoId: empleados[1].id,
                tipoExamen: 'periodico',
                resultado: 'apto',
                fechaRealizacion: fechaRealizacionStr,
                fechaVencimiento: fechaVencimientoStr,
                vigente: true,
                activo: true,
            },
            {
                empleadoId: empleados[2].id,
                tipoExamen: 'pre_ocupacional',
                resultado: 'apto_preexistencias',
                fechaRealizacion: fechaRealizacionStr,
                fechaVencimiento: fechaVencimientoCortaStr,
                vigente: true,
                activo: true,
            },
            {
                empleadoId: empleados[3].id,
                tipoExamen: 'periodico',
                resultado: 'apto',
                fechaRealizacion: fechaRealizacionAnteriorStr,
                fechaVencimiento: fechaVencidaStr, // Vencido
                vigente: false, // Vencido
                activo: true,
            },
            {
                empleadoId: empleados[4].id,
                tipoExamen: 'pre_ocupacional',
                resultado: 'apto',
                fechaRealizacion: fechaRealizacionStr,
                fechaVencimiento: fechaVencimientoStr,
                vigente: true,
                activo: true,
            },
            {
                empleadoId: empleados[5].id,
                tipoExamen: 'pre_ocupacional',
                resultado: 'apto',
                fechaRealizacion: fechaRealizacionStr,
                fechaVencimiento: fechaVencimientoStr,
                vigente: true,
                activo: true,
            },
        ];
        await RegistroSalud.bulkCreate(registrosSaludData, { validate: false, hooks: false });

        // ==========================================
        // EVALUACIONES
        // ==========================================
        // Helper function to get a business day
        const { esDiaHabil } = require('../utils/fechas');

        const getBusinessDay = (date) => {
            let testDate = new Date(date);
            let attempts = 0;
            while (attempts < 14) { // Try up to 2 weeks
                const dateStr = testDate.toISOString().split('T')[0];
                if (esDiaHabil(dateStr)) {
                    return dateStr;
                }
                testDate.setDate(testDate.getDate() - 1);
                attempts++;
            }
            // Fallback to a known business day
            return '2025-11-03'; // Monday
        };

        const fechaEvalAnterior = new Date(hoy);
        fechaEvalAnterior.setMonth(hoy.getMonth() - 2);
        const fechaEvalAnteriorStr = getBusinessDay(fechaEvalAnterior);

        const fechaEvalReciente = new Date(hoy);
        fechaEvalReciente.setDate(hoy.getDate() - 7);
        const fechaEvalRecienteStr = getBusinessDay(fechaEvalReciente);

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

        // ==========================================
        // CONCEPTOS SALARIALES (Retenciones obligatorias)
        // ==========================================
        const conceptosSalariales = await ConceptoSalarial.bulkCreate([
            {
                nombre: 'Jubilación',
                tipo: 'deduccion',
                esPorcentaje: true,
                valor: 11,
                activo: true,
            },
            {
                nombre: 'Obra Social',
                tipo: 'deduccion',
                esPorcentaje: true,
                valor: 3,
                activo: true,
            },
            {
                nombre: 'PAMI',
                tipo: 'deduccion',
                esPorcentaje: true,
                valor: 3,
                activo: true,
            },
            {
                nombre: 'Cuota Sindical',
                tipo: 'deduccion',
                esPorcentaje: true,
                valor: 2.5,
                activo: true,
            },
        ]);

        // ==========================================
        // SOLICITUDES DE VACACIONES (para testing de liquidaciones)
        // ==========================================
        const solicitudesVacaciones = [
            {
                contratoId: contratos[1].id, // Contrato 2
                empleadoId: empleados[1].id,
                tipoSolicitud: 'vacaciones',
                activo: true,
                createdAt: new Date('2024-02-01'),
                updatedAt: new Date('2024-02-01'),
            },
            {
                contratoId: contratos[1].id, // Contrato 2
                empleadoId: empleados[1].id,
                tipoSolicitud: 'vacaciones',
                activo: true,
                createdAt: new Date('2024-04-25'),
                updatedAt: new Date('2024-04-25'),
            },
        ];

        const solicitudesCreadas = await Solicitud.bulkCreate(solicitudesVacaciones);

        const vacacionesData = [
            {
                solicitudId: solicitudesCreadas[0].id,
                periodo: 2024,
                diasCorrespondientes: 14,
                diasTomados: 0,
                diasDisponibles: 14,
                fechaInicio: '2024-03-03',
                fechaFin: '2024-03-04',
                fechaRegreso: '2024-03-05',
                diasSolicitud: 2,
                descripcion: null,
                documentos: [],
                estado: 'aprobada',
            },
            {
                solicitudId: solicitudesCreadas[1].id,
                periodo: 2024,
                diasCorrespondientes: 14,
                diasTomados: 0,
                diasDisponibles: 14,
                fechaInicio: '2024-04-29',
                fechaFin: '2024-05-05',
                fechaRegreso: '2024-05-06',
                diasSolicitud: 7,
                descripcion: null,
                documentos: [],
                estado: 'aprobada',
            },
        ];

        await Vacaciones.bulkCreate(vacacionesData);

        // ==========================================
        // PERMISOS Y ROLES
        // ==========================================
        console.log('🔐 Inicializando permisos...');

        const modulos = [
            { key: 'empleados', label: 'Empleados' },
            { key: 'empresas', label: 'Empresas' },
            { key: 'contratos', label: 'Contratos' },
            { key: 'registros_salud', label: 'Registros de Salud' },
            { key: 'evaluaciones', label: 'Evaluaciones' },
            { key: 'contactos', label: 'Contactos' },
            { key: 'solicitudes', label: 'Solicitudes' },
            { key: 'liquidaciones', label: 'Liquidaciones' },
            { key: 'conceptos_salariales', label: 'Conceptos Salariales' },
            { key: 'roles', label: 'Roles y Permisos' },
        ];

        const acciones = [
            { key: 'crear', label: 'Crear' },
            { key: 'leer', label: 'Leer' },
            { key: 'actualizar', label: 'Actualizar' },
            { key: 'eliminar', label: 'Eliminar' },
        ];

        const permisos = [];
        for (const modulo of modulos) {
            for (const accion of acciones) {
                const permiso = await Permiso.create({
                    modulo: modulo.key,
                    accion: accion.key,
                    descripcion: `${accion.label} ${modulo.label}`,
                });
                permisos.push(permiso);
            }
        }

        // Crear rol de Administrador con todos los permisos
        const rolAdmin = await Rol.create({
            nombre: 'Administrador',
            descripcion: 'Rol con acceso completo a todas las funcionalidades del sistema',
            activo: true,
        });

        // Asignar todos los permisos al rol de Administrador
        await rolAdmin.setPermisos(permisos.map(p => p.id));

        console.log(`✅ ${permisos.length} permisos creados`);
        console.log(`✅ Rol de Administrador creado con todos los permisos`);

        // ==========================================
        // PARÁMETROS LABORALES (Singleton)
        // ==========================================
        await ParametroLaboral.create({
            limiteAusenciaInjustificada: 1,
        });

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
        console.log(`   📊 ${conceptosSalariales.length} conceptos salariales`);
        console.log(`   📊 ${solicitudesVacaciones.length} solicitudes de vacaciones`);
        console.log(`   📊 ${permisos.length} permisos`);
        console.log(`   📊 1 rol (Administrador)`);
        console.log(`   📊 1 parámetro laboral`);



        return true;
    } catch (error) {
        console.error('❌ Error al cargar semilla:', error);
        throw error;
    }
};

module.exports = { runSeed, hasData };

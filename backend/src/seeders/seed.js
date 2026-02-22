/**
 * Semilla de datos iniciales para la base de datos
 */

const {
    Usuario,
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
    Solicitud,
    Vacaciones,
    Licencia,
    HorasExtras,
    Renuncia,
    Rol,
    Permiso,
    EspacioTrabajo,
    ConceptoSalarial,
    ParametroLaboral,
} = require('../models');

const hasData = async () => (await Usuario.count()) > 0;

/**
 * Helper: crear empleado con usuario, contrato, puesto y último contrato seleccionado
 */
const crearEmpleado = async ({
    nombre, apellido, email, dni, cuil, fechaNacimiento, genero, estadoCivil,
    calle, numero, codigoPostal, espacioId, rol, puesto, salario, tipoContrato, fechaInicio
}) => {
    const usuario = await Usuario.create({
        nombre, apellido, email,
        contrasena: 'User123!',
        esAdministrador: false,
        esEmpleado: true,
        activo: true,
    });

    const empleado = await Empleado.create({
        usuarioId: usuario.id,
        espacioTrabajoId: espacioId,
        tipoDocumento: 'cedula',
        numeroDocumento: dni,
        cuil,
        fechaNacimiento,
        nacionalidadId: 1,
        genero,
        estadoCivil,
        calle,
        numero,
        codigoPostal: codigoPostal || '3300',
        provinciaId: 1,
        ciudadId: 1,
    });

    const contrato = await Contrato.create({
        empleadoId: empleado.id,
        rolId: rol.id,
        tipoContrato: tipoContrato || 'tiempo_indeterminado',
        fechaInicio: fechaInicio || '2024-03-01',
        salario,
        estado: 'en_curso',
        activo: true,
        horario: 'Lunes a Viernes 09:00 - 18:00',
    }, { hooks: false, validate: false });

    await ContratoPuesto.create({ contratoId: contrato.id, puestoId: puesto.id });
    await empleado.update({ ultimoContratoSeleccionadoId: contrato.id });

    return { usuario, empleado, contrato };
};

/**
 * Ejecutar la semilla de datos
 */
const runSeed = async () => {
    try {
        if (await hasData()) {
            console.log('📦 Los datos ya existen, omitiendo semilla.');
            return false;
        }

        console.log('🌱 Iniciando carga de datos de semilla...');

        // ─── 0. Permisos ─────────────────────────────────────────────────────────
        console.log('🔐 Inicializando permisos...');
        const modulos = [
            'empleados', 'empresas', 'contratos', 'registros_salud',
            'evaluaciones', 'contactos', 'solicitudes', 'liquidaciones',
            'roles', 'reportes'
        ];
        const acciones = ['crear', 'leer', 'actualizar', 'eliminar'];

        for (const modulo of modulos) {
            for (const accion of acciones) {
                if (modulo === 'liquidaciones' && (accion === 'crear' || accion === 'eliminar')) continue;
                if (modulo === 'reportes' && accion !== 'leer') continue;
                await Permiso.findOrCreate({
                    where: { modulo, accion },
                    defaults: { descripcion: `${accion} ${modulo}` }
                });
            }
        }
        const allPermisos = await Permiso.findAll();

        const getPermisosIds = (criterios) =>
            allPermisos.filter(p => criterios.some(c => {
                if (typeof c === 'string') return p.modulo === c;
                return p.modulo === c.modulo && c.acciones.includes(p.accion);
            })).map(p => p.id);

        // ─── 1. Usuarios propietarios ─────────────────────────────────────────────
        console.log('👤 Creando usuarios propietarios...');
        const usuarioCEO = await Usuario.create({
            nombre: 'Carlos',
            apellido: 'Méndez',
            email: 'ceo@cataratas.com',
            contrasena: 'Admin123!',
            esAdministrador: true,
            esEmpleado: false,
            activo: true,
        });

        const usuarioRRHH = await Usuario.create({
            nombre: 'Laura',
            apellido: 'Fernández',
            email: 'user@cataratas.com',
            contrasena: 'User123!',
            esAdministrador: false,
            esEmpleado: false,
            activo: true,
        });

        // ─── 2. Helper: crear roles para un espacio ───────────────────────────────
        const createRolesForSpace = async (espacioId) => {
            const rolCEO = await Rol.create({
                nombre: 'Director Ejecutivo',
                descripcion: 'Acceso total al sistema',
                esObligatorio: true,
                espacioTrabajoId: espacioId,
                activo: true
            });
            await rolCEO.setPermisos(allPermisos.map(p => p.id));

            const rolRRHH = await Rol.create({
                nombre: 'Administrador de RRHH',
                descripcion: 'Gestión de RRHH y lectura de Reportes',
                esObligatorio: true,
                espacioTrabajoId: espacioId,
                activo: true
            });
            await rolRRHH.setPermisos(getPermisosIds([
                'empleados', 'contratos', 'registros_salud', 'evaluaciones', 'contactos', 'solicitudes',
                { modulo: 'empresas', acciones: ['leer'] },
                { modulo: 'reportes', acciones: ['leer'] },
                { modulo: 'liquidaciones', acciones: ['leer', 'actualizar'] },
            ]));

            const rolOperativo = await Rol.create({
                nombre: 'Personal Operativo',
                descripcion: 'Acceso de lectura a sus propios datos',
                esObligatorio: true,
                espacioTrabajoId: espacioId,
                activo: true
            });
            await rolOperativo.setPermisos(getPermisosIds([
                { modulo: 'registros_salud', acciones: ['leer'] },
                { modulo: 'evaluaciones', acciones: ['leer'] },
                { modulo: 'contactos', acciones: ['leer'] },
                { modulo: 'solicitudes', acciones: ['leer'] },
                { modulo: 'liquidaciones', acciones: ['leer'] },
            ]));

            return { rolCEO, rolRRHH, rolOperativo };
        };

        // ─── 3. Helper: configuración de espacio ─────────────────────────────────
        const initSpaceConfig = async (espacioId) => {
            await ConceptoSalarial.bulkCreate([
                { nombre: 'Jubilación', tipo: 'deduccion', esPorcentaje: true, valor: 11, esObligatorio: true, espacioTrabajoId: espacioId },
                { nombre: 'Obra Social', tipo: 'deduccion', esPorcentaje: true, valor: 3, esObligatorio: true, espacioTrabajoId: espacioId },
                { nombre: 'PAMI', tipo: 'deduccion', esPorcentaje: true, valor: 3, esObligatorio: true, espacioTrabajoId: espacioId },
                { nombre: 'Cuota Sindical', tipo: 'deduccion', esPorcentaje: true, valor: 2.5, esObligatorio: true, espacioTrabajoId: espacioId },
                { nombre: 'Horas Extra 50%', tipo: 'adicional', esPorcentaje: false, valor: 0, esObligatorio: false, espacioTrabajoId: espacioId },
                { nombre: 'Presentismo', tipo: 'adicional', esPorcentaje: true, valor: 5, esObligatorio: false, espacioTrabajoId: espacioId },
            ]);
            await ParametroLaboral.create({
                tipo: 'limite_ausencia_injustificada',
                valor: '3',
                descripcion: 'Cantidad máxima de ausencias injustificadas antes de sanción',
                esObligatorio: true,
                espacioTrabajoId: espacioId,
            });
        };

        // ─── 4. Helper: poblar espacio con empleados y datos ─────────────────────
        const populateSpaceData = async (espacioId, roles, prefix) => {

            // ── Empresa ──────────────────────────────────────────────────────────
            const empresa = await Empresa.create({
                nombre: `${prefix} Ingeniería SA`,
                email: `contacto@${prefix.toLowerCase().replace(/\s/g, '')}.com`,
                telefono: '0376-4421500',
                industria: 'Ingeniería y Construcción',
                direccion: 'Av. Victoria Aguirre 66, Iguazú, Misiones',
                cuit: `30-7000000${espacioId}-2`,
                activo: true,
                espacioTrabajoId: espacioId,
            });

            // ── Estructura organizacional ─────────────────────────────────────────
            const areaDireccion = await Area.create({ nombre: 'Dirección General', descripcion: 'Alta gerencia y estrategia', empresaId: empresa.id });
            const areaRRHH = await Area.create({ nombre: 'Recursos Humanos', descripcion: 'Gestión del capital humano', empresaId: empresa.id });
            const areaOp = await Area.create({ nombre: 'Operaciones', descripcion: 'Ejecución de proyectos en campo', empresaId: empresa.id });
            const areaTec = await Area.create({ nombre: 'Tecnología', descripcion: 'Sistemas e infraestructura', empresaId: empresa.id });

            const deptDir = await Departamento.create({ nombre: 'Gerencia General', descripcion: 'Dirección ejecutiva', areaId: areaDireccion.id });
            const deptRRHH = await Departamento.create({ nombre: 'Administración de Personal', descripcion: 'Nómina, legales y RRHH', areaId: areaRRHH.id });
            const deptObras = await Departamento.create({ nombre: 'Obras y Proyectos', descripcion: 'Gestión de obras civiles', areaId: areaOp.id });
            const deptSeg = await Departamento.create({ nombre: 'Seguridad e Higiene', descripcion: 'Control y prevención de riesgos', areaId: areaOp.id });
            const deptIT = await Departamento.create({ nombre: 'Sistemas', descripcion: 'Infraestructura TI y soporte', areaId: areaTec.id });

            const puestoDir = await Puesto.create({ nombre: 'Director General', descripcion: 'Máxima autoridad ejecutiva de la empresa', departamentoId: deptDir.id });
            const puestoRRHH = await Puesto.create({ nombre: 'Analista de RRHH', descripcion: 'Gestión integral del personal y liquidaciones', departamentoId: deptRRHH.id });
            const puestoJefeOp = await Puesto.create({ nombre: 'Jefe de Obra', descripcion: 'Coordinación y supervisión de obras', departamentoId: deptObras.id });
            const puestoTec = await Puesto.create({ nombre: 'Técnico en Obras', descripcion: 'Ejecución de tareas en campo y taller', departamentoId: deptObras.id });
            const puestoSeg = await Puesto.create({ nombre: 'Responsable de Seguridad', descripcion: 'Auditoría y cumplimiento normativo SyH', departamentoId: deptSeg.id });
            const puestoIT = await Puesto.create({ nombre: 'Analista de Sistemas', descripcion: 'Desarrollo y administración de sistemas', departamentoId: deptIT.id });

            // ── Empleado 1: Director ──────────────────────────────────────────────
            const { empleado: empDir, contrato: cDir } = await crearEmpleado({
                nombre: 'Martín', apellido: 'Rodríguez',
                email: `martin.rodriguez.${espacioId}@empresa.com`,
                dni: `22000${espacioId}01`, cuil: `20-22000${espacioId}01-4`,
                fechaNacimiento: '1979-05-12', genero: 'masculino', estadoCivil: 'casado',
                calle: 'Av. Córdoba', numero: '1540', codigoPostal: '3370',
                espacioId, rol: roles.rolCEO, puesto: puestoDir, salario: 920000,
                fechaInicio: '2023-01-15',
            });

            await RegistroSalud.create({ empleadoId: empDir.id, tipoExamen: 'pre_ocupacional', fechaRealizacion: '2023-01-15', fechaVencimiento: '2024-01-15', resultado: 'apto', activo: true, vigente: false }, { hooks: false, validate: false });
            await RegistroSalud.create({ empleadoId: empDir.id, tipoExamen: 'periodico', fechaRealizacion: '2024-03-10', fechaVencimiento: '2025-03-10', resultado: 'apto', activo: true, vigente: true }, { hooks: false, validate: false });

            await Contacto.create({ empleadoId: empDir.id, nombreCompleto: 'Sofía Rodríguez', dni: '28111222', telefono: '376-4512345', email: 'sofia.rodriguez@gmail.com', parentesco: 'conyugue', esFamiliar: true, esContactoEmergencia: true }, { validate: false });
            await Contacto.create({ empleadoId: empDir.id, nombreCompleto: 'Lucas Rodríguez', dni: '41222333', telefono: '376-4512346', email: 'lucas.rodriguez@gmail.com', parentesco: 'hijo', esFamiliar: true, esContactoEmergencia: false }, { validate: false });

            await Evaluacion.create({ contratoEvaluadoId: cDir.id, periodo: 'anual', tipoEvaluacion: 'descendente_90', fecha: '2024-12-10', puntaje: 94, escala: 'supera_expectativas', feedback: 'El director demostró liderazgo excepcional. Superó los objetivos anuales en un 18% y consolidó alianzas estratégicas clave para el crecimiento a largo plazo de la empresa.', estado: 'firmada', activo: true }, { hooks: false, validate: false });

            // Solicitud aprobada de vacaciones del Director
            const solVacDir = await Solicitud.create({ contratoId: cDir.id, tipoSolicitud: 'vacaciones', activo: true }, { validate: false });
            await Vacaciones.create({ solicitudId: solVacDir.id, periodo: 2024, diasCorrespondientes: 21, diasTomados: 0, diasDisponibles: 21, fechaInicio: '2024-07-08', fechaFin: '2024-07-26', fechaRegreso: '2024-07-29', diasSolicitud: 15, descripcion: 'Vacaciones de invierno 2024', documentos: [], estado: 'aprobada', notificadoEl: '2024-06-20' }, { hooks: false, validate: false });

            // ── Empleado 2: Analista RRHH ─────────────────────────────────────────
            const { empleado: empRRHH, contrato: cRRHH } = await crearEmpleado({
                nombre: 'Valeria', apellido: 'Gómez',
                email: `valeria.gomez.${espacioId}@empresa.com`,
                dni: `27000${espacioId}02`, cuil: `27-27000${espacioId}02-6`,
                fechaNacimiento: '1988-09-23', genero: 'femenino', estadoCivil: 'casado',
                calle: 'San Martín', numero: '320', codigoPostal: '3370',
                espacioId, rol: roles.rolRRHH, puesto: puestoRRHH, salario: 580000,
                fechaInicio: '2023-06-01',
            });

            await RegistroSalud.create({ empleadoId: empRRHH.id, tipoExamen: 'pre_ocupacional', fechaRealizacion: '2023-06-01', fechaVencimiento: '2024-06-01', resultado: 'apto', activo: true, vigente: false }, { hooks: false, validate: false });
            await RegistroSalud.create({ empleadoId: empRRHH.id, tipoExamen: 'periodico', fechaRealizacion: '2024-06-15', fechaVencimiento: '2025-06-15', resultado: 'apto', activo: true, vigente: true }, { hooks: false, validate: false });

            await Contacto.create({ empleadoId: empRRHH.id, nombreCompleto: 'Roberto Gómez', dni: '24333444', telefono: '376-4567890', email: 'roberto.gomez@gmail.com', parentesco: 'conyugue', esFamiliar: true, esContactoEmergencia: true }, { validate: false });

            await Evaluacion.create({ contratoEvaluadoId: cRRHH.id, periodo: 'semestre_1', tipoEvaluacion: 'descendente_90', fecha: '2024-07-01', puntaje: 88, escala: 'supera_expectativas', feedback: 'Valeria gestionó el área de personal con gran eficiencia. Implementó mejoras en los procesos de liquidación y redujo los tiempos de respuesta a consultas de empleados.', estado: 'firmada', activo: true }, { hooks: false, validate: false });

            // Solicitud pendiente de licencia del RRHH
            const solLicRRHH = await Solicitud.create({ contratoId: cRRHH.id, tipoSolicitud: 'licencia', activo: true }, { validate: false });
            await Licencia.create({ solicitudId: solLicRRHH.id, esLicencia: true, motivoLegal: 'tramites_personales', fechaInicio: '2025-02-17', fechaFin: '2025-02-17', diasSolicitud: 1, descripcion: 'Trámites en registro civil', documentos: [], estado: 'pendiente' }, { hooks: false, validate: false });

            // ── Empleado 3: Jefe de Obra ──────────────────────────────────────────
            const { empleado: empJefe, contrato: cJefe } = await crearEmpleado({
                nombre: 'Hernán', apellido: 'Aguirre',
                email: `hernan.aguirre.${espacioId}@empresa.com`,
                dni: `30000${espacioId}03`, cuil: `20-30000${espacioId}03-5`,
                fechaNacimiento: '1983-11-08', genero: 'masculino', estadoCivil: 'divorciado',
                calle: 'Belgrano', numero: '987', codigoPostal: '3370',
                espacioId, rol: roles.rolOperativo, puesto: puestoJefeOp, salario: 720000,
                fechaInicio: '2023-03-01',
            });

            await RegistroSalud.create({ empleadoId: empJefe.id, tipoExamen: 'pre_ocupacional', fechaRealizacion: '2023-03-01', fechaVencimiento: '2024-03-01', resultado: 'apto', activo: true, vigente: false }, { hooks: false, validate: false });
            await RegistroSalud.create({ empleadoId: empJefe.id, tipoExamen: 'periodico', fechaRealizacion: '2024-09-05', fechaVencimiento: '2025-09-05', resultado: 'apto', activo: true, vigente: true }, { hooks: false, validate: false });

            await Contacto.create({ empleadoId: empJefe.id, nombreCompleto: 'María Aguirre', dni: '33444555', telefono: '376-4598765', email: 'maria.aguirre@gmail.com', parentesco: 'madre', esFamiliar: true, esContactoEmergencia: true }, { validate: false });

            await Evaluacion.create({ contratoEvaluadoId: cJefe.id, periodo: 'anual', tipoEvaluacion: 'descendente_90', fecha: '2024-12-15', puntaje: 83, escala: 'cumple', feedback: 'Hernán coordina el equipo de obras con solvencia técnica. Se recomienda mejorar la comunicación de avances y la gestión de incidentes en tiempo real.', estado: 'firmada', activo: true }, { hooks: false, validate: false });

            // Solicitud pendiente de horas extras del Jefe
            const solHEJefe = await Solicitud.create({ contratoId: cJefe.id, tipoSolicitud: 'horas_extras', activo: true }, { validate: false });
            await HorasExtras.create({ solicitudId: solHEJefe.id, fecha: '2025-01-31', horaInicio: '18:00', horaFin: '21:00', cantidadHoras: 3, tipoHorasExtra: '50', motivo: 'Cierre de etapa de obra por fecha contractual', documentos: [], estado: 'pendiente' }, { hooks: false, validate: false });

            // Solicitud aprobada de horas extras
            const solHEJefe2 = await Solicitud.create({ contratoId: cJefe.id, tipoSolicitud: 'horas_extras', activo: true }, { validate: false });
            await HorasExtras.create({ solicitudId: solHEJefe2.id, fecha: '2024-12-20', horaInicio: '18:00', horaFin: '22:00', cantidadHoras: 4, tipoHorasExtra: '100', motivo: 'Trabajo de urgencia por inspección programada', documentos: [], estado: 'aprobada' }, { hooks: false, validate: false });

            // ── Empleado 4: Técnico ───────────────────────────────────────────────
            const { empleado: empTec, contrato: cTec } = await crearEmpleado({
                nombre: 'Diego', apellido: 'Pereyra',
                email: `diego.pereyra.${espacioId}@empresa.com`,
                dni: `33000${espacioId}04`, cuil: `20-33000${espacioId}04-3`,
                fechaNacimiento: '1995-02-17', genero: 'masculino', estadoCivil: 'soltero',
                calle: 'Mitre', numero: '780', codigoPostal: '3370',
                espacioId, rol: roles.rolOperativo, puesto: puestoTec, salario: 340000,
                tipoContrato: 'plazo_fijo', fechaInicio: '2024-03-01',
            });

            await RegistroSalud.create({ empleadoId: empTec.id, tipoExamen: 'pre_ocupacional', fechaRealizacion: '2024-03-01', fechaVencimiento: '2025-03-01', resultado: 'apto', activo: true, vigente: true }, { hooks: false, validate: false });
            await RegistroSalud.create({ empleadoId: empTec.id, tipoExamen: 'periodico', fechaRealizacion: '2024-09-01', fechaVencimiento: '2025-09-01', resultado: 'apto_preexistencias', activo: true, vigente: true }, { hooks: false, validate: false });

            await Contacto.create({ empleadoId: empTec.id, nombreCompleto: 'Ana Pereyra', dni: '35999888', telefono: '376-4511111', email: 'ana.pereyra@gmail.com', parentesco: 'madre', esFamiliar: true, esContactoEmergencia: true }, { validate: false });
            await Contacto.create({ empleadoId: empTec.id, nombreCompleto: 'Carlos Pereyra', dni: '29888777', telefono: '376-4511112', email: 'carlos.pereyra@gmail.com', parentesco: 'padre', esFamiliar: true, esContactoEmergencia: false }, { validate: false });

            await Evaluacion.create({ contratoEvaluadoId: cTec.id, periodo: 'semestre_2', tipoEvaluacion: 'descendente_90', fecha: '2024-12-05', puntaje: 76, escala: 'cumple', feedback: 'Diego cumple con sus obligaciones. Se destaca por la puntualidad y disposición para tareas de campo. Se sugiere mayor autonomía en resolución de problemas técnicos.', estado: 'finalizada', activo: true }, { hooks: false, validate: false });

            // Solicitud pendiente de vacaciones del Técnico
            const solVacTec = await Solicitud.create({ contratoId: cTec.id, tipoSolicitud: 'vacaciones', activo: true }, { validate: false });
            await Vacaciones.create({ solicitudId: solVacTec.id, periodo: 2025, diasCorrespondientes: 14, diasTomados: 0, diasDisponibles: 14, fechaInicio: '2025-02-24', fechaFin: '2025-03-07', fechaRegreso: '2025-03-10', diasSolicitud: 10, descripcion: 'Vacaciones de verano 2025', documentos: [], estado: 'pendiente' }, { hooks: false, validate: false });

            // ── Empleado 5: Analista IT ───────────────────────────────────────────
            const { empleado: empIT, contrato: cIT } = await crearEmpleado({
                nombre: 'Luciana', apellido: 'Ferreyra',
                email: `luciana.ferreyra.${espacioId}@empresa.com`,
                dni: `38000${espacioId}05`, cuil: `27-38000${espacioId}05-8`,
                fechaNacimiento: '1997-07-30', genero: 'femenino', estadoCivil: 'soltero',
                calle: 'Rivadavia', numero: '455', codigoPostal: '3370',
                espacioId, rol: roles.rolOperativo, puesto: puestoIT, salario: 490000,
                tipoContrato: 'tiempo_indeterminado', fechaInicio: '2024-06-01',
            });

            await RegistroSalud.create({ empleadoId: empIT.id, tipoExamen: 'pre_ocupacional', fechaRealizacion: '2024-06-01', fechaVencimiento: '2025-06-01', resultado: 'apto', activo: true, vigente: true }, { hooks: false, validate: false });

            await Contacto.create({ empleadoId: empIT.id, nombreCompleto: 'Jorge Ferreyra', dni: '26777666', telefono: '376-4522222', email: 'jorge.ferreyra@gmail.com', parentesco: 'padre', esFamiliar: true, esContactoEmergencia: true }, { validate: false });

            await Evaluacion.create({ contratoEvaluadoId: cIT.id, periodo: 'semestre_2', tipoEvaluacion: 'descendente_90', fecha: '2024-12-20', puntaje: 91, escala: 'supera_expectativas', feedback: 'Luciana demostró gran capacidad técnica y proactividad. Implementó mejoras en la infraestructura que redujeron los tiempos de respuesta del sistema en un 30%.', estado: 'firmada', activo: true }, { hooks: false, validate: false });

            // Solicitud pendiente de licencia de la analista IT
            const solLicIT = await Solicitud.create({ contratoId: cIT.id, tipoSolicitud: 'licencia', activo: true }, { validate: false });
            await Licencia.create({ solicitudId: solLicIT.id, esLicencia: true, motivoLegal: 'examen_estudio', fechaInicio: '2025-02-21', fechaFin: '2025-02-21', diasSolicitud: 1, descripcion: 'Examen final Universidad Tecnológica Nacional', documentos: [], estado: 'pendiente' }, { hooks: false, validate: false });

            // Solicitud rechazada de licencia
            const solLicRec = await Solicitud.create({ contratoId: cIT.id, tipoSolicitud: 'licencia', activo: true }, { validate: false });
            await Licencia.create({ solicitudId: solLicRec.id, esLicencia: false, motivoLegal: 'tramites_personales', fechaInicio: '2025-01-10', fechaFin: '2025-01-10', diasSolicitud: 1, descripcion: 'Trámites banco', documentos: [], estado: 'rechazada' }, { hooks: false, validate: false });
        };

        // ─── 5. Espacio CEO - Casa Central ────────────────────────────────────────
        console.log('🏢 Creando espacio CEO (Casa Central)...');
        const espacioCEO = await EspacioTrabajo.create({
            nombre: 'Cataratas Ingeniería - Casa Central',
            descripcion: 'Sede principal de operaciones en Puerto Iguazú',
            propietarioId: usuarioCEO.id,
            activo: true,
        });
        await initSpaceConfig(espacioCEO.id);
        const rolesCEO = await createRolesForSpace(espacioCEO.id);
        await populateSpaceData(espacioCEO.id, rolesCEO, 'Cataratas');

        // ─── 6. Espacio CEO - Sucursal Posadas ────────────────────────────────────
        console.log('🏢 Creando espacio CEO (Sucursal Posadas)...');
        const espacioCEO2 = await EspacioTrabajo.create({
            nombre: 'Cataratas - Sucursal Posadas',
            descripcion: 'Sucursal regional en Posadas, Misiones',
            propietarioId: usuarioCEO.id,
            activo: true,
        });
        await initSpaceConfig(espacioCEO2.id);
        const rolesCEO2 = await createRolesForSpace(espacioCEO2.id);
        await populateSpaceData(espacioCEO2.id, rolesCEO2, 'Cataratas Posadas');

        // ─── 7. Espacio User - Consultora Principal ───────────────────────────────
        console.log('🏢 Creando espacio User (Consultora)...');
        const espacioUser = await EspacioTrabajo.create({
            nombre: 'Consultora Río Grande SRL',
            descripcion: 'Consultora de RRHH y capacitación empresarial',
            propietarioId: usuarioRRHH.id,
            activo: true,
        });
        await initSpaceConfig(espacioUser.id);
        const rolesUser = await createRolesForSpace(espacioUser.id);
        await populateSpaceData(espacioUser.id, rolesUser, 'Río Grande');

        // ─── 8. Espacio User - Filial Norte ──────────────────────────────────────
        console.log('🏢 Creando espacio User (Filial Norte)...');
        const espacioUser2 = await EspacioTrabajo.create({
            nombre: 'Consultora - Filial Norte',
            descripcion: 'Filial en etapa de expansión - Oberá, Misiones',
            propietarioId: usuarioRRHH.id,
            activo: true,
        });
        await initSpaceConfig(espacioUser2.id);
        await createRolesForSpace(espacioUser2.id);

        console.log('');
        console.log('✅ Semilla completada exitosamente.');
        console.log('');
        console.log('   📧 CEO (admin):  ceo@cataratas.com  / Admin123!');
        console.log('   📧 User (owner): user@cataratas.com / User123!');
        console.log('   📧 Empleados:    *@empresa.com      / User123!');
        console.log('');
        return true;

    } catch (error) {
        console.error('❌ Error al cargar semilla:', error);
        throw error;
    }
};

module.exports = { runSeed, hasData };

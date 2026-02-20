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
    Rol,
    Permiso,
    EspacioTrabajo,
    ConceptoSalarial,
    ParametroLaboral,
} = require('../models');

/**
 * Verificar si ya existen datos
 */
const hasData = async () => {
    return (await Usuario.count()) > 0;
};

/**
 * Helper: crear empleado realista con usuario, contrato asignado a un rol y un puesto
 */
const crearEmpleado = async ({ nombre, apellido, email, dni, cuil, fechaNacimiento, genero, estadoCivil, calle, numero, espacioId, rol, puesto, salario, tipoContrato }) => {
    const usuario = await Usuario.create({
        nombre,
        apellido,
        email,
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
        codigoPostal: '1000',
        provinciaId: 1,
        ciudadId: 1,
    });

    const contrato = await Contrato.create({
        empleadoId: empleado.id,
        rolId: rol.id,
        tipoContrato: tipoContrato || 'tiempo_indeterminado',
        fechaInicio: '2024-03-01',
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
            'roles', 'dashboard', 'reportes'
        ];
        const acciones = ['crear', 'leer', 'actualizar', 'eliminar'];

        for (const modulo of modulos) {
            for (const accion of acciones) {
                if (modulo === 'liquidaciones' && (accion === 'crear' || accion === 'eliminar')) continue;
                if ((modulo === 'dashboard' || modulo === 'reportes') && accion !== 'leer') continue;
                await Permiso.findOrCreate({
                    where: { modulo, accion },
                    defaults: { descripcion: `${accion} ${modulo}` }
                });
            }
        }
        const allPermisos = await Permiso.findAll();

        const getPermisosIds = (criterios) => {
            return allPermisos.filter(p => criterios.some(c => {
                if (typeof c === 'string') return p.modulo === c;
                return p.modulo === c.modulo && c.acciones.includes(p.accion);
            })).map(p => p.id);
        };

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
                descripcion: 'Gestión de RRHH, lectura de Dashboard y Reportes',
                esObligatorio: true,
                espacioTrabajoId: espacioId,
                activo: true
            });
            await rolRRHH.setPermisos(getPermisosIds([
                'empleados', 'contratos', 'registros_salud', 'evaluaciones', 'contactos', 'solicitudes',
                { modulo: 'empresas', acciones: ['leer'] },
                { modulo: 'dashboard', acciones: ['leer'] },
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

        // ─── 3. Helper: configuración de espacio (conceptos y parámetros) ─────────
        const initSpaceConfig = async (espacioId) => {
            await ConceptoSalarial.bulkCreate([
                { nombre: 'Jubilación', tipo: 'deduccion', esPorcentaje: true, valor: 11, esObligatorio: true, espacioTrabajoId: espacioId },
                { nombre: 'Obra Social', tipo: 'deduccion', esPorcentaje: true, valor: 3, esObligatorio: true, espacioTrabajoId: espacioId },
                { nombre: 'PAMI', tipo: 'deduccion', esPorcentaje: true, valor: 3, esObligatorio: true, espacioTrabajoId: espacioId },
                { nombre: 'Cuota Sindical', tipo: 'deduccion', esPorcentaje: true, valor: 2.5, esObligatorio: true, espacioTrabajoId: espacioId },
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
        const populateSpaceData = async (espacioId, roles) => {
            // Empresa
            const empresa = await Empresa.create({
                nombre: 'Cataratas Ingeniería SA',
                email: 'contacto@cataratas.com',
                telefono: '0376-4421500',
                industria: 'Ingeniería y Construcción',
                direccion: 'Av. Victoria Aguirre 66',
                activo: true,
                espacioTrabajoId: espacioId,
            });

            // Estructura organizacional
            const areaDireccion = await Area.create({ nombre: 'Dirección General', descripcion: 'Alta gerencia', empresaId: empresa.id });
            const areaRRHH = await Area.create({ nombre: 'Recursos Humanos', descripcion: 'Gestión de personas', empresaId: empresa.id });
            const areaOp = await Area.create({ nombre: 'Operaciones', descripcion: 'Ejecución de proyectos', empresaId: empresa.id });

            const deptyDir = await Departamento.create({ nombre: 'Gerencia', descripcion: 'Dirección ejecutiva', areaId: areaDireccion.id });
            const deptyRRHH = await Departamento.create({ nombre: 'Administración', descripcion: 'RRHH y Nómina', areaId: areaRRHH.id });
            const deptyOp = await Departamento.create({ nombre: 'Obras y Proyectos', descripcion: 'Campo y oficina', areaId: areaOp.id });

            const puestoDir = await Puesto.create({ nombre: 'Director General', descripcion: 'Máxima autoridad ejecutiva', departamentoId: deptyDir.id });
            const puestoRRHH = await Puesto.create({ nombre: 'Analista de RRHH', descripcion: 'Gestión integral de personal', departamentoId: deptyRRHH.id });
            const puestoTec = await Puesto.create({ nombre: 'Técnico en Obras', descripcion: 'Ejecución y supervisión de obras', departamentoId: deptyOp.id });

            // ── Empleado 1: Director con rol rolCEO ───────────────────────────────
            const { empleado: empDir, contrato: contratoDir } = await crearEmpleado({
                nombre: 'Martín',
                apellido: 'Rodríguez',
                email: `martin.rodriguez.${espacioId}@cataratas.com`,
                dni: `2200000${espacioId}`,
                cuil: `20-2200000${espacioId}-4`,
                fechaNacimiento: '1979-05-12',
                genero: 'masculino',
                estadoCivil: 'casado',
                calle: 'Av. Córdoba',
                numero: '1540',
                espacioId,
                rol: roles.rolCEO,
                puesto: puestoDir,
                salario: 850000,
            });

            // Registros para el Director
            await RegistroSalud.create({
                empleadoId: empDir.id,
                tipoExamen: 'pre_ocupacional',
                fechaRealizacion: '2024-03-01',
                fechaVencimiento: '2025-03-01',
                resultado: 'apto',
                activo: true, vigente: true,
            }, { hooks: false, validate: false });

            await Contacto.create({
                empleadoId: empDir.id,
                nombreCompleto: 'Sofía Rodríguez',
                dni: '28111222',
                esFamiliar: true,
                esContactoEmergencia: true,
            }, { validate: false });

            // ── Empleado 2: Administrador RRHH con rol rolRRHH ───────────────────
            const { empleado: empRRHH, contrato: contratoRRHH } = await crearEmpleado({
                nombre: 'Valeria',
                apellido: 'Gómez',
                email: `valeria.gomez.${espacioId}@cataratas.com`,
                dni: `2700000${espacioId}`,
                cuil: `27-2700000${espacioId}-6`,
                fechaNacimiento: '1988-09-23',
                genero: 'femenino',
                estadoCivil: 'casado',
                calle: 'Calle San Martín',
                numero: '320',
                espacioId,
                rol: roles.rolRRHH,
                puesto: puestoRRHH,
                salario: 520000,
            });

            await RegistroSalud.create({
                empleadoId: empRRHH.id,
                tipoExamen: 'periodico',
                fechaRealizacion: '2024-06-15',
                fechaVencimiento: '2025-06-15',
                resultado: 'apto',
                activo: true, vigente: true,
            }, { hooks: false, validate: false });

            await Contacto.create({
                empleadoId: empRRHH.id,
                nombreCompleto: 'Roberto Gómez',
                dni: '24333444',
                esFamiliar: true,
                esContactoEmergencia: true,
            }, { validate: false });

            // Evaluación emitida por RRHH al Director
            await Evaluacion.create({
                contratoEvaluadoId: contratoDir.id,
                periodo: 'anual',
                tipoEvaluacion: 'descendente_90',
                fecha: '2024-12-10',
                puntaje: 92,
                escala: 'supera_expectativas',
                feedback: 'El director demostró liderazgo excepcional durante el ejercicio. Superó los objetivos anuales en un 15%, consolidó alianzas estratégicas y mejoró el clima organizacional.',
                estado: 'firmada',
                activo: true,
            }, { hooks: false, validate: false });

            // ── Empleado 3: Técnico con rol rolOperativo ─────────────────────────
            const { empleado: empTec, contrato: contratoTec } = await crearEmpleado({
                nombre: 'Diego',
                apellido: 'Pereyra',
                email: `diego.pereyra.${espacioId}@cataratas.com`,
                dni: `3300000${espacioId}`,
                cuil: `20-3300000${espacioId}-3`,
                fechaNacimiento: '1995-02-17',
                genero: 'masculino',
                estadoCivil: 'soltero',
                calle: 'Mitre',
                numero: '780',
                espacioId,
                rol: roles.rolOperativo,
                puesto: puestoTec,
                salario: 310000,
                tipoContrato: 'plazo_fijo',
            });

            await RegistroSalud.create({
                empleadoId: empTec.id,
                tipoExamen: 'pre_ocupacional',
                fechaRealizacion: '2024-03-01',
                fechaVencimiento: '2025-03-01',
                resultado: 'apto',
                activo: true, vigente: true,
            }, { hooks: false, validate: false });

            await RegistroSalud.create({
                empleadoId: empTec.id,
                tipoExamen: 'periodico',
                fechaRealizacion: '2024-09-01',
                fechaVencimiento: '2025-09-01',
                resultado: 'apto_preexistencias',
                activo: true, vigente: true,
            }, { hooks: false, validate: false });

            await Contacto.create({
                empleadoId: empTec.id,
                nombreCompleto: 'Ana Pereyra',
                dni: '35999888',
                esFamiliar: true,
                esContactoEmergencia: true,
            }, { validate: false });

            // Solicitud de vacaciones del técnico
            const solicitudVac = await Solicitud.create({
                contratoId: contratoTec.id,
                tipoSolicitud: 'vacaciones',
                activo: true,
            }, { validate: false });

            await Vacaciones.create({
                solicitudId: solicitudVac.id,
                periodo: 2025,
                diasCorrespondientes: 14,
                diasTomados: 0,
                diasDisponibles: 14,
                fechaInicio: '2025-01-13',
                fechaFin: '2025-01-24',
                fechaRegreso: '2025-01-27',
                diasSolicitud: 10,
                estado: 'aprobado',
            }, { hooks: false, validate: false });

            // Evaluación del técnico emitida por RRHH
            await Evaluacion.create({
                contratoEvaluadoId: contratoTec.id,
                periodo: 'semestre_2',
                tipoEvaluacion: 'descendente_90',
                fecha: '2024-12-05',
                puntaje: 76,
                escala: 'cumple',
                feedback: 'El técnico cumple adecuadamente con sus responsabilidades en campo. Se recomienda mayor proactividad en la comunicación de inconvenientes y en la gestión del tiempo.',
                estado: 'finalizada',
                activo: true,
            }, { hooks: false, validate: false });
        };

        // ─── 5. Espacio CEO ────────────────────────────────────────────────────────
        console.log('🏢 Creando espacio de trabajo (CEO)...');
        const espacioCEO = await EspacioTrabajo.create({
            nombre: 'Cataratas Ingeniería - Casa Central',
            descripcion: 'Sede principal de operaciones',
            propietarioId: usuarioCEO.id,
            activo: true,
        });
        await initSpaceConfig(espacioCEO.id);
        const rolesCEO = await createRolesForSpace(espacioCEO.id);
        await populateSpaceData(espacioCEO.id, rolesCEO);

        const espacioCEO2 = await EspacioTrabajo.create({
            nombre: 'Cataratas - Sucursal Posadas',
            descripcion: 'Nueva sucursal en desarrollo',
            propietarioId: usuarioCEO.id,
            activo: true,
        });
        await initSpaceConfig(espacioCEO2.id);
        await createRolesForSpace(espacioCEO2.id);

        // ─── 6. Espacio Usuario Estándar ───────────────────────────────────────────
        console.log('🏢 Creando espacio de trabajo (Usuario)...');
        const espacioUser = await EspacioTrabajo.create({
            nombre: 'Consultora Río Grande SRL',
            descripcion: 'Consultora de RRHH y capacitación',
            propietarioId: usuarioRRHH.id,
            activo: true,
        });
        await initSpaceConfig(espacioUser.id);
        const rolesUser = await createRolesForSpace(espacioUser.id);
        await populateSpaceData(espacioUser.id, rolesUser);

        const espacioUser2 = await EspacioTrabajo.create({
            nombre: 'Consultora - Filial Norte',
            descripcion: 'Filial en etapa de apertura',
            propietarioId: usuarioRRHH.id,
            activo: true,
        });
        await initSpaceConfig(espacioUser2.id);
        await createRolesForSpace(espacioUser2.id);

        console.log('✅ Semilla completada exitosamente.');
        console.log('');
        console.log('   📧 CEO:    ceo@cataratas.com   / Admin123!');
        console.log('   📧 User:   user@cataratas.com  / User123!');
        return true;

    } catch (error) {
        console.error('❌ Error al cargar semilla:', error);
        throw error;
    }
};

module.exports = { runSeed, hasData };

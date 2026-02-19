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
 * Ejecutar la semilla de datos
 */
const runSeed = async () => {
    try {
        if (await hasData()) {
            console.log('📦 Los datos ya existen, omitiendo semilla.');
            return false;
        }

        console.log('🌱 Iniciando carga de datos de semilla estructurada...');

        // 0. Crear Permisos Base (Sistema)
        const modulos = ['empleados', 'empresas', 'contratos', 'roles'];
        const acciones = ['crear', 'leer', 'actualizar', 'eliminar'];

        console.log('🔐 Inicializando permisos...');
        for (const modulo of modulos) {
            for (const accion of acciones) {
                await Permiso.findOrCreate({
                    where: { modulo, accion },
                    defaults: { descripcion: `${accion} ${modulo}` }
                });
            }
        }

        // 1. Crear Usuario Admin (Propietario) con datos completos (requeridos por modelo Usuario)
        const adminUsuario = await Usuario.create({
            nombre: 'Admin',
            apellido: 'Sistema',
            email: 'admin@cataratasrh.com',
            contrasena: 'Admin123!',
            esAdministrador: true,
            esEmpleado: false,
            activo: true,
        });

        // 2. Crear Espacio de Trabajo Principal
        const espacioTrabajo = await EspacioTrabajo.create({
            nombre: 'Espacio Principal',
            descripcion: 'Espacio de trabajo por defecto',
            propietarioId: adminUsuario.id,
            activo: true
        });

        // 2.1. Crear Conceptos Salariales Obligatorios
        const conceptosDefault = [
            { nombre: 'Jubilación', tipo: 'deduccion', esPorcentaje: true, valor: 11, esObligatorio: true, espacioTrabajoId: espacioTrabajo.id },
            { nombre: 'Obra Social', tipo: 'deduccion', esPorcentaje: true, valor: 3, esObligatorio: true, espacioTrabajoId: espacioTrabajo.id },
            { nombre: 'PAMI', tipo: 'deduccion', esPorcentaje: true, valor: 3, esObligatorio: true, espacioTrabajoId: espacioTrabajo.id },
            { nombre: 'Cuota Sindical', tipo: 'deduccion', esPorcentaje: true, valor: 2.5, esObligatorio: true, espacioTrabajoId: espacioTrabajo.id },
        ];
        await ConceptoSalarial.bulkCreate(conceptosDefault);

        // 2.2. Crear Parámetros Laborales Obligatorios
        await ParametroLaboral.create({
            tipo: 'limite_ausencia_injustificada',
            valor: '1',
            descripcion: 'Límite de ausencias injustificadas permitidas por mes',
            esObligatorio: true,
            espacioTrabajoId: espacioTrabajo.id
        });

        // 2.3. Crear Rol de Administrador
        const permisos = await Permiso.findAll();
        const rolAdmin = await Rol.create({
            nombre: 'Administrador',
            descripcion: 'Rol con acceso completo a todas las funcionalidades del sistema',
            esObligatorio: true,
            espacioTrabajoId: espacioTrabajo.id,
            activo: true
        });

        // Asignar todos los permisos al rol admin
        if (permisos.length > 0) {
            await rolAdmin.setPermisos(permisos.map(p => p.id));
        }

        console.log('✅ Espacio de trabajo creado con conceptos, parámetros y rol admin');

        // 3. Crear Empresas
        const empresas = await Empresa.bulkCreate([
            {
                nombre: 'TechCorp Argentina SA',
                email: 'info@techcorp.com.ar',
                telefono: '+54 11 4555-1234',
                industria: 'Tecnología',
                direccion: 'Av. Libertador 1234, CABA',
                activo: true,
                espacioTrabajoId: espacioTrabajo.id
            },
            {
                nombre: 'Industrias del Sur SRL',
                email: 'contacto@industrias-sur.com.ar',
                telefono: '+54 11 4666-5678',
                industria: 'Manufactura',
                direccion: 'Calle Industrial 567, Avellaneda',
                activo: true,
                espacioTrabajoId: espacioTrabajo.id
            },
        ]);

        // 4. Estructura Org
        const areas = await Area.bulkCreate([
            { nombre: 'Recursos Humanos', descripcion: 'Gestión del personal', empresaId: empresas[0].id },
            { nombre: 'Desarrollo', descripcion: 'Desarrollo de software', empresaId: empresas[0].id },
        ]);

        const departamentos = await Departamento.bulkCreate([
            { nombre: 'Selección', descripcion: 'Reclutamiento', areaId: areas[0].id },
            { nombre: 'Frontend', descripcion: 'Desarrollo UI', areaId: areas[1].id },
        ]);

        const puestos = await Puesto.bulkCreate([
            { nombre: 'Analista RRHH', descripcion: 'Generalista', departamentoId: departamentos[0].id },
            { nombre: 'Dev Frontend', descripcion: 'React Developer', departamentoId: departamentos[1].id },
        ]);

        // 5. Crear Empleado Juan Garcia
        // Datos personales ahora van en Usuario
        const usuarioJuan = await Usuario.create({
            nombre: 'Juan',
            apellido: 'García',
            email: 'juan.garcia@ejemplo.com',
            contrasena: 'Juan2024!',
            activo: true,
            esAdministrador: false,
            esEmpleado: true,
        });

        // Empleado con datos personales y dirección
        const empleadoJuan = await Empleado.create({
            usuarioId: usuarioJuan.id,
            espacioTrabajoId: espacioTrabajo.id,
            tipoDocumento: 'cedula',
            numeroDocumento: '30123456',
            cuil: '20-30123456-5',
            fechaNacimiento: '1990-05-15',
            nacionalidadId: 1,
            genero: 'masculino',
            estadoCivil: 'casado',
            calle: 'Av. Corrientes',
            numero: '1234',
            provinciaId: 1
        });

        // 6. Contratos
        await Contrato.create({
            empleadoId: empleadoJuan.id,
            tipoContrato: 'tiempo_indeterminado',
            fechaInicio: new Date().toISOString().split('T')[0],
            horario: '9 to 18',
            salario: 180000.00,
            estado: 'en_curso',
            activo: true
        });

        console.log('✅ Semilla completada con estructura nueva.');
        return true;

    } catch (error) {
        console.error('❌ Error al cargar semilla:', error);
        throw error;
    }
};

module.exports = { runSeed, hasData };

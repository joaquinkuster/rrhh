const { Empresa, Area, Departamento, Puesto, Contrato, EspacioTrabajo, Empleado, ContratoPuesto } = require('../models');
const { Op } = require('sequelize');

const includeStructure = [{
    model: Area,
    as: 'areas',
    include: [{
        model: Departamento,
        as: 'departamentos',
        include: [{
            model: Puesto,
            as: 'puestos',
            include: [{
                model: Contrato,
                as: 'contratos',
                through: { attributes: [] },
                where: { activo: true },
                required: false
            }]
        }]
    }]
}];

// Obtener todas las empresas con búsqueda y paginación
const getAll = async (req, res) => {
    try {
        const { search, page = 1, limit = 10, activo } = req.query;
        const where = {};

        // Por defecto solo mostrar activas
        if (activo === 'false') {
            where.activo = false;
        } else if (activo === 'all') {
            // No filtrar
        } else {
            where.activo = true;
        }

        if (search) {
            where.nombre = { [Op.like]: `%${search}%` };
        }

        // Filtros adicionales requested
        const { email, telefono, industria, direccion } = req.query;
        if (email) where.email = { [Op.like]: `%${email}%` };
        if (telefono) where.telefono = { [Op.like]: `%${telefono}%` };
        if (industria) where.industria = { [Op.like]: `%${industria}%` };
        if (direccion) where.direccion = { [Op.like]: `%${direccion}%` };

        const usuarioSesionId = req.session.usuarioId || req.session.empleadoId;
        const esAdmin = req.session.esAdministrador;

        if (req.query.espacioTrabajoId) {
            where.espacioTrabajoId = req.query.espacioTrabajoId;
        } else if (!esAdmin) {
            // Si NO es admin y no hay filtro explícito, buscar sus espacios
            const empleadoSesion = await Empleado.findOne({ where: { usuarioId: usuarioSesionId } });

            if (empleadoSesion) {
                where.espacioTrabajoId = empleadoSesion.espacioTrabajoId;
            } else {
                // Si es propietario
                const espaciosPropios = await EspacioTrabajo.findAll({
                    where: { propietarioId: usuarioSesionId },
                    attributes: ['id']
                });

                if (espaciosPropios.length > 0) {
                    const espaciosIds = espaciosPropios.map(e => e.id);
                    where.espacioTrabajoId = { [Op.in]: espaciosIds };
                } else {
                    // Si no tiene espacios propios ni es empleado, no debe ver nada
                    where.espacioTrabajoId = -1;
                }
            }
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows } = await Empresa.findAndCountAll({
            where,
            include: [{
                model: EspacioTrabajo,
                as: 'espacioTrabajo',
                attributes: ['id', 'nombre']
            }],
            order: [['nombre', 'ASC']],
            limit: parseInt(limit),
            offset,
        });

        res.json({
            data: rows,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / parseInt(limit)),
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener empresa por ID con toda su estructura
const getById = async (req, res) => {
    try {
        const empresa = await Empresa.findByPk(req.params.id, {
            include: includeStructure
        });

        if (!empresa) {
            return res.status(404).json({ error: 'Empresa no encontrada' });
        }

        res.json(empresa);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Crear empresa con estructura anidada
const create = async (req, res) => {
    try {
        let { nombre, email, telefono, industria, direccion, areas, espacioTrabajoId } = req.body;

        if (!espacioTrabajoId) {
            return res.status(400).json({ error: 'Debe pertenecer a un espacio de trabajo para crear una empresa. Por favor cree un Espacio de Trabajo primero.' });
        }

        // Validar unicidad de email dentro del mismo espacioTrabajo
        if (email) {
            const emailExistente = await Empresa.findOne({
                where: { espacioTrabajoId, email }
            });
            if (emailExistente) {
                return res.status(400).json({ error: 'El email ya está registrado en este espacio de trabajo' });
            }
        }

        const nuevaEmpresa = await Empresa.create({
            nombre,
            email,
            telefono,
            industria,
            direccion,
            areas,
            espacioTrabajoId
        }, {
            include: includeStructure
        });

        res.status(201).json(nuevaEmpresa);
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(e => e.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }
        res.status(500).json({ error: error.message });
    }
};

// Eliminar empresa (eliminación lógica)
const remove = async (req, res) => {
    try {
        const empresa = await Empresa.findByPk(req.params.id, {
            include: includeStructure
        });

        if (!empresa) {
            return res.status(404).json({ error: 'Empresa no encontrada' });
        }

        // Obtener todos los puestos de esta empresa
        const puestoIds = [];
        empresa.areas?.forEach(area => {
            area.departamentos?.forEach(depto => {
                depto.puestos?.forEach(puesto => {
                    puestoIds.push(puesto.id);
                });
            });
        });

        // Verificar si hay contratos activos asociados a los puestos de esta empresa
        if (puestoIds.length > 0) {
            const contratosActivos = await ContratoPuesto.count({
                where: { puestoId: puestoIds },
                include: [{
                    model: Contrato,
                    as: 'contrato',
                    where: { activo: true }
                }]
            });

            if (contratosActivos > 0) {
                return res.status(400).json({
                    error: `No se puede desactivar la empresa "${empresa.nombre}" porque tiene ${contratosActivos} contrato(s) activo(s). Primero desactive los contratos.`
                });
            }
        }

        await empresa.update({ activo: false });
        res.json({ message: 'Empresa desactivada correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar empresas en lote (eliminación lógica)
const removeBulk = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'Se requiere un array de IDs' });
        }

        // --- Verificaciones de entidades asociadas activas para cada empresa ---
        for (const id of ids) {
            const empresa = await Empresa.findByPk(id, {
                include: includeStructure
            });

            if (!empresa) continue;

            // Obtener todos los puestos de esta empresa
            const puestoIds = [];
            empresa.areas?.forEach(area => {
                area.departamentos?.forEach(depto => {
                    depto.puestos?.forEach(puesto => {
                        puestoIds.push(puesto.id);
                    });
                });
            });

            // Verificar si hay contratos activos asociados a los puestos de esta empresa
            if (puestoIds.length > 0) {
                const contratosActivos = await ContratoPuesto.count({
                    where: { puestoId: puestoIds },
                    include: [{
                        model: Contrato,
                        as: 'contrato',
                        where: { activo: true }
                    }]
                });

                if (contratosActivos > 0) {
                    return res.status(400).json({
                        error: `No se puede desactivar la empresa "${empresa.nombre}" porque tiene ${contratosActivos} contrato(s) activo(s). Primero desactive los contratos.`
                    });
                }
            }
        }

        await Empresa.update(
            { activo: false },
            { where: { id: { [Op.in]: ids } } }
        );

        res.json({ message: `${ids.length} empresa(s) desactivada(s) correctamente` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Reactivar empresa
const reactivate = async (req, res) => {
    try {
        const empresa = await Empresa.findByPk(req.params.id);

        if (!empresa) {
            return res.status(404).json({ error: 'Empresa no encontrada' });
        }

        // Validar unicidad de email dentro del mismo espacioTrabajo
        if (empresa.email) {
            const emailExistente = await Empresa.findOne({
                where: { espacioTrabajoId: empresa.espacioTrabajoId, email: empresa.email, id: { [Op.ne]: empresa.id } }
            });
            if (emailExistente) {
                return res.status(400).json({ error: 'El email ya está registrado en este espacio de trabajo' });
            }
        }

        await empresa.update({ activo: true });

        const empresaReactivada = await Empresa.findByPk(req.params.id, {
            include: includeStructure
        });

        res.json(empresaReactivada);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar empresa con estructura anidada
const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email, telefono, industria, direccion, areas, espacioTrabajoId } = req.body;

        if (!espacioTrabajoId) {
            return res.status(400).json({ error: 'Debe pertenecer a un espacio de trabajo para crear una empresa. Por favor cree un Espacio de Trabajo primero.' });
        }

        const empresa = await Empresa.findByPk(id);
        if (!empresa) {
            return res.status(404).json({ error: 'Empresa no encontrada' });
        }

        // Validar unicidad de email dentro del mismo espacioTrabajo
        if (email) {
            const emailExistente = await Empresa.findOne({
                where: { espacioTrabajoId, email, id: { [Op.ne]: id } }
            });
            if (emailExistente) {
                return res.status(400).json({ error: 'El email ya está registrado en este espacio de trabajo' });
            }
        }

        await empresa.update({ nombre, email, telefono, industria, direccion });

        if (areas !== undefined) {
            // Get existing structure
            const areasExistentes = await Area.findAll({
                where: { empresaId: id },
                include: [{
                    model: Departamento,
                    as: 'departamentos',
                    include: [{
                        model: Puesto,
                        as: 'puestos'
                    }]
                }]
            });

            // Track IDs to keep
            const areasToKeep = new Set();
            const deptosToKeep = new Set();
            const puestosToKeep = new Set();

            if (areas && areas.length > 0) {
                for (const areaData of areas) {
                    const { departamentos, id: areaId, ...areaRest } = areaData;
                    let area;

                    // Update existing or create new area
                    if (areaId) {
                        area = await Area.findByPk(areaId);
                        if (area && area.empresaId === parseInt(id)) {
                            await area.update(areaRest);
                            areasToKeep.add(areaId);
                        } else {
                            area = await Area.create({ ...areaRest, empresaId: id });
                            areasToKeep.add(area.id);
                        }
                    } else {
                        area = await Area.create({ ...areaRest, empresaId: id });
                        areasToKeep.add(area.id);
                    }

                    if (departamentos && departamentos.length > 0) {
                        for (const deptoData of departamentos) {
                            const { puestos, id: deptoId, ...deptoRest } = deptoData;
                            let depto;

                            // Update existing or create new departamento
                            if (deptoId) {
                                depto = await Departamento.findByPk(deptoId);
                                if (depto && depto.areaId === area.id) {
                                    await depto.update(deptoRest);
                                    deptosToKeep.add(deptoId);
                                } else {
                                    depto = await Departamento.create({ ...deptoRest, areaId: area.id });
                                    deptosToKeep.add(depto.id);
                                }
                            } else {
                                depto = await Departamento.create({ ...deptoRest, areaId: area.id });
                                deptosToKeep.add(depto.id);
                            }

                            if (puestos && puestos.length > 0) {
                                for (const puestoData of puestos) {
                                    const { id: puestoId, ...puestoRest } = puestoData;

                                    // Update existing or create new puesto
                                    if (puestoId) {
                                        const puesto = await Puesto.findByPk(puestoId);
                                        if (puesto && puesto.departamentoId === depto.id) {
                                            await puesto.update(puestoRest);
                                            puestosToKeep.add(puestoId);
                                        } else {
                                            const newPuesto = await Puesto.create({ ...puestoRest, departamentoId: depto.id });
                                            puestosToKeep.add(newPuesto.id);
                                        }
                                    } else {
                                        const newPuesto = await Puesto.create({ ...puestoRest, departamentoId: depto.id });
                                        puestosToKeep.add(newPuesto.id);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Validate and delete orphaned items (those not in the new structure)
            // First, check if any items to be deleted are linked to active contracts
            const { ContratoPuesto, Contrato } = require('../models');
            const errorsLinked = [];

            for (const areaExistente of areasExistentes) {
                const areaBeingDeleted = !areasToKeep.has(areaExistente.id);

                for (const deptoExistente of areaExistente.departamentos || []) {
                    const deptoBeingDeleted = !deptosToKeep.has(deptoExistente.id) || areaBeingDeleted;

                    for (const puestoExistente of deptoExistente.puestos || []) {
                        const puestoBeingDeleted = !puestosToKeep.has(puestoExistente.id) || deptoBeingDeleted;

                        if (puestoBeingDeleted) {
                            // Check if puesto is linked to any active contract
                            const linkedContracts = await ContratoPuesto.count({
                                where: { puestoId: puestoExistente.id },
                                include: [{
                                    model: Contrato,
                                    as: 'contrato',
                                    where: { activo: true }
                                }]
                            });

                            if (linkedContracts > 0) {
                                // Create contextual error message
                                if (areaBeingDeleted) {
                                    errorsLinked.push(`El área "${areaExistente.nombre}" no puede eliminarse porque contiene el puesto "${puestoExistente.nombre}" que tiene ${linkedContracts} contrato(s) activo(s)`);
                                } else if (deptoBeingDeleted) {
                                    errorsLinked.push(`El departamento "${deptoExistente.nombre}" no puede eliminarse porque contiene el puesto "${puestoExistente.nombre}" que tiene ${linkedContracts} contrato(s) activo(s)`);
                                } else {
                                    errorsLinked.push(`El puesto "${puestoExistente.nombre}" no puede eliminarse porque tiene ${linkedContracts} contrato(s) activo(s)`);
                                }
                            }
                        }
                    }
                }
            }

            // If there are any linked items, return error
            if (errorsLinked.length > 0) {
                return res.status(400).json({
                    error: errorsLinked.join('. ')
                });
            }

            // Now proceed to delete items that are not linked
            for (const areaExistente of areasExistentes) {
                for (const deptoExistente of areaExistente.departamentos || []) {
                    for (const puestoExistente of deptoExistente.puestos || []) {
                        if (!puestosToKeep.has(puestoExistente.id)) {
                            await puestoExistente.destroy();
                        }
                    }

                    if (!deptosToKeep.has(deptoExistente.id)) {
                        // Check if departamento has any puestos still
                        const remainingPuestos = await Puesto.count({
                            where: { departamentoId: deptoExistente.id }
                        });

                        if (remainingPuestos === 0) {
                            await deptoExistente.destroy();
                        }
                    }
                }

                if (!areasToKeep.has(areaExistente.id)) {
                    // Check if area has any departamentos still
                    const remainingDeptos = await Departamento.count({
                        where: { areaId: areaExistente.id }
                    });

                    if (remainingDeptos === 0) {
                        await areaExistente.destroy();
                    }
                }
            }
        }

        const empresaActualizada = await Empresa.findByPk(id, {
            include: includeStructure
        });

        res.json(empresaActualizada);
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(e => e.message);
            return res.status(400).json({ error: messages.join(', ') });
        }
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }
        res.status(500).json({ error: error.message });
    }
};

// Check if an area, departamento, or puesto can be deleted (has no active contracts)
const checkCanDelete = async (req, res) => {
    try {
        const { type, id } = req.params; // type: 'area', 'departamento', 'puesto'
        const { ContratoPuesto, Contrato } = require('../models');

        let puestosToCheck = [];
        let contextName = '';

        if (type === 'puesto') {
            const puesto = await Puesto.findByPk(id);
            if (!puesto) {
                return res.json({ canDelete: true });
            }
            puestosToCheck = [puesto];
            contextName = `El puesto "${puesto.nombre}"`;
        } else if (type === 'departamento') {
            const depto = await Departamento.findByPk(id, {
                include: [{ model: Puesto, as: 'puestos' }]
            });
            if (!depto) {
                return res.json({ canDelete: true });
            }
            puestosToCheck = depto.puestos || [];
            contextName = `El departamento "${depto.nombre}"`;
        } else if (type === 'area') {
            const area = await Area.findByPk(id, {
                include: [{
                    model: Departamento,
                    as: 'departamentos',
                    include: [{ model: Puesto, as: 'puestos' }]
                }]
            });
            if (!area) {
                return res.json({ canDelete: true });
            }
            puestosToCheck = (area.departamentos || []).flatMap(d => d.puestos || []);
            contextName = `El área "${area.nombre}"`;
        } else {
            return res.status(400).json({ error: 'Tipo inválido' });
        }

        // Check each puesto for active contracts
        const linkedPuestos = [];
        for (const puesto of puestosToCheck) {
            const count = await ContratoPuesto.count({
                where: { puestoId: puesto.id },
                include: [{
                    model: Contrato,
                    as: 'contrato',
                    where: { activo: true }
                }]
            });
            if (count > 0) {
                linkedPuestos.push({ nombre: puesto.nombre, contratos: count });
            }
        }

        if (linkedPuestos.length > 0) {
            let message;
            if (type === 'puesto') {
                message = `${contextName} no puede eliminarse porque tiene ${linkedPuestos[0].contratos} contrato(s) activo(s)`;
            } else {
                const puestosStr = linkedPuestos.map(p => `"${p.nombre}" (${p.contratos} contrato(s))`).join(', ');
                message = `${contextName} no puede eliminarse porque contiene puestos con contratos activos: ${puestosStr}`;
            }
            return res.json({ canDelete: false, message });
        }

        res.json({ canDelete: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
    removeBulk,
    reactivate,
    checkCanDelete,
};

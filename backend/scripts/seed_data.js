const { sequelize, Empresa, Area, Departamento, Puesto, Empleado, Contrato, ConceptoSalarial, Novedad, DocumentacionPago, Liquidacion } = require('../src/models');

async function seedData(closeConnection = true) {
    try {
        // Only authenticate if not already connected (simple check)
        try {
            await sequelize.authenticate();
            console.log('Database connected for seeding.');
        } catch (e) {
            // If already connected, this might throw or just work.
            // If we are running from app, it's likely connected.
        }

        // 1. Check if data exists
        const count = await Empleado.count();
        if (count > 5) {
            console.log('Database already has data. Skipping seed.');
            return;
        }

        console.log('Seeding database...');

        // 2. Create Empresa
        const empresa = await Empresa.create({
            nombre: 'CataratasRH S.A.',
            email: 'contacto@cataratasrh.com',
            telefono: '1234567890',
            industria: 'Tecnología',
            direccion: 'Av. Principal 123',
            activo: true
        });

        // 3. Create Area
        const area = await Area.create({
            nombre: 'Casa Central',
            descripcion: 'Oficinas centrales',
            empresaId: empresa.id
        });

        // 4. Create Departamentos
        const deptos = await Departamento.bulkCreate([
            { nombre: 'Administración', descripcion: 'Gestión administrativa', areaId: area.id },
            { nombre: 'Operaciones', descripcion: 'Personal operativo', areaId: area.id },
            { nombre: 'Recursos Humanos', descripcion: 'Gestión de personal', areaId: area.id }
        ]);

        // 5. Create Puestos
        const puestos = await Puesto.bulkCreate([
            { nombre: 'Gerente', departamentoId: deptos[0].id },
            { nombre: 'Analista Contable', departamentoId: deptos[0].id },
            { nombre: 'Operario', departamentoId: deptos[1].id },
            { nombre: 'Supervisor', departamentoId: deptos[1].id },
            { nombre: 'Analista RRHH', departamentoId: deptos[2].id }
        ]);

        // 6. Create Conceptos Salariales
        await ConceptoSalarial.bulkCreate([
            { nombre: 'Sueldo Básico', tipo: 'remunerativo', valor: 0, formula: 'BASICO', activo: true },
            { nombre: 'Antigüedad', tipo: 'remunerativo', valor: 1, formula: 'ANTIGUEDAD', activo: true, esPorcentaje: true },
            { nombre: 'Presentismo', tipo: 'remunerativo', valor: 8.33, formula: 'PRESENTISMO', activo: true, esPorcentaje: true },
            { nombre: 'Jubilación', tipo: 'deduccion', valor: 11, formula: 'BRUTO', activo: true, esPorcentaje: true },
            { nombre: 'Obra Social', tipo: 'deduccion', valor: 3, formula: 'BRUTO', activo: true, esPorcentaje: true },
            { nombre: 'PAMI', tipo: 'deduccion', valor: 3, formula: 'BRUTO', activo: true, esPorcentaje: true },
            { nombre: 'Cuota Sindical', tipo: 'deduccion', valor: 2.5, formula: 'BRUTO', activo: true, esPorcentaje: true }
        ]);

        // 7. Create Empleados & Contratos
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();

        // Case A: Standard Employee (Full Month)
        const emp1 = await Empleado.create({
            nombre: 'Juan', apellido: 'Pérez', cuil: '20-12345678-9',
            fechaNacimiento: '1985-05-15', email: 'juan.perez@email.com',
            telefono: '123456789', direccion: 'Calle Falsa 123',
            tipoDocumento: 'cedula', numeroDocumento: '12345678',
            nacionalidad: 'Argentina', genero: 'masculino', estadoCivil: 'soltero',
            calle: 'Calle Falsa', numero: '123', provinciaId: '1',
            fechaIngreso: '2020-01-01', activo: true
        });
        await Contrato.create({
            empleadoId: emp1.id, puestoId: puestos[1].id,
            tipoContrato: 'indeterminado', fechaInicio: '2020-01-01',
            salario: 850000, activo: true
        });

        // Case B: Proportional Salary Test (Started 15th of current month)
        const midMonthDate = new Date(currentYear, currentMonth, 15);
        const emp2 = await Empleado.create({
            nombre: 'María', apellido: 'Gómez', cuil: '27-87654321-4',
            fechaNacimiento: '1992-08-20', email: 'maria.gomez@email.com',
            telefono: '987654321', direccion: 'Av. Siempre Viva 742',
            tipoDocumento: 'cedula', numeroDocumento: '87654321',
            nacionalidad: 'Argentina', genero: 'femenino', estadoCivil: 'casado',
            calle: 'Av. Siempre Viva', numero: '742', provinciaId: '1',
            fechaIngreso: midMonthDate, activo: true
        });
        await Contrato.create({
            empleadoId: emp2.id, puestoId: puestos[2].id,
            tipoContrato: 'indeterminado', fechaInicio: midMonthDate,
            salario: 600000, activo: true
        });

        // Case C: Monotributista (Should be excluded from generator)
        const emp3 = await Empleado.create({
            nombre: 'Carlos', apellido: 'López', cuil: '20-11223344-5',
            fechaNacimiento: '1980-03-10', email: 'carlos.lopez@email.com',
            telefono: '1122334455', direccion: 'Calle 3 456',
            tipoDocumento: 'cedula', numeroDocumento: '11223344',
            nacionalidad: 'Argentina', genero: 'masculino', estadoCivil: 'divorciado',
            calle: 'Calle 3', numero: '456', provinciaId: '1',
            fechaIngreso: '2023-01-01', activo: true
        });
        await Contrato.create({
            empleadoId: emp3.id, puestoId: puestos[3].id,
            tipoContrato: 'LOCACION', fechaInicio: '2023-01-01',
            salario: 500000, activo: true
        });

        // Case D: Another Standard Employee
        const emp4 = await Empleado.create({
            nombre: 'Ana', apellido: 'Martínez', cuil: '27-99887766-1',
            fechaNacimiento: '1995-11-30', email: 'ana.martinez@email.com',
            telefono: '5544332211', direccion: 'Calle 4 789',
            tipoDocumento: 'cedula', numeroDocumento: '99887766',
            nacionalidad: 'Argentina', genero: 'femenino', estadoCivil: 'soltero',
            calle: 'Calle 4', numero: '789', provinciaId: '1',
            fechaIngreso: '2021-06-01', activo: true
        });
        await Contrato.create({
            empleadoId: emp4.id, puestoId: puestos[4].id,
            tipoContrato: 'indeterminado', fechaInicio: '2021-06-01',
            salario: 750000, activo: true
        });

        // 8. Create Novedades
        await Novedad.create({
            empleadoId: emp1.id, tipo: 'LICENCIA',
            fecha: new Date(currentYear, currentMonth, 5),
            cantidad: 1, observaciones: 'Trámite personal'
        });
        await Novedad.create({
            empleadoId: emp4.id, tipo: 'VACACIONES',
            fecha: new Date(currentYear, currentMonth, 20),
            cantidad: 5, observaciones: 'Vacaciones de invierno'
        });

        console.log('Database seeded successfully!');

    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        if (closeConnection) {
            await sequelize.close();
        }
    }
}

if (require.main === module) {
    seedData(true);
}

module.exports = seedData;

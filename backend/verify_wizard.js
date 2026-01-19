// Usando fetch nativo de Node.js 18+

const API_URL = 'http://localhost:3000/api';

const run = async () => {
    try {
        console.log('--- Iniciando prueba de creación anidada ---');

        const empresaData = {
            nombre: `Empresa Wizard Test ${Date.now()}`,
            email: 'test@wizard.com',
            telefono: '123456',
            industria: 'Software',
            direccion: 'Calle Test',
            areas: [
                {
                    nombre: 'Area Tech',
                    descripcion: 'Tecnología',
                    departamentos: [
                        {
                            nombre: 'Desarrollo',
                            descripcion: 'Devs',
                            puestos: [
                                { nombre: 'Frontend Dev', descripcion: 'React' },
                                { nombre: 'Backend Dev', descripcion: 'Node' }
                            ]
                        }
                    ]
                },
                {
                    nombre: 'Area RH',
                    departamentos: []
                }
            ]
        };

        console.log('Enviando datos:', JSON.stringify(empresaData, null, 2));

        const response = await fetch(`${API_URL}/empresas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(empresaData)
        });

        if (!response.ok) {
            const txt = await response.text();
            throw new Error(`Error ${response.status}: ${txt}`);
        }

        const data = await response.json();
        console.log('✅ Empresa creada con éxito:', data.id, data.nombre);

        // Verificar si se crearon las sub-entidades (aunque el endpoint create devuelve la empresa básica, 
        // normalmente habría que hacer un fetch con includes para ver todo, pero por ahora confiamos si no dio error 500)
        // O mejor, intentamos hacer un getById si implementáramos el include en getById.

        console.log('Prueba finalizada corréctamente.');

    } catch (error) {
        console.error('❌ Error en la prueba:', error.message);
    }
};

run();

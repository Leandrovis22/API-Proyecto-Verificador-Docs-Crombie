const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prismaClient = new PrismaClient();

exports.register = async (req, res) => {
    const { nombre, dni, cuil, correo, password, telefono, fecha_nacimiento } = req.body;

    // Validaciones básicas
    if (!dni || !correo || !password) {
        return res.status(400).json({ error: 'DNI, correo y contraseña son requeridos' });
    }

    // Convertir DNI y teléfono a BigInt
    const dniBigInt = BigInt(dni);
    const telefonoBigInt = BigInt(telefono);

    try {
        // Buscar usuario existente
        const existingUser = await prismaClient.usuarios.findFirst({
            where: {
                OR: [{ dni: dniBigInt }, { correo }]
            }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'El DNI o el correo ya están registrados' });
        }

        // Hashear la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear nuevo usuario
        const newUser = await prismaClient.usuarios.create({
            data: {
                nombre,
                dni: dniBigInt,
                cuil,
                correo,
                password: hashedPassword,
                telefono: telefonoBigInt,
                fecha_nacimiento,
                dni_foto_delante: "",
                dni_foto_detras: "",
                textextract: ""
            }
        });

        // Crear el token JWT
        const token = jwt.sign(
            { id: newUser.id.toString(), dni: newUser.dni.toString() },
            process.env.JWT_SECRET,
            { expiresIn: '30m' }
        );

        res.status(201).json({ message: 'Registro exitoso', token });
    } catch (creationError) {
        console.error('Error al crear el usuario:', creationError);
        return res.status(500).json({ error: 'Error al crear el usuario' });
    }
};

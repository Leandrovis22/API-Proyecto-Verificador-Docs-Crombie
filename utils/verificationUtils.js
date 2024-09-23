// /Utils/verificationUtils.js

/**
 * Normaliza una cadena eliminando caracteres especiales y convirtiendo a minúsculas.
 * @param {string} cadena - La cadena a normalizar.
 * @returns {string} La cadena normalizada.
 */
function normalizarCadena(cadena) {
    return cadena.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '');
}

/**
 * Normaliza el DNI eliminando puntos.
 * @param {string} dni - El DNI a normalizar.
 * @returns {string} El DNI sin puntos.
 */
function normalizarDNI(dni) {
    return dni.replace(/\./g, '');
}

/**
 * Convierte una fecha en formato YYYY-MM-DD a (DD MMM YYYY).
 * @param {string} fecha - La fecha en formato YYYY-MM-DD.
 * @returns {string} La fecha en formato DD MMM YYYY.
 */
function convertirFecha(fecha) {
    const meses = [
        'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'
    ];
    const [ano, mes, dia] = fecha.split('-');
    return `${dia} ${meses[parseInt(mes, 10) - 1]} ${ano}`;
}

/**
 * Extrae todas las fechas de nacimiento posibles del texto extraído.
 * @param {string} texto - Texto del que se extraerán las fechas.
 * @returns {Array} Array de objetos con día, mes y año extraídos.
 */
function extraerFechasNacimiento(texto) {
    const fechas = [];
    const fechaRegex = /(\d{2})\s([A-Z]{3})\/\s([A-Z]{3})\s(\d{4})/g;
    let match;

    while ((match = fechaRegex.exec(texto)) !== null) {
        const [_, dia, mesEspañol, mesIngles, ano] = match;
        fechas.push({
            dia,
            mes: mesEspañol,
            ano
        });
    }

    return fechas;
}


/**
 * Convierte un mes abreviado en español a su número correspondiente.
 * @param {string} mes - Mes en formato abreviado (ENE, FEB, etc.).
 * @returns {number} El número del mes (1 para enero, 2 para febrero, etc.).
 */
function convertirMes(mes) {
    const meses = {
        'ENE': 1, 'FEB': 2, 'MAR': 3, 'ABR': 4, 'MAY': 5, 'JUN': 6,
        'JUL': 7, 'AGO': 8, 'SEP': 9, 'OCT': 10, 'NOV': 11, 'DIC': 12
    };
    return meses[mes.toUpperCase()] || null; // Devuelve null si el mes no es válido
}

function esMayorDeEdad(fechas) {
    if (fechas.length === 0) return false;

    const hoy = new Date();
    const { dia, mes, ano } = fechas[0]; // Primera fecha extraída

    // Convertir el mes de texto a un número
    const mesNumero = convertirMes(mes);
    if (!mesNumero) {
        console.error("Mes inválido:", mes);
        return false; // Retorna falso si el mes no es válido
    }

    // Crear un objeto de fecha con la primera fecha extraída
    const fechaNacimiento = new Date(`${ano}-${mesNumero}-${dia}`);

    // Si la fecha es inválida, detener
    if (isNaN(fechaNacimiento.getTime())) {
        console.error("Fecha de nacimiento inválida:", fechaNacimiento);
        return false;
    }

    // Calcular la edad
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mesActual = hoy.getMonth() + 1;
    const diaActual = hoy.getDate();

    if (mesActual < mesNumero || (mesActual === mesNumero && diaActual < dia)) {
        edad--;
    }

    //console.log("fechas: ", fechas, "hoy: ", hoy, "fechaNacimiento: ", fechaNacimiento, "edad: ", edad);

    return edad >= 18;
}


/**
 * Compara los datos extraídos con los datos proporcionados en el request.
 * @param {string} frente - Texto extraído del frente del documento.
 * @param {string} detras - Texto extraído del dorso del documento.
 * @param {object} requestData - Datos proporcionados en el request.
 * @param {string} requestData.nombre - Nombre proporcionado en el request.
 * @param {string} requestData.dni - DNI proporcionado en el request.
 * @param {string} requestData.cuil - CUIL proporcionado en el request.
 * @returns {object} Resultado de la verificación.
 */
async function verificarDatos(frente, detras, requestData) {
    const { nombre, apellido, dni, cuil } = requestData;

    // Normalizar el DNI proporcionado
    const dniNormalizado = normalizarDNI(dni);
    const dniFrenteNormalizado = normalizarDNI(frente);
    const dniDetrasNormalizado = normalizarDNI(detras);

    // Validar DNI
    const dniEsValido = /^\d{8}$/.test(dniNormalizado);

    const cuilEsValido = /^\d{2}-\d{8}-\d{1}$/.test(cuil);

    // Extraer todas las fechas de nacimiento posibles del texto extraído
    const fechasExtraidas = extraerFechasNacimiento(frente);

    // Verificar si la persona es mayor o igual a 18 años
    const edadValida = esMayorDeEdad(fechasExtraidas);

    // Normalizar el nombre proporcionado en request
    const nombreNormalizado = normalizarCadena(nombre);

    // Dividir el nombre proporcionado en partes
    const partesNombre = nombreNormalizado.split(/\s+/);
    const primerNombre = partesNombre[0] || '';
    const segundoNombre = partesNombre.length > 2 ? partesNombre[1] : ''; // Segundo nombre puede no estar presente
    const apellidoNormalizado = normalizarCadena(apellido);

    // Convertir el texto extraído a minúsculas para la comparación
    const frenteNormalizado = normalizarCadena(frente);

    // Verificar si cada parte del nombre está en el texto extraído
    const primerNombreCoincide = frenteNormalizado.includes(primerNombre);
    const segundoNombreCoincide = segundoNombre ? frenteNormalizado.includes(segundoNombre) : true;
    const apellidoCoincide = frenteNormalizado.includes(apellidoNormalizado);

    // Comparar DNI
    const dniCoincide = dniEsValido && dniFrenteNormalizado.includes(dniNormalizado) && dniDetrasNormalizado.includes(dniNormalizado);
    const cuilCoincide = cuilEsValido && detras.includes(cuil);

    // Evaluar si todos los campos son válidos
    const todosValidos = primerNombreCoincide && segundoNombreCoincide && apellidoCoincide &&
        dniEsValido && dniCoincide && cuilEsValido && cuilCoincide && edadValida;

    // Retorno detallado con los resultados de las verificaciones y el estado final
    return {
        primerNombre: {
            valido: primerNombreCoincide,
            razon: primerNombreCoincide ? null : 'El primer nombre no coincide.'
        },
        segundoNombre: {
            valido: segundoNombreCoincide,
            razon: segundoNombreCoincide ? null : 'El segundo nombre no coincide.'
        },
        apellido: {
            valido: apellidoCoincide,
            razon: apellidoCoincide ? null : 'El apellido no coincide.'
        },
        dniValido: {
            valido: dniEsValido,
            razon: dniEsValido ? null : 'El DNI proporcionado es inválido.'
        },
        dniCoincide: {
            valido: dniCoincide,
            razon: dniCoincide ? null : 'El DNI no coincide con el documento.'
        },
        cuilValido: {
            valido: cuilEsValido,
            razon: cuilEsValido ? null : 'El CUIL proporcionado es inválido.'
        },
        cuilCoincide: {
            valido: cuilCoincide,
            razon: cuilCoincide ? null : 'El CUIL no coincide con el documento.'
        },
        mayorDeEdad: {
            valido: edadValida,
            razon: edadValida ? null : 'La persona debe ser mayor de 18 años.'
        },
        valido: todosValidos // Campo que indica si todas las verificaciones fueron exitosas
    };
}

module.exports = { verificarDatos };

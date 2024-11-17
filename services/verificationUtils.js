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
 * Extrae todas las fechas de nacimiento posibles del texto extraído.
 * @param {string} texto - Texto del que se extraerán las fechas.
 * @returns {Array} Array de objetos con día, mes y año extraídos.
 */
function extraerFechasNacimiento(frente) {
        // Buscar la fecha que viene después de "Date of birth"
        const regex = /Date of birth[^\d]*(\d{2})\s+([A-Z]{3})[^\d]*(\d{4})/;
        const match = frente.match(regex);
        
        if (match) {
            const [, dia, mes, ano] = match;
            return {
                dia,
                mes,
                ano
            };
        }

        return null;
    }

/**
 * Convierte un mes abreviado en español a su número correspondiente.
 * @param {string} mes - Mes en formato abreviado (ENE, FEB, etc.).
 * @returns {number} El número del mes (1 para enero, 2 para febrero, etc.).
 */
function convertirMes(mes) {
    const meses = {
        'ENE': 1, 'FEB': 2, 'MAR': 3, 'ABR': 4, 'MAY': 5, 'JUN': 6,
        'JUL': 7, 'AGO': 8, 'SEP': 9, 'SET':9, 'OCT': 10, 'NOV': 11, 'DIC': 12
    };
    return meses[mes.toUpperCase()] || null;
}

function esMayorDeEdad(fecha) {
    if (!fecha || !fecha.dia || !fecha.mes || !fecha.ano) return false;

    const hoy = new Date();
    const { dia, mes, ano } = fecha;

    // Convertir el mes de texto a número
    const mesNumero = convertirMes(mes);
    if (!mesNumero) {
        console.error("Mes inválido:", mes);
        return false;
    }

    // Crear un objeto de fecha con la fecha obtenida
    const fechaNacimiento = new Date(`${ano}-${mesNumero}-${dia}`);

    // Si la fecha es inválida, detener
    if (isNaN(fechaNacimiento.getTime())) {
        console.error("Fecha de nacimiento inválida:", fechaNacimiento);
        return false;
    }

    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mesActual = hoy.getMonth() + 1;
    const diaActual = hoy.getDate();

    if (mesActual < mesNumero || (mesActual === mesNumero && diaActual < dia)) {
        edad--;
    }

    return edad >= 18;
}

/**
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

    const dniNormalizado = normalizarDNI(dni);

    const dniFrenteNormalizado = normalizarDNI(frente);
    const dniDetrasNormalizado = normalizarDNI(detras);

    // Extraer todas las fechas de nacimiento posibles del texto extraído
    const fechasExtraidas = extraerFechasNacimiento(frente);

    // Verificar si la persona es mayor o igual a 18 años
    const edadValida = esMayorDeEdad(fechasExtraidas);

    // Normalizar el nombre del request
    const nombreNormalizado = normalizarCadena(nombre);

    // Dividir el nombre en partes
    const partesNombre = nombreNormalizado.split(/\s+/);
    const primerNombre = partesNombre[0] || '';
    const segundoNombre = partesNombre.length > 2 ? partesNombre[1] : ''; // Segundo nombre puede no estar presente
    const apellidoNormalizado = normalizarCadena(apellido);

    // Convertir el texto extraído a minúsculas para la comparación
    const frenteNormalizado = normalizarCadena(frente);

    const dniEsValido = /^\d{8}$/.test(dniNormalizado);
    const cuilEsValido = /^\d{2}-\d{8}-\d{1}$/.test(cuil);

    // Verificar si cada parte del nombre está en el texto extraído
    const primerNombreCoincide = frenteNormalizado.includes(primerNombre);
    const segundoNombreCoincide = segundoNombre ? frenteNormalizado.includes(segundoNombre) : true;
    const apellidoCoincide = frenteNormalizado.includes(apellidoNormalizado);

    // Comparar DNI
    const dniCoincide = dniEsValido && dniFrenteNormalizado.includes(dniNormalizado) && dniDetrasNormalizado.includes(dniNormalizado);
    const cuilCoincide = cuilEsValido && detras.includes(cuil);

    const todosValidos = primerNombreCoincide && segundoNombreCoincide && apellidoCoincide &&
        dniEsValido && dniCoincide && cuilEsValido && cuilCoincide && edadValida;

    // Retorno con los resultados
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
        valido: todosValidos
    };
}

module.exports = { verificarDatos };

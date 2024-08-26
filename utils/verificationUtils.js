//verificationUtils.js

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
 * Compara los datos extraídos con los datos proporcionados en el request.
 * @param {string} frente - Texto extraído del frente del documento.
 * @param {string} detras - Texto extraído del dorso del documento.
 * @param {object} requestData - Datos proporcionados en el request.
 * @param {string} requestData.nombre - Nombre proporcionado en el request.
 * @param {string} requestData.dni - DNI proporcionado en el request.
 * @param {string} requestData.cuil - CUIL proporcionado en el request.
 * @param {string} requestData.fecha_nacimiento - Fecha de nacimiento proporcionada en el request.
 * @returns {object} Resultado de la verificación.
 */
async function verificarDatos(frente, detras, requestData) {
    const { nombre, dni, cuil, fecha_nacimiento } = requestData;

    // Normalizar el DNI proporcionado
    const dniNormalizado = normalizarDNI(dni);
    const dniFrenteNormalizado = normalizarDNI(frente);
    const dniDetrasNormalizado = normalizarDNI(detras);

    // Validar DNI
    const dniEsValido = /^\d{8}$/.test(dniNormalizado);
    
    const cuilEsValido = /^\d{2}-\d{8}-\d{1}$/.test(cuil);

    // Convertir fecha de nacimiento al formato del texto extraído
    const fechaNacimientoFormato = convertirFecha(fecha_nacimiento);

    // Extraer todas las fechas de nacimiento posibles del texto extraído
    const fechasExtraidas = extraerFechasNacimiento(frente);

    // Encontrar la fecha extraída que coincida con la proporcionada
    const fechaNacimientoCoincide = fechasExtraidas.some(
        fecha => fecha.dia === fechaNacimientoFormato.split(' ')[0] &&
                 fecha.mes === fechaNacimientoFormato.split(' ')[1] &&
                 fecha.ano === fechaNacimientoFormato.split(' ')[2]
    );

    // Normalizar el nombre proporcionado en request
    const nombreNormalizado = normalizarCadena(nombre);

    // Dividir el nombre proporcionado en partes
    const partesNombre = nombreNormalizado.split(/\s+/);
    const primerNombre = partesNombre[0] || '';
    const segundoNombre = partesNombre.length > 2 ? partesNombre[1] : ''; // Segundo nombre puede no estar presente
    const apellido = partesNombre.slice(-1).join(' '); // El último componente es el apellido

    // Convertir el texto extraído a minúsculas para la comparación
    const frenteNormalizado = normalizarCadena(frente);

    // Verificar si cada parte del nombre está en el texto extraído
    const primerNombreCoincide = frenteNormalizado.includes(primerNombre);
    const segundoNombreCoincide = segundoNombre ? frenteNormalizado.includes(segundoNombre) : true;
    const apellidoCoincide = frenteNormalizado.includes(apellido);

    //console.log(partesNombre, primerNombre, segundoNombre, apellido);
    //console.log(primerNombreCoincide, segundoNombreCoincide, apellidoCoincide);

    // Comparar DNI
    const dniCoincide = dniEsValido && dniFrenteNormalizado.includes(dniNormalizado) && dniDetrasNormalizado.includes(dniNormalizado);
    const cuilCoincide = cuilEsValido && detras.includes(cuil);

    // Identificar qué comparación falló
    let errores = [];
    if (!primerNombreCoincide) errores.push('primer nombre');
    if (!segundoNombreCoincide && segundoNombre) errores.push('segundo nombre');
    if (!apellidoCoincide) errores.push('apellido');
    if (!dniEsValido) errores.push('DNI inválido');
    if (!dniCoincide) errores.push('DNI');
    if (!cuilEsValido) errores.push('CUIL inválido');
    if (!cuilCoincide) errores.push('CUIL');
    if (!fechaNacimientoCoincide) errores.push('fecha de nacimiento');

    if (errores.length === 0) {
        return { success: true };
    } else {
        const mensajesError = {
            'primer nombre': 'El primer nombre no coincide.',
            'segundo nombre': 'El segundo nombre no coincide.',
            'apellido': 'El apellido no coincide.',
            'DNI inválido': 'El DNI proporcionado es inválido.',
            'DNI': 'El DNI no coincide con el documento.',
            'CUIL inválido': 'El CUIL proporcionado es inválido.',
            'CUIL': 'El CUIL no coincide con el documento.',
            'fecha de nacimiento': 'La fecha de nacimiento no coincide con el documento.',
        };
    
        const mensajes = errores.map(error => mensajesError[error]);
    
        return { 
            success: false, 
            error: `Hubo problemas con los siguientes datos: ${mensajes.join(' ')}` 
        };
    }
    
}

module.exports = {
    verificarDatos
};
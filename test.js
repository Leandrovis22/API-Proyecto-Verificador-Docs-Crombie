const { verificarDatos } = require('./utils/verificationUtils');

// Datos de prueba
const requestData = {
    nombre: "Leandro Ezequiel Viscolungo",
    dni: "42612132",
    cuil: "20-42612132-9",
    fecha_nacimiento: "2000-08-19",
};

const textextract = {
    frente: "REPUBLICA ARGENTINA - MERCOSUR REGISTRO NACIONAL DE LAS PERSONAS MINISTERIO DEL INTERIOR Y TRANSPORTE Apellido / Surname VISCOLUNGO Nombre / Name LEANDRO EZEQUIEL Sexo / Sex Nacionalidad / Nationality Ejemplar M ARGENTINA A Fecha de nacimiento / Date of birth 19 AGO/ AUG 1998 Fecharde emision / Date of issue 29 OCT OCT 2014 FIRMA IDENTIFICADO/ SIGNATURE # 2 A encimiento / Date of expiry 29 OC I OCT 2029 Documento / Document Transfer / Of ident 00313399545 42.612.132 7069 REPUBLICA ARGENTINA - MERCOSUR REGISTRO NACIONAL DE LAS PERSONAS MINISTERIO DEL INTERIOR Y TRANSPORTE Apellido / Surname VISCOLUNGO Nombre / Name LEANDRO EZEQUIEL Sexo / Sex Nacionalidad / Nationality Ejemplar M ARGENTINA A Fecha de nacimiento / Date of birth 19 AGO/ AUG 2000 Fecharde emision / Date of issue 29 OCT OCT 2014 FIRMA IDENTIFICADO/ SIGNATURE # 2 A encimiento / Date of expiry 29 OC I OCT 2029 Documento / Document Transfer / Of ident 00313399545 42.612.132 7069",
    detras: "DOMICILIO: LARREA 6350 - SANTA FE - LA CAPITAL - SANTA FE LUGAR DE NACIMENTO SANTA FE the Cr. A. Florencio Randazzo CUIL 20-42612132-9 Ministro del interior y Transporte PULGAR IDARG42612132<1<<<<<<<<<<<<<<< 0008198M2910297ARG<<<<<<<<<<<6 VISCOLUNGO<<LEANDRO<EZEQUIEL<< DOMICILIO: LARREA 6350 - SANTA FE - LA CAPITAL - SANTA FE LUGAR DE NACIMENTO SANTA FE the Cr. A. Florencio Randazzo CUIL 20-42612132-9 Ministro del interior y Transporte PULGAR IDARG42612132<1<<<<<<<<<<<<<<< 0008198M2910297ARG<<<<<<<<<<<6 VISCOLUNGO<<LEANDRO<EZEQUIEL<<"
};

// Ejecutar la verificación
verificarDatos(textextract.frente, textextract.detras, requestData)
    .then(resultado => {
        console.log('Resultado de la verificación:', resultado);
    })
    .catch(error => {
        console.error('Error durante la verificación:', error);
    });
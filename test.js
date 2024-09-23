const { verificarDatos } = require('./utils/verificationUtils');

// Datos de prueba
const datos = {
    "detras": "DOMICILIO: PJE GALISTEO 2951 B° ROMA - SANTA FE - LA CAPITAL . SANTA FE LUGAR DE NAQIMENTO SANTA FE Rose F Frigerio 19 Ministro del heart 0 Pub. y Vivienda CUIL: 20-45343674-9 PULGAR IDARG45343674<0<<<<<<<<<<<<<<< 0310170M3310104ARG<<<<<<<<<<<8 PERREN<<ALEJANDRO<TOMAS<<<<<<<",
   
    "frente": "REPUBLICA ARGENTINA - MERCOSUR REGISTRO NACIONAL DE LAS PERSONAS MINISTERIO DEL INTERIOR, OBRAS PUBLICAS Y VIVIENDA Apellido / Surname PERREN Nombre / Name ALEJANDRO TOMÁS Sexo / Sex Nacionalidad / Nationality Ejemplar M ARGENTINA A Fecha de nacimiento / Date of birth 17 OCT/ OCT 2003 Fecha de emisión / Date of issue R 10 OCT/ OCT 2018 I FIRMA IDENTIFICADO/ SIGNATURE Fecha de vencimiento / Date of expiry 10 OCT/ OCT 2033 Documento / Document Trámite N° / Of. ident 00567344649 45.343.674 8289"
};

// Datos del request
const requestData = {
    "nombre": "Alejandro Tomás",
    "apellido": "Perren",
    "dni": "45343674",
    "cuil": "20-45343674-9"
};

// Ejecutar la verificación
verificarDatos(datos.frente, datos.detras, requestData)
    .then(resultado => {
        console.log('Resultados de la verificación:', resultado);
    })
    .catch(error => {
        console.error('Error en la verificación:', error);
    });

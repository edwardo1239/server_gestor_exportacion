const fs = require('fs');
const path = require('path');
const { ProcessError } = require('../../Error/ProcessError');

const inspeccion_calidad_path = path.join(__dirname, '..', '..', 'constants', 'inspeccionCalidad.json');
const clasificacion_descarte_path = path.join(__dirname, '..', '..', 'constants', 'clasificacion_descarte.json');
const observaciones_calidad_path = path.join(__dirname, '..', '..', 'constants', 'observacionesCalidad.json');
const tipo_fruta_path = path.join(__dirname, '..', '..', 'constants', 'tipo_fruta.json');
const paises_GGN_path = path.join(__dirname, '..', '..', 'constants', 'paisesEXP.json');

class ConstantesDelSistema {
    static async get_info_formulario_inspeccion_fruta() {
        try {

            const inspeccionCalidadJSON = fs.readFileSync(inspeccion_calidad_path);
            const inspeccionCalidad = JSON.parse(inspeccionCalidadJSON);

            return inspeccionCalidad;

        } catch (err) {
            throw new ProcessError(410, `Error Obteniendo datos de inspeccionCalidadJSON ${err.name}`)
        }
    }
    static async get_constantes_sistema_clasificacion_descarte() {
        try {

            const dataJSON = fs.readFileSync(clasificacion_descarte_path);
            const data = JSON.parse(dataJSON);

            return data;

        } catch (err) {
            throw new ProcessError(410, `Error Obteniendo datos de inspeccionCalidadJSON ${err.name}`)
        }
    }
    static async get_constantes_sistema_observaciones_calidad() {
        try {
            const dataJSON = fs.readFileSync(observaciones_calidad_path);
            const data = JSON.parse(dataJSON);

            return data;

        } catch (err) {
            throw new ProcessError(410, `Error Obteniendo datos de inspeccionCalidadJSON ${err.name}`)
        }
    }
    static async get_constantes_sistema_tipo_frutas() {
        try {
            const dataJSON = fs.readFileSync(tipo_fruta_path);
            const data = JSON.parse(dataJSON);

            return data;

        } catch (err) {
            throw new ProcessError(540, `Error Obteniendo datos de inspeccionCalidadJSON ${err.name}`)
        }
    }
    static async get_constantes_sistema_paises_GGN() {
        try {
            const dataJSON = fs.readFileSync(paises_GGN_path);
            const data = JSON.parse(dataJSON);

            return data;

        } catch (err) {
            throw new ProcessError(540, `Error Obteniendo datos de inspeccionCalidadJSON ${err.name}`)
        }
    }
}

module.exports = {
    ConstantesDelSistema
}
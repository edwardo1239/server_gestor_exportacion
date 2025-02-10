const mongoose = require("mongoose");
const { Schema } = mongoose;

const defineInsumos = async (conn) => {

    const InsumosSchema = new Schema({
        codigo: { type: String, require: true, unique: true },
        insumo: String,
        medida: String,
        alias: { type: String, require: true, unique: true },
        tipo: String,
        fecha: { type: Date, default: Date.now }
    }, { timestamps: true });


    const Insumos = conn.model("insumo", InsumosSchema);
    return Insumos;
}


module.exports.defineInsumos = defineInsumos;

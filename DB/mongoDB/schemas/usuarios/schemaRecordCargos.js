const mongoose = require("mongoose");
const { Schema } = mongoose;

const defineRecordcargo = async (conn) => {

    const HistorialCargoSchema = new Schema({
        operacionRealizada: String,
        user: String,
        documento: Object,
        fecha: { type: Date, default: Date.now },
        createdAt: { type: Date, expires: '2y', default: Date.now }
    }, { timestamps: true });


    const recordCargo = conn.model("recordCargo", HistorialCargoSchema);
    return recordCargo
}


module.exports.defineRecordcargo = defineRecordcargo;


const mongoose = require("mongoose");
const { Schema } = mongoose;

const defineRecordClientes = async (conn) => {


    const HistorialClientesSchema = new Schema({
        operacionRealizada: String,
        user: String,
        documento: Object,
        createdAt: { type: Date, expires: '2y', default: Date.now }
    }, { timestamps: true });


    const recordClientes = conn.model("recordClientes", HistorialClientesSchema);
    return recordClientes

}

module.exports.defineRecordClientes = defineRecordClientes;

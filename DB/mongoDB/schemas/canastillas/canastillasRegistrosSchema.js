
const mongoose = require("mongoose");
const { Schema } = mongoose;


const defineRegistroCanastillas = async (conn) => {

    const cantidadSchema = new Schema({
        propias: { type: Number, default: 0 },
        prestadas: [
            {
                cantidad: Number,
                propietario: String
            }
        ]
    }, { _id: false })

    const canastillasRegistrosSchema = new Schema({
        fecha: { type: Date },
        createdAt: { type: Date, default: () => new Date() },
        destino: String,
        origen: String,
        cantidad: cantidadSchema,
        observaciones: String,
        usuario: {
            id: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
            user: { type: String, required: true },
        },
        referencia: String,
        tipoMovimiento: String,
        estado: String,
    })

    const Precios = conn.model("canastilla", canastillasRegistrosSchema);
    return Precios;
}

module.exports.defineRegistroCanastillas = defineRegistroCanastillas

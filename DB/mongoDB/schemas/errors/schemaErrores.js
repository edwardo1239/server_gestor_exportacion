import mongoose from "mongoose";
const { Schema } = mongoose;

export const defineErrores = async (conn) => {

    const erroresSchema = new Schema({
        usuario: { type: Schema.Types.ObjectId, ref: "Usuarios" },
        message: String,
        name: String,
        stack: String,
        code: Number,
        action: String,
        createdAt: { type: Date, expires: '1y', default: Date.now }
    });

    const Errores = conn.model("errore", erroresSchema);
    return Errores

}


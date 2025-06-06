import mongoose from "mongoose";
const { Schema } = mongoose;


export const defineClientes = async (conn) => {

  const ClienteSchema = new Schema({
    CLIENTE: String,
    PAIS_DESTINO: [String],
    CODIGO: { type: Number, required: true, unique: true },
    CORREO: String,
    DIRECCIÓN: String,
    ID: String,
    TELEFONO: String,
    activo: Boolean
  });

  const Clientes = conn.model("Cliente", ClienteSchema);
  return Clientes

}

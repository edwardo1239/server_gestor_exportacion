const { obtenerEstadoDesdeAccionCanastillasInventario } = require("../api/utils/diccionarios");
const { RecordLotesRepository } = require("../archive/ArchiveLotes");
const { RecordModificacionesRepository } = require("../archive/ArchivoModificaciones");
const { ClientesRepository } = require("../Class/Clientes");
const { LotesRepository } = require("../Class/Lotes");
const { PreciosRepository } = require("../Class/Precios");
const { ProveedoresRepository } = require("../Class/Proveedores");
const { VariablesDelSistema } = require("../Class/VariablesDelSistema");

class InventariosService {

    static async obtenerPrecioProveedor(predioId, tipoFruta) {
        const proveedor = await ProveedoresRepository.get_proveedores({
            ids: [predioId],
            select: { precio: 1, PREDIO: 1, GGN: 1 }
        });

        if (!proveedor || proveedor.length === 0) {
            throw new Error("Proveedor no encontrado");
        }

        const idPrecio = proveedor[0].precio[tipoFruta];
        if (!idPrecio) {
            throw new Error(`No hay precio para la fruta ${tipoFruta}`);
        }

        const precio = await PreciosRepository.get_precios({ ids: [idPrecio] });
        if (!precio || precio.length === 0) {
            throw new Error("Precio inválido");
        }

        return { precioId: precio[0]._id, proveedor: proveedor };

    }
    static async construirQueryIngresoLote(datos, enf, precioId) {
        const fecha = new Date(datos.fecha_estimada_llegada);

        return {
            ...datos,
            precio: precioId,
            enf,
            fecha_salida_patio: fecha,
            fecha_ingreso_patio: fecha,
            fecha_ingreso_inventario: fecha,
        };
    }
    static async incrementarEF(ef) {
        if (ef.startsWith("EF1")) return VariablesDelSistema.incrementarEF1();
        if (ef.startsWith("EF8")) return VariablesDelSistema.incrementarEF8();
        throw new Error(`Código EF no válido para incrementar: ${ef}`);
    }
    static async crearRegistroInventarioCanastillas(
        {
            origen = '',
            destino = '',
            accion = '',
            canastillas = 0,
            canastillasPrestadas = 0,
            remitente = "",
            destinatario = "",
            user,
            fecha = '',
            observaciones = '',
            duenio = ''
        }
    ) {
        const estado = obtenerEstadoDesdeAccionCanastillasInventario(accion)
        return {
            fecha: new Date(fecha),
            destino: destino,
            origen: origen,
            cantidad: {
                propias: canastillas,
                // Se deja como array porque en el futuro se manejarán varios propietarios
                prestadas: [
                    {
                        cantidad: canastillasPrestadas,
                        propietario: duenio
                    }
                ]
            },
            observaciones: observaciones,
            referencia: "C1",
            tipoMovimiento: accion,
            estado: estado,
            usuario: {
                id: user._id,
                user: user.user
            },
            remitente: remitente,
            destinatario: destinatario
        }
    }
    static async ajustarCanastillasProveedorCliente(_id, cantidad) {
        if (!_id || cantidad === 0) return;

        const proveedores = await ProveedoresRepository.get_proveedores({
            ids: [_id],
            select: { canastillas: 1 }
        });

        const clientes = await ClientesRepository.get_clientesNacionales({
            ids: [_id],
            select: { canastillas: 1 }
        })

        if (proveedores.length > 0) {
            const proveedor = proveedores[0];
            const cantidadActual = Number(proveedor.canastillas ?? 0);
            const newCanastillas = cantidadActual + cantidad;
            await ProveedoresRepository.modificar_proveedores(
                { _id: proveedor._id },
                { $set: { canastillas: newCanastillas } }
            );
        } else if (clientes.length > 0) {
            const cliente = clientes[0];
            const cantidadActual = Number(cliente.canastillas ?? 0);
            const newCanastillas = cantidadActual + cantidad;
            await ClientesRepository.actualizar_clienteNacional(
                { _id: cliente._id },
                { canastillas: newCanastillas }
            );
        }
    }
    static async encontrarDestinoOrigenRegistroCanastillas(registros) {
        const destinosArr = registros.map(registro => registro.destino);
        const origenesArr = registros.map(registro => registro.origen);

        const ids = [...new Set([...destinosArr, ...origenesArr])];

        const proveedores = await ProveedoresRepository.get_proveedores({
            ids: ids
        })
        const clientes = await ClientesRepository.get_clientesNacionales({
            ids: ids
        })

        const proveedorMap = new Map(proveedores.map(p => [p._id.toString(), p]));
        const clienteMap = new Map(clientes.map(c => [c._id.toString(), c]));

        const newRegistros = []

        for (let i = 0; i < registros.length; i++) {
            const registro = registros[i].toObject()

            const proveedorOrigen = proveedorMap.get(registro.origen);
            const clienteOrigen = clienteMap.get(registro.origen);

            const proveedorDestino = proveedorMap.get(registro.destino);
            const clienteDestino = clienteMap.get(registro.destino);

            const newOrigen = proveedorOrigen?.PREDIO || clienteOrigen?.cliente || registro.origen;
            const newDestino = proveedorDestino?.PREDIO || clienteDestino?.cliente || registro.destino;

            newRegistros.push({
                ...registro,
                origen: newOrigen,
                destino: newDestino
            })
        }
        return newRegistros
    }
    static async calcularDescartesReprocesoPredio(descarteLavado, descarteEncerado) {
        const kilosDescarteLavado =
            descarteLavado === undefined ? 0 :
                Object.values(descarteLavado).reduce((acu, item) => acu -= item, 0)
        const kilosDescarteEncerado =
            descarteEncerado === undefined ? 0 :
                Object.values(descarteEncerado).reduce((acu, item) => acu -= item, 0)

        return kilosDescarteLavado + kilosDescarteEncerado;
    }
    static async modificarInventariosDescarteReprocesoPredio(_id, descarteLavado, descarteEncerado) {
        if (descarteLavado)
            await VariablesDelSistema.modificar_inventario_descarte(_id, descarteLavado, 'descarteLavado');
        if (descarteEncerado)
            await VariablesDelSistema.modificar_inventario_descarte(_id, descarteEncerado, 'descarteEncerado');
    }
    static async validarGGN(proveedor, tipoFruta, user) {
        if (!(proveedor && proveedor[0].GGN && proveedor[0].GGN.fechaVencimiento)) { throw new Error("El predio no tiene GGN") }

        const fechaVencimiento = new Date(proveedor[0].GGN.fechaVencimiento);
        const hoy = new Date();

        // Calcular la fecha de un mes después de hoy (ojo, JS hace la magia con los días)
        const unMesDespues = new Date(hoy);
        unMesDespues.setMonth(unMesDespues.getMonth() + 1);

        // Si la fecha está entre hoy y dentro de un mes, es "cercana"
        if (fechaVencimiento > hoy && fechaVencimiento <= unMesDespues) {
            if (user.Rol > 2) {
                throw new Error("La fecha de vencimiento está cercana.");
            }
        } else if (fechaVencimiento < hoy) {
            throw new Error("El GGN del proveedor ya expiró.");
        }


        if (
            proveedor[0].GGN.code &&
            proveedor[0].GGN.tipo_fruta.includes(tipoFruta)
        ) return true



        //poner filtro de la fecha
        throw new Error("El proveedor no tiene GGN para ese tipo de fruta")
    }
    static async modificarLote_regresoHistorialFrutaProcesada(_id, queryLote, user, action, kilosVaciados) {

        const lote = await LotesRepository.getLotes({ ids: [_id], select: { desverdizado: 1, kilosVaciados: 1 } })

        const newLote = await LotesRepository.modificar_lote_proceso(
            _id,
            queryLote,
            "Regreso de fruta procesada",
            user.user
        )

        await RecordModificacionesRepository.post_record_contenedor_modification(
            action,
            user,
            {
                modelo: "Lote",
                documentoId: lote[0]._id,
                descripcion: `Kilos procesados ${lote[0].kilosVaciados} se le restaron ${kilosVaciados}`,
            },
            lote,
            newLote,
            { _id, action, kilosVaciados }
        );

        return lote
    }
    static async modificarInventario_regresoHistorialFrutaProcesada(lote, inventario, action, user) {
        let inventarioOld
        let newInventario
        //modificar inventario
        if (lote[0].desverdizado) {
            inventarioOld = await VariablesDelSistema.getInventarioDesverdizado()
            await VariablesDelSistema.modificarInventario_desverdizado(lote[0]._id, -inventario)
            newInventario = await VariablesDelSistema.getInventarioDesverdizado()

        } else {
            inventarioOld = await VariablesDelSistema.getInventario()
            await VariablesDelSistema.modificarInventario(lote[0]._id, -inventario);
            newInventario = await VariablesDelSistema.getInventario()

        }
        await RecordModificacionesRepository.post_record_contenedor_modification(
            action,
            user,
            {
                modelo: "Inventario",
                descripcion: `Inventario modificado`,
            },
            inventarioOld,
            newInventario,
            { inventario }
        );

    }
    static async modificarLote_regresoHistorialFrutaIngreso(_id, queryLote, user, action) {

        const lote = await LotesRepository.getLotes({ ids: [_id] })

        const newLote = await LotesRepository.modificar_lote_proceso(
            _id,
            queryLote,
            "Modificacion ingreso fruta",
            user.user
        )

        await RecordModificacionesRepository.post_record_contenedor_modification(
            action,
            user,
            {
                modelo: "Lote",
                documentoId: lote[0]._id,
                descripcion: `Modificacion de ingreso de lote`,
            },
            lote,
            newLote,
            { _id, action, queryLote }
        );

        return lote
    }
    static async modificarRecordLote_regresoHistorialFrutaIngreso(_id, __v, data) {
        const query = {}
        Object.keys(data).forEach(item => {
            query[`documento.${item}`] = data[item]
        })
        query[`documento.fecha_ingreso_patio`] = data.fecha_ingreso_inventario
        query[`documento.fecha_salida_patio`] = data.fecha_ingreso_inventario
        query[`documento.fecha_estimada_llegada`] = data.fecha_ingreso_inventario

        await RecordLotesRepository.modificarRecord(
            _id,
            query,
            __v
        )
    }
    /**
         * Procesa los datos del formulario de inventario de descarte, separando y transformando
         * los campos en objetos estructurados para descarte de lavado y encerado.
         * @param {Object} data - Datos del formulario
         * @param {string} data.tipoFruta - Tipo de fruta (ignorado en el procesamiento)
         * @param {Object.<string, string>} data - Pares clave-valor donde las claves tienen formato 'tipo:subtipo'
         * @returns {Object} Objeto con los descartes procesados
         * @returns {Object.<string, number>} return.descarteLavado - Objeto con los valores de descarte de lavado
         * @returns {Object.<string, number>} return.descarteEncerado - Objeto con los valores de descarte de encerado
         * @returns {number} return.total - Suma total de todos los valores de descarte
         * @example
         * // Entrada
         * {
         *   tipoFruta: 'Naranja',
         *   'descarteLavado:descarteGeneral': '10',
         *   'descarteLavado:pareja': '5',
         *   'descarteEncerado:descarteGeneral': '8'
         * }
         * // Salida
         * {
         *   descarteLavado: { descarteGeneral: 10, pareja: 5 },
         *   descarteEncerado: { descarteGeneral: 8 },
         *   total: 23
         * }
         */
    static async procesar_formulario_inventario_descarte(data) {
        const descarteLavado = {};
        const descarteEncerado = {};
        let totalDescarte = 0;

        Object.entries(data).forEach(([key, value]) => {
            if (key === 'tipoFruta') return;
            const [tipo, subtipo] = key.split(':');
            const valorNumerico = value === '' ? 0 : parseInt(value);

            if (tipo === 'descarteLavado') {
                descarteLavado[subtipo] = valorNumerico;
                totalDescarte += valorNumerico;
            } else if (tipo === 'descarteEncerado') {
                descarteEncerado[subtipo] = valorNumerico;
                totalDescarte += valorNumerico;
            }
        });

        return {
            descarteLavado,
            descarteEncerado,
            total: totalDescarte
        };
    }    
    /**
     * Crea un nuevo lote de reproceso para Celifrut con un código autogenerado.
     * Este método se utiliza para registrar lotes de fruta que serán reprocesados,
     * generando automáticamente un código ENF y registrando el lote como vaciado.
     * 
     * @param {string} tipoFruta - Tipo de fruta ('Naranja' o 'Limon')
     * @param {number} kilos - Cantidad de kilos de fruta del lote
     * @param {Object} user - Usuario que realiza la operación
     * @param {string} user._id - ID del usuario
     * @param {string} user.user - Nombre del usuario
     * 
     * @returns {Promise<Object>} El lote creado con todos sus datos
     * @throws {Error} Si hay problemas al generar el código o crear el lote
     * 
     * @example
     * const lote = await InventariosService.crear_lote_celifrut('Naranja', 1000, {
     *   _id: '123',
     *   user: 'Juan'
     * });
     */
    static async crear_lote_celifrut(tipoFruta, kilos, user) {

        const codigo = await VariablesDelSistema.generar_codigo_celifrut()

        const lote = {
            enf: codigo,
            predio: '65c27f3870dd4b7f03ed9857',
            canastillas: '0',
            kilos: kilos,
            placa: 'AAA000',
            tipoFruta: tipoFruta,
            observaciones: 'Reproceso',
            promedio: Number(kilos) / (tipoFruta === 'Naranja' ? 19 : 20),
            "fecha_estimada_llegada": new Date(),
            "fecha_ingreso_patio": new Date(),
            "fecha_salida_patio": new Date(),
            "fecha_ingreso_inventario": new Date(),
        }

        const newLote = await LotesRepository.addLote(lote, user);

        const query = {
            $inc: {
                kilosVaciados: newLote.kilos,
                __v: 1,
            },
            fechaProceso: new Date()
        }

        await LotesRepository.modificar_lote(newLote._id.toString(), query, "vaciarLote", user, newLote.__v);
        await VariablesDelSistema.incrementar_codigo_celifrut();
        return newLote
    }
}

module.exports.InventariosService = InventariosService
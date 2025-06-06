import { ProcessError } from "../../Error/ProcessError.js";
import { ContenedoresRepository } from "../Class/Contenedores.js";
import { LotesRepository } from "../Class/Lotes.js";
import { filtroFechaInicioFin } from "./utils/filtros.js";


export class ViewsRepository {
    static async view_lotes(req) {
        try {
            const { data } = req

            const {
                tipoFruta,
                predio,
                enf,
                fechaInicio,
                fechaFin,
                rendimientoMin,
                rendimientoMax,
                limit,
                todosLosDatos,
                busqueda,
                umbralMin,
                umbralMax,
                criterio,
                ordenarPor
            } = data;
            let query = {}
            let sort
            if (ordenarPor === 'fecha_creacion') {
                sort = { [`${ordenarPor}`]: -1, fechaIngreso: -1 };
            } else {
                sort = { [`${ordenarPor}`]: -1 };
            }

            if (tipoFruta) query.tipoFruta = tipoFruta;
            if (predio) query.predio = predio;
            if (enf) query.enf = enf;
            else query.enf = { $regex: '^E', $options: 'i' }

            query = filtroFechaInicioFin(fechaInicio, fechaFin, query, ordenarPor)

            if (rendimientoMin || rendimientoMax) {
                query.rendimiento = {}
                if (rendimientoMin) {
                    query.rendimiento.$gte = Number(rendimientoMin)
                } else {
                    query.rendimiento.$gte = -50
                }
                if (rendimientoMax) {
                    query.rendimiento.$lt = Number(rendimientoMax)
                } else {
                    query.rendimiento.$lt = 150
                }
            }
            let cantidad = 50
            if (limit) cantidad = limit

            //busqueda calidad
            if (criterio) {
                sort = {}
                sort[`calidad.calidadInterna.${criterio}`] = -1
            }
            if (criterio && (umbralMin || umbralMax)) {
                query[`calidad.calidadInterna.${criterio}`] = {}
                if (umbralMin) {
                    query[`calidad.calidadInterna.${criterio}`].$gte = Number(umbralMin)
                } else {
                    query[`calidad.calidadInterna.${criterio}`].$gte = -50
                }
                if (umbralMax) {
                    query[`calidad.calidadInterna.${criterio}`].$lt = Number(umbralMax)
                } else {
                    query[`calidad.calidadInterna.${criterio}`].$lt = 999999999
                }
            }


            const lotes = await LotesRepository.getLotes({
                query: query,
                limit: todosLosDatos ? 99999999999 : cantidad,
                sort: sort
            });
            const contenedoresArr = []
            if (busqueda === 'calidad') {
                return lotes
            } else {
                lotes.forEach(element => {
                    element.contenedores.forEach(contenedor => contenedoresArr.push(contenedor))
                })
                const contenedoresSet = new Set(contenedoresArr)
                const cont = [...contenedoresSet]

                const contenedores = await ContenedoresRepository.getContenedores({
                    ids: cont,
                    select: { numeroContenedor: 1, pallets: 1 }
                });

                return { lotes: lotes, contenedores: contenedores }
            }
        } catch (err) {
            if (
                err.status === 518 ||
                err.status === 523 ||
                err.status === 515
            ) {
                throw err
            }
            throw new ProcessError(470, `Error ${err.type}: ${err.message}`)
        }

    }
}


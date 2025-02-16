require('dotenv').config();
const express = require("express");
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const cron = require("node-cron");
const path = require('path')

const { initMongoDB } = require('./DB/mongoDB/config/init');
const { apiSocket } = require('./server/desktop/reduce');
const { UserRepository } = require('./server/auth/users');
const { BadGetwayError } = require('./Error/ConnectionErrors');
const { socketMobileRepository } = require('./server/mobile/socket');
const { routerSistema } = require('./server/mobile/sistema');
const { routerVariablesdelSistema } = require('./server/mobile/variablesDelSistema');
const { routerProceso } = require('./server/mobile/process');
const { routerCalidad } = require('./server/mobile/calidad');
const { routerComercial } = require('./server/mobile/comercial');
const { routerAppTv } = require('./server/routes/appTv');
const { ProcesoRepository } = require('./server/api/Proceso');
const { SistemaRepository } = require('./server/api/Sistema');
const { AccessError } = require('./Error/ValidationErrors');
const { procesoEventEmitter } = require('./events/eventos');
const { HandleErrors } = require('./Error/recordErrors');
const { VariablesDelSistema } = require('./server/Class/VariablesDelSistema');
const { FormulariosCalidadRepository } = require('./server/Class/FormulariosCalidad');
const { sp32 } = require('./server/mobile/sp32');
const { routerProceso2 } = require('./server/routes/Proceso');
const { IndicadoresAPIRepository } = require('./server/api/IndicadoresAPI');
const { routerIndicadores } = require('./server/routes/indicadores');
// const { initRustProceso } = require('./DB/controllers/proceso');


initMongoDB()
// initRustProceso()
//#region HTTP
// Middleware para configurar CORS
app.use((req, res, next) => {
    console.log(req.url)

    res.header('Access-Control-Allow-Origin', '*'); // Permite solicitudes de cualquier origen
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); // Métodos permitidos
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization'); // Encabezados permitidos
    // Maneja las solicitudes OPTIONS (pre-flight)
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.text());
// Aumentar el límite de tamaño del cuerpo de la solicitud de manera global


app.use(express.static(path.join(__dirname, 'public')));
app.use("/variablesDeProceso", routerVariablesdelSistema);
app.use("/proceso", routerProceso);
app.use("/proceso2", routerProceso2);
app.use("/indicadores", routerIndicadores);
app.use("/comercial", routerComercial);
app.use("/calidad", routerCalidad)
app.use("/sistema", routerSistema)
app.use("/appTV", routerAppTv)
app.use("/sp32", sp32)
app.get("/", (req, res) => {
    console.log("entra aqui")
    res.sendFile(path.join(__dirname, 'public', 'web', 'index.html'));
});

//se envia el archivo ymal para actualizar la aplicacion de ecritorio
app.get("/latest.yml", async (req, res) => {
    try {

        const fileContents = await SistemaRepository.isNewVersion();

        res.setHeader('Content-Type', 'text/yaml');
        res.send(fileContents);
    }
    catch (err) {
        console.log(`Code ${err.status}: ${err.message}`)
        res.json({ status: err.status, message: err.message })
    }
})
//Envia los archivos para actualizar la aplicacion de escritorio 
app.get('/:filename', async (req, res) => {
    try {
        let { filename } = req.params;
        filename = path.basename(filename);
        const file =
            await SistemaRepository.getCelifrutAppFile(filename)


        // Enviar el archivo como respuest
        res.setHeader('Content-Type', 'application/octet-stream');
        res.end(file);

    }
    catch (err) {
        console.log(`Code ${err.status}: ${err.message}`)
        res.json({ status: err.status, message: err.message })
    }
})

app.post('/login2', async (req, res) => {
    const user = { user: req.body.user, password: req.body.password }
    try {
        const dataUser = await SistemaRepository.login2(user)
        const accesToken = UserRepository.generateAccessToken({
            user: dataUser.usuario,
            cargo: dataUser.cargo._id,
            _id: dataUser._id,
            Rol: dataUser.cargo.Rol
        })
        res.json({
            accesToken: accesToken,
            status: 200,
            message: 'Ok',
            permisos: dataUser.cargo,
            user: dataUser.usuario,
            cargo: dataUser.cargo.Cargo,
            Rol: dataUser.cargo.Rol

        })
    } catch (err) {
        await HandleErrors.addError(err, req.body.user)
        res.json(err)

    }
});

app.listen(process.env.PORT, process.env.HOST, () => {
    console.log(`El servidor está escuchando en el puerto ${process.env.PORT} y la dirección IP ${process.env.HOST}.`);
});




//#region  Socket

// Middleware de autenticación para Socket.IO
io.use((socket, next) => {
    UserRepository.authenticateTokenSocket(socket, next)
});

async function sendData(data) {
    io.emit('servidor', data)
};

procesoEventEmitter.on('predio_vaciado', (data) => {
    console.log(data)
    try {
        io.emit("predio_vaciado", data);
    } catch (error) {
        console.error('Error en predio_vaciado:', error);
    }
})
procesoEventEmitter.on('listaempaque_update', () => {
    try {
        io.emit("listaempaque_update");
    } catch (error) {
        console.error('Error en listaempaque_update:', error);
    }
})
procesoEventEmitter.on('status_proceso', (data) => {
    try {
        io.emit("status_proceso", data);
    } catch (error) {
        console.error('Error en status_proceso:', error);
    }
})
procesoEventEmitter.on('proceso_event', (data) => {
    try {
        io.emit("proceso_event", data);
    } catch (error) {
        console.error('Error en proceso_event:', error);
    }
});
procesoEventEmitter.on('server_event', (data) => {
    try {
        io.emit("server_event", data);
    } catch (error) {
        console.error('Error en nuevo_predio:', error);
    }
})

io.on("connection", socket => {
    console.log("an user has connected");
    let ongoingRequests = {};
    socket.on("Desktop2", async (data, callback) => {
        try {
            // If the request is already ongoing, return
            if (ongoingRequests[data.data.action]) {
                return;
            }
            const user = await UserRepository.authenticateToken(data.token)
            data = { ...data, user: user }

            // Mark the request as ongoing
            ongoingRequests[data.data.action] = true;
            const autorizado2 = await UserRepository.autentificacionPermisos2(data);
            if (!autorizado2) {
                throw new AccessError(412, `Acceso no autorizado ${data.data.action}`);
            }

            if (!Object.prototype.hasOwnProperty.call(apiSocket, data.data.action))
                throw new BadGetwayError(501, `Error badGetWay ${data.data.action} no existe`)


            const response = await apiSocket[data.data.action](data, sendData);

            const newToken = UserRepository.generateAccessToken({
                user: data.user.user,
                cargo: data.user.cargo,
                _id: data.user._id,
                Rol: data.user.Rol,
            })

            callback({ ...response, token: newToken })
        } catch (err) {
            console.log("Error socket: ", err);
            await HandleErrors.addError(err)

            if (![401, 402, 403, 404, 405].includes(err.status)) {
                const newToken = data.user ? UserRepository.generateAccessToken({
                    user: data.user.user,
                    cargo: data.user.cargo,
                    _id: data.user._id,
                    Rol: data.user.Rol,

                }) : null;
                callback({ ...err, token: newToken });
            } else {
                callback(err);
            }
        } finally {
            console.log(ongoingRequests)
            if (data && data.data && data.data.action) {
                delete ongoingRequests[data.data.action]
            }
        }
    })
    socket.on("Mobile", async (data, callback) => {
        try {
            // If the request is already ongoing, return
            if (ongoingRequests[data.data.action]) {
                return;
            }
            const user = await UserRepository.authenticateToken(data.token)
            data = { ...data, user: user }

            // Mark the request as ongoing
            ongoingRequests[data.data.action] = true;
            const autorizado2 = await UserRepository.autentificacionPermisos2(data);

            if (!autorizado2) {
                throw new AccessError(412, `Acceso no autorizado ${data.data.action}`);
            }

            if (!Object.prototype.hasOwnProperty.call(socketMobileRepository, data.data.action))
                throw new BadGetwayError(501, `Error badGetWay ${data.data.action} no existe`)
            const response = await socketMobileRepository[data.data.action](data);
            callback(response)
        } catch (err) {
            await HandleErrors.addError(err)
            console.log("Error socket mobile: ", err);
            if (![401, 402, 403, 404, 405].includes(err.status)) {
                const newToken = data.user ? UserRepository.generateAccessToken({
                    user: data.user.user,
                    cargo: data.user.cargo
                }) : null;
                if (!err.status) {
                    callback({ message: err.message, status: 401, token: newToken });
                }
                callback({ ...err, token: newToken });
            } else {
                callback(err);
            }
        } finally {
            delete ongoingRequests[data.data.action]
        }
    })
});

server.listen(3011, () => {
    console.log('listening on *:3010');
});

// #region Acciones programadas


//crear indicador diario
// cron.schedule('0 7 * * *', async () => {
//     await IndicadoresAPIRepository.post_indicadores_eficiencia_operativa_registro();
// });
cron.schedule('10 5 * * *', async () => {
    await IndicadoresAPIRepository.post_indicadores_eficiencia_operativa_registro();

});

//Kilos procesados al finalizar el dia
cron.schedule('0 5 * * *', async () => {
    await IndicadoresAPIRepository.sys_indicadores_eficiencia_operativa_kilos_procesados();
    await ProcesoRepository.reiniciarValores_proceso();

});


cron.schedule('20 16 * * *', async () => {
    await IndicadoresAPIRepository.sys_indicadores_eficiencia_fruta_kilos_procesados();

});

cron.schedule("7 9 * * *", async () => {
    const inicio = new Date().setHours(0, 0, 0, 0);
    const fin = new Date().setHours(23, 59, 59, 59);
    const codigo = await VariablesDelSistema.generar_codigo_informe_calidad()

    await FormulariosCalidadRepository.crear_formulario_limpieza_diaria(
        codigo, inicio, fin
    )
    await VariablesDelSistema.incrementar_codigo_informes_calidad();

});


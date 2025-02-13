# Instrucciones de Instalación del Servidor

Este documento proporciona los pasos necesarios para instalar y configurar el servidor.

## Requisitos previos

- Sistema operativo Ubuntu (preferiblemente Ubuntu 22.04 Jammy Jellyfish)
- Acceso de superusuario (sudo)

## Pasos de instalación

### 1. Descargar e instalar Node.js

```bash
sudo apt-get update
sudo apt-get upgrade
sudo apt-get install curl
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
. ~/.bashrc
nvm --version
nvm install 20
nvm use 20
node -v
npm -v
```

### 2. Instalar MongoDB

```bash
cat /etc/lsb-release
sudo apt-get install gnupg curl
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
--dearmor
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
```

### 3. Instalar Redis

Instala Redis versión 7.4 o superior. (Los pasos específicos no fueron proporcionados)

### 4. Inicializar el inventario

Ejecuta el script `InicializarInventario` que se encuentra en la carpeta `scripts`. Esto creará los archivos JSON necesarios.

**Nota importante**: Algunos archivos necesitan ser modificados manualmente:
- Cajas sin pallet: `[]`
- inventariodescarte: `[]`
- ordenVaceo: `[]`
- Dentro de seriales, agregar: `{"idCelifrut":38,"enf":1241}`

### 5. Configurar el archivo .env

Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:

```
# HOST
HOST = "La direccion ip"

# Celifrut app port
PORT = "El puerto del servidor"
MONGO_PORT = "EL puerto donde esta el servicio de mongo"

# direccion mongoDB se debe cambiar el puerto por el puerto de mongo
MONGODB_PROCESO = "mongodb://localhost:27017/proceso"
MONGODB_SISTEMA = "mongodb://localhost:27017/sistema"

# acces token
ACCES_TOKEN = 

REFRESH_TOKEN = 

# salt
SALT_ROUNDS = 10

# Salt AES_SECRET = 
```

### 6. Modificar la configuración de MongoDB

En el archivo `DB/mongoDB/config/init.js`, modifica la función `startMongoDB`. Ajusta el `exec` con el puerto correspondiente.

### 7. Iniciar el servidor

Ejecuta el servidor con:

```bash
node index.js
```

Se recomienda usar una librería como pm2 para gestionar el proceso del servidor.

## Notas adicionales

- Asegúrate de tener todos los permisos necesarios antes de ejecutar los comandos.
- Verifica que todas las dependencias estén correctamente instaladas antes de iniciar el servidor.
- Para cualquier problema durante la instalación, consulta la documentación oficial de cada tecnología o contacta al equipo de soporte.

```
server
├─ .git
│  ├─ COMMIT_EDITMSG
│  ├─ config
│  ├─ description
│  ├─ FETCH_HEAD
│  ├─ HEAD
│  ├─ hooks
│  │  ├─ applypatch-msg.sample
│  │  ├─ commit-msg.sample
│  │  ├─ fsmonitor-watchman.sample
│  │  ├─ post-update.sample
│  │  ├─ pre-applypatch.sample
│  │  ├─ pre-commit.sample
│  │  ├─ pre-merge-commit.sample
│  │  ├─ pre-push.sample
│  │  ├─ pre-rebase.sample
│  │  ├─ pre-receive.sample
│  │  ├─ prepare-commit-msg.sample
│  │  ├─ push-to-checkout.sample
│  │  ├─ sendemail-validate.sample
│  │  └─ update.sample
│  ├─ index
│  ├─ info
│  │  └─ exclude
│  ├─ logs
│  │  ├─ HEAD
│  │  └─ refs
│  │     ├─ heads
│  │     │  └─ main
│  │     └─ remotes
│  │        └─ origin
│  │           └─ main
│  ├─ objects
│  │  ├─ info
│  │  └─ pack
│  │     ├─ pack-f209228a8eab5055aaf9c9ba293692aa663c7494.idx
│  │     ├─ pack-f209228a8eab5055aaf9c9ba293692aa663c7494.pack
│  │     └─ pack-f209228a8eab5055aaf9c9ba293692aa663c7494.rev
│  ├─ ORIG_HEAD
│  └─ refs
│     ├─ heads
│     │  └─ main
│     ├─ remotes
│     │  └─ origin
│     │     └─ main
│     └─ tags
├─ .gitignore
├─ constants
│  ├─ calidad.json
│  ├─ formularios_calidad.json
│  ├─ insumos.json
│  ├─ observacionesCalidad.json
│  ├─ paisesEXP.json
│  └─ permisosDev.json
├─ DB
│  ├─ controllers
│  │  └─ proceso.js
│  ├─ mongoDB
│  │  ├─ config
│  │  │  ├─ config.js
│  │  │  └─ init.js
│  │  └─ schemas
│  │     ├─ calidad
│  │     │  ├─ schemaControlPlagas.js
│  │     │  ├─ schemaHigienePersonal.js
│  │     │  ├─ schemaLimpiezaDiaria.js
│  │     │  ├─ schemaLimpiezaMensual.js
│  │     │  └─ schemaVolanteCalidad.js
│  │     ├─ clientes
│  │     │  ├─ schemaClientes.js
│  │     │  └─ schemaRecordClientes.js
│  │     ├─ contenedores
│  │     │  ├─ schemaContenedores.js
│  │     │  └─ schemaRecordContenedores.js
│  │     ├─ errors
│  │     │  └─ schemaErrores.js
│  │     ├─ insumos
│  │     │  ├─ RecordSchemaInsumos.js
│  │     │  └─ schemaInsumos.js
│  │     ├─ lotes
│  │     │  ├─ schemaHistorialDescarte.js
│  │     │  ├─ schemaHistorialDespachosDescartes.js
│  │     │  ├─ schemaLotes.js
│  │     │  └─ schemaRecordLotes.js
│  │     ├─ proceso
│  │     │  └─ TurnoData.js
│  │     ├─ proveedores
│  │     │  ├─ schemaProveedores.js
│  │     │  └─ schemaRecordProveedores.js
│  │     └─ usuarios
│  │        ├─ schemaCargos.js
│  │        ├─ schemaRecordCargos.js
│  │        ├─ schemaRecordUsuarios.js
│  │        └─ schemaUsuarios.js
│  └─ redis
│     └─ init.js
├─ Error
│  ├─ ConnectionErrors.js
│  ├─ ProcessError.js
│  ├─ recordErrors.js
│  └─ ValidationErrors.js
├─ eslint.config.mjs
├─ events
│  └─ eventos.js
├─ generator
│  ├─ informe_calidad.js
│  └─ resource
│     └─ informe_calidad
│        ├─ FORMATO INFORME LIMON TAHITI.xlsx
│        └─ FORMATO INFORME NARANJA.xlsx
├─ index.js
├─ package.json
├─ public
│  ├─ appTv
│  │  ├─ assets
│  │  │  ├─ DS-DIGI-dG6DdXEc.TTF
│  │  │  ├─ img1-BVKzVInW.jpg
│  │  │  ├─ img_logo-CJ2LOTjn.png
│  │  │  ├─ index-CMqVFLm8.css
│  │  │  ├─ index-D8OWihCD.js
│  │  │  └─ limon-CR6hGAfI.webp
│  │  └─ index.html
│  └─ other
├─ README.md
├─ scripts
│  ├─ InicializarInventario.js
│  ├─ modificarClientes.js
│  ├─ modificarListaEmpaque.js
│  └─ subirInventarioAWS.js
└─ server
   ├─ api
   │  ├─ Calidad.js
   │  ├─ Comercial.js
   │  ├─ Contabilidad.js
   │  ├─ ModificarData.js
   │  ├─ Proceso.js
   │  ├─ Sistema.js
   │  └─ Views.js
   ├─ archive
   │  ├─ ArchiveLotes.js
   │  ├─ ArchivoListaEmpaque.js
   │  └─ ArchivoProveedores.js
   ├─ auth
   │  └─ users.js
   ├─ Class
   │  ├─ Clientes.js
   │  ├─ Contenedores.js
   │  ├─ DespachoDescarte.js
   │  ├─ FormulariosCalidad.js
   │  ├─ Insumos.js
   │  ├─ Lotes.js
   │  ├─ Proveedores.js
   │  ├─ TurnoData.js
   │  ├─ Usuarios.js
   │  └─ VariablesDelSistema.js
   ├─ controllers
   │  └─ validations.js
   ├─ desktop
   │  └─ reduce.js
   ├─ functions
   │  └─ insumos.js
   ├─ mobile
   │  ├─ calidad.js
   │  ├─ comercial.js
   │  ├─ process.js
   │  ├─ sistema.js
   │  ├─ socket.js
   │  ├─ utils
   │  │  └─ contenedoresLotes.js
   │  └─ variablesDelSistema.js
   └─ routes
      └─ appTv.js

```
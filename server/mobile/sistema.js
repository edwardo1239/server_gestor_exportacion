import express from 'express';
import yaml from 'js-yaml';
import { SistemaRepository } from '../api/Sistema.js';


export const routerSistema = express.Router();

routerSistema.get("/", (req, res) => {
    res.send("Sistema")
});

routerSistema.get("/check_mobile_version", async (req, res) => {
    try {
        console.log("check update")
        const version = await SistemaRepository.check_mobile_version();
        console.log(version)
        res.send({ status: 200, message: 'Ok', data: version })
    }
    catch (err) {
        console.log(`Code ${err.status}: ${err.message}`)
        res.json({ status: err.status, message: err.message })
    }
})
routerSistema.get("/download_mobilApp/:name", async (req, res) => {
    try {
        const apk = await SistemaRepository.download_mobilApp(req.params.name);
        res.sendFile(apk, (err) => {
            if (err) {
                if (!res.headersSent) {
                    res.status(500).json({ status: 500, message: 'Error sending file' });
                }
            }
        });
    }
    catch (err) {
        console.log(`Code ${err.status}: ${err.message}`)
        if (!res.headersSent) {
            res.status(err.status || 500).json({ status: err.status || 500, message: err.message });
        }
    }
})

routerSistema.get("/check_desktopApp/:name", async (req, res) => {
    try {
        let out;
        const fileContents = await SistemaRepository.isNewVersion();
        const latest = yaml.load(fileContents);
        if (req.params.name === latest.version) {
            out = "false";
        } else {
            out = "true";
        }
        res.send(out)
    }
    catch (err) {
        console.log(`Code ${err.status}: ${err.message}`)
        res.json({ status: err.status, message: err.message })
    }
})


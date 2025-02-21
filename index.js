const express = require('express');
const path = require("path")
const axios = require("axios")
const cors = require("cors")
const fs = require("fs")

const app = express();
const port = 3000;

app.use(cors());

const Regexes = {
    patch_version: /^\d\d?\.\d\d?\.\d\d?$/
}
const CONFIG = JSON.parse(fs.readFileSync(path.resolve(__dirname, "./config.json"),"utf-8"))

if(CONFIG?.patch == null || Regexes.patch_version.test(`${CONFIG.patch}`) == false) {
    throw new Error(`[config.json] Patch version invalid. Given: '${CONFIG.patch}'. Expected format: ${Regexes.patch_version.toString()}`)
}



app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname + "/page.html"))
});


app.get('/old', (req, res) => {
    res.sendFile(path.resolve(__dirname + "/page_old.html"))
});


console.log("Getting champions...")
axios.get(`https://ddragon.leagueoflegends.com/cdn/${CONFIG.patch}/data/fr_FR/champion.json`).then((champions) => {

    const CHAMPIONS = champions.data

    console.log("Champions:",CHAMPIONS)


    app.get('/allChampions', async (_req,res) => {
        console.log("GET /allChampions");
        res.send(CHAMPIONS)
        return
    })

    app.get("/getChampion", async (req,res) => {
        try {
            if(req.query?.key == null) {
                res.send({})
                return;
            }
            let championKey = req.query?.key.trim()
            console.log("[/getChampion] Getting key:",championKey)
            console.log("Getting datas for:",championKey)
            let temp1 = (await axios.get(`https://ddragon.leagueoflegends.com/cdn/15.3.1/data/fr_FR/champion/${championKey}.json`)).data
            console.log("Datas retrieved.",temp1)
            let temp2 = temp1.data
            let temp3 = Object.values(temp2)[0]
            res.send(temp3)
            return;
        } catch(err) {
            console.log("Error:",err)
            res.send({
                status: 500,
                message: "Internal Server Error",
                stack: err.stack
            })
        }
    })

    app.get("*", (_req,_res) => {
        _res.send("404 Not Found")
    })
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });

})
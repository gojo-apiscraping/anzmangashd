const express = require('express');
const port = process.env.port || 80;
const app = express();
const cheerio   = require('cheerio');
const fs        = require('fs');
const request   = require('request');
const axios = require("axios");

app.use(express.json());

app.get('/api/:type/:name/:chapter', (req, res) => {

    let type = req.params.type; 
    let name = req.params.name; 
    let chapter = req.params.chapter;

    const url =  `https://www.anzmangashd.com/${type}/${name}/${chapter}`;
    
    async function scrapeData() {
        try {
            // const { data, request } = await axios.get(url);
            const manga = [];
                request( url, (err, res, body) => {
                    let $ = cheerio.load(body);
                    let img = [];
                    /*consult */
                    $('img.img-responsive', '#all').each(function (){
                        img.push($(this).attr('data-src'));
                    });
            
                    /*Fill a Object with basic information*/
                    manga = {
                        name: name,
                        chapter: chaptername,
                        images: imgname,
                    }
                });
                return manga;
        } catch (error) {
            console.error(error);
        }
    }
    res.send(
        console.log(scrapeData())
        );
});

app.listen(port, () => console.log(`escuchando en puerto ${port}`));
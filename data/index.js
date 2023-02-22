const express = require('express');
const port = process.env.port || 80;
const app = express();


const cheerio   = require('cheerio');
const request   = require('request');


app.get('/api/:type/:name/:chapter', (req, res) => {

    const { type, chapter, name } = req.params;

    function getImages(type, name, chapter) {
        return new Promise((resolve, reject) => {
          request(`https://www.anzmangashd.com/${type}/${name}/${chapter}`, (err, res2, body) => {
            if (!err && res2.statusCode == 200) {
              let $ = cheerio.load(body);
              let img = [];
      
              $('img.img-responsive', '#all').each(function () {
                img.push($(this).attr('data-src'));
              });
      
              let resImage = {
                name,
                chapter,
                sheets: img.length,
                img,
              };
              resolve(resImage);
            } else {
              reject(err);
            }
          });
        });
      }
    //   let names = name.replace('-', ' ');

      getImages(type, name, chapter)
        .then((resImage) => {
        //   console.log(resImage);
          res.send(resImage);
        })
        .catch((err) => {
            res.send({
                message: "Please check the request",
                attemptUrl: `/api/${type}/${name}/${chapter}`,
                error: err,
                state: 400,
            });
            console.error(err);
        });
      
})

    
app.listen(port, () => console.log(`escuchando en puerto ${port}`));


                    
/*Fill a Object with basic information*/
// reqManga.name = name;
// reqManga.chapter = chapter;
// reqManga.images = img;


// reqManga.pages = img.length;
// reqManga.urlSeed = `/${type}/${name}/${chapter}`;

// console.log(reqManga);
// console.log(body);
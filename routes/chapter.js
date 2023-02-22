var express = require('express');
var router = express.Router();
const request = require('request');
const cheerio = require('cheerio');

/* GET users listing. */
router.get('/manga/:name/:chapter', function(req, res, next) {
  const {chapter, name } = req.params;

    function getImages(name, chapter) {
        return new Promise((resolve, reject) => {
          request(`https://www.anzmangashd.com/manga/${name}/${chapter}`, (err, res2, body) => {
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

      getImages(name, chapter)
        .then((resImage) => {
        //   console.log(resImage);
          res.send(resImage);
        })
        .catch((err) => {
            res.send({
                message: "Please check the request",
                attemptUrl: `https://www.anzmangashd.com/manga/${name}/${chapter}`,
                error: err,
                state: 400,
                data: {
                      name: req.params.name,
                      chapter: req.params.chapter,
                    }
            });
            console.error(err);
        });
  // res.send(
  //   {
  //     response: 'respond with a resource',
  //     name: req.params.name,
  //     type: req.params.type,
  //     chapter: req.params.chapter,
  //   }
  //   );
});

module.exports = router;

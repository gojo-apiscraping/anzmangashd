const express = require('express');
const router = express.Router();
const request = require('request');
const cheerio = require('cheerio');
const axios = require('axios');

/* Route get images by chapters. */
router.get('/manga/:name/:chapter', function(req, res, next) {
  const {chapter, name } = req.params;

  getImages(name, chapter)
    .then((resImage) => {
      res.json(resImage);
    })
    .catch((err) => {
        res.json({
            message: "Please check the request",
            error: err,
            state: 400,
            data: {
                  name: req.params.name,
                  chapter: req.params.chapter,
                }
        });
        console.error(err);
    });

});

/* Route get chapters by Manga. */
router.get('/manga/:name', function(req, res) {
    const {name } = req.params;
    getChapters(name)
      .then((data) => {
        res.json(data);
      })
      .catch((error) => {
        console.error(error);
        res.status(400).json({
          message: 'Please check the request',
          error: error,
          data: {
            name: req.params.name
          }
      });
    });
});

function getImages(name, chapter) {
  return new Promise((resolve, reject) => {
    let anzmanga = 'www.anzmangashd';
    request(`https://${anzmanga}.com/manga/${name}/${chapter}`, (err, res2, body) => {
      if (!err && res2.statusCode == 200) {
        let $ = cheerio.load(body);
        let img = [];
        let nome = [];
        let lastedChapter = [];

        $('ul.dropdown-menu > li > a', '#chapter-list').each(function () {
          lastedChapter.push($(this).text());
        });
        
        $('img.img-responsive', '#all').each(function () {
          img.push($(this).attr('data-src'));
        });

        $('ul.nav.navbar-nav > li > a', '#navbar-collapse-1').each(function () {
          nome.push($(this).text());
        });

        nome = nome[0].replace(' Manga', '');
        lastedChapter = (lastedChapter[0].replace(':', '').split(' '))[1];

        let resImage = {
          name: name,
          lastedChapter: lastedChapter,
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

function getChapters(name) {
  return new Promise((resolve, reject) => {
    let url = 'https://www.anzmangashd.com/search';
    axios.get(url, { params: { query: name } })
      .then(async (response) => {
        let nameSearch = response.data.suggestions[0].data;
        let nameDefault = response.data.suggestions[0].value;

        return getAllChapters(nameSearch, nameDefault)
          .then((chapters) => {
            return {
              data: response.data,
              chapters: chapters
            };
          });
      })
      .then((result) => {
        let data = result.data;
        let chapters = result.chapters;
        let suggestions = data.suggestions;

        let response = {
          name: suggestions[0].value,
          searchName: suggestions[0].data,
          chapters: chapters
        };

        suggestions[0].chapters = chapters;

        resolve(response);
      })
      .catch((error) => {
        console.error(error);
        reject(error);
      });
  });
}

function getAllChapters(nameSearch, nameDefault) {
  return new Promise(async (resolve, reject) => {
    let anzmanga = 'www.anzmangashd';

    request(`https://${anzmanga}.com/manga/${nameSearch}`, async (err, res2, body) => {
      if (!err && res2.statusCode == 200) {
        let $ = cheerio.load(body);
        let rawChapters = [];
        $('li > h5 > a', 'ul.chapters').each(function () {
          rawChapters.push($(this).text());
        });

        let chapters = await Promise.all(rawChapters.map(async (chapter) => {
          let numberChapter = chapter.split(nameDefault)[1].trim();
          let imageData = await getImages(nameSearch, numberChapter);
          return {
            chapter: numberChapter,
            sheets: imageData.sheets,
            images: imageData.img,
          }
        }));

        chapters = chapters.reverse();

        resolve(chapters);
      } else {
        reject(err);
      }
    });
  });
}


module.exports = router;

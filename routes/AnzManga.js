const express = require('express');
const router = express.Router();
const request = require('request');
const cheerio = require('cheerio');
const axios = require('axios');

/* Route get images by chapters. */
router.post('/manga/:name/:chapter', function(req, res, next) {
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
router.post('/manga/:name', function(req, res) {
    const {name} = req.params;
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
    let urlReq = 'https://www.anzmangashd.com/search';
    axios.get(urlReq, { params: { query: name } })
      .then(async (response) => {
        
        let nameSearch = [];
        let nameDefault = [];
        
        for (const element of response.data.suggestions) {
          nameSearch.push(element.data);
          nameDefault.push(element.value);
        }

        return getAllLinkChapters(nameSearch, nameDefault)
          .then((chapters) => {
            for (let i = 0; i < nameSearch.length; i++) {
              if(chapters[i].name === nameSearch[i])
              console.log(nameDefault[i]);
            }
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
        let response = [];
        
        response.push({suggestions: chapters});
        
        suggestions[0].chapters = chapters;

        resolve(response[0]);
      })
      .catch((error) => {
        console.error(error);
        reject(error);
      });
  });
}

function getAllLinkChapters(nameSearch, nameDefault) {
  return new Promise(async (resolve, reject) => {
    let anzmanga = 'www.anzmangashd';
    let chapters = [];
    let search = {
      lenghtData: nameSearch.length,
      nameSearch, 
      nameDefault
    }
    async function getImagesByChapter(url, params){
      return new Promise((resolve, reject) => {
        request(url, (err, res2, body) => {
          if (err) {
            reject(err);
          }
          if (res2.statusCode !== 200) {
            reject(new Error(`Request failed with status ${res2.statusCode}`));
          }

          const $ = cheerio.load(body);
          const rawChapters = [];
          
          $('li > h5 > a', 'ul.chapters').each(function () {
            let cleanUp = ($(this).text()).replace(params.value, "").trim()
            rawChapters.push(`/api/anz/manga/${params.data}/${cleanUp}`);
          });

          resolve(rawChapters);
        });
      });
    }
    for (let i = 0; i < search.lenghtData; i++) {
      chapters.push({
        value: search.nameDefault[i], 
        data: search.nameSearch[i], 
        chapters: (
          await getImagesByChapter(
            `https://${anzmanga}.com/manga/${search.nameSearch[i]}`, 
            {
              value: search.nameDefault[i], 
              data: search.nameSearch[i]
            }
          )
        )
      })
    }
    resolve(chapters)
})
}


module.exports = router;

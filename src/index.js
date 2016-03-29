#!/usr/bin/env node
'use strict';

import cheerio from 'cheerio';
import request from 'cloudscraper';
import download from './download';
import zt from 'zt';
import minimist from 'minimist';

const argv = minimist(process.argv.slice(2));

const url = `https://kissanime.to/Anime/${argv.anime || argv.a}`;

if(argv.h || argv.help) {
  console.log(`
    Usage:
      kdl -h | --help
      kdl -v | --version
      
    Options:
      -h --help Show this screen.
      -u --username Your KissAnime username.
      -p --password Your KissAnime password.
      -a --anime The URL name for your anime.
      -q --quality The anime quality (ex. 640x360).
      -o --out The download directory.
  `);
  process.exit(0);
}

zt.log('Logging in...');
request.post('https://kissanime.to/Login', {
  username: argv.username || argv.u,
  password: argv.password || argv.p,
  redirect: ''
}, (err, res0, body0) => {
  if(body0.indexOf('invalid username or password') > -1) {
    return zt.error('Invalid username or password');
  }
  
  zt.log('Getting episodes...');
  request.request({
    method: 'GET',
    url: url,
    headers: res0.headers
  }, (err, res, body) => {
    if(err) console.log(err);
    
    let $ = cheerio.load(body);
    let listing = $('.listing');
    
    zt.log(`Found ${listing.find('tr').slice(2).length} episodes.`);
    
    listing.find('tr').slice(2).each((i, el) => {
      let anchor = $(el).find('td').find('a');
      
      request.get('https://kissanime.to' + anchor.attr('href'), (err1, res1, body1) => {
        $ = cheerio.load(body1);
        $('#divDownload').find(`a:contains("${argv.q || argv.quality}")`).each((i1, el1) => {
          let name = $('#divFileName').clone().children().remove().end().text().trim();
          download($(el1).attr('href'), `${argv.out || argv.o}/${name}.mp4`);
        });
      });
    });
    
    zt.log(`Downloading ${listing.find('tr').slice(2).length} episodes`);
  });
});


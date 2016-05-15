#!/usr/bin/env Node

var cheerio = require('cheerio');
var cloudflare = require('cloudscraper');
var request = require('request');
var zt = require('zt');
var minimist = require('minimist');
var path = require('path');
var fs = require('fs');

var argv = minimist(process.argv.slice(2));

var url = 'https://kissanime.to';
var urls = {
  login: url + '/Login',
  anime: url + '/Anime/' + (argv.anime || argv.a)
};

if (argv.h || argv.help) {
  var help = 'Usage: \n' +
             '  kdl -h | --help \n' +
             '  kdl -v | --version \n' +
             '\n' +
             'Options \n' +
             '  -h --help Show this screen \n' +
             '  -u --username Your kissanime username \n' +
             '  -p --password Your kissanime password \n' +
             '  -a --anime The anime name \n' +
             '  -q --quality The anime quality (ex. 640x360) \n' +
             '  -o --out The download directory';
  console.log(help);
  process.exit(0);
}

function downloadEpisodes(err, res, body) {
  var $ = cheerio.load(body);
  var episode = $('#divDownload').find('a:contains("' + (argv.q || argv.quality) + '")');
  episode.each(function(i, el) {
    var name = $('#divFileName').clone().children().remove().end().text().trim();
    var url = $(el).attr('href');
    var out = (argv.out || argv.o) + '/' + name + '.mp4';
    
    request.get(url)
      .on('response', function(res) {
        zt.log('Downloading episode ' + path.basename(name));

        res.on('end', function() {
          zt.log(path.basename(name) + ' finished downloading');
        });
      })
      .pipe(fs.createWriteStream(out));
  });
}

function getEpisodes(err, res, body) {
  if (err) {
    return zt.error('There was an error getting episodes');
  }
    
  var $ = cheerio.load(body);
  var listing = $('.listing');
  var episodes = listing.find('tr').slice(2);
  
  zt.log('Found ' + episodes.length + ' episodes');
  
  res.episodes = episodes.length;
  
  episodes.each(function(i, el) {
    var anchor = $(el).find('td').find('a');
    
    cloudflare.get(url + anchor.attr('href'), downloadEpisodes);
  });
}

function login(err, res, body) {  
  if (err) {
    return zt.error('There was an error logging in');
  }
  if (body.indexOf('invalid username or password') > -1) {
    return zt.error('Invalid username or password');
  }
  
  zt.log('Successfully logged in');
  zt.log('Getting episodes');
  
  cloudflare.request({
    method: 'GET',
    url: urls.anime,
    headers: res.headers
  }, getEpisodes)
}

function start() {
  zt.log('Logging in...');
  cloudflare.post(urls.login, {
    username: argv.username || argv.u,
    password: argv.password || argv.p,
    redirect: ''
  }, login);
}

start();

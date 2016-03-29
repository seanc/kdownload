import fs from 'fs';
import path from 'path';
import request from 'request';
import zt from 'zt';

export default function download(url, loc) {
  request.get(url)
    .on('response', res => {
      zt.log(`Download started for ...${path.basename(loc)}`);
      
      res.on('end', () => console.log(`${path.basename(loc)} Finished downloading`));
    })
    .pipe(fs.createWriteStream(loc));
};
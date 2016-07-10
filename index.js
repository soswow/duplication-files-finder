const md5File = require('md5-file')
const dir = require('node-dir');
const hashMap = {};
const readline = require('readline');
const walk = require('walk');
const path = require('path');
const q = require('q');
const fs = require('fs');
const util = require('util');
// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout
// });
let totalCount = 0;
let hashedSoFar = 0;
let errors = 0;
let copiesSoFar = 0;

function saveFileToHashMap(hash, size, fileName){
  if (!hashMap[hash]) {
    hashMap[hash] = {size: size, names: []};
  }else{
    copiesSoFar += 1;
  }
  hashMap[hash].names.push(fileName);

  hashedSoFar += 1;
}

function logProgress(root){
  readline.clearLine(process.stdout, 0);
  readline.cursorTo(process.stdout, 0);
  process.stdout.write(`${hashedSoFar} (${copiesSoFar}) - ${root}`);
}

function hashDirectory(startingPoint){
  const deferred = q.defer()
  const walker = walk.walk(startingPoint, {});

  walker.on("file", (root, fileStats, next) => {
    const fileName = path.join(root, fileStats.name);
    const MB200InBytes = 1000 * 1000 * 200;
    if (fileStats.size > MB200InBytes) {
      let hash = `${fileStats.name}_${fileStats.size}`;
      saveFileToHashMap(hash, fileStats.size, fileName);
      logProgress(root);
      next();
    } else {
      md5File(fileName, (err, hash) => {
        saveFileToHashMap(hash, fileStats.size, fileName);
        logProgress(root);
        next();
      });
    }
  });

  walker.on("errors", (root, nodeStatsArray, next) => {
    console.log(root, nodeStatsArray);
    next();
  });

  walker.on("end", () => {
    deferred.resolve();
  });

  return deferred.promise;
}

const directories = [
  '/Volumes/Mac 1',
  // '/Volumes/Macintosh HD 1',
  // '/Volumes/New Mac HD',
  // '/Volumes/New Volume',
  // '/Volumes/PC'
];

const promises = directories.map(hashDirectory);

q.all(promises).then(() => {
  console.log('');
  console.log('Writing output');
  fs.writeFileSync('./output_Mac_1.json', JSON.stringify(hashMap, null, 2), 'utf-8');
  console.log('All done');
});

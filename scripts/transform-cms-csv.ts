// scripts/transform-cms-csv.ts
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { Transform } from 'stream';

const inputPath = path.join(__dirname, '../data/cms_part_d_full.csv');
console.log('→ Reading CSV from:', inputPath);

// A Transform stream that on the first chunk strips BOM, and on every chunk normalizes CRLF → LF
let firstChunk = true;
const normalize = new Transform({
  transform(chunk, _encoding, callback) {
    let str = chunk.toString('utf8');
    if (firstChunk) {
      // remove BOM if present
      if (str.charCodeAt(0) === 0xFEFF) {
        str = str.slice(1);
      }
      firstChunk = false;
    }
    // normalize Windows line endings
    str = str.replace(/\r\n/g, '\n');
    callback(null, str);
  }
});

const results: any[] = [];

fs.createReadStream(inputPath)
  .pipe(normalize)               // ① strip BOM + normalize line endings
  .pipe(csv({
    mapHeaders: ({ header }) => header.trim(),  // you already trim whitespace here
    skipLines: 0,                              // adjust if you need to skip extra lines
  }))
  .on('data', row => {
    // debug: make sure rows are coming through
    console.log('🔍 RAW ROW:', Object.keys(row));
    if (results.length < 5) results.push(row);
  })
  .on('end', () => {
    console.log('\n✅ Finished parsing. Sample rows:\n', results);
    // here you can transform `results` into your JSON shape and write it out:
    // fs.writeFileSync('data/medicare_part_d.json', JSON.stringify(results, null, 2));
  })
  .on('error', err => {
    console.error('❌ Parse error:', err);
  });

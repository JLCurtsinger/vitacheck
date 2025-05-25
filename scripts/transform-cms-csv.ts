import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

const results: any[] = [];

const inputPath = path.join(__dirname, '../data/cms_part_d_full.csv');

fs.createReadStream(inputPath)
  .pipe(csv({
    mapHeaders: ({ header }) => header?.trim().replace(/^\uFEFF/, ''), // remove BOM + trim
  }))
  .on('data', (row) => {
    console.log('\n🔍 RAW ROW:', row);
    console.log('🔑 Keys:', Object.keys(row));

    if (results.length < 5) results.push(row);
  })
  .on('end', () => {
    console.log('\n✅ Finished parsing. Sample rows:\n', results);
  });

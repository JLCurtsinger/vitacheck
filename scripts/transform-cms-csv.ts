import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

const results: any[] = [];

function normalizeDrugName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/gi, '').trim();
}

// Adjust the file path if needed
const inputPath = path.join(__dirname, '../data/cms_part_d_full.csv');
const outputPath = path.join(__dirname, '../data/cms_usage_data.json');

fs.createReadStream(inputPath)
  .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
  .on('data', (row) => {
    if (results.length < 5) {
      console.log("\n🔍 Sample row:");
      console.log(row);
      console.log("🔑 Keys:", Object.keys(row));
    }
  
    const beneficiaries = parseInt(row.Tot_Benes_2022 || '0', 10);
    if (!row.Gnrc_Name || beneficiaries === 0) return;
  
    results.push({
      brand_name: row.Brnd_Name,
      generic_name: row.Gnrc_Name,
      normalized_name: normalizeDrugName(row.Gnrc_Name),
      total_beneficiaries: beneficiaries,
      total_claims: parseInt(row.Tot_Clms_2022 || '0', 10),
      total_dosage_units: parseInt(row.Tot_Dsg_Unts_2022 || '0', 10),
      total_spending: parseFloat(row.Tot_Spndng_2022 || '0'),
      avg_spend_per_dosage_unit: parseFloat(row.Avg_Spnd_Per_Dsg_Unt_Wghtd_2022 || '0'),
      year: 2022,
      source: 'CMS Medicare Part D'
    });
  })
  .on('end', () => {
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`✅ Done. Converted ${results.length} rows to ${outputPath}`);
  });

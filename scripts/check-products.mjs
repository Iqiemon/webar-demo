// Validates products.json and the asset files it points to. Exit 1 on any error.
import fs from 'node:fs';
import { validateProducts } from '../js/catalog.js';

const MAX_GLB = 5 * 1024 * 1024; // spec: "a GLB file under about 5 MB"
const POSTERS_REQUIRED = false;  // set true once posters exist (Task 7)

const products = JSON.parse(fs.readFileSync('products.json', 'utf8'));
const errors = validateProducts(products), warnings = [];
for (const p of Array.isArray(products) ? products : []) {
  if (!fs.existsSync(p.model)) errors.push(`${p.id}: model missing (${p.model})`);
  else if (fs.statSync(p.model).size > MAX_GLB) errors.push(`${p.id}: model is ${(fs.statSync(p.model).size / 1048576).toFixed(1)} MB, over 5 MB`);
  if (!fs.existsSync(p.poster)) (POSTERS_REQUIRED ? errors : warnings).push(`${p.id}: poster missing (${p.poster})`);
}
for (const w of warnings) console.log(`warning: ${w}`);
for (const e of errors) console.log(`error: ${e}`);
console.log(errors.length ? `${errors.length} error(s)` : 'products ok');
process.exit(errors.length ? 1 : 0);

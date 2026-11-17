// Renders each product's loading poster from its own product page in headless Chrome: npm run posters
import fs from 'node:fs';
import path from 'node:path';
import { withPage, closeAll, waitLoaded } from '../tests/helpers/browser.mjs';

const products = JSON.parse(fs.readFileSync('products.json', 'utf8'));
try {
  for (const p of products) {
    await withPage(`/product.html?p=${encodeURIComponent(p.id)}`, async page => {
      await page.setViewport({ width: 1200, height: 900 });
      await waitLoaded(page, '#viewer', 60000);
      const dataUrl = await page.$eval('#viewer', async el => {
        const blob = await el.toBlob({ mimeType: 'image/webp', qualityArgument: 0.85, idealAspect: true });
        return new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
      });
      fs.mkdirSync(path.dirname(p.poster), { recursive: true });
      fs.writeFileSync(p.poster, Buffer.from(dataUrl.split(',')[1], 'base64'));
      console.log(`wrote ${p.poster} (${Math.round(fs.statSync(p.poster).size / 1024)} KB)`);
    });
  }
} finally {
  await closeAll();
}

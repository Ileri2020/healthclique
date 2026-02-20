import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import * as cheerio from 'cheerio'

const prisma = new PrismaClient()

async function main() {
    const files = [
        'onehealth_batch_a.json',
        'onehealth_batch_e.json',
        'onehealth_batch_i.json',
        'onehealth_batch_o.json',
        'onehealth_batch_u.json'
    ]

    const idToSampleUrl: Record<number, string> = {}
    
    console.log("Gathering brand IDs and sample URLs...");
    for (const fileName of files) {
        const dataPath = path.join(process.cwd(), fileName)
        if (!fs.existsSync(dataPath)) continue

        const rawData = fs.readFileSync(dataPath, 'utf-8')
        const json = JSON.parse(rawData)
        const products = json.value || []

        for (const item of products) {
            const p = item.searchable
            if (p?.brand_id && !idToSampleUrl[p.brand_id]) {
                idToSampleUrl[p.brand_id] = p.url || `https://onehealthng.com/product/${p.slug}`
            }
        }
    }

    const brandMap: Record<string, string> = {}
    const ids = Object.keys(idToSampleUrl)
    console.log(`Found ${ids.length} unique brand IDs. Starting scrape...`);

    for (let i = 0; i < ids.length; i++) {
        const id = ids[i]
        const url = idToSampleUrl[parseInt(id)]
        console.log(`[${i + 1}/${ids.length}] Scraping ID ${id} from ${url}...`);

        try {
            const { data } = await axios.get(url, { 
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
                }
            });
            const $ = cheerio.load(data);
            
            // On OneHealth, the brand link usually has href containing "/brand/"
            const brandName = $('a[href^="/brand/"]').first().text().trim();
            
            if (brandName) {
                brandMap[`Brand_${id}`] = brandName;
                console.log(`  Mapped Brand_${id} -> ${brandName}`);
            } else {
                // Sometimes it's just text or in breadcrumbs
                const text = $('body').text();
                // We'll fallback to Ingredient map if we can't find brand? No, let's keep it empty or try another selector
                console.warn(`  Could not find brand name for ID ${id}`);
            }
        } catch (e: any) {
            console.error(`  Error scraping ID ${id}: ${e.message}`);
        }

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    fs.writeFileSync(path.join(process.cwd(), 'prisma/brand_map.json'), JSON.stringify(brandMap, null, 2));
    console.log("Scrape complete. Map saved to prisma/brand_map.json");
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());

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
    
    console.log("Gathering ingredient IDs and sample URLs...");
    for (const fileName of files) {
        const dataPath = path.join(process.cwd(), fileName)
        if (!fs.existsSync(dataPath)) continue

        const rawData = fs.readFileSync(dataPath, 'utf-8')
        const json = JSON.parse(rawData)
        const products = json.value || []

        for (const item of products) {
            const p = item.searchable
            if (p?.ingredient_id && !idToSampleUrl[p.ingredient_id]) {
                idToSampleUrl[p.ingredient_id] = p.url || `https://onehealthng.com/product/${p.slug}`
            }
        }
    }

    const ingredientMap: Record<string, string> = {}
    const ids = Object.keys(idToSampleUrl)
    console.log(`Found ${ids.length} unique ingredient IDs. Starting scrape...`);

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
            
            // Selector identified by browser subagent
            const ingredientName = $('a[href^="/ingredient/"]').first().text().trim();
            
            if (ingredientName) {
                ingredientMap[`Ingredient_${id}`] = ingredientName;
                console.log(`  Mapped Ingredient_${id} -> ${ingredientName}`);
            } else {
                console.warn(`  Could not find ingredient name for ID ${id}`);
            }
        } catch (e: any) {
            console.error(`  Error scraping ID ${id}: ${e.message}`);
        }

        // Small delay
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    fs.writeFileSync(path.join(process.cwd(), 'prisma/ingredient_map.json'), JSON.stringify(ingredientMap, null, 2));
    console.log("Scrape complete. Map saved to prisma/ingredient_map.json");
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());

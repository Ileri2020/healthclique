import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
    const mapPath = path.join(process.cwd(), 'prisma/brand_map.json')
    if (!fs.existsSync(mapPath)) {
        console.error("Map file not found! Run scrape_brands.ts first.");
        return;
    }

    const brandMap = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
    console.log(`Loaded brand map with ${Object.keys(brandMap).length} entries.`);

    // Find all products that have brands like "Brand_"
    const products = await prisma.product.findMany({
        where: {
            brand: {
                startsWith: 'Brand_'
            }
        }
    });

    console.log(`Found ${products.length} products to update.`);

    let totalUpdated = 0;
    for (const product of products) {
        if (product.brand && brandMap[product.brand]) {
            const newBrand = brandMap[product.brand];
            
            await prisma.product.update({
                where: { id: product.id },
                data: {
                    brand: newBrand
                }
            });
            totalUpdated++;
            if (totalUpdated % 50 === 0) console.log(`  Updated ${totalUpdated} products...`);
        }
    }

    console.log(`Update complete. Total products modified: ${totalUpdated}`);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());

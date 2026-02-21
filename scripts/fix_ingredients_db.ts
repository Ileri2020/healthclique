import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
    const mapPath = path.join(process.cwd(), 'prisma/ingredient_map.json')
    if (!fs.existsSync(mapPath)) {
        console.error("Map file not found! Run scrape_ingredients.ts first.");
        return;
    }

    const ingredientMap = JSON.parse(fs.readFileSync(mapPath, 'utf-8'));
    console.log(`Loaded map with ${Object.keys(ingredientMap).length} entries.`);

    // Find all products that have active ingredients containing "Ingredient_"
    const products = await prisma.product.findMany({
        where: {
            activeIngredients: {
                hasSome: Object.keys(ingredientMap)
            }
        }
    });

    console.log(`Found ${products.length} products to update.`);

    let totalUpdated = 0;
    for (const product of products) {
        const newIngredients = product.activeIngredients.map((ing: string) => {
            if (ing.startsWith('Ingredient_') && ingredientMap[ing]) {
                return ingredientMap[ing];
            }
            return ing;
        });

        // Ensure we only have unique names
        const uniqueIngredients = [...new Set(newIngredients)];

        if (JSON.stringify(product.activeIngredients) !== JSON.stringify(uniqueIngredients)) {
            await prisma.product.update({
                where: { id: product.id },
                data: {
                    activeIngredients: uniqueIngredients
                }
            });
            totalUpdated++;
            if (totalUpdated % 50 === 0) console.log(`  Updated ${totalUpdated} products...`);
        }
    }

    console.log(`Update complete. Total products modified: ${totalUpdated}`);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());

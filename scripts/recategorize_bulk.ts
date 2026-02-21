import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import * as cheerio from 'cheerio'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const prisma = new PrismaClient()

async function scrapeCategory(url: string) {
    const productsInCat: string[] = [];
    let currentPage = 1;
    let hasNext = true;

    while (hasNext && currentPage <= 5) { // Limit to 5 pages per category to avoid timeout
        let retries = 2;
        let success = false;
        
        while (retries > 0 && !success) {
            try {
                const pageUrl = currentPage === 1 ? url : `${url}?page=${currentPage}`;
                console.log(`  Scraping page ${currentPage}: ${pageUrl} (Retries left: ${retries-1})`);
                const { data } = await axios.get(pageUrl, { 
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.9',
                    }
                });
                const $ = cheerio.load(data);
                
                const items: string[] = [];
                
                $('.product-card').each((i, el) => {
                    const card = $(el);
                    
                    // 1. Try to find the full name in the button's productdata attribute
                    const productData = card.find('button.add_to_cart').attr('productdata');
                    if (productData) {
                        try {
                            const parsed = JSON.parse(productData);
                            if (parsed.name) {
                                items.push(parsed.name.trim());
                                return; // Move to next card
                            }
                        } catch (e) {}
                    }
                    
                    // 2. Try the image alt attribute (usually contains full name)
                    const altName = card.find('img').attr('alt');
                    if (altName && altName.length > 5) {
                        items.push(altName.trim());
                        return;
                    }
                    
                    // 3. Fallback selectors for text
                    const textName = card.find('.text-dark-blue p, .product-title, h4').first().text().trim();
                    if (textName) {
                        items.push(textName);
                    }
                });
                
                if (items.length > 0) {
                    productsInCat.push(...items);
                    console.log(`    Extracted ${items.length} products`);
                }

                const nextBtn = $('a.next, .pagination .next, a:contains("Next")');
                const hasNextLink = nextBtn.length > 0;
                if (!hasNextLink) hasNext = false;
                
                currentPage++;
                if (items.length < 5 && currentPage > 1) hasNext = false; 
                success = true;

                // Small delay between pages
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (e: any) {
                console.error(`    Attempt failed: ${e.message}`);
                retries--;
                if (retries === 0) {
                    hasNext = false;
                } else {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }
    }
    return [...new Set(productsInCat)];
}

async function main() {
    const categoryMap = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'onehealth_category_map.json'), 'utf-8'));
    
    console.log(`Starting bulk recategorization for ${categoryMap.length} categories...`);

    for (const cat of categoryMap) {
        // Skip if category already has products to save time
        const existingCount = await prisma.product.count({
            where: { category: { name: cat.name } }
        });
        
        if (existingCount > 0) {
            console.log(`Skipping Category: ${cat.name} (already has ${existingCount} products)`);
            continue;
        }

        console.log(`Processing Category: ${cat.name}`);
        
        // Ensure category exists in our DB
        const dbCat = await prisma.category.upsert({
            where: { name: cat.name },
            update: {},
            create: { name: cat.name }
        });

        const productNames = await scrapeCategory(cat.url);
        console.log(`  Found ${productNames.length} products on OneHealth`);

        let updatedCount = 0;
        for (const name of productNames) {
            if (!name) continue;
            // Escape special regex characters to avoid Prisma P2010 / MongoDB Invalid Regex error
            const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

            // Find products in our DB that match this name
            const matches = await prisma.product.findMany({
                where: {
                    name: { contains: escapedName, mode: 'insensitive' }
                }
            });

            for (const p of matches) {
                await prisma.product.update({
                    where: { id: p.id },
                    data: { categoryId: dbCat.id }
                });
                updatedCount++;
            }
        }
        console.log(`  Mapped ${updatedCount} products to ${cat.name}`);
    }

    console.log("Recategorization complete!");
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());

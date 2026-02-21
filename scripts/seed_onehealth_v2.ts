import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const prisma = new PrismaClient()

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

const REF_DATA = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'onehealth_ref.json'), 'utf-8'));

async function uploadToCloudinary(url: string, publicId: string) {
  try {
    const result = await cloudinary.uploader.upload(url, {
      public_id: publicId,
      folder: 'healthclique/products',
      overwrite: true
    })
    return result.secure_url
  } catch (e) {
    console.error(`Cloudinary upload failed for ${url}:`, e)
    return url // fallback to original
  }
}

async function scrapeDetailPage(url: string) {
  try {
    const { data } = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(data);
    
    // 1. Description
    const description = $('#overview').nextUntil('h6, h5, h4, h3').text().trim() || 
                        $('meta[name="description"]').attr('content') || '';

    // 2. Active Ingredients
    const pageText = $('body').text();
    const ingredientMatch = pageText.match(/Active Ingredients \(.*?\): (.*)/i) || 
                          pageText.match(/Ingredient: (.*)/i) ||
                          pageText.match(/Active Ingredient: (.*)/i);
    
    let activeIngredients: string[] = [];
    if (ingredientMatch) {
        const rawIng = ingredientMatch[1].split(/[,\n]/);
        activeIngredients = rawIng.map(i => i.trim()).filter(i => i.length > 0);
    }

    // Attempt to match against our reference list
    const matchedIngredients = REF_DATA.ingredients.filter((ing: string) => 
        pageText.toLowerCase().includes(ing.toLowerCase())
    );
    activeIngredients = [...new Set([...activeIngredients, ...matchedIngredients])];

    // 3. Category from Breadcrumbs
    const breadcrumbs = $('.breadcrumb-item').map((i, el) => $(el).text().trim()).get();
    let categoryName = breadcrumbs.find(b => REF_DATA.categories.includes(b)) || 'Pharmacy Medication';

    // 4. Brand from text
    const brandName = REF_DATA.brands.find((b: string) => pageText.toLowerCase().includes(b.toLowerCase())) || 'General';

    return {
      description,
      activeIngredients,
      categoryName,
      brandName
    };
  } catch (e) {
    console.error(`Failed to scrape ${url}`);
    return null;
  }
}

async function main() {
  const batchFiles = [
    'onehealth_batch_a.json',
    'onehealth_batch_e.json',
    'onehealth_batch_i.json',
    'onehealth_batch_o.json',
    'onehealth_batch_u.json'
  ];

  const allProducts: any[] = [];
  const seenSlugs = new Set<string>();

  for (const file of batchFiles) {
    const filePath = path.join(process.cwd(), file);
    if (!fs.existsSync(filePath)) continue;
    const json = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const items = json.value || [];
    for (const item of items) {
      if (!seenSlugs.has(item.searchable.slug)) {
        allProducts.push(item.searchable);
        seenSlugs.add(item.searchable.slug);
      }
    }
  }

  console.log(`Unique products to process: ${allProducts.length}`);

  // Get all categories from DB for reference
  const dbCategories = await prisma.category.findMany();
  const categoryMap = new Map(dbCategories.map(c => [c.name, c.id]));

  for (let i = 0; i < allProducts.length; i++) {
    const p = allProducts[i];
    console.log(`[${i+1}/${allProducts.length}] Processing: ${p.name}`);

    // Scrape details
    const details = await scrapeDetailPage(p.url || `https://onehealthng.com/product/${p.slug}`);
    
    // Cloudinary Upload
    let imageUrl = p.image;
    if (p.image) {
        imageUrl = await uploadToCloudinary(p.image, p.slug);
    }

    const catName = details?.categoryName || 'Pharmacy Medication';
    let catId = categoryMap.get(catName);
    
    // If category not found, ensure it exists
    if (!catId) {
        const newCat = await prisma.category.upsert({
            where: { name: catName },
            update: {},
            create: { name: catName }
        });
        catId = newCat.id;
        categoryMap.set(catName, catId);
    }

    try {
        await prisma.product.upsert({
            where: { id: p.id.toString().padEnd(24, '0') }, // Ensure valid ObjectID format if needed, but we'll let Prisma handle auto-id if possible
            // Actually, we'll use name as unique check or just update if exists
            //@ts-ignore
            create: {
                name: p.name,
                description: details?.description || p.brief_info || '',
                price: p.amount || 0,
                categoryId: catId,
                brand: details?.brandName || 'General',
                images: [imageUrl],
                activeIngredients: details?.activeIngredients || []
            },
            update: {
                description: details?.description || p.brief_info || '',
                price: p.amount || 0,
                categoryId: catId,
                brand: details?.brandName || 'General',
                images: [imageUrl],
                activeIngredients: details?.activeIngredients || []
            }
        });
    } catch (err) {
        // Fallback to searching by name if ID strategy fails
        const existing = await prisma.product.findFirst({ where: { name: p.name } });
        if (existing) {
            await prisma.product.update({
                where: { id: existing.id },
                data: {
                    description: details?.description || p.brief_info || '',
                    price: p.amount || 0,
                    categoryId: catId,
                    brand: details?.brandName || 'General',
                    images: [imageUrl],
                    activeIngredients: details?.activeIngredients || []
                }
            });
        } else {
             await prisma.product.create({
                data: {
                    name: p.name,
                    description: details?.description || p.brief_info || '',
                    price: p.amount || 0,
                    categoryId: catId,
                    brand: details?.brandName || 'General',
                    images: [imageUrl],
                    activeIngredients: details?.activeIngredients || []
                }
            });
        }
    }
    
    // Small delay to avoid blockage
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log("Seeding complete!");
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());

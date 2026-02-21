import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  const files = [
    'onehealth_batch_a.json',
    'onehealth_batch_e.json',
    'onehealth_batch_i.json',
    'onehealth_batch_o.json',
    'onehealth_batch_u.json'
  ]

  const category = await prisma.category.upsert({
    where: { name: 'Pharmacy' },
    update: {},
    create: {
      name: 'Pharmacy',
      description: 'Imported products from OneHealth Search API',
    },
  })

  console.log(`Using Category: ${category.name} (${category.id})`)

  const seenIds = new Set<string>()

  for (const fileName of files) {
    const dataPath = path.join(process.cwd(), fileName)
    if (!fs.existsSync(dataPath)) continue

    console.log(`Processing ${fileName}...`)
    const rawData = fs.readFileSync(dataPath, 'utf-8')
    let json
    try {
        json = JSON.parse(rawData)
    } catch (e) {
        console.error(`Failed to parse ${fileName}`)
        continue
    }
    
    const products = json.value || []

    for (const item of products) {
      const p = item.searchable
      if (!p || !p.name) continue
      
      // Use name as a unique check for this session to avoid duplicates from overlapping searches
      if (seenIds.has(p.name)) continue
      seenIds.add(p.name)

      const price = typeof p.amount === 'number' ? p.amount : 0

      try {
        const product = await prisma.product.create({
          data: {
            name: p.name,
            description: p.brief_info || p.description || '',
            price: price,
            categoryId: category.id,
            brand: p.brand_id ? `Brand_${p.brand_id}` : 'General',
            images: p.image ? [p.image] : [],
            activeIngredients: p.ingredient_id ? [`Ingredient_${p.ingredient_id}`] : [],
          },
        })
        console.log(`Imported: ${product.name}`)
      } catch (error) {
        // If it fails (e.g. unique constraint if name was unique, though it isn't in schema), just skip
        console.log(`Skipped (likely exists): ${p.name}`)
      }
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

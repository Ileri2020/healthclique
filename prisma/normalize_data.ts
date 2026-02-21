import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

const CATEGORY_KEYWORDS: Record<string, string[]> = {
    "Gut Health": ["Dulcolax", "Laxative", "Constipation", "Indigestion", "Gas", "Antacid", "Gaviscon", "Omeprazole", "Digestive", "Diarrhea", "Probiotic", "Stomach", "Worm", "Albendazole", "Zentel", "Ketoconazole"],
    "Cough, Cold & Flu": ["Cough", "Cold", "Flu", "Catarrh", "Sinus", "Bronchitis", "Mucous", "Strepsils", "Lozenges", "Throat", "Panadol Multi-Symptom", "Beecham", "DayQuil", "NyQuil", "Decongestion", "Expectorant"],
    "Pain Relief": ["Pain", "Headache", "Ache", "Fever", "Paracetamol", "Ibuprofen", "Diclofenac", "Aspirin", "Naproxen", "Panadol", "Analgesic", "Joint Pain", "Muscle Pain", "Tramadol", "Codeine", "Felvin"],
    "Eye Care": ["Eye", "Ophthalmic", "Drops", "Visine", "Contact Lens", "Vision", "Redness", "Itchy Eye", "Optrex"],
    "First Aid": ["Antiseptic", "Plaster", "Bandage", "Dettol", "Wound", "Savlon", "Iodine", "Cotton Wool", "Surgical", "First Aid", "Alcohol Swabs", "Gauze", "Methylated Spirit"],
    "Skin Treatment": ["Cream", "Ointment", "Eczema", "Fungal", "Acne", "Rash", "Itch", "Hydrocortisone", "Clotrimazole", "Ketoconazole", "Skineal", "Funbact", "Calamine", "Lotion"],
    "Malaria Medications": ["Malaria", "Artemether", "Lumefantrine", "Amatem", "Lonart", "Coartem", "P-Alaxin", "Quinine", "Mosquito", "Malareich"],
    "Allergy & Hayfever": ["Allergy", "Antihistamine", "Hayfever", "Loratadine", "Cetirizine", "Itching", "Sneezing", "Clarityn", "Piriton", "Chlorpheniramine"],
    "Vitamins": ["Vitamin", "Supplement", "Multivitamin", "Mineral", "Zinc", "Magnesium", "Calcium", "Omega", "Fish Oil", "Centrum", "Nature's Bounty", "Reload", "Wellman", "Wellwoman", "Cod Liver", "A-Z", "B-Complex"],
    "Sexual Health": ["Condom", "Pregnancy Test", "Contraceptive", "Postinor", "Lubricant", "Durex", "Rough Rider", "HIV Test", "Emergency Pill", "Levonorgestrel", "Postpill"],
    "Her Health": ["Women", "Female", "Menstrual", "Period", "Vaginal", "Maternity", "Pregnancy", "Tampon", "Sanitary", "Eve's Desire", "Feminine"],
    "His Health": ["Men", "Male", "Prostate", "Erectile", "Performance", "Wellman", "Vigor", "Tadalafil", "Sildenafil", "Manix"],
    "Dental": ["Toothpaste", "Toothbrush", "Mouthwash", "Dental", "Gum", "Oral-B", "Colgate", "Sensodyne", "Close-Up", "Oral Care"],
    "Deodorants": ["Deodorant", "Antiperspirant", "Roll-on", "Spray", "Nivea", "Sure", "Rexona", "Old Spice"],
    "Baby & Child Health": ["Baby", "Kid", "Child", "Infant", "Teething", "Nappy", "Wipe", "Pampers", "Huggies", "Cerelac", "SMA", "Nan", "Baby Lotion"],
    "Hair Health": ["Shampoo", "Conditioner", "Hair", "Scalp", "Dandruff", "Wig", "Braids", "Relaxer"]
};

async function main() {
    const categories = await prisma.category.findMany();
    const categoryMap = new Map(categories.map(c => [c.name, c.id]));

    const products = await prisma.product.findMany({
        where: {
            OR: [
                { category: { name: 'Pharmacy' } },
                { category: { name: 'Pharmacy Medication' } },
                { category: { name: 'Health & Pharmacy' } }
            ]
        },
        include: { category: true }
    });

    console.log(`Analyzing ${products.length} products for better categorization...`);

    let totalUpdated = 0;
    for (const product of products) {
        try {
            let matchedCategory = null;
            const searchStr = `${product.name} ${product.description} ${product.activeIngredients.join(' ')}`.toLowerCase();

            for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
                if (keywords.some(k => searchStr.includes(k.toLowerCase()))) {
                    matchedCategory = catName;
                    break;
                }
            }

            if (matchedCategory) {
                let catId = categoryMap.get(matchedCategory);
                if (!catId) {
                    const newCat = await prisma.category.create({ data: { name: matchedCategory } });
                    catId = newCat.id;
                    categoryMap.set(matchedCategory, catId);
                }
                await prisma.product.update({ where: { id: product.id }, data: { categoryId: catId } });
                totalUpdated++;
            }
        } catch (e) {
            console.error(`Error updating product category ${product.name}:`, e);
        }
    }
    console.log(`Recategorization complete. Updated ${totalUpdated} products.`);

    const refData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'onehealth_ref.json'), 'utf-8'));
    const allProducts = await prisma.product.findMany({
        where: {
            OR: [
                { brand: "Brand" },
                { brand: "General" },
                { brand: { startsWith: "Brand_" } },
                { brand: null }
            ]
        }
    });

    console.log(`Analyzing brands for ${allProducts.length} products...`);
    let brandUpdated = 0;
    for (const p of allProducts) {
        try {
            const searchStr = `${p.name} ${p.description}`.toLowerCase();
            let foundBrand = refData.brands.find((b: string) => searchStr.includes(b.toLowerCase()));
            
            if (!foundBrand) {
                const firstWord = p.name.split(' ')[0];
                if (firstWord.length > 3 && !['THE', 'FOR', 'AND', 'WITH', 'MADE'].includes(firstWord.toUpperCase())) {
                    foundBrand = firstWord;
                }
            }

            if (foundBrand) {
                await prisma.product.update({ where: { id: p.id }, data: { brand: foundBrand } });
                brandUpdated++;
            }
        } catch (e) {
            console.error(`Error updating brand for ${p.name}:`, e);
        }
    }
    console.log(`Brand normalization complete. Updated ${brandUpdated} products.`);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());


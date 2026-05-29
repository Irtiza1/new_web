
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const sharp = require('sharp');

// 1. Load Environment Variables
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '../.env.local');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const envVars = {};
        envFile.split('\n').forEach(line => {
            if (line && !line.startsWith('#')) {
                const [key, ...values] = line.split('=');
                if (key && values.length > 0) {
                    envVars[key.trim()] = values.join('=').trim().replace(/(^"|"$)/g, '');
                }
            }
        });
        return envVars;
    } catch (e) {
        console.error("Error loading .env.local:", e);
        return {};
    }
}

const env = loadEnv();
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or Key in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Configuration
const IMAGES_DIR = '/Users/muhammadirtiza/Archive/me/website/new_web/item_image';
const STORAGE_BUCKET = 'media';
const STORAGE_FOLDER = 'products';

// 3. Main Function
async function importImages() {
    console.log(`Scanning directory: ${IMAGES_DIR}`);

    if (!fs.existsSync(IMAGES_DIR)) {
        console.error("Directory not found!");
        return;
    }

    const files = fs.readdirSync(IMAGES_DIR);
    const imageFiles = files.filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));

    console.log(`Found ${imageFiles.length} images.`);

    // Check Buckets
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
        console.error("Error listing buckets:", bucketError.message);
        return;
    }

    const mediaBucket = buckets ? buckets.find(b => b.name === STORAGE_BUCKET) : null;

    if (!mediaBucket) {
        console.warn(`\nWARNING: Bucket '${STORAGE_BUCKET}' not found in list (likely due to permissions).`);
        console.log("Attempting to upload anyway...");
    } else {
        console.log(`Bucket '${STORAGE_BUCKET}' found. Proceeding with import...`);
    }

    for (const [index, fileName] of imageFiles.entries()) {
        const filePath = path.join(IMAGES_DIR, fileName);
        const fileBuffer = fs.readFileSync(filePath);
        const baseName = path.basename(fileName, path.extname(fileName))
            .replace(/[^a-zA-Z0-9-]/g, '-')
            .toLowerCase()
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        const webpBuffer = await sharp(fileBuffer, { animated: false })
            .rotate()
            .resize({
                width: 2200,
                height: 2200,
                fit: 'inside',
                withoutEnlargement: true,
            })
            .webp({ quality: 84, effort: 4 })
            .toBuffer();
        const webpFileName = `imported_${Date.now()}_${index}_${baseName || 'image'}.webp`;

        // Generate a unique storage path
        const storagePath = `${STORAGE_FOLDER}/${webpFileName}`;

        console.log(`[${index + 1}/${imageFiles.length}] Converting and uploading ${fileName} as WebP...`);

        // A. Upload to Storage
        const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(storagePath, webpBuffer, {
                contentType: 'image/webp',
                upsert: true
            });

        if (uploadError) {
            console.error(`  Upload failed for ${fileName}:`, uploadError.message);
            continue;
        }

        // B. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(storagePath);

        console.log(`  Uploaded: ${publicUrl}`);

        // C. Create Product Record
        const productData = {
            id: crypto.randomUUID(), // Generate UUID
            name: `Imported Leather Item ${index + 1}`,
            description: "Genuine leather product imported from collection.",
            price: Math.floor(Math.random() * (500 - 100) + 100), // Random price $100-$500
            category: "Uncategorized",
            image: publicUrl,
            stock: 10,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const { data: product, error: productError } = await supabase
            .from('Product')
            .insert([productData])
            .select()
            .single();

        if (productError) {
            console.error(`  Failed to create product for ${fileName}:`, productError.message);
        } else {
            console.log(`  Created Product: ${product.name} (ID: ${product.id})`);
        }

        // D. Create Media Record
        await supabase
            .from('media_files')
            .insert([{
                filename: webpFileName,
                url: publicUrl,
                size: webpBuffer.length,
                content_type: 'image/webp',
                folder: STORAGE_FOLDER
            }]);
    }

    console.log("\nImport completed!");
}

importImages().catch(console.error);

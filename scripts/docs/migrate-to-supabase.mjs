import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { parseFrontmatter } = require('../../netlify/functions/_lib/frontmatter.js');

const SUPABASE_URL = process.env.SUPABASE_URL || "https://tasapyurqvkviblnaymt.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "sb_publishable_E056pt4Dp5w3nTBEkYpRSA_scTTtrfa";

const PUBLIC_DIR = 'docs_content_temp';
// const PRIVATE_DIR = 'docs_content_temp/private'; // Example

async function upsertPost(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Error upserting to ${table}: ${res.status} ${errorText}`);
    return false;
  }
  return true;
}

async function migrateFolder(dir, table, isPrivate = false) {
  if (!fs.existsSync(dir)) {
    console.log(`Directory ${dir} not found, skipping.`);
    return;
  }

  const files = fs.readdirSync(dir, { recursive: true });
  for (const file of files) {
    if (!file.endsWith('.md')) continue;

    const fullPath = path.join(dir, file);
    const slug = file.replace(/\.md$/, '').replace(/\\/g, '/');
    const rawContent = fs.readFileSync(fullPath, 'utf-8');
    const { meta, content } = parseFrontmatter(rawContent);

    const postData = {
      slug,
      title: meta.title || slug,
      date: meta.date || new Date().toISOString().split('T')[0],
      category: meta.category || 'Uncategorized',
      content: content.trim(),
    };

    if (isPrivate) {
      postData.excerpt = meta.excerpt || '';
      // Password handling
      if (meta.password) {
        await upsertPost('posts_password', { slug, password: meta.password });
      }
    } else {
      postData.description = meta.description || '';
      postData.thumbnail = meta.thumbnail || '';
    }

    const success = await upsertPost(table, postData);
    if (success) {
      console.log(`Successfully migrated: ${slug} -> ${table}`);
    }
  }
}

async function main() {
  console.log('Starting migration to Supabase...');
  await migrateFolder(PUBLIC_DIR, 'public_posts', false);
  // await migrateFolder(PRIVATE_DIR, 'private_posts', true);
  console.log('Migration finished.');
}

main().catch(console.error);

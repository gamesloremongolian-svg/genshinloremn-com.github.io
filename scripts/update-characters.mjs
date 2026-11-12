import fs from 'node:fs/promises';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const base = 'https://genshin.jmp.blue';

const slug = (name) =>
  String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

function normalize(c) {
  const id = slug(c.name);
  const icon = c.images?.filename_icon;
  return {
    id,
    name: c.name || id,
    title: c.title || '',
    vision: c.elementText || '',
    weapon: c.weaponText || '',
    nation: c.region || '',
    rarity: c.rarity != null ? Number(c.rarity) : null,
    constellation: c.constellation || '',
    birthday: c.birthday || '',
    description: c.description || '',
    affiliation: c.affiliation || '',
    image: icon
      ? `https://enka.network/ui/${icon}.png`
      : `${base}/characters/${encodeURIComponent(id)}/icon-big`
  };
}

// Өмнөх мэдээллийн санг уншина.
let previous = null;
try {
  previous = JSON.parse(await fs.readFile('characters-auto.json', 'utf8'));
} catch {
  console.log('No previous database found.');
}

try {
  const loaded = require('genshin-db');
  const gdb = loaded.default ?? loaded;

  let list = gdb.characters('names', {
    matchCategories: true,
    verboseCategories: true
  });

  if (!Array.isArray(list)) list = [];

  // Зарим хувилбар нэрсийн жагсаалт буцаадаг тул дүр бүрийг тусад нь авна.
  if (list.length && typeof list[0] === 'string') {
    list = list.map((n) => gdb.characters(n)).filter(Boolean);
  }

  let characters = list
    .filter((c) => c && typeof c === 'object' && c.name)
    .map(normalize);

  console.log(`genshin-db: ${characters.length} characters`);

  if (characters.length < 50) {
    throw new Error(`Too few characters received: ${characters.length}`);
  }

  // Давхардсан ID-г арилгаж, эрэмбэлнэ.
  characters = [...new Map(characters.map((c) => [c.id, c])).values()];
  characters.sort((a, b) => a.id.localeCompare(b.id));

  // Өмнөхөөс хэт их буурсан эсэхийг шалгана.
  if (
    previous &&
    Number.isFinite(previous.count) &&
    previous.count > 0 &&
    characters.length < previous.count * 0.8
  ) {
    throw new Error(
      `Suspicious character drop: ${previous.count} -> ${characters.length}`
    );
  }

  const same =
    previous &&
    JSON.stringify(previous.characters) === JSON.stringify(characters);

  const output = {
    updatedAt: same ? previous.updatedAt : new Date().toISOString(),
    count: characters.length,
    source: 'genshin-db',
    characters
  };

  await fs.writeFile(
    'characters-auto.json',
    JSON.stringify(output, null, 2) + '\n'
  );

  console.log(
    same
      ? 'No changes. Kept previous update date.'
      : `Saved ${characters.length} characters.`
  );
} catch (error) {
  if (previous) {
    // Өмнөх өгөгдлийг хэвээр үлдээж, workflow-г унагахгүй.
    console.log(`::warning::${error.message}. Previous database kept.`);
    process.exit(0);
  }
  throw error;
}

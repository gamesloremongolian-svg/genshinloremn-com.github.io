import fs from 'node:fs/promises';

const base = 'https://genshin.jmp.blue';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getJson(url, attempts = 3) {
  let lastError;
  for (let i = 1; i <= attempts; i++) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Genshin-Lore-Mongolian'
        },
        signal: AbortSignal.timeout(20000)
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${i}: ${error.message}`);
      if (i < attempts) await wait(2000 * i);
    }
  }
  throw lastError;
}

function normalize(id, c) {
  return {
    id,
    name: c.name || id,
    title: c.title || '',
    vision: c.vision || '',
    weapon: c.weapon || '',
    nation: c.nation || '',
    rarity: c.rarity ?? null,
    constellation: c.constellation || '',
    birthday: c.birthday || '',
    description: c.description || '',
    affiliation: c.affiliation || '',
    image: `${base}/characters/${encodeURIComponent(id)}/icon-big`
  };
}

// Өмнөх мэдээллийн санг уншина.
let previous = null;
try {
  previous = JSON.parse(await fs.readFile('characters-auto.json', 'utf8'));
} catch {
  console.log('No previous database found.');
}

let characters = [];

// Эхлээд бүх дүрийг нэг дор татна.
try {
  const data = await getJson(`${base}/characters/all?lang=en`);

  if (Array.isArray(data)) {
    characters = data
      .filter((c) => c && typeof c === 'object')
      .map((c, i) =>
        normalize(
          c.id || c.name?.toLowerCase().replaceAll(' ', '-') || String(i),
          c
        )
      );
  } else if (data && typeof data === 'object') {
    const source = data.characters ?? data;
    characters = Object.entries(source)
      .filter(([, c]) => c && typeof c === 'object')
      .map(([id, c]) => normalize(id, c));
  }
  console.log(`Bulk API: ${characters.length} characters`);
} catch (error) {
  console.log(`Bulk API failed: ${error.message}`);
}

// Нөөц хувилбар: дүр бүрийг тусад нь татна.
if (!characters.length) {
  console.log('Using individual character requests...');
  const names = await getJson(`${base}/characters`);

  if (!Array.isArray(names) || !names.length) {
    throw new Error('Character list is empty or not an array');
  }

  let skipped = 0;
  for (const id of names) {
    try {
      const c = await getJson(
        `${base}/characters/${encodeURIComponent(id)}?lang=en`,
        2
      );
      characters.push(normalize(id, c));
      await wait(150);
    } catch (error) {
      skipped++;
      console.log(`Skipped ${id}: ${error.message}`);
    }
  }

  if (skipped > names.length * 0.2) {
    throw new Error(`Too many characters skipped: ${skipped}/${names.length}`);
  }
}

if (!characters.length) {
  throw new Error('No character data received');
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

// Өөрчлөлт байгаа эсэхийг шалгана.
const same =
  previous &&
  JSON.stringify(previous.characters) === JSON.stringify(characters);

const output = {
  updatedAt: same ? previous.updatedAt : new Date().toISOString(),
  count: characters.length,
  source: base,
  characters
};

// Бүтцийг шалгана.
const ids = new Set();
for (const c of output.characters) {
  if (!c.id || !c.name) {
    throw new Error(`Character missing id or name: ${JSON.stringify(c)}`);
  }
  if (ids.has(c.id)) throw new Error(`Duplicate id: ${c.id}`);
  ids.add(c.id);
}

await fs.writeFile(
  'characters-auto.json',
  JSON.stringify(output, null, 2) + '\n'
);

console.log(
  same
    ? 'No changes. Kept previous update date.'
    : `Saved ${characters.length} characters.`
);

# Репозиторын бүтэц ба файлын үүрэг

Энэ баримт нь Games Lore MN репозиторын үндсэн файлуудыг хаанаас хайх, өөрчлөлт хийхдээ юуг хамгаалахыг тайлбарлана.

## Үндсэн хуудсууд

| Зам | Үүрэг |
|---|---|
| `index.html` | Нүүр хуудас |
| `lore-center.html` | Тоглоомуудын нэгдсэн Lore төв |
| `genshin.html` | Genshin Impact-ийн үндсэн хэсэг |
| `genshin-lore.html` | Genshin lore хуудас |
| `wuwa/index.html` | Wuthering Waves |
| `ananta/index.html` | ANANTA |
| `aniimo/index.html` | Aniimo |
| `delta-force/index.html` | Delta Force |
| `articles.html` | Нийтлэлийн жагсаалт |
| `article.html` | Нэг нийтлэлийн дэлгэрэнгүй |
| `character.html` | Нэг дүрийн дэлгэрэнгүй |
| `auth.html`, `signup.html` | Нэвтрэлт ба бүртгэл |
| `premium.html` | Premium хэсэг |

## Assets

- `assets/css/` — хуудсуудын загварын давхаргууд.
- `assets/js/posts.js` — нийтлэлийн өгөгдөл.
- `assets/js/script.js` — Genshin хуудасны цэс, хайлт зэрэг ерөнхий үйлдлүүд.
- `assets/images/` — тоглоомын фон, лого, дүр болон бүсийн зургууд.

CSS файлууд өөр өөр хуудсанд хэрэглэгдэж байгаа тул зөвхөн нэрээр нь дүгнэж устгаж болохгүй. HTML дахь `<link>`, CSS дахь `url(...)`, JavaScript дахь динамик замуудыг хамтад нь шалгана.

## Өгөгдөл ба автомат ажиллагаа

- `characters-auto.json` — Genshin дүрийн өгөгдлийн сан.
- `scripts/update-characters.mjs` — дүрийн мэдээллийг шинэчлэх скрипт.
- `.github/workflows/update-characters.yml` — өдөр тутмын болон гараар эхлүүлэх автомат workflow.
- `supabase/migrations/` — өгөгдлийн сангийн өөрчлөлтүүд.
- `supabase/functions/` — сервер талын Edge Functions.

## Root дахь хуучин URL-ууд

`ananta.html`, `aniimo.html`, `delta-force.html`, `wuwa.html`, `genshin-characters.html` зэрэг redirect хуудсуудыг шууд устгахгүй. Хуучин холбоос, bookmark болон хайлтын системийн индекс тэдгээрийг ашиглаж байж болно.

## Аюулгүй засварын дараалал

1. Одоогийн файлын хувилбар болон SHA-г татаж авна.
2. Файлын бүх хэрэглээг хайна.
3. Зам өөрчлөгдвөл холбоос ашиглаж буй бүх файлыг шинэчилнэ.
4. GitHub Pages дээрх URL болон хуудасны ачаалалтыг шалгана.
5. Дараа нь л хуучин файлыг устгана.

Нууц түлхүүр болон Supabase service-role key-г браузер талын кодод байрлуулахгүй.

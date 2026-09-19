# אתר שירה איבון טויטו

אתר סטטי (HTML/CSS/JS + GSAP, Lenis, Three.js), בלי build. הטקסטים והרשימות נטענים מ-`content/*.json` וניתנים לעריכה דרך Decap CMS ב-`/admin`.

## הרצה מקומית
```
python3 -m http.server 5173
```

## עריכת תוכן (/admin)
ממשק Sveltia CMS בעברית (אותו פורמט הגדרות של Decap), ב-`admin/config.yml`. כל שינוי נשמר כקומיט בריפו והאתר מתעדכן לבד.

מה אפשר לערוך:
- **טקסטים כלליים באתר:** כל הכותרות והפסקאות בכל מקטע (`content/site-text.json`)
- **פרטי קשר:** טלפון, הודעת וואטסאפ מוכנה, כתובת (`content/contact.json`)
- **הטיפולים:** כרטיסים, כל אחד עם הודעת וואטסאפ מוכנה וכפתור "לפרטים"
- **שלבי התהליך, שאלות ותשובות, המלצות**
- **גלריית תמונות** ו**סרטונים** (יוטיוב או קובץ, עם תמונה ממוזערת וכיוון)

**מקטעים שמוצגים רק כשיש להם תוכן:** המלצות, גלריה, סרטונים והסבר "עין הבדולח" (אם השדה ריק).

**העלאת כמה תמונות בבת אחת:** הכפתור הסגול בפינת ה-/admin, או `admin/bulk-images.html`. הכלי מתחבר עם אותה התחברות של ה-CMS, ומאפשר לבחור, לסדר, להעלות ולמחוק תמונות בגלריה.

**עבודה מקומית בלי התחברות:** `local_backend: true` ב-`config.yml`. פותחים את `/admin` מהשרת המקומי ובוחרים "עבודה עם תיקייה מקומית".

## פרסום (חד-פעמי)
1. ליצור ריפו `nhftk154/shira-toyto-site` ב-GitHub ולדחוף אליו את התיקייה.
2. להפעיל GitHub Pages (Settings, Pages, branch main).
3. הכניסה ל-`/admin` עוברת דרך OAuth proxy ייעודי לאתר הזה (`oauth-worker/`, ראו למטה). מי שנכנס חייב להיות חשבון GitHub עם הרשאת כתיבה לריפו.
4. לחבר דומיין אם רוצים (קובץ CNAME).

## נשאר לעשות (לחזור לזה)
- [x] **OAuth proxy לאדמין:** פרוס ומחובר (`shira-toyto-cms-auth.nhftk154.workers.dev`), הכניסה ל-`/admin` נבדקה.
- [ ] **הרשאת עריכה לאמא:** חשבון GitHub משלה והוספה כ-collaborator בריפו.
- [ ] **הסבר על "כלי-ניקה עין הבדולח":** למלא באדמין (טקסטים כלליים, מקטע עין הבדולח, שדה הסבר). עד אז הקטע מוסתר.
- [ ] **המלצות אמיתיות:** כרגע יש 6 המלצות דוגמה מסומנות "לדוגמה" (`sample: true` ב-`content/testimonials.json`). למחוק אותן ולהוסיף אמיתיות באדמין לפני קידום האתר. **תמונות וסרטונים של הקליניקה:** להוסיף באדמין (עד אז המקטעים מוסתרים).
- [ ] **לאשר את המספרים** "10+ שנות ניסיון" ו-"200+ לקוחות" (הועתקו מהאתר הקודם).
- [ ] **סקירה משפטית** של `accessibility.html` ו-`privacy.html` (תבניות).
- [ ] **בדיקה על מכשירים אמיתיים** (iPhone/Android), כולל הטיית היהלום התלת-ממדי.
- [ ] **דומיין מותאם** (אופציונלי): קובץ CNAME ועדכון `site_url`.

## OAuth proxy ייעודי (Cloudflare Worker)
1. GitHub, Settings, Developer settings, OAuth Apps, New: שם `Shira Toyto Site CMS`, Homepage `https://nhftk154.github.io/shira-toyto-site/`, Callback `https://<worker>.workers.dev/callback`.
2. `cd oauth-worker && npx wrangler deploy`
3. `npx wrangler secret put OAUTH_CLIENT_ID` ו-`npx wrangler secret put OAUTH_CLIENT_SECRET`
4. לעדכן את `base_url` ב-`admin/config.yml` לכתובת ה-Worker.

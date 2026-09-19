# אתר שירה איבון טויטו

אתר סטטי (HTML/CSS/JS + GSAP, Lenis, Three.js), בלי build. הטקסטים והרשימות נטענים מ-`content/*.json` וניתנים לעריכה דרך Decap CMS ב-`/admin`.

## הרצה מקומית
```
python3 -m http.server 5173
```

## מה נערך ב-/admin
טקסטים ופרטי קשר, טיפולים, שלבי תהליך, שאלות ותשובות, המלצות וגלריה.
המלצות, גלריה והסבר "עין הבדולח" מוצגים באתר רק כשיש בהם תוכן.

## פרסום (חד-פעמי)
1. ליצור ריפו `nhftk154/shira-toyto-site` ב-GitHub ולדחוף אליו את התיקייה.
2. להפעיל GitHub Pages (Settings, Pages, branch main).
3. הכניסה ל-`/admin` עוברת דרך OAuth proxy ייעודי לאתר הזה (`oauth-worker/`, ראו למטה). מי שנכנס חייב להיות חשבון GitHub עם הרשאת כתיבה לריפו.
4. לחבר דומיין אם רוצים (קובץ CNAME).

## עדיין פתוח
- הסבר על "כלי-ניקה עין הבדולח" (מתמלא ב-/admin בשדה "עין הבדולח - הסבר").
- המלצות אמיתיות ותמונות/סרטונים של הקליניקה.
- אימות מסמכי הנגישות והפרטיות מול יועץ משפטי.
- הנתונים "10+ שנות ניסיון" ו-"200+ לקוחות" הועתקו מהאתר הקודם ויש לאשר אותם.

## OAuth proxy ייעודי (Cloudflare Worker)
1. GitHub, Settings, Developer settings, OAuth Apps, New: שם `Shira Toyto Site CMS`, Homepage `https://nhftk154.github.io/shira-toyto-site/`, Callback `https://<worker>.workers.dev/callback`.
2. `cd oauth-worker && npx wrangler deploy`
3. `npx wrangler secret put OAUTH_CLIENT_ID` ו-`npx wrangler secret put OAUTH_CLIENT_SECRET`
4. לעדכן את `base_url` ב-`admin/config.yml` לכתובת ה-Worker.

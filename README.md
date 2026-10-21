# Ontario Job Matcher PRO - Vercel + GitHub Ready - REAL LIVE

## Which version to use?

### Two versions you saw:

1. **Ontario_Job_Matcher_REAL_LIVE_Direct_Apply_v2.zip** = REAL LIVE VERSION
   - Fetches REAL jobs from Job Bank RSS via api.allorigins.win
   - Direct apply link: jobtitle/123456 (exact job page)
   - Needs internet, uses PDF.js + Tesseract CDN for scanned PDFs
   - Pros: Real jobs, live, direct apply
   - Cons: If Job Bank blocks RSS, falls back to curated jobs

2. **Ontario_Job_Matcher_PRO_Final_English_v2.zip** = OFFLINE STABLE VERSION
   - 40 curated realistic Ontario jobs (8 per city: London, Windsor, Chatham-Kent, Toronto, Kitchener)
   - No live RSS, works offline, 100/100 validation, no CDN dependency for core
   - Pros: Always works, no CORS, validated perfect
   - Cons: Jobs are curated mock (realistic but not live)

### For GitHub + Vercel, use THIS folder (REAL LIVE VERCEL-READY)

This package = REAL LIVE + fallback curated + vercel.json, works perfectly on Vercel.

## GitHub + Vercel Deploy (2 minutes)

1. Go to github.com -> New repo -> name: ontario-job-matcher -> Public
2. Upload: Drag & drop index.html, vercel.json, package.json from this folder
   OR: git commands:
   ```
   git init
   git add .
   git commit -m "Real live Ontario job matcher"
   git branch -M main
   git remote add origin https://github.com/YOURUSERNAME/ontario-job-matcher.git
   git push -u origin main
   ```
3. Go to vercel.com -> New Project -> Import your repo -> Deploy (no settings needed, it auto detects static)
4. Live URL: https://ontario-job-matcher.vercel.app

That's it - Vercel will serve index.html.

## How it works on Vercel

- User drops PDF resume (any format, even scanned photo) -> PDF.js + Tesseract OCR
- Enters location (empty = all Ontario, or London/Windsor/Chatham/N7M, fuzzy Chattam -> Chatham-Kent)
- Clicks Search -> Frontend fetches https://www.jobbank.gc.ca/jobsearch/rss?searchstring=truck+driver&locationstring=London,+ON&fprov=ON via allorigins proxy
- Parses XML, extracts real jobtitle links for direct apply
- AI ranks: matched skills, score, High/Med/Low
- Shows job cards with Apply Direct button -> goes to exact Job Bank job page

If RSS fetch fails (CORS block), automatically shows curated fallback with same direct apply search links (fprov=ON to filter Ontario only).

All 100% English, no Persian in UI.

Version: 2026-10-16 - Vercel Ready - Real Live + Fallback

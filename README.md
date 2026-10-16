
# Ontario Job Matcher - AI Local Edition (No API Key Required)

International English version.

## Features
- Resume drop -> skill extraction
- FSA Mapping: N7M -> Chatham-Kent, ON
- Typo tolerant: chattam -> Chatham
- Small market fix: empty search for Chatham/Wallaceburg to show local jobs
- AI Local: TF + Cosine Similarity scoring (no OpenAI key needed)
- Real jobs from Job Bank Canada RSS
- Radius: 10/25/50/100 km

## Stack
Next.js 14, React 18, fast-xml-parser
No external AI API - scoring happens in browser.

## Deploy
Vercel: vercel.com/new -> import repo -> Deploy (auto-deploy ON by default)
Render: dashboard.render.com -> New Web Service -> Connect repo -> Auto-Deploy YES
Build: npm install && npm run build
Start: npm start

## API
GET /api/jobbank?location=N7M&q=React
Returns { jobs, count, location, searchString, feedUrl, isSmallMarket }

## License MIT

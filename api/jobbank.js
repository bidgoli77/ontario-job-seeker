
import { XMLParser } from 'fast-xml-parser';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const query = (req.query.q || '').toString().trim();
  let location = (req.query.location || 'Chatham-Kent, ON').toString().trim();

  // FSA and typo maps for Ontario small towns
  const FSA_MAP = {
    'N7M': 'Chatham-Kent, ON',
    'N7L': 'Chatham, ON',
    'N8H': 'Windsor, ON', 'N8R': 'Windsor, ON', 'N8S': 'Windsor, ON', 'N9A': 'Windsor, ON',
    'M': 'Toronto, ON', 'K': 'Ottawa, ON', 'L': 'Hamilton, ON', 'N': 'London, ON'
  };
  const TYPO_MAP = {
    'chattam': 'Chatham', 'chatam': 'Chatham',
    'windser': 'Windsor', 'winsdor': 'Windsor',
    'toront': 'Toronto', 'toronoto': 'Toronto',
    'sarnai': 'Sarnia', 'sarna': 'Sarnia',
    'ottowa': 'Ottawa', 'otawa': 'Ottawa',
    'wallacburg': 'Wallaceburg', 'wallaceberg': 'Wallaceburg'
  };

  const lowerLoc = location.toLowerCase();
  if (TYPO_MAP[lowerLoc]) location = TYPO_MAP[lowerLoc] + ', ON';

  const fsaPrefix = location.toUpperCase().replace(/\s/g,'').slice(0,3);
  if (FSA_MAP[fsaPrefix]) location = FSA_MAP[fsaPrefix];
  else if (FSA_MAP[location.toUpperCase()[0]]) location = FSA_MAP[location.toUpperCase()[0]];

  // Handle small towns - if no skills, search empty to get local jobs
  const isSmallMarket = /chatham|wallaceburg|sarnia|timmins|moosonee|kent/i.test(location);
  let searchString = query;
  if (!searchString && isSmallMarket) searchString = '';
  if (!searchString && !isSmallMarket) searchString = 'developer';

  const feedUrl = `https://www.jobbank.gc.ca/jobsearch/feed/jobSearchRSSfeed?searchstring=${encodeURIComponent(searchString)}&locationstring=${encodeURIComponent(location)}&sort=M`;

  try {
    const response = await fetch(feedUrl, { headers: { 'User-Agent': 'Ontario-Job-Matcher/1.0', 'Accept': 'application/rss+xml' } });
    const xmlText = await response.text();

    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
    const parsed = parser.parse(xmlText);
    let entries = parsed?.feed?.entry || [];
    if (!Array.isArray(entries)) entries = entries ? [entries] : [];

    const jobs = entries.slice(0, 20).map(entry => {
      const title = entry.title || 'Job Opening';
      const link = entry.link?.href || entry.link || 'https://www.jobbank.gc.ca';
      const summary = entry.summary || entry.content || '';
      let company = 'Employer';
      if (title.includes(' - ')) {
        const parts = title.split(' - ');
        if (parts.length >= 2) company = parts[parts.length - 2].trim();
      }
      return {
        title: title.replace(/\s+-\s+Job Bank.*$/i, '').trim(),
        company,
        location,
        link,
        summary: (summary || '').toString().slice(0, 300),
        source: 'Job Bank Canada',
        postedAt: entry.updated || entry.published || new Date().toISOString()
      };
    }).filter(j => j.title);

    return res.status(200).json({
      jobs,
      count: jobs.length,
      location,
      searchString,
      feedUrl,
      isSmallMarket
    });
  } catch (error) {
    return res.status(200).json({
      jobs: [],
      count: 0,
      location,
      searchString,
      error: error.message,
      feedUrl
    });
  }
}

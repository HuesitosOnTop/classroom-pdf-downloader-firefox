function normalizeUrl(rawUrl) {
  if (!rawUrl) return '';

  try {
    return new URL(rawUrl, document.baseURI).href;
  } catch (error) {
    return rawUrl;
  }
}

function collectPdfLinksWithTitles() {
  const seen = new Set();
  const results = [];

  // Find all PDF links and their parent containers
  const pdfLinks = Array.from(document.querySelectorAll('a[href*=".pdf"], a[href*="export?format=pdf"], a[href*="download?"]'));

  for (const link of pdfLinks) {
    const href = normalizeUrl(link.getAttribute('href') || '');
    
    if (!href || href.startsWith('javascript:') || seen.has(href)) {
      continue;
    }

    seen.add(href);

    // Try to find a title from the parent card or nearby text
    let title = 'classroom-pdf';
    
    // Look for text in the link itself
    const linkText = (link.textContent || '').trim();
    if (linkText && linkText.toLowerCase() !== 'pdf') {
      title = linkText;
    } else {
      // Look for a nearby heading or card title
      const card = link.closest('[role="listitem"], [data-card], .goog-card, li, div[class*="card"], div[class*="item"]');
      if (card) {
        const heading = card.querySelector('h1, h2, h3, h4, [class*="title"], [class*="heading"]');
        if (heading) {
          const headingText = (heading.textContent || '').trim();
          if (headingText) {
            title = headingText;
          }
        }
      }
    }

    // Clean up the title for use as a filename
    title = title
      .replace(/[\\/:*?"<>|]+/g, '_')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 100) || 'classroom-pdf';

    results.push({
      url: href,
      title: title
    });
  }

  return results;
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'collect-pdfs') {
    sendResponse({ pdfs: collectPdfLinksWithTitles() });
    return true;
  }

  return false;
});

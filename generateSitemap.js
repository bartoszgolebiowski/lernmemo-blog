const fs = require('fs');
const path = require('path');

// Adjust this import to match your actual data source
// This assumes you have your articles in a data file or can import from your DB interface

function generateSitemapXml(baseUrl, articles) {
  // Remove trailing slash if present
  baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  // Get current date in YYYY-MM-DD format for the homepage
  const currentDate = new Date().toISOString().split('T')[0];
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Add homepage
  xml += '   <url>\n';
  xml += `      <loc>${baseUrl}/</loc>\n`;
  xml += `      <lastmod>${currentDate}</lastmod>\n`;
  xml += '      <changefreq>weekly</changefreq>\n';
  xml += '      <priority>1.0</priority>\n';
  xml += '   </url>\n';
  
  // Add article pages
  articles.forEach(article => {
    // Format article date for lastmod field
    const lastmod = new Date(article.date).toISOString().split('T')[0];
    
    xml += '   <url>\n';
    xml += `      <loc>${baseUrl}/article/${article.id}</loc>\n`;
    xml += `      <lastmod>${lastmod}</lastmod>\n`;
    xml += '      <changefreq>monthly</changefreq>\n';
    xml += '      <priority>0.8</priority>\n';
    xml += '   </url>\n';
  });
  
  xml += '</urlset>';
  return xml;
}

/**
 * Main function to generate and save sitemap
 */
async function createSitemap(articles) {
  try {
    const baseUrl = 'https://blog.lernmemo.com'; // Change this to match your actual domain

    // Generate sitemap content
    const sitemapContent = generateSitemapXml(baseUrl, articles);
    
    // Write to file
    const sitemapPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemapContent, 'utf8');
    
    console.log(`Sitemap generated successfully at ${sitemapPath}`);
    return true;
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return false;
  }
}

// Export for use in build process
module.exports = { createSitemap };

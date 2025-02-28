const fs = require('fs-extra');
const path = require('path');
const { marked } = require('marked');
const ejs = require('ejs');
const blogConfig = require('./config');
const { createSitemap } = require('./generateSitemap');

// Configuration
const BASE_URL = 'https://blog.lernmemo.com' 

const OUTPUT_DIR = path.join(__dirname, 'dist');

async function build() {
  try {
    console.log('Starting build process...');

    // Create dist directory
    await fs.ensureDir(OUTPUT_DIR);
    
    // Copy static assets
    await fs.copy(path.join(__dirname, 'public'), OUTPUT_DIR);
    console.log('Static assets copied.');

    // Load metatags and articles
    const metatags = JSON.parse(await fs.readFile(path.join(__dirname, 'config', 'metatags.json'), 'utf-8'));
    const articles = JSON.parse(await fs.readFile(path.join(__dirname, 'articles', 'articles.json'), 'utf-8'));
    
    // Create article pages
    for (const article of articles) {
      await generateArticlePage(article.id, articles, metatags);
    }

    // Create index page that redirects to the first article
    if (articles.length > 0) {
      await generateIndexPage(articles, metatags);
    }

    // Generate sitemap as part of the build process
    console.log('Generating sitemap...');
    await createSitemap(articles);

    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

async function generateArticlePage(articleId, allArticles, metatags) {
  try {
    // Read article content
    const markdownContent = await fs.readFile(path.join(__dirname, 'articles', `${articleId}.md`), 'utf-8');
    const articleContent = marked.parse(markdownContent);
    
    // Get article metadata
    const article = allArticles.find(a => a.id === articleId);
    const blogTitle = article?.title ?? blogConfig.title;
    const metaTagsForArticle = metatags.articles[articleId] || metatags.default;
    
    // Render the page
    const html = await ejs.renderFile(
      path.join(__dirname, 'views', 'index.ejs'),
      {
        blogTitle,
        articles: allArticles,
        articleContent,
        activeArticle: articleId,
        metaTags: metaTagsForArticle,
        baseUrl: BASE_URL
      }
    );
    
    // Create article directory structure
    const articleDir = path.join(OUTPUT_DIR, 'article', articleId);
    await fs.ensureDir(articleDir);
    
    // Write the HTML file
    await fs.writeFile(path.join(articleDir, 'index.html'), html);
    console.log(`Generated page for article: ${articleId}`);
  } catch (error) {
    console.error(`Error generating page for article ${articleId}:`, error);
  }
}

async function generateIndexPage(articles, metatags) {
  const defaultArticle = articles[0];
  
  // Create a redirect page to the first article
  const redirectHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${metatags.default.title}</title>
  <meta name="description" content="${metatags.default.description}">
  <meta name="keywords" content="${metatags.default.keywords}">
  <meta property="og:title" content="${metatags.default.title}">
  <meta property="og:description" content="${metatags.default.description}">
  <meta property="og:image" content="${BASE_URL}${metatags.default.ogImage}">
  <meta property="og:type" content="${metatags.default.ogType}">
  <meta property="og:url" content="${metatags.default.canonicalUrl}">
  <meta name="twitter:card" content="${metatags.default.twitterCard}">
  <meta http-equiv="refresh" content="0;url=/article/${defaultArticle.id}/">
</head>
<body>
  <h1>Redirecting...</h1>
  <p>If you are not redirected automatically, follow this <a href="/article/${defaultArticle.id}/">link to ${defaultArticle.title}</a>.</p>
</body>
</html>
  `;
  
  await fs.writeFile(path.join(OUTPUT_DIR, 'index.html'), redirectHtml);
  console.log('Generated index page with redirect.');
}

// Run the build
build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});

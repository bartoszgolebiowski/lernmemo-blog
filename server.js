const express = require('express');
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const { marked } = require('marked');
const blogConfig = require('./config');

const app = express();
const PORT = process.env.PORT || 3000;

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Serve static files
app.use(express.static('public'));

// Load metatags config
const metatags = JSON.parse(fs.readFileSync(path.join(__dirname, 'config', 'metatags.json'), 'utf-8'));
const articles = JSON.parse(fs.readFileSync(path.join(__dirname, 'articles', 'articles.json'), 'utf-8'));

// Configuration
const BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://blog.lernmemo.com'
  : 'http://localhost:3000';

// Home route - List all articles
app.get('/', async (req, res) => {
  try {
    const articlesJSON = articles;
    // If article query parameter exists, render that article
    if (req.query.article) {
      return res.redirect(`/article/${req.query.article}`);
    }

    // Otherwise, render the first article as default
    const defaultArticle = articlesJSON.length > 0 ? articlesJSON[0].id : null;

    if (defaultArticle) {
      return res.redirect(`/article/${defaultArticle}`);
    } else {
      return res.render('index', {
        blogTitle: blogConfig.title,
        articles: articlesJSON,
        articleContent: '<div class="error">No articles found</div>',
        activeArticle: null,
        metaTags: metatags.default,
        baseUrl: BASE_URL
      });
    }
  } catch (error) {
    console.error('Error loading articles:', error);
    res.status(500).render('error', { error: 'Error loading blog content' });
  }
});

// Article route
app.get('/article/:id', async (req, res) => {
  try {
    const articlesJSON = articles
    const articleId = req.params.id;

    try {
      const markdownContent = await fsPromises.readFile(path.join(__dirname, 'articles', `${articleId}.md`), 'utf8');
      const articleContent = marked.parse(markdownContent);
      const blogTitle = articlesJSON.find(article => article.id === articleId)?.title ?? blogConfig.title;
      const metaTagsForArticle = metatags.articles[articleId] || metatags.default;

      res.render('index', {
        blogTitle,
        articles: articlesJSON,
        articleContent,
        activeArticle: articleId,
        metaTags: metaTagsForArticle,
        baseUrl: BASE_URL
      });
    } catch (articleError) {
      console.error('Error loading article:', articleError);
      res.render('index', {
        blogTitle: blogConfig.title,
        articles: articlesJSON,
        articleContent: '<div class="error">Article not found</div>',
        activeArticle: null,
        metaTags: metatags.default,
        baseUrl: BASE_URL
      });
    }
  } catch (error) {
    console.error('Error loading articles:', error);
    res.status(500).render('error', { error: 'Error loading blog content' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

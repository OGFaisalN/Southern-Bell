const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const app = express();
const fetch = require('node-fetch');
const Feed = require('feed').Feed;
const mysql = require('mysql2');
const uuid = require('uuid');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const db = mysql.createPool({
    host: 'da.dangoweb.com',
    user: 'dangoweb_southernbell',
    password: process.env.DB_PASSWORD,
    database: 'dangoweb_southernbell'
});
const port = 3000;

app.engine('.ejs', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'frontend/pages'));
app.use(express.static(__dirname + '/frontend/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
app.use(session({
    name: 'sessionid',
    secret: 'DWSis#1',
    resave: true,
    saveUninitialized: false,
    cookie: { maxAge: 86400000 }
}));
app.set('trust proxy', true);
app.use(cookieParser());
app.use(rateLimit({
    windowMs: 60 * 1000,
    max: 15,
    skip: (req, res) => {
        return req.ip !== undefined;
    }
}));
app.use((req, res, next) => {
    if (req.method === 'GET') {
        const pageviewData = {
            v: 1,
            t: 'pageview',
            tid: process.env.GA_TRACKING_ID,
            cid: req.ip,
            uip: req.ip,
            dp: req.originalUrl,
            ua: req.headers['user-agent'],
        };
        fetch('https://www.google-analytics.com/collect', {
            method: 'POST',
            body: new URLSearchParams(pageviewData),
        })
            .then(() => {
                db.query('INSERT INTO pageviews (url, count) VALUES (?, 1) ON DUPLICATE KEY UPDATE count = IF(TIMESTAMPDIFF(HOUR, timestamp, NOW()) <= 1, count, count + 1), timestamp = IF(TIMESTAMPDIFF(HOUR, timestamp, NOW()) <= 1, timestamp, NOW());', [req.originalUrl], (err, results) => {
                    if (err) {
                        console.error('error tracking pageview:', err);
                    };
                });
            })
            .catch((err) => {
                console.error('error tracking pageview:', err);
            });
    }
    next();
});
app.use((req, res, next) => {
    db.query('SELECT count FROM pageviews WHERE url = ?', [req.originalUrl], (err, results) => {
        if (err) {
            console.error(err);
            res.status(500).render('error', { error: 'error retrieving page views; database connection failed' });
            return;
        };
        if (results.length === 1) {
            req.pageViews = results[0].count;
        } else {
            req.pageViews = 0;
        };
        next();
    });
});
app.use(async (req, res, next) => {
    if (!(await cmsdata()).ok) {
        res.status(500).render('error', { error: 'error connecting to CMS; CMS connection failed' });
        return;
    };
    next();
});

function cmsdata() {
    return fetch('https://cms.dangoweb.com/:southern-bell/api/gql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': process.env.CMS_API_KEY,
        },
        body: JSON.stringify({
            query: `{
                siteDetails: content(model: "siteDetails")
                menu: content(model: "menu")
                articles: content(model: "articles")
                layouts: content(model: "layouts")
                newspapers: content(model: "newspapers")
                about: content(model: "about")
                polls: content(model: "polls")
                artworks: content(model: "artworks")
            }`
        }),
    })
};

async function startApp() {
    try {
        var cms = JSON.parse(JSON.stringify((await cmsdata().then(res => res.json())).data).replaceAll('.spaces', 'clients'));
    } catch { };

    // Defaults & Environment Variables

    var defaults = {
        environment: process.env.NODE_ENV || 'testing',
        domain: process.env.NODE_ENV === 'production' ? cms.siteDetails[0]['domain-production'] : process.env.NODE_ENV === 'development' ? cms.siteDetails[0]['domain-development'] : '../../../../..',
        asset_prefix: process.env.CMS_ASSET_PREFIX,
        asset_url: process.env.CMS_ASSET_URL
    };

    // Functions

    async function allRoutes(req, res) {
        cms = (await cmsdata().then(res => res.json())).data;
    };

    Date.prototype.isToday = function () {
        const today = new Date()
        return this.getDate() === today.getDate() &&
            this.getMonth() === today.getMonth() &&
            this.getFullYear() === today.getFullYear()
    };

    // Routes

    app.get('/', async (req, res) => {
        await allRoutes(req, res);
        res.render('index', { vars: defaults, title: '', cms, pageviews: req.pageViews });
    });

    app.get('/about', async (req, res) => {
        await allRoutes(req, res);
        res.render('about', { vars: defaults, title: cms.about[0].title, cms, pageviews: req.pageViews });
    });

    app.get('/newspapers', async (req, res) => {
        await allRoutes(req, res);
        res.render('newspapers', { vars: defaults, title: 'All Newspapers', cms, pageviews: req.pageViews });
    });

    app.get('/newspapers/:newspaper', async (req, res) => {
        await allRoutes(req, res);
        var newspaper = cms.newspapers.find(newspaper => newspaper.slug === req.params.newspaper);
        if (newspaper) {
            db.query(`SELECT * FROM comments WHERE post_id = '${newspaper._id}'`,
                function (err, results, fields) {
                    res.render('newspaper', { vars: defaults, title: newspaper.title, cms, pageviews: req.pageViews, newspaper, comments: results });
                }
            );
        } else {
            res.render('404', { vars: defaults, title: '404', cms, pageviews: req.pageViews });
        };
    });

    app.post('/newspapers/:newspaper', async (req, res) => {
        await allRoutes(req, res);
        var newspaper = cms.newspapers.find(newspaper => newspaper.slug === req.params.newspaper);
        if (newspaper && req.body.id && (req.body.name.length > 0) && (req.body.email.includes('.')) && (req.body.email.length > 0) && (req.body.content.length > 0)) {
            db.query("INSERT INTO comments (author_name, author_email, post_id, content) VALUES (?, ?, ?, ?)", [req.body.name, req.body.email, req.body.id, req.body.content], function (err, results, fields) {
                if (err) {
                    console.log(err);
                };
                res.redirect(`/newspapers/${req.params.newspaper}#${results.insertId}`);
            });
        } else {
            res.redirect('/');
        };
    });

    app.get('/articles', async (req, res) => {
        await allRoutes(req, res);
        res.render('articles', { vars: defaults, title: 'All Articles', cms, pageviews: req.pageViews });
    });

    app.get('/articles/:year/:article', async (req, res) => {
        await allRoutes(req, res);
        var article = cms.articles.find(article => { return article.slug === req.params.article && (new Date(article.date)).getFullYear() === Number(req.params.year) });
        if (article) {
            db.query(`SELECT * FROM comments WHERE post_id = '${article._id}'`,
                function (err, results, fields) {
                    res.render('article', { vars: defaults, title: article.title, cms, pageviews: req.pageViews, article, comments: results });
                }
            );
        } else {
            res.render('404', { vars: defaults, title: '404', cms, pageviews: req.pageViews });
        };
    });

    app.post('/articles/:year/:article', async (req, res) => {
        await allRoutes(req, res);
        var article = cms.articles.find(article => { return article.slug === req.params.article && (new Date(article.date)).getFullYear() === Number(req.params.year) });
        if (article && req.body.id && (req.body.name.length > 0) && (req.body.email.includes('.')) && (req.body.email.length > 0) && (req.body.content.length > 0)) {
            db.query("INSERT INTO comments (author_name, author_email, post_id, content) VALUES (?, ?, ?, ?)", [req.body.name, req.body.email, req.body.id, req.body.content], function (err, results, fields) {
                if (err) {
                    console.log(err);
                };
                res.redirect(`/articles/${req.params.year}/${req.params.article}#${results.insertId}`);
            });
        } else {
            res.redirect('/');
        };
    });

    app.get('/tags', async (req, res) => {
        await allRoutes(req, res);
        res.render('tags', { vars: defaults, title: 'Tags', cms, pageviews: req.pageViews });
    });

    app.get('/tags/:tag', async (req, res) => {
        await allRoutes(req, res);
        res.render('tag', { vars: defaults, title: `#${req.params.tag.toLowerCase()}`, cms, pageviews: req.pageViews, tag: req.params.tag.toLowerCase() });
    });

    app.get('/polls', async (req, res) => {
        await allRoutes(req, res);
        db.query(`SELECT * FROM poll_responses`,
            function (err, responses, fields) {
                res.render('polls', { vars: defaults, title: 'All Polls', cms, pageviews: req.pageViews, responses });
            });
    });

    app.get('/polls/:poll', async (req, res) => {
        await allRoutes(req, res);
        let voteId = req.cookies.voteId;
        if (!voteId) {
            voteId = uuid.v4();
            res.cookie('voteId', voteId);
        };
        var poll = cms.polls.find(poll => poll.slug === req.params.poll);
        if (poll) {
            db.query(`SELECT * FROM poll_responses WHERE poll_id = '${poll._id}'`,
                function (err, responses, fields) {
                    db.query(`SELECT * FROM comments WHERE post_id = '${poll._id}'`,
                        function (err, results, fields) {
                            res.render('poll', { vars: defaults, title: poll.question, cms, pageviews: req.pageViews, poll, comments: results, responses, error: req.query.error });
                        }
                    );
                }
            );
        } else {
            res.render('404', { vars: defaults, title: '404', cms, pageviews: req.pageViews });
        };
    });

    app.post('/polls/:poll', async (req, res) => {
        await allRoutes(req, res);
        var poll = cms.polls.find(poll => poll.slug === req.params.poll);
        if (poll && req.body.id && (req.body.name.length > 0) && (req.body.answer)) {
            db.query(`SELECT * FROM poll_responses WHERE session_id = '${req.cookies.voteId}' AND poll_id = '${poll._id}'`,
                function (err, responses, fields) {
                    if (err) {
                        console.log(err);
                    };
                    if (responses.length === 0) {
                        for (let i = 0; i < poll.answers.length; i++) {
                            if (poll.answers[i] === req.body.answer) {
                                db.prepare("INSERT INTO poll_responses (name, ip, session_id, poll_id, response_id) VALUES (?, ?, ?, ?, ?)", (err, statement) => {
                                    if (err) {
                                        console.log(err);
                                        res.redirect(`/polls/${req.params.poll}?error=There was an error submitting your vote!`);
                                    } else {
                                        statement.execute([req.body.name, req.ip, req.cookies.voteId, req.body.id, i], function (err, results, fields) {
                                            if (err) {
                                                console.log(err);
                                            };
                                            res.redirect(`/polls/${req.params.poll}`);
                                        });
                                    };
                                });
                            };
                        };
                    } else {
                        res.redirect(`/polls/${req.params.poll}?error=You have already voted!`);
                    };
                }
            );
        } else if (poll && req.body.id && (req.body.name.length > 0) && (req.body.email.includes('.')) && (req.body.email.length > 0) && (req.body.content.length > 0)) {
            db.query("INSERT INTO comments (author_name, author_email, post_id, content) VALUES (?, ?, ?, ?)", [req.body.name, req.body.email, req.body.id, req.body.content], function (err, results, fields) {
                if (err) {
                    console.log(err);
                };
                res.redirect(`/polls/${req.params.poll}#${results.insertId}`);
            });
        } else {
            res.redirect('/');
        };
    });

    app.get('/artworks', async (req, res) => {
        await allRoutes(req, res);
        res.render('artworks', { vars: defaults, title: 'All Artworks', cms, pageviews: req.pageViews });
    });

    app.get('/artworks/:artwork', async (req, res) => {
        await allRoutes(req, res);
        var artwork = cms.artworks.find(artwork => artwork.slug === req.params.artwork);
        if (artwork) {
            db.query(`SELECT * FROM comments WHERE post_id = '${artwork._id}'`,
                function (err, results, fields) {
                    res.render('artwork', { vars: defaults, title: artwork.title, cms, pageviews: req.pageViews, artwork, comments: results });
                }
            );
        } else {
            res.render('404', { vars: defaults, title: '404', cms, pageviews: req.pageViews });
        };
    });

    app.post('/artworks/:artwork', async (req, res) => {
        await allRoutes(req, res);
        var artwork = cms.artworks.find(artwork => artwork.slug === req.params.artwork);
        if (artwork && req.body.id && (req.body.name.length > 0) && (req.body.email.includes('.')) && (req.body.email.length > 0) && (req.body.content.length > 0)) {
            db.prepare("INSERT INTO comments (author_name, author_email, post_id, content) VALUES (?, ?, ?, ?)", (err, statement) => {
                statement.execute([req.body.name, req.body.email, req.body.id, req.body.content], function (err, results, fields) {
                    if (err) {
                        console.log(err);
                    };
                    res.redirect(`/artworks/${req.params.artwork}#${results.insertId}`);
                });
            });
        } else {
            res.redirect('/');
        };
    });

    app.get('/search', async (req, res) => {
        await allRoutes(req, res);
        if (req.query.query) {
            db.query(`SELECT * FROM poll_responses`,
                function (err, responses, fields) {
                    res.render('search', { vars: defaults, title: 'Search Results', cms, pageviews: req.pageViews, query: req.query.query.toLowerCase(), responses });
                });
        } else {
            res.redirect('/');
        };
    });

    app.get('/admin', async (req, res) => {
        res.redirect('https://cms.dangoweb.com/:southern-bell');
    });

    app.get('/rss', async (req, res) => {
        const feed = new Feed({
            title: cms.siteDetails[0].title,
            description: `RSS Feed for ${cms.siteDetails[0].title}`,
            id: cms.siteDetails[0]['domain-production'],
            link: cms.siteDetails[0]['domain-production'],
            language: "en",
            image: `${defaults.asset_prefix}${cms.siteDetails[0].logo.path}`,
            favicon: `${defaults.asset_prefix}${cms.siteDetails[0].favicon.path}`,
            copyright: `All rights reserved ${new Date().getFullYear()}, ${cms.siteDetails[0].title}`,
            generator: "Dango Web Solutions",
            feedLinks: {
                json: `${cms.siteDetails[0]['domain-production']}/json`,
                atom: `${cms.siteDetails[0]['domain-production']}/atom`
            },
            author: {
                name: cms.siteDetails[0].title,
                email: `admin@${cms.siteDetails[0]['domain-production'].split('://')[1]}`,
                link: cms.siteDetails[0]['domain-production']
            }
        });
        cms.newspapers.forEach(post => {
            feed.addItem({
                title: post.title,
                id: `${cms.siteDetails[0]['domain-production']}${post.slug}`,
                link: `${cms.siteDetails[0]['domain-production']}${post.slug}`,
                description: `${post.articles.length} Article(s)`,
                content: post.content,
                author: [
                    {
                        name: cms.siteDetails[0].title,
                        email: `admin@${cms.siteDetails[0]['domain-production'].split('://')[1]}`,
                        link: cms.siteDetails[0]['domain-production']
                    }
                ],
                contributor: [
                    {
                        name: "Faisal N",
                        email: "contact@faisaln.com",
                        link: "https://faisaln.com/"
                    }
                ],
                date: new Date(post.date),
                image: `${defaults.asset_prefix}${post.image.path}`
            });
        });
        cms.articles.forEach(post => {
            feed.addItem({
                title: post.title,
                id: `${cms.siteDetails[0]['domain-production']}${post.slug}`,
                link: `${cms.siteDetails[0]['domain-production']}${post.slug}`,
                description: post.description,
                content: post.content,
                author: [
                    {
                        name: cms.siteDetails[0].title,
                        email: `admin@${cms.siteDetails[0]['domain-production'].split('://')[1]}`,
                        link: cms.siteDetails[0]['domain-production']
                    }
                ],
                contributor: [
                    {
                        name: "Faisal N",
                        email: "contact@faisaln.com",
                        link: "https://faisaln.com/"
                    }
                ],
                date: new Date(post.date),
                image: `${defaults.asset_prefix}${post.images[0].path}`
            });
        });
        res.set('Content-Type', 'text/xml');
        res.send(feed.rss2());
    });

    app.use(async (req, res, next) => {
        await allRoutes(req, res);
        return res.render('404', { vars: defaults, title: '404', cms, pageviews: req.pageViews });
    });

    app.use(async (err, req, res, next) => {
        return res.render('error', { error: 'internal server error; check logs' });
    });

    app.listen(port, () => {
        try {
            console.log(`${cms.siteDetails[0].title} listening on port ${port}`);
        } catch {
            console.log(`Southern Bell listening on port ${port}`);
        };
    });
}

startApp();
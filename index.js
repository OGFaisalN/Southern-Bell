const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const app = express();
const fetch = require('node-fetch');
const Feed = require('feed').Feed;
const mysql = require('mysql2');
require('dotenv').config();
const db = mysql.createConnection({
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
            }`
        }),
    })
};

async function startApp() {
    var cms = JSON.parse(JSON.stringify((await cmsdata().then(res => res.json())).data).replaceAll('.spaces', 'clients'));

    // Defaults & Environment Variables

    var defaults = {
        environment: process.env.NODE_ENV || 'testing',
        domain: process.env.NODE_ENV === 'production' ? cms.siteDetails[0]['domain-production'] : process.env.NODE_ENV === 'development' ? cms.siteDetails[0]['domain-development'] : '..',
        asset_prefix: process.env.CMS_ASSET_PREFIX,
        asset_url: process.env.CMS_ASSET_URL
    };

    // Functions

    async function allRoutes(req) {
        cms = (await cmsdata().then(res => res.json())).data;
    };

    Date.prototype.isToday = function () {
        const today = new Date()
        return this.getDate() === today.getDate() &&
            this.getMonth() === today.getMonth() &&
            this.getFullYear() === today.getFullYear()
    };

    Date.prototype.isYesterday = function () {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        return this.getDate() === yesterday.getDate() &&
            this.getMonth() === yesterday.getMonth() &&
            this.getFullYear() === yesterday.getFullYear()
    };

    function getAge(dateString) {
        var today = new Date();
        var birthDate = new Date(dateString);
        var age = today.getFullYear() - birthDate.getFullYear();
        var m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    async function toTitleCase(str) {
        return str.replace(
            /\w\S*/g,
            function (txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            }
        );
    };

    async function detectProfanity(content) {
        var has = false;
        await fetch(`https://api.api-ninjas.com/v1/profanityfilter?text=${content}`, {
            headers: {
                'X-Api-Key': process.env.NINJAS_API_KEY
            }
        })
            .then(body => body.json())
            .then(async body => {
                if (body["has_profanity"] === true) {
                    has = true;
                };
            });
        return has;
    };

    // Routes

    app.get('/', async (req, res) => {
        await allRoutes(req);
        res.render('index', { vars: defaults, title: '', cms });
    });

    app.get('/about', async (req, res) => {
        await allRoutes(req);
        res.render('about', { vars: defaults, title: cms.about[0].title, cms });
    });

    app.get('/newspapers', async (req, res) => {
        await allRoutes(req);
        res.render('newspapers', { vars: defaults, title: 'All Newspapers', cms });
    });

    app.get('/newspapers/:newspaper', async (req, res) => {
        await allRoutes(req);
        var newspaper = cms.newspapers.find(newspaper => newspaper.slug === req.params.newspaper);
        if (newspaper) {
            db.query(`SELECT * FROM comments WHERE post_id = '${newspaper._id}'`,
                function (err, results, fields) {
                    res.render('newspaper', { vars: defaults, title: newspaper.title, cms, newspaper, comments: results });
                }
            );
        } else {
            res.render('404', { vars: defaults, title: '404', cms });
        };
    });

    app.post('/newspapers/:newspaper', async (req, res) => {
        await allRoutes(req);
        var newspaper = cms.newspapers.find(newspaper => newspaper.slug === req.params.newspaper);
        if (newspaper && req.body.id && (req.body.name.length > 0) && (req.body.email.includes('.')) && (req.body.email.length > 0) && (req.body.content.length > 0)) {
            db.query(`INSERT INTO comments (author_name, author_email, post_id, content) VALUES ('${req.body.name}', '${req.body.email}', '${req.body.id}', '${req.body.content}')`,
                function (err, results, fields) {
                    if (err) {
                        console.log(err);
                    };
                    res.redirect(`/newspapers/${req.params.newspaper}#${results.insertId}`);
                }
            );
        } else {
            res.redirect('/');
        };
    });

    app.get('/articles', async (req, res) => {
        await allRoutes(req);
        res.render('articles', { vars: defaults, title: 'All Articles', cms });
    });

    app.get('/articles/:article', async (req, res) => {
        await allRoutes(req);
        var article = cms.articles.find(article => article.slug === req.params.article);
        if (article) {
            db.query(`SELECT * FROM comments WHERE post_id = '${article._id}'`,
                function (err, results, fields) {
                    res.render('article', { vars: defaults, title: article.title, cms, article, comments: results });
                }
            );
        } else {
            res.render('404', { vars: defaults, title: '404', cms });
        };
    });

    app.post('/articles/:article', async (req, res) => {
        await allRoutes(req);
        var article = cms.articles.find(article => article.slug === req.params.article);
        if (article && req.body.id && (req.body.name.length > 0) && (req.body.email.includes('.')) && (req.body.email.length > 0) && (req.body.content.length > 0)) {
            db.query(`INSERT INTO comments (author_name, author_email, post_id, content) VALUES ('${req.body.name}', '${req.body.email}', '${req.body.id}', '${req.body.content}')`,
                function (err, results, fields) {
                    if (err) {
                        console.log(err);
                    };
                    res.redirect(`/articles/${req.params.article}#${results.insertId}`);
                }
            );
        } else {
            res.redirect('/');
        };
    });

    app.get('/tags', async (req, res) => {
        await allRoutes(req);
        res.render('tags', { vars: defaults, title: 'Tags', cms });
    });

    app.get('/tags/:tag', async (req, res) => {
        await allRoutes(req);
        res.render('tag', { vars: defaults, title: `#${req.params.tag.toLowerCase()}`, cms, tag: req.params.tag.toLowerCase() });
    });

    app.get('/polls', async (req, res) => {
        await allRoutes(req);
        res.render('polls', { vars: defaults, title: 'All Polls', cms });
    });

    app.get('/polls/:poll', async (req, res) => {
        await allRoutes(req);
        var poll = cms.polls.find(poll => poll.slug === req.params.poll);
        if (poll) {
            db.query(`SELECT * FROM poll_responses WHERE poll_id = '${poll._id}'`,
                function (err, responses, fields) {
                    db.query(`SELECT * FROM comments WHERE post_id = '${poll._id}'`,
                        function (err, results, fields) {
                            res.render('poll', { vars: defaults, title: poll.question, cms, poll, comments: results, responses, error: req.query.error });
                        }
                    );
                }
            );
        } else {
            res.render('404', { vars: defaults, title: '404', cms });
        };
    });

    app.post('/polls/:poll', async (req, res) => {
        await allRoutes(req);
        var poll = cms.polls.find(poll => poll.slug === req.params.poll);
        if (poll && req.body.id && (req.body.name.length > 0) && (req.body.answer)) {
            db.query(`SELECT * FROM poll_responses WHERE ip = '${req.connection.remoteAddress}'`,
                function (err, responses, fields) {
                    if (responses.length === 0) {
                        for (let i = 0; i < poll.answers.length; i++) {
                            if (poll.answers[i] === req.body.answer) {
                                db.query(`INSERT INTO poll_responses (name, ip, poll_id, response_id) VALUES ('${req.body.name}', '${req.connection.remoteAddress}', '${req.body.id}', '${i}')`,
                                    function (err, results, fields) {
                                        if (err) {
                                            console.log(err);
                                        };
                                        res.redirect(`/polls/${req.params.poll}`);
                                    }
                                );
                            };
                        };
                    } else {
                        res.redirect(`/polls/${req.params.poll}?error=You have already voted!`);
                    };
                }
            );
        } else {
            res.redirect('/');
        };
    });

    app.get('/search', async (req, res) => {
        await allRoutes(req);
        if (req.query.query) {
            res.render('search', { vars: defaults, title: 'Search Results', cms, query: req.query.query.toLowerCase() });
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

    app.get('*', async (req, res) => {
        await allRoutes(req);
        res.render('404', { vars: defaults, title: '404', cms });
    });

    app.listen(port, () => {
        console.log(`${cms.siteDetails[0].title} listening on port ${port}`);
    });
}

startApp();
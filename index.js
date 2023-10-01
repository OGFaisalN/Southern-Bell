const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const app = express();
const fetch = require('node-fetch');
require('dotenv').config();
const port = 80;

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
            }`
        }),
    })
};

async function startApp() {
    var cms = JSON.parse(JSON.stringify((await cmsdata().then(res => res.json())).data).replaceAll('.spaces', 'clients'));

    // Defaults & Environment Variables

    var defaults = {
        domain: process.env.NODE_ENV === 'production' ? cms.siteDetails[0].domain_production : process.env.NODE_ENV === 'development' ? cms.siteDetails[0].domain_development : 'http://localhost',
        asset_prefix: process.env.CMS_ASSET_PREFIX,
        school: {
            short: "south",
            name: "South High School",
            cssColorClass: "south",
            logoUrl: "south-logo.png",
            bannerUrl: "south-banner.png",
            address: "150 Jedwood Place, Valley Stream, NY 11581",
            website: "https://vschsd.org/schools/south-high-school/",
            type: "Public Middle School/High School",
        },
        badges: [
            {
                name: "Admin",
                slug: "admin",
                icon: "screwdriver-wrench",
            },
            {
                name: "Moderator",
                slug: "moderator",
                icon: "user-shield",
            },
            {
                name: "Teacher",
                slug: "teacher",
                icon: "chalkboard-user",
            },
            {
                name: "Student",
                slug: "student",
                icon: "graduation-cap",
            },
        ],
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
        res.render('index', { vars: defaults, session: req.session, title: '', cms });
    });

    app.get('/forum', async (req, res) => {
        await allRoutes(req);
        await fetch(`${process.env.DATABASE_URL}?do=allarticles`, {
            method: 'GET',
            headers: {
                Accept: '*/*',
                'User-Agent': `${cms.siteDetails[0].title} (${defaults.domain})`
            }
        })
            .then(db => db.json())
            .then(db => {
                var articlesList = "";
                var wanted = db.data.length;
                var done = 0;
                var sortedPosts = [];
                var pinnedPosts = [];
                db.data.sort((a, b) => parseFloat(b.id) - parseFloat(a.id)).forEach(async article => {
                    var tagList = "";
                    article.tags.split(`,`).forEach(tag => {
                        defaults.tags.forEach(tags => {
                            if (tags.slug === tag) {
                                tagList += tags.name + ", ";
                            };
                        });
                    });
                    await fetch(`${process.env.DATABASE_URL}?do=find&username=${article.author}`, {
                        method: 'GET',
                        headers: {
                            Accept: '*/*',
                            'User-Agent': `${cms.siteDetails[0].title} (${defaults.domain})`
                        }
                    })
                        .then(db => db.json())
                        .then(db => {
                            if ((db.info.status === 1) && (!article.flagged)) {
                                var authorName = db.data.firstname + " " + db.data.lastname;
                                var authorBadge = JSON.parse(db.data.badges)[JSON.parse(db.data.badges).length - 1];
                                defaults.badges.forEach(badge => {
                                    if (badge.slug === authorBadge) {
                                        authorBadge = badge;
                                    };
                                });
                                if (article.pinned) {
                                    pinnedPosts.push({
                                        id: article.id,
                                        article: `<a href="${defaults.domain}/forum/articles/${article.slug}" class="article"><h4>${authorName} <i class="fa-solid fa-${authorBadge.icon}" alt="${authorBadge.name}"></i> (${new Date(article["created_at"]).toLocaleDateString('en-us', { weekday: "long", month: "short", day: "numeric" })} at ${new Date(article["created_at"]).toLocaleTimeString('en-US')}) <i class="fa-solid fa-thumbtack"></i>${(article.images != "{}") ? ' <i class="fa-solid fa-image"></i>' : ''}</h4><h2>${article.name}</h2><div class="tags"><i class="fa-solid fa-tags"></i> ${tagList.slice(0, -2)}</div></a>`,
                                    });
                                } else {
                                    sortedPosts.push({
                                        id: article.id,
                                        article: `<a href="${defaults.domain}/forum/articles/${article.slug}" class="article"><h4>${authorName} <i class="fa-solid fa-${authorBadge.icon}" alt="${authorBadge.name}"></i> (${new Date(article["created_at"]).toLocaleDateString('en-us', { weekday: "long", month: "short", day: "numeric" })} at ${new Date(article["created_at"]).toLocaleTimeString('en-US')})${(article.images != "{}") ? ' <i class="fa-solid fa-image"></i>' : ''}</h4><h2>${article.name}</h2><div class="tags"><i class="fa-solid fa-tags"></i> ${tagList.slice(0, -2)}</div></a>`,
                                    });
                                };
                            };
                            done++;
                            if (done === wanted) {
                                pinnedPosts.sort((a, b) => parseFloat(b.id) - parseFloat(a.id));
                                pinnedPosts.forEach(async article => {
                                    articlesList += article.article;
                                });
                                sortedPosts.sort((a, b) => parseFloat(b.id) - parseFloat(a.id));
                                sortedPosts.forEach(async article => {
                                    articlesList += article.article;
                                });
                                if (articlesList === "") {
                                    articlesList = "No articles yet.";
                                };
                                res.render('forum', { vars: defaults, session: req.session, title: 'Forum', articles: articlesList });
                            };
                        });
                });
            });
    });

    app.get('/forum/articles', async (req, res) => {
        await allRoutes(req);
        res.redirect('/forum');
    });

    app.get('/forum/articles/:article', async (req, res) => {
        await allRoutes(req);
    });

    app.get('/forum/topics', async (req, res) => {
        await allRoutes(req);
        res.render('topics', { vars: defaults, session: req.session, title: 'Topics', tags: defaults.tagListHTMLButtons });
    });

    app.get('/forum/topics/:topic', async (req, res) => {
        await allRoutes(req);
    });

    app.get('/search', async (req, res) => {
        await allRoutes(req);
        if (req.query.query) {
            await fetch(`${process.env.DATABASE_URL}?do=allarticles`, {
                method: 'GET',
                headers: {
                    Accept: '*/*',
                    'User-Agent': `${cms.siteDetails[0].title} (${defaults.domain})`
                }
            })
                .then(articles => articles.json())
                .then(async articles => {
                    var articlesList = "";
                    var sortedPosts = [];
                    var pinnedPosts = [];
                    var wanted = 0;
                    var done = 0;
                    var done2 = 0;
                    await articles.data.forEach(async article => {
                        if ((article.name.toLowerCase().includes(req.query.query.toLowerCase()) || article.description.toLowerCase().includes(req.query.query.toLowerCase()) || article.author.toLowerCase().includes(req.query.query.toLowerCase())) && (!article.flagged)) {
                            wanted++;
                        };
                        done++;
                        if (done === articles.data.length) {
                            if (wanted != 0) {
                                await articles.data.sort((a, b) => parseFloat(b.id) - parseFloat(a.id)).forEach(async article => {
                                    if ((article.name.toLowerCase().includes(req.query.query.toLowerCase()) || article.description.toLowerCase().includes(req.query.query.toLowerCase()) || article.author.toLowerCase().includes(req.query.query.toLowerCase())) && (!article.flagged)) {
                                        var tagList = "";
                                        article.tags.split(`,`).forEach(tag => {
                                            defaults.tags.forEach(tags => {
                                                if (tags.slug === tag) {
                                                    tagList += tags.name + ", ";
                                                };
                                            });
                                        });
                                        await fetch(`${process.env.DATABASE_URL}?do=find&username=${article.author}`, {
                                            method: 'GET',
                                            headers: {
                                                Accept: '*/*',
                                                'User-Agent': `${cms.siteDetails[0].title} (${defaults.domain})`
                                            }
                                        })
                                            .then(db => db.json())
                                            .then(async db => {
                                                if (db.info.status === 1) {
                                                    var authorName = db.data.firstname + " " + db.data.lastname;
                                                    defaults.badges.forEach(badge => {
                                                        if (badge.slug === JSON.parse(db.data.badges)[JSON.parse(db.data.badges).length - 1]) {
                                                            authorBadge = badge;
                                                        };
                                                    });
                                                    if (article.pinned) {
                                                        pinnedPosts.push({
                                                            id: article.id,
                                                            article: `<a href="${defaults.domain}/forum/articles/${article.slug}" class="article"><h4>${authorName} <i class="fa-solid fa-${authorBadge.icon}" alt="${authorBadge.name}"></i> (${new Date(article["created_at"]).toLocaleDateString('en-us', { weekday: "long", month: "short", day: "numeric" })} at ${new Date(article["created_at"]).toLocaleTimeString('en-US')}) <i class="fa-solid fa-thumbtack"></i>${(article.images != "{}") ? ' <i class="fa-solid fa-image"></i>' : ''}</h4><h2>${article.name}</h2><div class="tags"><i class="fa-solid fa-tags"></i> ${tagList.slice(0, -2)}</div></a>`,
                                                        });
                                                    } else {
                                                        sortedPosts.push({
                                                            id: article.id,
                                                            article: `<a href="${defaults.domain}/forum/articles/${article.slug}" class="article"><h4>${authorName} <i class="fa-solid fa-${authorBadge.icon}" alt="${authorBadge.name}"></i> (${new Date(article["created_at"]).toLocaleDateString('en-us', { weekday: "long", month: "short", day: "numeric" })} at ${new Date(article["created_at"]).toLocaleTimeString('en-US')})${(article.images != "{}") ? ' <i class="fa-solid fa-image"></i>' : ''}</h4><h2>${article.name}</h2><div class="tags"><i class="fa-solid fa-tags"></i> ${tagList.slice(0, -2)}</div></a>`,
                                                        });
                                                    };
                                                    done2++;
                                                    if (done2 === wanted) {
                                                        pinnedPosts.sort((a, b) => parseFloat(b.id) - parseFloat(a.id));
                                                        pinnedPosts.forEach(async article => {
                                                            articlesList += article.article;
                                                        });
                                                        sortedPosts.sort((a, b) => parseFloat(b.id) - parseFloat(a.id));
                                                        sortedPosts.forEach(async article => {
                                                            articlesList += article.article;
                                                        });
                                                        await getComments(sortedPosts, articlesList);
                                                    };
                                                };
                                            });
                                    };
                                });
                            } else {
                                await getComments([], "No articles");
                            };
                        };
                    });
                });
            async function getComments(sortedPosts, articlesList) {
                await fetch(`${process.env.DATABASE_URL}?do=allcomments`, {
                    method: 'GET',
                    headers: {
                        Accept: '*/*',
                        'User-Agent': `${cms.siteDetails[0].title} (${defaults.domain})`
                    }
                })
                    .then(comments => comments.json())
                    .then(async comments => {
                        var commentsList = "";
                        var sortedComments = [];
                        var wanted = 0;
                        var done = 0;
                        await comments.data.forEach(async comment => {
                            if (comment.content.toLowerCase().includes(req.query.query.toLowerCase()) || comment.author.toLowerCase().includes(req.query.query.toLowerCase())) {
                                wanted++;
                            };
                            done++;
                            if (done === comments.data.length) {
                                if (wanted != 0) {
                                    var done2 = 0;
                                    await comments.data.sort((a, b) => parseFloat(b.id) - parseFloat(a.id)).forEach(async comment => {
                                        if (comment.content.toLowerCase().includes(req.query.query.toLowerCase()) || comment.author.toLowerCase().includes(req.query.query.toLowerCase())) {
                                            await fetch(`${process.env.DATABASE_URL}?do=find&username=${comment.author}`, {
                                                method: 'GET',
                                                headers: {
                                                    Accept: '*/*',
                                                    'User-Agent': `${cms.siteDetails[0].title} (${defaults.domain})`
                                                }
                                            })
                                                .then(db => db.json())
                                                .then(async db => {
                                                    if (db.info.status === 1) {
                                                        var commentAuthorName = db.data.firstname + " " + db.data.lastname;
                                                        defaults.badges.forEach(badge => {
                                                            if (badge.slug === JSON.parse(db.data.badges)[JSON.parse(db.data.badges).length - 1]) {
                                                                commentAuthorBadge = badge;
                                                            };
                                                        });
                                                        if (comment.images != "{}") {
                                                            sortedComments.push({
                                                                id: comment.id,
                                                                comment: `<div class="comment"><a href="${defaults.domain}/forum/comments/${comment.id}"><h4>${commentAuthorName} <i class="fa-solid fa-${commentAuthorBadge.icon}" alt="${commentAuthorBadge.name}"></i></h4><h5>${new Date(comment["created_at"]).toLocaleDateString('en-us', { weekday: "long", month: "short", day: "numeric" })} at ${new Date(comment["created_at"]).toLocaleTimeString('en-US')}</h5><h4>${comment.content}</h4><img src="${JSON.parse(comment.images).image}" alt="${JSON.parse(comment.images).name}"></a></div>`,
                                                            });
                                                        } else {
                                                            sortedComments.push({
                                                                id: comment.id,
                                                                comment: `<div class="comment"><a href="${defaults.domain}/forum/comments/${comment.id}"><h4>${commentAuthorName} <i class="fa-solid fa-${commentAuthorBadge.icon}" alt="${commentAuthorBadge.name}"></i></h4><h5>${new Date(comment["created_at"]).toLocaleDateString('en-us', { weekday: "long", month: "short", day: "numeric" })} at ${new Date(comment["created_at"]).toLocaleTimeString('en-US')}</h5><h4>${comment.content}</h4></a></div>`,
                                                            });
                                                        };
                                                        done2++;
                                                        if (done2 === wanted) {
                                                            sortedComments.sort((a, b) => parseFloat(b.id) - parseFloat(a.id));
                                                            sortedComments.forEach(async comment => {
                                                                commentsList += comment.comment;
                                                            });
                                                            await sendResults(sortedPosts, articlesList, commentsList);
                                                        };
                                                    };
                                                });
                                        };
                                    });
                                } else {
                                    await sendResults(sortedPosts, articlesList, "No comments");
                                };
                            };
                        });
                    });
            };
            async function sendResults(sortedPosts, articlesList, commentsList) {
                try {
                    res.render('search', { vars: defaults, session: req.session, title: 'Search Results', articles: articlesList, query: req.query.query, results: sortedPosts.length, comments: commentsList });
                } catch { };
            };
        } else {
            res.redirect('/forum');
        };
    });

    app.get('/admin', async (req, res) => {
        res.redirect('https://cms.dangoweb.com/:southern-bell');
    });

    app.get('*', async (req, res) => {
        await allRoutes(req);
        res.render('404', { vars: defaults, session: req.session, title: '404', cms });
    });

    app.listen(port, () => {
        console.log(`${cms.siteDetails[0].title} listening on port ${port}`);
    });
}

startApp();
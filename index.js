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
        domain: process.env.NODE_ENV === 'production' ? cms.siteDetails[0].domain_production : process.env.NODE_ENV === 'development' ? cms.siteDetails[0].domain_development : '..',
        asset_prefix: process.env.CMS_ASSET_PREFIX,
        asset_url: process.env.CMS_ASSET_URL,
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

    app.get('/newspapers', async (req, res) => {
        await allRoutes(req);
        res.render('newspapers', { vars: defaults, session: req.session, title: 'All Newspapers', cms });
    });

    /*app.get('/newspapers/:newspaper', async (req, res) => {
        await allRoutes(req);
    });*/

    app.get('/articles', async (req, res) => {
        await allRoutes(req);
        res.render('articles', { vars: defaults, session: req.session, title: 'All Articles', cms });
    });

    app.get('/articles/:article', async (req, res) => {
        await allRoutes(req);
        var article = cms.articles.find(article => article.slug === req.params.article);
        if (article) {
            res.render('article', { vars: defaults, session: req.session, title: article.title, cms, article });
        } else {
            res.render('404', { vars: defaults, session: req.session, title: '404', cms });
        };
    });

    app.get('/tags', async (req, res) => {
        await allRoutes(req);
        res.render('tags', { vars: defaults, session: req.session, title: 'Tags', cms });
    });

    app.get('/tags/:tag', async (req, res) => {
        await allRoutes(req);
        res.render('tag', { vars: defaults, session: req.session, title: `#${req.params.tag.toLowerCase()}`, cms, tag: req.params.tag.toLowerCase() });
    });

    app.get('/search', async (req, res) => {
        await allRoutes(req);
        if (req.query.query) {
            res.render('search', { vars: defaults, session: req.session, title: 'Search Results', cms, query: req.query.query.toLowerCase() });
        } else {
            res.redirect('/');
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
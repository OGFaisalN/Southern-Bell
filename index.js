const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const app = express();
const fetch = require('node-fetch');
require('dotenv').config();
const port = 80;

app.engine('.html', require('ejs').renderFile);
app.set('view engine', 'html');
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

// Defaults

var defaults = {
    siteName: "VSCHSD Student Forum",
    schools: [
        {
            short: "south",
            name: "South High School",
            cssColorClass: "south",
            logoUrl: "south-logo.png",
            bannerUrl: "south-banner.png",
            address: "150 Jedwood Place, Valley Stream, NY 11581",
            website: "https://vschsd.org/schools/south-high-school/",
            type: "Public Middle School/High School",
        },
        {
            short: "north",
            name: "North High School",
            cssColorClass: "north",
            logoUrl: "north-logo.png",
            bannerUrl: "north-banner.png",
            address: "750 Herman Avenue, Franklin Square, NY 11010",
            website: "https://vschsd.org/schools/north-high-school/",
            type: "Public Middle School/High School",
        },
        {
            short: "central",
            name: "Central High School",
            cssColorClass: "central",
            logoUrl: "central-logo.png",
            bannerUrl: "central-banner.png",
            address: "135 Fletcher Avenue, Valley Stream, NY 11580",
            website: "https://vschsd.org/schools/central-high-school/",
            type: "Public Senior High School",
        },
        {
            short: "memorial",
            name: "Memorial Junior High School",
            cssColorClass: "memorial",
            logoUrl: "memorial-logo.png",
            bannerUrl: "memorial-banner.png",
            address: "320 Fletcher Avenue, Valley Stream, NY 11580",
            website: "https://vschsd.org/schools/memorial-junior-high-school/",
            type: "Public Junior High School",
        },
    ],
    schoolListHTML: "",
    ssoButtons: [
        {
            name: "VSCHSD",
            link: "https://vschsd.org/",
            icon: "/images/vschsd-logo.png",
            color: "FFFFFF",
        },
        {
            name: "Infinite Campus",
            link: "https://valleystreamny.infinitecampus.org/campus/SSO/valleystream/sis?configID=1",
            icon: "https://www.infinitecampus.com/favicon.ico",
            color: "92c841",
        },
        {
            name: "ClassLink",
            link: "https://launchpad.classlink.com/vschsd",
            icon: "https://cdn.classlink.com/production/launchpad/resources/images/favicon/favicon-32x32.png",
            color: "3aadcf",
        },
        {
            name: "Library Catalog",
            link: "https://destiny.vschsd.org/",
            icon: "https://www.follett.com/favicon.ico",
            color: "e78020",
        },
        {
            name: "Microsoft 365",
            link: "https://portal.office.com/?domain_hint=vschsd.org",
            icon: "https://res.cdn.office.net/officehub/images/content/images/favicon_m365-67350a08e8.ico",
            color: "e6e6e6",
        },
        {
            name: "Castle Learning",
            link: "https://cl.castlelearning.com/",
            icon: "https://cl.castlelearning.com/Review/CLO/Content/images/CastleFav/android-chrome-192x192.png",
            color: "921b1f",
        },
    ],
    ssoButtonListHTML: "",
    tags: [
        {
            name: "Math",
            slug: "math",
        },
        {
            name: "Science",
            slug: "science",
        },
        {
            name: "English",
            slug: "english",
        },
        {
            name: "History",
            slug: "history",
        },
        {
            name: "Other",
            slug: "other",
        },
    ],
    tagListHTML: "",
    tagListHTMLHeader: "",
    tagListHTMLSidebar: "",
};
defaults.schools.forEach(school => {
    defaults.schoolListHTML += `<option value="${school.short}">${school.name}</option>`;
});
defaults.ssoButtons.forEach(button => {
    result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(button.color);
    red = parseInt(result[1], 16);
    green = parseInt(result[2], 16);
    blue = parseInt(result[3], 16);
    if ((red * 0.299 + green * 0.587 + blue * 0.114) > 186) {
        textColor = "black";
    } else {
        textColor = "white";
    };
    defaults.ssoButtonListHTML += `<a href="${button.link}"><button class="sso" style="background-color: #${button.color}; color: ${textColor}"><img src="${button.icon}" /> ${button.name}</button></a>`;
});
defaults.tags.forEach(tag => {
    defaults.tagListHTML += `<option value="${tag.slug}">${tag.name}</option>`;
    defaults.tagListHTMLHeader += `<a href="${defaults.domain}/forum/topics/${tag.slug}">${tag.name}</a>`;
    defaults.tagListHTMLSidebar += `<a href="${defaults.domain}/forum/topics/${tag.slug}" class="link">${tag.name}</a>`;
});

// Environment Variables

if (process.env.NODE_ENV === 'production') {
    defaults.domain = "https://acp.vschsd.faisaln.cf/vschsd-student-forum";
} else {
    if (process.env.NODE_ENV === 'development') {
        defaults.domain = "https://beta.acp.vschsd.faisaln.cf";
    } else {
        defaults.domain = "http://localhost";
    };
};

// Functions

async function allRoutes(req) {
    if (!req.session.userData) {
        req.session.userData = {};
    };
};

// Routes

app.get('/', async (req, res) => {
    await allRoutes(req);
    res.render('index', { vars: defaults, title: 'Home', user: req.session.userData });
});

app.get('/account', async (req, res) => {
    await allRoutes(req);
    if (req.session.loggedinUser === true) {
        res.render('account', { vars: defaults, title: 'Account', user: req.session.userData, buttons: defaults.ssoButtonListHTML });
    } else {
        res.redirect('/login');
    };
});

app.get('/login', async (req, res) => {
    await allRoutes(req);
    if (req.session.loggedinUser === true) {
        res.redirect('/account');
    } else {
        res.render('login', { vars: defaults, title: 'Login', user: req.session.userData });
    };
});

app.post('/login', async (req, res) => {
    await allRoutes(req);
    if (req.body.username.includes("@")) {
        var loginType = "email";
    } else {
        var loginType = "username";
    };
    await fetch(`${process.env.DATABASE_URL}?do=find&${loginType}=${req.body.username}`, {
        method: 'GET',
        headers: {
            Accept: '*/*',
            'User-Agent': `${defaults.siteName} (${defaults.domain})`
        }
    })
        .then(db => db.json())
        .then(db => {
            if (db.info.status === 1) {
                db = db.data;
                if (req.body.password === db.password) {
                    defaults.schools.forEach(school => {
                        if (school.short === db.school) {
                            var schoolData = school;
                            req.session.userData = {
                                username: db.username,
                                name: {
                                    first: db.firstname,
                                    last: db.lastname,
                                },
                                email: db.email,
                                age: db.age,
                                school: schoolData,
                                dob: db.dob,
                                gradyear: db.gradyear
                            };
                            req.session.loggedinUser = true;
                            res.redirect('/login');
                        };
                    });
                } else {
                    req.session.loggedinUser = false;
                    res.render('login', { vars: defaults, title: 'Login', user: req.session.userData, alert: "Incorrect details!" });
                };
            } else {
                req.session.loggedinUser = false;
                res.render('login', { vars: defaults, title: 'Login', user: req.session.userData, alert: "Incorrect details!" });
            };
        });
});

app.get('/signup', async (req, res) => {
    await allRoutes(req);
    if (req.session.loggedinUser === true) {
        res.redirect('/account');
    } else {
        res.render('signup', { vars: defaults, title: 'Signup', user: req.session.userData, schoolList: defaults.schoolListHTML });
    };
});

app.post('/signup', async (req, res) => {
    await allRoutes(req);
    async function getAge(dateString) {
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
    res.send(req.body.password.isNaN())
    if ((req.body.username != "") && (req.body.password != "") && (req.body.email != "") && (req.body.firstname != "") && (req.body.lastname != "") && (req.body.dob != "") && (req.body.school != "") && (req.body.gradyear != "") && (req.body.email.includes("@vschsd.org")) && (req.body.gradyear.length === 4) && (req.body.password.length === 6) && (!req.body.password.isNaN()) && (!req.body.gradyear.isNaN()) && (req.body.gradyear >= new Date.getYear()) && (await getAge(req.body.dob) < 21)) {
        console.log(`${process.env.DATABASE_URL}?do=new&username=${req.body.username}&password=${req.body.password}&email=${req.body.email}&firstname=${await toTitleCase(req.body.firstname)}&lastname=${await toTitleCase(req.body.lastname)}&age=${await getAge(req.body.dob)}&gradyear=${req.body.gradyear}&school=${req.body.school}&dob=${req.body.dob}`);
        await fetch(`${process.env.DATABASE_URL}?do=new&username=${req.body.username}&password=${req.body.password}&email=${req.body.email}&firstname=${await toTitleCase(req.body.firstname)}&lastname=${await toTitleCase(req.body.lastname)}&age=${await getAge(req.body.dob)}&gradyear=${req.body.gradyear}&school=${req.body.school}&dob=${req.body.dob}`, {
            method: 'GET',
            headers: {
                Accept: '*/*',
                'User-Agent': `${defaults.siteName} (${defaults.domain})`
            }
        })
            .then(db => db.json())
            .then(async db => {
                console.log(db);
                if (db.info.status === 1) {
                    req.session.loggedinUser = false;
                    res.render('signup', { vars: defaults, title: 'Signup', user: req.session.userData, schoolList: defaults.schoolListHTML, alert: "Account created." });
                } else {
                    req.session.loggedinUser = false;
                    res.render('signup', { vars: defaults, title: 'Signup', user: req.session.userData, schoolList: defaults.schoolListHTML, alert: "Account already exists or there was an error!" });
                };
            });
    } else {
        req.session.loggedinUser = false;
        res.render('signup', { vars: defaults, title: 'Signup', user: req.session.userData, schoolList: defaults.schoolListHTML, alert: "Fill in all fields correctly!" });
    };
});

app.get('/logout', async (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.get('/forum', async (req, res) => {
    await allRoutes(req);
    res.render('forum', { vars: defaults, title: 'Forum', user: req.session.userData });
});

app.get('/forum/posts/new', async (req, res) => {
    await allRoutes(req);
    if (req.session.loggedinUser === true) {
        res.render('newpost', { vars: defaults, title: 'New Post', user: req.session.userData, tagList: defaults.tagListHTML });
    } else {
        res.redirect('/login');
    };
});

app.post('/forum/posts/new', async (req, res) => {
    await allRoutes(req);
    function convertToSlug(Text) {
        return Text.toLowerCase()
            .replace(/[^\w ]+/g, '')
            .replace(/ +/g, '-');
    };
    var optional = "";
    if ((req.body.tags != "") && (req.body.tags != undefined)) {
        optional += `&tags=${req.body.tags}`;
    };
    if ((req.body.description != "") && (req.body.description != undefined)) {
        optional += `&description=${req.body.description}`;
    };
    if ((req.body.image != "") && (req.body.image != undefined)) {
        var imageJson = {
            name: req.body.imagename,
            image: req.body.image
        };
        optional += `&image=${JSON.stringify(imageJson)}`;
    };
    await fetch(`${process.env.DATABASE_URL}?do=newpost&username=${req.session.userData.username}&name=${req.body.name}&slug=${convertToSlug(req.body.name)}${optional}`, {
        method: 'GET',
        headers: {
            Accept: '*/*',
            'User-Agent': `${defaults.siteName} (${defaults.domain})`
        }
    })
        .then(db => db.json())
        .then(async db => {
            if (db.info.status === 1) {
                res.redirect(`${defaults.domain}/forum/posts/${db.data.slug}`);
            } else {
                res.render('newpost', { vars: defaults, title: 'New Post', user: req.session.userData, tagList: defaults.tagListHTML, alert: "Post title already exists, choose another!" });
            };
        });
});

app.get('*', async (req, res) => {
    await allRoutes(req);
    res.render('404', { vars: defaults, title: '404', user: req.session.userData });
});

app.listen(port, () => {
    console.log(`${defaults.siteName} listening on port ${port}`);
});
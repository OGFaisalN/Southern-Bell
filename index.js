const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const app = express();
const fetch = require('node-fetch');
require('dotenv').config();
const mysql = require('mysql');
const port = 80;
const facultyList = require(path.join(__dirname, 'frontend/public/js/faculty.json'));
const bcrypt = require('bcrypt');

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
    domain: "",
    url: "",
    siteName: "VSCHSD Student Forum",
    announcement: "",
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
            type: "Public Middle School / High School",
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
            icon: "https://valleystreamny.infinitecampus.org/campus/favicon.ico",
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
            icon: "calculator",
            title: "Mathematics",
            description: "Math might not be for everyone but thats okay! We can help you out here!",
        },
        {
            name: "Science",
            slug: "science",
            icon: "flask",
            title: "Science",
            description: "Science is difficult for some but there is nothing wrong with that! Get further help here!",
        },
        {
            name: "English",
            slug: "english",
            icon: "book-open",
            title: "English",
            description: "English can be difficult but you're at the right place! We are here to help!",
        },
        {
            name: "History",
            slug: "history",
            icon: "landmark-dome",
            title: "History",
            description: "Learning the past is always wonderful but difficult for some! Further assistance is ok we are here to help!",
        },
        {
            name: "Other",
            slug: "other",
            icon: "ellipsis",
            title: "Other",
            description: "A place for help on subjects that might not've been listed!",
        },
    ],
    tagListHTML: "",
    tagListHTMLHeader: "",
    tagListHTMLSidebar: "",
    tagListHTMLButtons: "",
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
    badgeListHTML: "",
    faculty: facultyList,
};

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

// Set Defaults

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
    defaults.ssoButtonListHTML += `<a href="${button.link}" target="_blank" rel="noopener noreferrer"><button class="sso" style="background: #${button.color}; color: ${textColor}"><img src="${button.icon}" /> ${button.name}</button></a>`;
});
defaults.tags.forEach(tag => {
    defaults.tagListHTML += `<option value="${tag.slug}">${tag.name}</option>`;
    defaults.tagListHTMLHeader += `<a href="${defaults.domain}/forum/topics/${tag.slug}">${tag.name}</a>`;
    defaults.tagListHTMLSidebar += `<a href="${defaults.domain}/forum/topics/${tag.slug}" class="link">${tag.name}</a>`;
    defaults.tagListHTMLButtons += `<a href="${defaults.domain}/forum/topics/${tag.slug}"><button><i class="fa-solid fa-${tag.icon}" alt="${tag.name}"></i> ${tag.name}</button></a>`;
});

// Functions

async function allRoutes(req) {
    if (!req.session.userData) {
        req.session.userData = {};
    };
    defaults.url = req.originalUrl.split("?")[0];
    if (!req.session.announcement) {
        if (process.env.NODE_ENV === 'production') {
            req.session.announcement = `<i class="fa-solid fa-message"></i>&nbsp;&nbsp;Welcome!`;
        } else {
            req.session.announcement = `<i class="fa-solid fa-vial"></i>&nbsp;&nbsp;Beta Version`;
        };
    };
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
    return date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear()
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
    await fetch(`${process.env.DATABASE_URL}?do=allposts`, {
        method: 'GET',
        headers: {
            Accept: '*/*',
            'User-Agent': `${defaults.siteName} (${defaults.domain})`
        }
    })
        .then(db => db.json())
        .then(db => {
            var postsList = "";
            var wanted = db.data.length;
            var done = 0;
            var sortedPosts = [];
            var pinnedPosts = [];
            db.data.sort((a, b) => parseFloat(b.id) - parseFloat(a.id)).forEach(async post => {
                var tagList = "";
                post.tags.split(`,`).forEach(tag => {
                    defaults.tags.forEach(tags => {
                        if (tags.slug === tag) {
                            tagList += tags.name + ", ";
                        };
                    });
                });
                await fetch(`${process.env.DATABASE_URL}?do=find&username=${post.author}`, {
                    method: 'GET',
                    headers: {
                        Accept: '*/*',
                        'User-Agent': `${defaults.siteName} (${defaults.domain})`
                    }
                })

                    .then(db => db.json())
                    .then(db => {
                        if ((db.info.status === 1) && (new Date(post["created_at"]).isToday()) && (!post.flagged)) {
                            var authorName = db.data.firstname + " " + db.data.lastname;
                            var authorBadge = JSON.parse(db.data.badges)[JSON.parse(db.data.badges).length - 1];
                            defaults.badges.forEach(badge => {
                                if (badge.slug === authorBadge) {
                                    authorBadge = badge;
                                };
                            });
                            if (post.pinned) {
                                pinnedPosts.push({
                                    id: post.id,
                                    post: `<a href="${defaults.domain}/forum/posts/${post.slug}" class="post"><h4>${authorName} <i class="fa-solid fa-${authorBadge.icon}" alt="${authorBadge.name}"></i> (${new Date(post["created_at"]).toLocaleDateString('en-us', { weekday: "long", month: "short", day: "numeric" })} at ${new Date(post["created_at"]).toLocaleTimeString('en-US')}) <i class="fa-solid fa-thumbtack"></i>${(post.images != "{}") ? ' <i class="fa-solid fa-image"></i>' : ''}</h4><h2>${post.name}</h2><div class="tags"><i class="fa-solid fa-tags"></i> ${tagList.slice(0, -2)}</div></a>`,
                                });
                            } else {
                                sortedPosts.push({
                                    id: post.id,
                                    post: `<a href="${defaults.domain}/forum/posts/${post.slug}" class="post"><h4>${authorName} <i class="fa-solid fa-${authorBadge.icon}" alt="${authorBadge.name}"></i> (${new Date(post["created_at"]).toLocaleDateString('en-us', { weekday: "long", month: "short", day: "numeric" })} at ${new Date(post["created_at"]).toLocaleTimeString('en-US')})${(post.images != "{}") ? ' <i class="fa-solid fa-image"></i>' : ''}</h4><h2>${post.name}</h2><div class="tags"><i class="fa-solid fa-tags"></i> ${tagList.slice(0, -2)}</div></a>`,
                                });
                            };
                        };
                        done++;
                        if (done === wanted) {
                            pinnedPosts.sort((a, b) => parseFloat(b.id) - parseFloat(a.id));
                            pinnedPosts.forEach(async post => {
                                postsList += post.post;
                            });
                            sortedPosts.sort((a, b) => parseFloat(b.id) - parseFloat(a.id));
                            sortedPosts.forEach(async post => {
                                postsList += post.post;
                            });
                            if (postsList === "") {
                                postsList = "No posts yet.";
                            };
                            res.render('index', { vars: defaults, session: req.session, title: '', user: req.session.userData, posts: postsList });
                        };
                    });
            });
        });
});

app.get('/account', async (req, res) => {
    await allRoutes(req);
    if (req.session.loggedinUser === true) {
        var tagListHTML = "";
        defaults.badges.forEach(badge => {
            if (req.session.userData.badges.includes(badge.slug)) {
                tagListHTML += `&nbsp;<i class="fa-solid fa-${badge.icon}" alt="${badge.name}"></i>&nbsp;&nbsp;${badge.name}, `;
            };
        });
        await fetch(`${process.env.DATABASE_URL}?do=allposts&username=${req.session.userData.username}`, {
            method: 'GET',
            headers: {
                Accept: '*/*',
                'User-Agent': `${defaults.siteName} (${defaults.domain})`
            }
        })
            .then(db => db.json())
            .then(async db => {
                var postsList = "";
                if (db.data) {
                    var wanted = db.data.length;
                    var done = 0;
                    var sortedPosts = [];
                    var pinnedPosts = [];
                    db.data.sort((a, b) => parseFloat(b.id) - parseFloat(a.id)).forEach(async post => {
                        var tagList = "";
                        post.tags.split(`,`).forEach(tag => {
                            defaults.tags.forEach(tags => {
                                if (tags.slug === tag) {
                                    tagList += tags.name + ", ";
                                };
                            });
                        });
                        if (post.pinned) {
                            pinnedPosts.push({
                                id: post.id,
                                post: `<a href="${defaults.domain}/forum/posts/${post.slug}" class="post"><h4>${req.session.userData.name.first} ${req.session.userData.name.last} <i class="fa-solid fa-${req.session.userData.badge.icon}" alt="${req.session.userData.badge.name}"></i> (${new Date(post["created_at"]).toLocaleDateString('en-us', { weekday: "long", month: "short", day: "numeric" })} at ${new Date(post["created_at"]).toLocaleTimeString('en-US')}) <i class="fa-solid fa-thumbtack"></i></h4><h2>${post.name}</h2><div class="tags"><i class="fa-solid fa-tags"></i> ${tagList.slice(0, -2)}</div></a>`,
                            });
                        } else {
                            sortedPosts.push({
                                id: post.id,
                                post: `<a href="${defaults.domain}/forum/posts/${post.slug}" class="post"><h4>${req.session.userData.name.first} ${req.session.userData.name.last} <i class="fa-solid fa-${req.session.userData.badge.icon}" alt="${req.session.userData.badge.name}"></i> (${new Date(post["created_at"]).toLocaleDateString('en-us', { weekday: "long", month: "short", day: "numeric" })} at ${new Date(post["created_at"]).toLocaleTimeString('en-US')})${(post.images != "{}") ? ' <i class="fa-solid fa-image"></i>' : ''}</h4><h2>${post.name}</h2><div class="tags"><i class="fa-solid fa-tags"></i> ${tagList.slice(0, -2)}</div></a>`,
                            });
                        };
                        done++;
                        if (done === wanted) {
                            pinnedPosts.sort((a, b) => parseFloat(b.id) - parseFloat(a.id));
                            pinnedPosts.forEach(async post => {
                                postsList += post.post;
                            });
                            sortedPosts.sort((a, b) => parseFloat(b.id) - parseFloat(a.id));
                            sortedPosts.forEach(async post => {
                                postsList += post.post;
                            });
                            await getComments(postsList);
                        };
                    });
                } else {
                    postsList = "No Posts";
                    await getComments(postsList);
                };
                async function getComments(postsList) {
                    await fetch(`${process.env.DATABASE_URL}?do=allcomments&username=${req.session.userData.username}`, {
                        method: 'GET',
                        headers: {
                            Accept: '*/*',
                            'User-Agent': `${defaults.siteName} (${defaults.domain})`
                        }
                    })
                        .then(db => db.json())
                        .then(async db => {
                            var commentsList = "";
                            if (db.data) {
                                var wanted = db.data.length;
                                var done = 0;
                                var sortedComments = [];
                                db.data.sort((a, b) => parseFloat(b.id) - parseFloat(a.id)).forEach(async comment => {
                                    if (comment.images != "{}") {
                                        sortedComments.push({
                                            id: comment.id,
                                            comment: `<a href="${defaults.domain}/forum/comments/${comment.id}" class="comment" id="${comment.id}"><h4>${req.session.userData.name.first} ${req.session.userData.name.last} <i class="fa-solid fa-${req.session.userData.badge.icon}" alt="${req.session.userData.badge.name}"></i></h4><h5>${new Date(comment["created_at"]).toLocaleDateString('en-us', { weekday: "long", month: "short", day: "numeric" })} at ${new Date(comment["created_at"]).toLocaleTimeString('en-US')}</h5><h4>${comment.content}</h4><img src="${JSON.parse(comment.images).image}" alt="${JSON.parse(comment.images).name}"></a>`,
                                        });
                                    } else {
                                        sortedComments.push({
                                            id: comment.id,
                                            comment: `<a href="${defaults.domain}/forum/comments/${comment.id}" class="comment" id="${comment.id}"><h4>${req.session.userData.name.first} ${req.session.userData.name.last} <i class="fa-solid fa-${req.session.userData.badge.icon}" alt="${req.session.userData.badge.name}"></i></h4><h5>${new Date(comment["created_at"]).toLocaleDateString('en-us', { weekday: "long", month: "short", day: "numeric" })} at ${new Date(comment["created_at"]).toLocaleTimeString('en-US')}</h5><h4>${comment.content}</h4></a>`,
                                        });
                                    };
                                    done++;
                                    if (done === wanted) {
                                        sortedComments.sort((a, b) => parseFloat(b.id) - parseFloat(a.id));
                                        sortedComments.forEach(async comment => {
                                            commentsList += comment.comment;
                                        });
                                        await sendData(commentsList);
                                    };
                                });
                            } else {
                                commentsList = "No Comments";
                                await sendData(commentsList);
                            };
                            async function sendData(commentsList) {
                                res.render('account', { vars: defaults, session: req.session, title: 'Account', user: req.session.userData, buttons: defaults.ssoButtonListHTML, posts: postsList, badges: tagListHTML.slice(0, -2), comments: commentsList });
                            };
                        });
                };
            });
    } else {
        if (req.query.redirect) {
            res.redirect(`/login?redirect=${req.query.redirect}`);
        } else {
            res.redirect('/login?redirect=/account');
        };
    };
});

app.get('/login', async (req, res) => {
    await allRoutes(req);
    if (req.session.loggedinUser === true) {
        if (req.query.redirect) {
            res.redirect(defaults.domain + req.query.redirect);
        } else {
            res.redirect('/account');
        };
    } else {
        res.render('login', { vars: defaults, session: req.session, title: 'Login', user: req.session.userData, redirect: "?redirect=" + req.query.redirect });
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
                bcrypt.compare(req.body.password, db.password, function (err, result) {
                    if (result) {
                        defaults.schools.forEach(async school => {
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
                                    dob: new Intl.DateTimeFormat('en-US', { timeZone: 'Australia/Sydney' }).format(new Date(db.dob)),
                                    gradyear: db.gradyear,
                                    badges: JSON.parse(db.badges),
                                    badge: JSON.parse(db.badges)[JSON.parse(db.badges).length - 1],
                                    pfp: db.image,
                                };
                                defaults.badges.forEach(badge => {
                                    if (badge.slug === req.session.userData.badge) {
                                        req.session.userData.badge = badge;
                                    };
                                });
                                req.session.announcement = `<i class="fa-solid fa-${req.session.userData.badge.icon}"></i>&nbsp;&nbsp;Hey, ${req.session.userData.badge.name}!`;
                                await fetch(`${process.env.DATABASE_URL}?do=allposts&username=${req.session.userData.username}`, {
                                    method: 'GET',
                                    headers: {
                                        Accept: '*/*',
                                        'User-Agent': `${defaults.siteName} (${defaults.domain})`
                                    }
                                })
                                    .then(db => db.json())
                                    .then(db => {
                                        if (db.data) {
                                            req.session.userData.posts = db.data.length;
                                        } else {
                                            req.session.userData.posts = 0;
                                        };
                                    });
                                await fetch(`${process.env.DATABASE_URL}?do=allcomments&username=${req.session.userData.username}`, {
                                    method: 'GET',
                                    headers: {
                                        Accept: '*/*',
                                        'User-Agent': `${defaults.siteName} (${defaults.domain})`
                                    }
                                })
                                    .then(db => db.json())
                                    .then(db => {
                                        if (db.data) {
                                            req.session.userData.comments = db.data.length;
                                        } else {
                                            req.session.userData.comments = 0;
                                        };
                                    });
                                req.session.loggedinUser = true;
                                if (req.query.redirect) {
                                    res.redirect('/login?redirect=' + req.query.redirect);
                                } else {
                                    res.redirect('/login');
                                };
                            };
                        });
                    } else {
                        req.session.loggedinUser = false;
                        res.render('login', { vars: defaults, session: req.session, title: 'Login', user: req.session.userData, alert: "Incorrect details!", redirect: "?redirect=" + req.query.redirect });
                    };
                });
            } else {
                req.session.loggedinUser = false;
                res.render('login', { vars: defaults, session: req.session, title: 'Login', user: req.session.userData, alert: "Incorrect details!", redirect: "?redirect=" + req.query.redirect });
            };
        });
});

app.get('/signup', async (req, res) => {
    await allRoutes(req);
    if (req.session.loggedinUser === true) {
        res.redirect('/account');
    } else {
        res.render('signup', { vars: defaults, session: req.session, title: 'Signup', user: req.session.userData, schoolList: defaults.schoolListHTML });
    };
});

app.post('/signup', async (req, res) => {
    await allRoutes(req);
    if ((req.body.username != "") && (req.body.password != "") && (req.body.email != "") && (req.body.firstname != "") && (req.body.lastname != "") && (req.body.dob != "") && (req.body.school != "") && (req.body.gradyear != "") && (req.body.email === `${req.body.username.toLowerCase()}@vschsd.org`) && (!detectProfanity(req.body.username))) {
        if (!req.body.teacher) {
            if ((req.body.password.length === 6) && (!isNaN(req.body.password)) && (req.body.gradyear.length === 4) && (!isNaN(req.body.gradyear))) {
                await continue1();
            } else {
                req.session.loggedinUser = false;
                res.render('signup', { vars: defaults, session: req.session, title: 'Signup', user: req.session.userData, schoolList: defaults.schoolListHTML, alert: "Fill in all fields correctly!" });
            };
        } else {
            await continue1();
        };
        async function continue1() {
            var badges = "student";
            var wanted = defaults.faculty.length;
            var done = 0;
            var teacher = [];
            defaults.faculty.forEach(async faculty => {
                if ((faculty.name.first === req.body.firstname) && (faculty.name.last === req.body.lastname) && (req.body.gradyear < new Date().getFullYear() - 3) && (getAge(req.body.dob) > 21)) {
                    badges = "teacher";
                    teacher = faculty;
                };
                done++;
                if (done === wanted) {
                    // DangoID >> vschsd-student-forum >> new
                    var connection = mysql.createConnection({
                        host: 'portal.dangoweb.com',
                        user: 'dangoweb_vschsd-student-forum',
                        password: '8p4fascbse',
                        database: 'dangoweb_vschsd-student-forum'
                    });
                    await connection.connect();
                    await connection.query(`SELECT * FROM users WHERE username = '${req.body.username.toLowerCase()}'`, async function (error, results, fields) {
                        if (!error) {
                            if (results.length === 0) {
                                await connection.query(`SELECT MAX(id) FROM users`, async function (error, results, fields) {
                                    if (!error) {
                                        var newId = results[0]['MAX(id)'] + 1;
                                        if ((req.body.image != "") && (req.body.image != undefined)) {
                                            var temp1 = ", image";
                                            var temp2 = `, '${req.body.image}'`;
                                        } else {
                                            var temp1 = "";
                                            var temp2 = "";
                                        };
                                        await connection.query(`INSERT INTO users (id, username, password, email, firstname, lastname, age, school, gradyear, dob, badges${temp1}) VALUES (${newId}, '${req.body.username.toLowerCase()}', '${await bcrypt.hash(req.body.password, 10)}', '${req.body.email}', '${await toTitleCase(req.body.firstname)}', '${await toTitleCase(req.body.lastname)}', '${getAge(req.body.dob)}', '${req.body.school}', '${req.body.gradyear}', '${req.body.dob}', '["${badges}"]'${temp2})`, async function (error, results, fields) {
                                            if (!error) {
                                                req.session.loggedinUser = false;
                                                res.render('signup', { vars: defaults, session: req.session, title: 'Signup', user: req.session.userData, schoolList: defaults.schoolListHTML, alert: "Account created." });
                                                await connection.end();
                                            } else {
                                                console.log(error);
                                                req.session.loggedinUser = false;
                                                res.render('signup', { vars: defaults, session: req.session, title: 'Signup', user: req.session.userData, schoolList: defaults.schoolListHTML, alert: "There was an error!" });
                                                await connection.end();
                                            };
                                        });
                                    } else {
                                        console.log(error);
                                        req.session.loggedinUser = false;
                                        res.render('signup', { vars: defaults, session: req.session, title: 'Signup', user: req.session.userData, schoolList: defaults.schoolListHTML, alert: "There was an error!" });
                                        await connection.end();
                                    };
                                });
                            } else {
                                console.log(error);
                                req.session.loggedinUser = false;
                                res.render('signup', { vars: defaults, session: req.session, title: 'Signup', user: req.session.userData, schoolList: defaults.schoolListHTML, alert: "Account already exists!" });
                            };
                        } else {
                            console.log(error);
                            req.session.loggedinUser = false;
                            res.render('signup', { vars: defaults, session: req.session, title: 'Signup', user: req.session.userData, schoolList: defaults.schoolListHTML, alert: "There was an error!" });
                        };
                    });
                };
            });
        };
    } else {
        req.session.loggedinUser = false;
        res.render('signup', { vars: defaults, session: req.session, title: 'Signup', user: req.session.userData, schoolList: defaults.schoolListHTML, alert: "Fill in all fields correctly!" });
    };
});

app.get('/logout', async (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

app.get('/forum', async (req, res) => {
    await allRoutes(req);
    await fetch(`${process.env.DATABASE_URL}?do=allposts`, {
        method: 'GET',
        headers: {
            Accept: '*/*',
            'User-Agent': `${defaults.siteName} (${defaults.domain})`
        }
    })
        .then(db => db.json())
        .then(db => {
            var postsList = "";
            var wanted = db.data.length;
            var done = 0;
            var sortedPosts = [];
            var pinnedPosts = [];
            db.data.sort((a, b) => parseFloat(b.id) - parseFloat(a.id)).forEach(async post => {
                var tagList = "";
                post.tags.split(`,`).forEach(tag => {
                    defaults.tags.forEach(tags => {
                        if (tags.slug === tag) {
                            tagList += tags.name + ", ";
                        };
                    });
                });
                await fetch(`${process.env.DATABASE_URL}?do=find&username=${post.author}`, {
                    method: 'GET',
                    headers: {
                        Accept: '*/*',
                        'User-Agent': `${defaults.siteName} (${defaults.domain})`
                    }
                })
                    .then(db => db.json())
                    .then(db => {
                        if ((db.info.status === 1) && (!post.flagged)) {
                            var authorName = db.data.firstname + " " + db.data.lastname;
                            var authorBadge = JSON.parse(db.data.badges)[JSON.parse(db.data.badges).length - 1];
                            defaults.badges.forEach(badge => {
                                if (badge.slug === authorBadge) {
                                    authorBadge = badge;
                                };
                            });
                            if (post.pinned) {
                                pinnedPosts.push({
                                    id: post.id,
                                    post: `<a href="${defaults.domain}/forum/posts/${post.slug}" class="post"><h4>${authorName} <i class="fa-solid fa-${authorBadge.icon}" alt="${authorBadge.name}"></i> (${new Date(post["created_at"]).toLocaleDateString('en-us', { weekday: "long", month: "short", day: "numeric" })} at ${new Date(post["created_at"]).toLocaleTimeString('en-US')}) <i class="fa-solid fa-thumbtack"></i>${(post.images != "{}") ? ' <i class="fa-solid fa-image"></i>' : ''}</h4><h2>${post.name}</h2><div class="tags"><i class="fa-solid fa-tags"></i> ${tagList.slice(0, -2)}</div></a>`,
                                });
                            } else {
                                sortedPosts.push({
                                    id: post.id,
                                    post: `<a href="${defaults.domain}/forum/posts/${post.slug}" class="post"><h4>${authorName} <i class="fa-solid fa-${authorBadge.icon}" alt="${authorBadge.name}"></i> (${new Date(post["created_at"]).toLocaleDateString('en-us', { weekday: "long", month: "short", day: "numeric" })} at ${new Date(post["created_at"]).toLocaleTimeString('en-US')})${(post.images != "{}") ? ' <i class="fa-solid fa-image"></i>' : ''}</h4><h2>${post.name}</h2><div class="tags"><i class="fa-solid fa-tags"></i> ${tagList.slice(0, -2)}</div></a>`,
                                });
                            };
                        };
                        done++;
                        if (done === wanted) {
                            pinnedPosts.sort((a, b) => parseFloat(b.id) - parseFloat(a.id));
                            pinnedPosts.forEach(async post => {
                                postsList += post.post;
                            });
                            sortedPosts.sort((a, b) => parseFloat(b.id) - parseFloat(a.id));
                            sortedPosts.forEach(async post => {
                                postsList += post.post;
                            });
                            if (postsList === "") {
                                postsList = "No posts yet.";
                            };
                            res.render('forum', { vars: defaults, session: req.session, title: 'Forum', user: req.session.userData, posts: postsList });
                        };
                    });
            });
        });
});

app.get('/forum/posts', async (req, res) => {
    await allRoutes(req);
    res.redirect('/forum');
});

app.get('/forum/posts/new', async (req, res) => {
    await allRoutes(req);
    if (req.session.loggedinUser === true) {
        res.render('newpost', { vars: defaults, session: req.session, title: 'New Post', user: req.session.userData, tagList: defaults.tagListHTML });
    } else {
        res.redirect('/login?redirect=/forum/posts/new');
    };
});

app.post('/forum/posts/new', async (req, res) => {
    await allRoutes(req);
    if (req.session.loggedinUser === true) {
        // DangoID >> vschsd-student-forum >> newpost
        var connection = mysql.createConnection({
            host: 'portal.dangoweb.com',
            user: 'dangoweb_vschsd-student-forum',
            password: '8p4fascbse',
            database: 'dangoweb_vschsd-student-forum'
        });
        await connection.connect();
        var slug = req.body.name.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');
        await connection.query(`SELECT * FROM posts WHERE slug = '${slug}'`, async function (error, results, fields) {
            if (!error) {
                if (results.length != 0) {
                    function makeid(length) {
                        let result = '';
                        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                        const charactersLength = characters.length;
                        let counter = 0;
                        while (counter < length) {
                            result += characters.charAt(Math.floor(Math.random() * charactersLength));
                            counter += 1;
                        }
                        return result;
                    };
                    slug = `${slug}-${makeid(5).toLowerCase()}`;
                };
                await connection.query(`SELECT MAX(id) FROM posts`, async function (error, results, fields) {
                    if (!error) {
                        var newId = results[0]['MAX(id)'] + 1;
                        if ((req.body.description != "") && (req.body.description != undefined)) {
                            var temp1 = ", description";
                            var temp2 = `, '${req.body.description.replaceAll(`'`, `\\'`)}'`;
                        } else {
                            var temp1 = "";
                            var temp2 = "";
                        };
                        if ((req.body.image != "") && (req.body.image != undefined)) {
                            var imageJson = {
                                name: req.body.imagename,
                                image: req.body.image
                            };
                            var temp3 = ", images";
                            var temp4 = `, '${JSON.stringify(imageJson)}'`;
                        } else {
                            var temp3 = "";
                            var temp4 = "";
                        };
                        await connection.query(`INSERT INTO posts (id, author, name, slug, tags${temp1}${temp3}) VALUES (${newId}, '${req.session.userData.username}', '${req.body.name}', '${slug}', '${req.body.tags}'${temp2}${temp4})`, async function (error, results, fields) {
                            if (!error) {
                                if ((detectProfanity(req.body.name)) || (detectProfanity(req.body.description))) {
                                    await fetch(`${process.env.DATABASE_URL}?do=flagpost&slug=${slug}`, {
                                        method: 'GET',
                                        headers: {
                                            Accept: '*/*',
                                            'User-Agent': `${defaults.siteName} (${defaults.domain})`
                                        }
                                    })
                                        .then(db => db.json())
                                        .then(db => {
                                            if (db.info.status === 1) {
                                                res.redirect(`${defaults.domain}/forum/posts/${slug}`);
                                            }
                                        });
                                } else {
                                    res.redirect(`${defaults.domain}/forum/posts/${slug}`);
                                };
                                await connection.end();
                            } else {
                                console.log(error);
                                res.render('newpost', { vars: defaults, session: req.session, title: 'New Post', user: req.session.userData, tagList: defaults.tagListHTML, alert: (error.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD') ? 'We do not allow emojis.' :"There was an error!", enteredTitle: req.body.name, enteredDescription: req.body.description });
                                await connection.end();
                            };
                        });
                    } else {
                        console.log(error);
                        res.render('newpost', { vars: defaults, session: req.session, title: 'New Post', user: req.session.userData, tagList: defaults.tagListHTML, alert: "There was an error!", enteredTitle: req.body.name, enteredDescription: req.body.description });
                        await connection.end();
                    };
                });
            } else {
                console.log(error);
                res.render('newpost', { vars: defaults, session: req.session, title: 'New Post', user: req.session.userData, tagList: defaults.tagListHTML, alert: "There was an error!", enteredTitle: req.body.name, enteredDescription: req.body.description });
                await connection.end();
            };
        });
    } else {
        res.redirect('/login?redirect=/forum/posts/new');
    };
});

app.get('/forum/posts/:post', async (req, res) => {
    await allRoutes(req);
    await fetch(`${process.env.DATABASE_URL}?do=findpost&slug=${req.params.post}`, {
        method: 'GET',
        headers: {
            Accept: '*/*',
            'User-Agent': `${defaults.siteName} (${defaults.domain})`
        }
    })
        .then(post => post.json())
        .then(async post => {
            if (post.data) {
                await fetch(`${process.env.DATABASE_URL}?do=find&username=${post.data.author}`, {
                    method: 'GET',
                    headers: {
                        Accept: '*/*',
                        'User-Agent': `${defaults.siteName} (${defaults.domain})`
                    }
                })
                    .then(db => db.json())
                    .then(async db => {
                        var authorName = db.data.firstname + " " + db.data.lastname;
                        var tagList = "";
                        post.data.tags.split(`,`).forEach(tag => {
                            defaults.tags.forEach(tags => {
                                if (tags.slug === tag) {
                                    tagList += tags.name + ", ";
                                };
                            });
                        });
                        var authorBadge = JSON.parse(db.data.badges)[JSON.parse(db.data.badges).length - 1];
                        defaults.badges.forEach(badge => {
                            if (badge.slug === authorBadge) {
                                authorBadge = badge;
                            };
                        });
                        var authorPfp = "";
                        var authorSchool = [];
                        defaults.schools.forEach(school => {
                            if (db.data.school === school.short) {
                                authorPfp = `${defaults.domain}/images/${school.logoUrl}`;
                                authorSchool = school;
                            };
                        });
                        if (db.data.image != null) {
                            authorPfp = db.data.image;
                        };
                        var authorAbout = `<img src="${authorPfp}"/><h4>${authorName}</h4><p>${authorName} is a ${authorBadge.name} from ${authorSchool.name}.</p>`;
                        var authorUsername = db.data.username;
                        switch (JSON.parse(db.data.badges)[JSON.parse(db.data.badges).length - 1]) {
                            case "admin":
                                var alert = "<i class='fas fa-exclamation-triangle'></i>&nbsp;&nbsp;This post is from an admin.";
                                var adminpost = true;
                                break;
                            default:
                                var alert = "";
                                var adminpost = false;
                                break;
                        };
                        await fetch(`${process.env.DATABASE_URL}?do=allcomments&post=${post.data.id}`, {
                            method: 'GET',
                            headers: {
                                Accept: '*/*',
                                'User-Agent': `${defaults.siteName} (${defaults.domain})`
                            }
                        })
                            .then(comments => comments.json())
                            .then(async comments => {
                                if (comments.data) {
                                    var commentsList = [];
                                    var wanted = comments.data.length;
                                    var done = 0;
                                    var sortedComments = [];
                                    comments.data.sort((a, b) => parseFloat(b.id) - parseFloat(a.id)).forEach(async comment => {
                                        await fetch(`${process.env.DATABASE_URL}?do=find&username=${comment.author}`, {
                                            method: 'GET',
                                            headers: {
                                                Accept: '*/*',
                                                'User-Agent': `${defaults.siteName} (${defaults.domain})`
                                            }
                                        })
                                            .then(db => db.json())
                                            .then(db => {
                                                if (db.info.status === 1) {
                                                    var commentAuthorName = db.data.firstname + " " + db.data.lastname;
                                                    var commentAuthorBadge = JSON.parse(db.data.badges)[JSON.parse(db.data.badges).length - 1];
                                                    defaults.badges.forEach(badge => {
                                                        if (badge.slug === commentAuthorBadge) {
                                                            commentAuthorBadge = badge;
                                                        };
                                                    });
                                                    var commentAuthorPfp = "";
                                                    defaults.schools.forEach(school => {
                                                        if (db.data.school === school.short) {
                                                            commentAuthorPfp = `${defaults.domain}/images/${school.logoUrl}`;
                                                        };
                                                    });
                                                    if (db.data.image != null) {
                                                        commentAuthorPfp = db.data.image;
                                                    };
                                                    var modactions = "";
                                                    if ((req.session.userData.badge) && ((req.session.userData.badge.slug === "admin") || (req.session.userData.badge.slug === "moderator") || (comment.author === req.session.userData.username))) {
                                                        modactions = `<div class="modactions">Comment Actions: <button onclick="window.location.href='${defaults.domain}/forum/comments/${comment.id}/delete'"><i class="fa-solid fa-trash"></i> Delete</button></div>`;
                                                    };
                                                    if (comment.images != "{}") {
                                                        sortedComments.push({
                                                            id: comment.id,
                                                            comment: `<div class="comment"><a href="${defaults.domain}/users/${comment.author}"><img src="${commentAuthorPfp}" class="pfp" /></a><a href="#${comment.id}" id="${comment.id}" class="inner"><h4>${commentAuthorName} <i class="fa-solid fa-${commentAuthorBadge.icon}" alt="${commentAuthorBadge.name}"></i></h4><h5>${new Date(comment["created_at"]).toLocaleDateString('en-us', { weekday: "long", month: "short", day: "numeric" })} at ${new Date(comment["created_at"]).toLocaleTimeString('en-US')}</h5><h4>${comment.content}</h4><img src="${JSON.parse(comment.images).image}" alt="${JSON.parse(comment.images).name}" />${modactions}</a></div>`,
                                                        });
                                                    } else {
                                                        sortedComments.push({
                                                            id: comment.id,
                                                            comment: `<div class="comment"><a href="${defaults.domain}/users/${comment.author}"><img src="${commentAuthorPfp}" class="pfp" /></a><a href="#${comment.id}" id="${comment.id}" class="inner"><h4>${commentAuthorName} <i class="fa-solid fa-${commentAuthorBadge.icon}" alt="${commentAuthorBadge.name}"></i></h4><h5>${new Date(comment["created_at"]).toLocaleDateString('en-us', { weekday: "long", month: "short", day: "numeric" })} at ${new Date(comment["created_at"]).toLocaleTimeString('en-US')}</h5><h4>${comment.content}</h4>${modactions}</a></div>`,
                                                        });
                                                    };
                                                };
                                                done++;
                                                if (done === wanted) {
                                                    sortedComments.sort((a, b) => parseFloat(b.id) - parseFloat(a.id));
                                                    sortedComments.forEach(async comment => {
                                                        commentsList += comment.comment;
                                                    });
                                                    if (post.data.images != "{}") {
                                                        res.render('post', { vars: defaults, session: req.session, title: post.data.name, user: req.session.userData, tags: tagList.slice(0, -2), description: post.data.description, image: JSON.parse(post.data.images).image, imagename: JSON.parse(post.data.images).name, author: authorName, badge: authorBadge, pinned: post.data.pinned, date: `${new Date(post.data["created_at"]).toLocaleDateString('en-us', { weekday: "long", month: "short", day: "numeric" })} at ${new Date(post.data["created_at"]).toLocaleTimeString('en-US')}`, comments: commentsList, id: post.data.id, pfp: authorPfp, alert: alert, slug: post.data.slug, username: post.data.author, adminpost: adminpost, authorAbout: authorAbout, authorUsername: authorUsername });
                                                    } else {
                                                        res.render('post', { vars: defaults, session: req.session, title: post.data.name, user: req.session.userData, tags: tagList.slice(0, -2), description: post.data.description, image: "", imagename: "", author: authorName, badge: authorBadge, pinned: post.data.pinned, date: `${new Date(post.data["created_at"]).toLocaleDateString('en-us', { weekday: "long", month: "short", day: "numeric" })} at ${new Date(post.data["created_at"]).toLocaleTimeString('en-US')}`, comments: commentsList, id: post.data.id, pfp: authorPfp, alert: alert, slug: post.data.slug, username: post.data.author, adminpost: adminpost, authorAbout: authorAbout, authorUsername: authorUsername });
                                                    };
                                                };
                                            });
                                    });
                                } else {
                                    commentsList = "No comments yet.";
                                    if (post.data.images != "{}") {
                                        res.render('post', { vars: defaults, session: req.session, title: post.data.name, user: req.session.userData, tags: tagList.slice(0, -2), description: post.data.description, image: JSON.parse(post.data.images).image, imagename: JSON.parse(post.data.images).name, author: authorName, badge: authorBadge, pinned: post.data.pinned, date: `${new Date(post.data["created_at"]).toLocaleDateString('en-us', { weekday: "long", month: "short", day: "numeric" })} at ${new Date(post.data["created_at"]).toLocaleTimeString('en-US')}`, comments: commentsList, id: post.data.id, pfp: authorPfp, alert: alert, slug: post.data.slug, username: post.data.author, adminpost: adminpost, authorAbout: authorAbout, authorUsername: authorUsername });
                                    } else {
                                        res.render('post', { vars: defaults, session: req.session, title: post.data.name, user: req.session.userData, tags: tagList.slice(0, -2), description: post.data.description, image: "", imagename: "", author: authorName, badge: authorBadge, pinned: post.data.pinned, date: `${new Date(post.data["created_at"]).toLocaleDateString('en-us', { weekday: "long", month: "short", day: "numeric" })} at ${new Date(post.data["created_at"]).toLocaleTimeString('en-US')}`, comments: commentsList, id: post.data.id, pfp: authorPfp, alert: alert, slug: post.data.slug, username: post.data.author, adminpost: adminpost, authorAbout: authorAbout, authorUsername: authorUsername });
                                    };
                                };
                            });
                    });
            } else {
                res.render('404', { vars: defaults, session: req.session, title: '404', user: req.session.userData });
            };
        });
});

app.get('/forum/posts/:post/delete', async (req, res) => {
    await allRoutes(req);
    if (req.session.loggedinUser === true) {
        await fetch(`${process.env.DATABASE_URL}?do=findpost&slug=${req.params.post}`, {
            method: 'GET',
            headers: {
                Accept: '*/*',
                'User-Agent': `${defaults.siteName} (${defaults.domain})`
            }
        })
            .then(post => post.json())
            .then(async post => {
                if (post.info.status === 1) {
                    if ((req.session.userData.badge.slug === "admin") || (req.session.userData.badge.slug === "moderator") || (post.data.author === req.session.userData.username)) {
                        await fetch(`${process.env.DATABASE_URL}?do=deletepost&slug=${req.params.post}`, {
                            method: 'GET',
                            headers: {
                                Accept: '*/*',
                                'User-Agent': `${defaults.siteName} (${defaults.domain})`
                            }
                        })
                            .then(result => result.json())
                            .then(async result => {
                                res.redirect('/forum');
                            });
                    } else {
                        res.redirect('/forum');
                    };
                } else {
                    res.redirect('/forum');
                };
            });
    } else {
        res.redirect('/forum');
    };
});

app.get('/forum/posts/:post/pin', async (req, res) => {
    await allRoutes(req);
    if (req.session.loggedinUser === true) {
        await fetch(`${process.env.DATABASE_URL}?do=findpost&slug=${req.params.post}`, {
            method: 'GET',
            headers: {
                Accept: '*/*',
                'User-Agent': `${defaults.siteName} (${defaults.domain})`
            }
        })
            .then(post => post.json())
            .then(async post => {
                if (post.info.status === 1) {
                    if (req.session.userData.badge.slug === "admin") {
                        await fetch(`${process.env.DATABASE_URL}?do=pinpost&slug=${req.params.post}`, {
                            method: 'GET',
                            headers: {
                                Accept: '*/*',
                                'User-Agent': `${defaults.siteName} (${defaults.domain})`
                            }
                        })
                            .then(result => result.json())
                            .then(async result => {
                                res.redirect(`/forum/posts/${req.params.post}`);
                            });
                    } else {
                        res.redirect('/forum');
                    };
                } else {
                    res.redirect('/forum');
                };
            });
    } else {
        res.redirect('/forum');
    };
});

app.get('/forum/posts/:post/unpin', async (req, res) => {
    await allRoutes(req);
    if (req.session.loggedinUser === true) {
        await fetch(`${process.env.DATABASE_URL}?do=findpost&slug=${req.params.post}`, {
            method: 'GET',
            headers: {
                Accept: '*/*',
                'User-Agent': `${defaults.siteName} (${defaults.domain})`
            }
        })
            .then(post => post.json())
            .then(async post => {
                if (post.info.status === 1) {
                    if (req.session.userData.badge.slug === "admin") {
                        await fetch(`${process.env.DATABASE_URL}?do=unpinpost&slug=${req.params.post}`, {
                            method: 'GET',
                            headers: {
                                Accept: '*/*',
                                'User-Agent': `${defaults.siteName} (${defaults.domain})`
                            }
                        })
                            .then(result => result.json())
                            .then(async result => {
                                res.redirect(`/forum/posts/${req.params.post}`);
                            });
                    } else {
                        res.redirect('/forum');
                    };
                } else {
                    res.redirect('/forum');
                };
            });
    } else {
        res.redirect('/forum');
    };
});

app.get('/forum/posts/:post/flag', async (req, res) => {
    await allRoutes(req);
    if (req.session.loggedinUser === true) {
        await fetch(`${process.env.DATABASE_URL}?do=findpost&slug=${req.params.post}`, {
            method: 'GET',
            headers: {
                Accept: '*/*',
                'User-Agent': `${defaults.siteName} (${defaults.domain})`
            }
        })
            .then(post => post.json())
            .then(async post => {
                if (post.info.status === 1) {
                    if ((req.session.userData.badge.slug === "admin") || (req.session.userData.badge.slug === "moderation")) {
                        await fetch(`${process.env.DATABASE_URL}?do=flagpost&slug=${req.params.post}`, {
                            method: 'GET',
                            headers: {
                                Accept: '*/*',
                                'User-Agent': `${defaults.siteName} (${defaults.domain})`
                            }
                        })
                            .then(result => result.json())
                            .then(async result => {
                                res.redirect(`/forum/posts/${req.params.post}`);
                            });
                    } else {
                        res.redirect('/forum');
                    };
                } else {
                    res.redirect('/forum');
                };
            });
    } else {
        res.redirect('/forum');
    };
});

app.get('/forum/posts/:post/unflag', async (req, res) => {
    await allRoutes(req);
    if (req.session.loggedinUser === true) {
        await fetch(`${process.env.DATABASE_URL}?do=findpost&slug=${req.params.post}`, {
            method: 'GET',
            headers: {
                Accept: '*/*',
                'User-Agent': `${defaults.siteName} (${defaults.domain})`
            }
        })
            .then(post => post.json())
            .then(async post => {
                if (post.info.status === 1) {
                    if ((req.session.userData.badge.slug === "admin") || (req.session.userData.badge.slug === "moderator")) {
                        await fetch(`${process.env.DATABASE_URL}?do=unflagpost&slug=${req.params.post}`, {
                            method: 'GET',
                            headers: {
                                Accept: '*/*',
                                'User-Agent': `${defaults.siteName} (${defaults.domain})`
                            }
                        })
                            .then(result => result.json())
                            .then(async result => {
                                res.redirect(`/forum/posts/${req.params.post}`);
                            });
                    } else {
                        res.redirect('/forum');
                    };
                } else {
                    res.redirect('/forum');
                };
            });
    } else {
        res.redirect('/forum');
    };
});

app.get('/forum/topics', async (req, res) => {
    await allRoutes(req);
    res.render('topics', { vars: defaults, session: req.session, title: 'Topics', user: req.session.userData, tags: defaults.tagListHTMLButtons });
});

app.get('/forum/topics/:topic', async (req, res) => {
    await allRoutes(req);
    var wanted = defaults.tags.length;
    var done = 0;
    defaults.tags.forEach(async tag => {
        if (tag.slug === req.params.topic) {
            done--;
            await fetch(`${process.env.DATABASE_URL}?do=allposts&tag=${req.params.topic}`, {
                method: 'GET',
                headers: {
                    Accept: '*/*',
                    'User-Agent': `${defaults.siteName} (${defaults.domain})`
                }
            })
                .then(db => db.json())
                .then(db => {
                    if (db.data) {
                        var postsList = "";
                        var wanted = db.data.length;
                        var donea = 0;
                        var sortedPosts = [];
                        var pinnedPosts = [];
                        db.data.sort((a, b) => parseFloat(b.id) - parseFloat(a.id)).forEach(async post => {
                            var tagList = "";
                            post.tags.split(`,`).forEach(tag => {
                                defaults.tags.forEach(tags => {
                                    if (tags.slug === tag) {
                                        tagList += tags.name + ", ";
                                    };
                                });
                            });
                            await fetch(`${process.env.DATABASE_URL}?do=find&username=${post.author}`, {
                                method: 'GET',
                                headers: {
                                    Accept: '*/*',
                                    'User-Agent': `${defaults.siteName} (${defaults.domain})`
                                }
                            })
                                .then(db => db.json())
                                .then(db => {
                                    if ((db.info.status === 1) && (!post.flagged)) {
                                        var authorName = db.data.firstname + " " + db.data.lastname;
                                        defaults.badges.forEach(badge => {
                                            if (badge.slug === JSON.parse(db.data.badges)[JSON.parse(db.data.badges).length - 1]) {
                                                authorBadge = badge;
                                            };
                                        });
                                        if (post.pinned) {
                                            pinnedPosts.push({
                                                id: post.id,
                                                post: `<a href="${defaults.domain}/forum/posts/${post.slug}" class="post"><h4>${authorName} <i class="fa-solid fa-${authorBadge.icon}" alt="${authorBadge.name}"></i> (${new Date(post["created_at"]).toLocaleDateString('en-us', { weekday: "long", month: "short", day: "numeric" })} at ${new Date(post["created_at"]).toLocaleTimeString('en-US')}) <i class="fa-solid fa-thumbtack"></i>${(post.images != "{}") ? ' <i class="fa-solid fa-image"></i>' : ''}</h4><h2>${post.name}</h2><div class="tags"><i class="fa-solid fa-tags"></i> ${tagList.slice(0, -2)}</div></a>`,
                                            });
                                        } else {
                                            sortedPosts.push({
                                                id: post.id,
                                                post: `<a href="${defaults.domain}/forum/posts/${post.slug}" class="post"><h4>${authorName} <i class="fa-solid fa-${authorBadge.icon}" alt="${authorBadge.name}"></i> (${new Date(post["created_at"]).toLocaleDateString('en-us', { weekday: "long", month: "short", day: "numeric" })} at ${new Date(post["created_at"]).toLocaleTimeString('en-US')})${(post.images != "{}") ? ' <i class="fa-solid fa-image"></i>' : ''}</h4><h2>${post.name}</h2><div class="tags"><i class="fa-solid fa-tags"></i> ${tagList.slice(0, -2)}</div></a>`,
                                            });
                                        };
                                    };
                                    donea++;
                                    if (donea === wanted) {
                                        pinnedPosts.sort((a, b) => parseFloat(b.id) - parseFloat(a.id));
                                        pinnedPosts.forEach(async post => {
                                            postsList += post.post;
                                        });
                                        sortedPosts.sort((a, b) => parseFloat(b.id) - parseFloat(a.id));
                                        sortedPosts.forEach(async post => {
                                            postsList += post.post;
                                        });
                                        res.render('topic', { vars: defaults, session: req.session, title: 'Topic', user: req.session.userData, tags: defaults.tagListHTMLButtons, posts: postsList, longtitle: tag.title, description: tag.description, icon: tag.icon });
                                    };
                                });
                        });
                    } else {
                        res.render('topic', { vars: defaults, session: req.session, title: 'Topic', user: req.session.userData, tags: defaults.tagListHTMLButtons, posts: "No Posts", longtitle: tag.title, description: tag.description, icon: tag.icon });
                    };
                });
        };
        done++;
        if (done === wanted) {
            res.render('404', { vars: defaults, session: req.session, title: '404', user: req.session.userData });
        };
    });
});

app.get('/forum/comments', async (req, res) => {
    await allRoutes(req);
    res.redirect('/forum');
});

app.get('/forum/comments/new', async (req, res) => {
    await allRoutes(req);
    if (req.session.loggedinUser === true) {
        if (req.query.post) {
            res.render('newcomment', { vars: defaults, session: req.session, title: 'New Comment', user: req.session.userData, post: req.query.post });
        } else {
            res.redirect('/forum');
        };
    } else {
        res.redirect('/login?redirect=/forum/comments/new');
    };
});

app.post('/forum/comments/new', async (req, res) => {
    await allRoutes(req);
    if ((req.session.loggedinUser === true) && (req.query.post)) {
        // DangoID >> vschsd-student-forum >> newcomment
        var connection = mysql.createConnection({
            host: 'portal.dangoweb.com',
            user: 'dangoweb_vschsd-student-forum',
            password: '8p4fascbse',
            database: 'dangoweb_vschsd-student-forum'
        });
        await connection.connect();
        await connection.query(`SELECT MAX(id) FROM comments`, async function (error, results, fields) {
            if (!error) {
                var newId = results[0]['MAX(id)'] + 1;
                if ((req.body.image != "") && (req.body.image != undefined)) {
                    var imageJson = {
                        name: req.body.imagename,
                        image: req.body.image
                    };
                    var temp1 = ", images";
                    var temp2 = `, '${JSON.stringify(imageJson)}'`;
                } else {
                    var temp1 = "";
                    var temp2 = "";
                };
                await connection.query(`INSERT INTO comments (id, post, author, content${temp1}) VALUES (${newId}, ${req.query.post}, '${req.session.userData.username}', '${req.body.content}'${temp2})`, async function (error, results, fields) {
                    if (!error) {
                        await fetch(`${process.env.DATABASE_URL}?do=findpost&id=${req.query.post}`, {
                            method: 'GET',
                            headers: {
                                Accept: '*/*',
                                'User-Agent': `${defaults.siteName} (${defaults.domain})`
                            }
                        })
                            .then(post => post.json())
                            .then(async post => {
                                res.redirect(`${defaults.domain}/forum/posts/${post.data.slug}`);
                                await connection.end();
                            });
                    } else {
                        console.log(error);
                        res.render('newcomment', { vars: defaults, session: req.session, title: 'New Comment', user: req.session.userData, alert: "There was an error!", post: req.query.post });
                        await connection.end();
                    };
                });
            } else {
                console.log(error);
                res.render('newcomment', { vars: defaults, session: req.session, title: 'New Comment', user: req.session.userData, alert: "There was an error!", post: req.query.post });
                await connection.end();
            };
        });
    } else {
        res.redirect('/login?redirect=/forum/comments/new');
    };
});

app.get('/forum/comments/:comment', async (req, res) => {
    await allRoutes(req);
    if ((req.params.comment) && (!isNaN(req.params.comment))) {
        await fetch(`${process.env.DATABASE_URL}?do=findcomment&id=${req.params.comment}`, {
            method: 'GET',
            headers: {
                Accept: '*/*',
                'User-Agent': `${defaults.siteName} (${defaults.domain})`
            }
        })
            .then(comment => comment.json())
            .then(async comment => {
                if (comment.data) {
                    await fetch(`${process.env.DATABASE_URL}?do=findpost&id=${comment.data.post}`, {
                        method: 'GET',
                        headers: {
                            Accept: '*/*',
                            'User-Agent': `${defaults.siteName} (${defaults.domain})`
                        }
                    })
                        .then(post => post.json())
                        .then(async post => {
                            res.redirect(`${defaults.domain}/forum/posts/${post.data.slug}#${comment.data.id}`);
                        });
                } else {
                    res.redirect('/forum');
                };
            });
    } else {
        res.redirect('/forum/comments');
    };
});

app.get('/forum/comments/:comment/delete', async (req, res) => {
    await allRoutes(req);
    if (req.session.loggedinUser === true) {
        await fetch(`${process.env.DATABASE_URL}?do=findcomment&id=${req.params.comment}`, {
            method: 'GET',
            headers: {
                Accept: '*/*',
                'User-Agent': `${defaults.siteName} (${defaults.domain})`
            }
        })
            .then(comment => comment.json())
            .then(async comment => {
                if (comment.info.status === 1) {
                    if ((req.session.userData.badge.slug === "admin") || (req.session.userData.badge.slug === "moderator") || (comment.data.author === req.session.userData.username)) {
                        await fetch(`${process.env.DATABASE_URL}?do=deletecomment&id=${req.params.comment}`, {
                            method: 'GET',
                            headers: {
                                Accept: '*/*',
                                'User-Agent': `${defaults.siteName} (${defaults.domain})`
                            }
                        })
                            .then(result => result.json())
                            .then(async result => {
                                res.redirect('/forum');
                            });
                    } else {
                        res.redirect('/forum');
                    };
                } else {
                    res.redirect('/forum');
                };
            });
    } else {
        res.redirect('/forum');
    };
});

app.get('/users', async (req, res) => {
    await allRoutes(req);
    await fetch(`${process.env.DATABASE_URL}?do=all`, {
        method: 'GET',
        headers: {
            Accept: '*/*',
            'User-Agent': `${defaults.siteName} (${defaults.domain})`
        }
    })
        .then(users => users.json())
        .then(async users => {
            var userList = [];
            var wanted = users.data.length;
            var done = 0;
            var sortedUsersBySchool = [];
            defaults.schools.forEach(school => {
                sortedUsersBySchool[school.short] = [];
                userList[school.short] = [];
            });
            users.data.forEach(async user => {
                var userName = user.firstname + " " + user.lastname;
                var userBadge = JSON.parse(user.badges)[JSON.parse(user.badges).length - 1];
                defaults.badges.forEach(badge => {
                    if (badge.slug === userBadge) {
                        userBadge = badge;
                    };
                });
                var userPfp = "";
                defaults.schools.forEach(school => {
                    if (user.school === school.short) {
                        userPfp = `${defaults.domain}/images/${school.logoUrl}`;
                    };
                });
                if (user.image != null) {
                    userPfp = user.image;
                };
                var userPosts = 0;
                var userComments = 0;
                await fetch(`${process.env.DATABASE_URL}?do=allposts&username=${user.username}`, {
                    method: 'GET',
                    headers: {
                        Accept: '*/*',
                        'User-Agent': `${defaults.siteName} (${defaults.domain})`
                    }
                })
                    .then(db => db.json())
                    .then(async db => {
                        if (db.data) {
                            userPosts = db.data.length;
                        };
                        await fetch(`${process.env.DATABASE_URL}?do=allcomments&username=${user.username}`, {
                            method: 'GET',
                            headers: {
                                Accept: '*/*',
                                'User-Agent': `${defaults.siteName} (${defaults.domain})`
                            }
                        })
                            .then(db => db.json())
                            .then(db => {
                                if (db.data) {
                                    userComments = db.data.length;
                                };
                                sortedUsersBySchool[user.school].push({
                                    id: user.id,
                                    school: user.school,
                                    content: `<a href="/users/${user.username}" class="card" id="${user.username}"><img src="${userPfp}" /><h4>${userName} <i class="fa-solid fa-${userBadge.icon}" alt="${userBadge.name}"></i></h4><h5>${userBadge.name}</h5><div class="data">${userPosts} Posts • ${userComments} Comments</div></a>`
                                });
                                done++;
                                if (done === wanted) {
                                    wanted = sortedUsersBySchool.south.length;
                                    done = 0;
                                    if (wanted != 0) {
                                        doSchoolSouth(wanted);
                                    } else {
                                        doSchoolNorth(wanted);
                                    };
                                    async function doSchoolSouth(wanted) {
                                        if (wanted != 0) {
                                            sortedUsersBySchool.south.sort((a, b) => parseFloat(a.id) - parseFloat(b.id)).forEach(usersInSchool => {
                                                userList[usersInSchool.school] += usersInSchool.content;
                                                done++;
                                                if (done === wanted) {
                                                    wanted = sortedUsersBySchool.north.length;
                                                    done = 0;
                                                    if (wanted != 0) {
                                                        doSchoolNorth(wanted);
                                                    } else {
                                                        doSchoolCentral(wanted);
                                                    };
                                                };
                                            });
                                        } else {
                                            wanted = sortedUsersBySchool.north.length;
                                            done = 0;
                                            if (wanted != 0) {
                                                doSchoolNorth(wanted);
                                            } else {
                                                doSchoolCentral(wanted);
                                            };
                                        };
                                    };
                                    async function doSchoolNorth(wanted) {
                                        if (wanted != 0) {
                                            sortedUsersBySchool.north.forEach(usersInSchool => {
                                                userList[usersInSchool.school] += usersInSchool.content;
                                                done++;
                                                if (done === wanted) {
                                                    wanted = sortedUsersBySchool.central.length;
                                                    done = 0;
                                                    if (wanted != 0) {
                                                        doSchoolCentral(wanted);
                                                    } else {
                                                        doSchoolMemorial(wanted);
                                                    };
                                                };
                                            });
                                        } else {
                                            wanted = sortedUsersBySchool.north.length;
                                            done = 0;
                                            if (wanted != 0) {
                                                doSchoolCentral(wanted);
                                            } else {
                                                doSchoolMemorial(wanted);
                                            };
                                        };
                                    };
                                    async function doSchoolCentral(wanted) {
                                        if (wanted != 0) {
                                            sortedUsersBySchool.central.sort((a, b) => parseFloat(a.id) - parseFloat(b.id)).forEach(usersInSchool => {
                                                userList[usersInSchool.school] += usersInSchool.content;
                                                done++;
                                                if (done === wanted) {
                                                    wanted = sortedUsersBySchool.memorial.length;
                                                    done = 0;
                                                    if (wanted != 0) {
                                                        doSchoolMemorial(wanted);
                                                    } else {
                                                        res.render('users', { vars: defaults, session: req.session, title: 'Users', user: req.session.userData, userList: userList });
                                                    };
                                                };
                                            });
                                        } else {
                                            wanted = sortedUsersBySchool.north.length;
                                            done = 0;
                                            if (wanted != 0) {
                                                doSchoolMemorial(wanted);
                                            } else {
                                                res.render('users', { vars: defaults, session: req.session, title: 'Users', user: req.session.userData, userList: userList });
                                            };
                                        };
                                    };
                                    async function doSchoolMemorial(wanted) {
                                        if (wanted != 0) {
                                            sortedUsersBySchool.memorial.sort((a, b) => parseFloat(a.id) - parseFloat(b.id)).forEach(usersInSchool => {
                                                userList[usersInSchool.school] += usersInSchool.content;
                                                done++;
                                                if (done === wanted) {
                                                    res.render('users', { vars: defaults, session: req.session, title: 'Users', user: req.session.userData, userList: userList });
                                                };
                                            });
                                        } else {
                                            res.render('users', { vars: defaults, session: req.session, title: 'Users', user: req.session.userData, userList: userList });
                                        };
                                    };
                                };
                            });
                    });
            });
        });
});

app.get('/users/:username', async (req, res) => {
    await allRoutes(req);
    if (req.params.username) {
        res.redirect(`/search?query=${req.params.username}`)
    } else {
        res.redirect('/users');
    };
});

app.get('/search', async (req, res) => {
    await allRoutes(req);
    if (req.query.query) {
        await fetch(`${process.env.DATABASE_URL}?do=allposts`, {
            method: 'GET',
            headers: {
                Accept: '*/*',
                'User-Agent': `${defaults.siteName} (${defaults.domain})`
            }
        })
            .then(posts => posts.json())
            .then(async posts => {
                var postsList = "";
                var sortedPosts = [];
                var pinnedPosts = [];
                var wanted = 0;
                var done = 0;
                var done2 = 0;
                await posts.data.forEach(async post => {
                    if ((post.name.toLowerCase().includes(req.query.query.toLowerCase()) || post.description.toLowerCase().includes(req.query.query.toLowerCase()) || post.author.toLowerCase().includes(req.query.query.toLowerCase())) && (!post.flagged)) {
                        wanted++;
                    };
                    done++;
                    if (done === posts.data.length) {
                        if (wanted != 0) {
                            await posts.data.sort((a, b) => parseFloat(b.id) - parseFloat(a.id)).forEach(async post => {
                                if ((post.name.toLowerCase().includes(req.query.query.toLowerCase()) || post.description.toLowerCase().includes(req.query.query.toLowerCase()) || post.author.toLowerCase().includes(req.query.query.toLowerCase())) && (!post.flagged)) {
                                    var tagList = "";
                                    post.tags.split(`,`).forEach(tag => {
                                        defaults.tags.forEach(tags => {
                                            if (tags.slug === tag) {
                                                tagList += tags.name + ", ";
                                            };
                                        });
                                    });
                                    await fetch(`${process.env.DATABASE_URL}?do=find&username=${post.author}`, {
                                        method: 'GET',
                                        headers: {
                                            Accept: '*/*',
                                            'User-Agent': `${defaults.siteName} (${defaults.domain})`
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
                                                if (post.pinned) {
                                                    pinnedPosts.push({
                                                        id: post.id,
                                                        post: `<a href="${defaults.domain}/forum/posts/${post.slug}" class="post"><h4>${authorName} <i class="fa-solid fa-${authorBadge.icon}" alt="${authorBadge.name}"></i> (${new Date(post["created_at"]).toLocaleDateString('en-us', { weekday: "long", month: "short", day: "numeric" })} at ${new Date(post["created_at"]).toLocaleTimeString('en-US')}) <i class="fa-solid fa-thumbtack"></i>${(post.images != "{}") ? ' <i class="fa-solid fa-image"></i>' : ''}</h4><h2>${post.name}</h2><div class="tags"><i class="fa-solid fa-tags"></i> ${tagList.slice(0, -2)}</div></a>`,
                                                    });
                                                } else {
                                                    sortedPosts.push({
                                                        id: post.id,
                                                        post: `<a href="${defaults.domain}/forum/posts/${post.slug}" class="post"><h4>${authorName} <i class="fa-solid fa-${authorBadge.icon}" alt="${authorBadge.name}"></i> (${new Date(post["created_at"]).toLocaleDateString('en-us', { weekday: "long", month: "short", day: "numeric" })} at ${new Date(post["created_at"]).toLocaleTimeString('en-US')})${(post.images != "{}") ? ' <i class="fa-solid fa-image"></i>' : ''}</h4><h2>${post.name}</h2><div class="tags"><i class="fa-solid fa-tags"></i> ${tagList.slice(0, -2)}</div></a>`,
                                                    });
                                                };
                                                done2++;
                                                if (done2 === wanted) {
                                                    pinnedPosts.sort((a, b) => parseFloat(b.id) - parseFloat(a.id));
                                                    pinnedPosts.forEach(async post => {
                                                        postsList += post.post;
                                                    });
                                                    sortedPosts.sort((a, b) => parseFloat(b.id) - parseFloat(a.id));
                                                    sortedPosts.forEach(async post => {
                                                        postsList += post.post;
                                                    });
                                                    await getComments(sortedPosts, postsList);
                                                };
                                            };
                                        });
                                };
                            });
                        } else {
                            await getComments([], "No posts");
                        };
                    };
                });
            });
        async function getComments(sortedPosts, postsList) {
            await fetch(`${process.env.DATABASE_URL}?do=allcomments`, {
                method: 'GET',
                headers: {
                    Accept: '*/*',
                    'User-Agent': `${defaults.siteName} (${defaults.domain})`
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
                                                'User-Agent': `${defaults.siteName} (${defaults.domain})`
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
                                                        await sendResults(sortedPosts, postsList, commentsList);
                                                    };
                                                };
                                            });
                                    };
                                });
                            } else {
                                await sendResults(sortedPosts, postsList, "No comments");
                            };
                        };
                    });
                });
        };
        async function sendResults(sortedPosts, postsList, commentsList) {
            try {
                res.render('search', { vars: defaults, session: req.session, title: 'Search Results', user: req.session.userData, posts: postsList, query: req.query.query, results: sortedPosts.length, comments: commentsList });
            } catch { };
        };
    } else {
        res.redirect('/forum');
    };
});

app.get('/admin', async (req, res) => {
    await allRoutes(req);
    if (req.session.loggedinUser === true) {
        if ((req.session.userData.badge.slug === "admin") || (req.session.userData.badge.slug === "moderator")) {
            await allRoutes(req);
            await fetch(`${process.env.DATABASE_URL}?do=allposts`, {
                method: 'GET',
                headers: {
                    Accept: '*/*',
                    'User-Agent': `${defaults.siteName} (${defaults.domain})`
                }
            })
                .then(db => db.json())
                .then(db => {
                    var postsList = "";
                    var wanted = db.data.length;
                    var done = 0;
                    var sortedPosts = [];
                    db.data.sort((a, b) => parseFloat(b.id) - parseFloat(a.id)).forEach(async post => {
                        var tagList = "";
                        post.tags.split(`,`).forEach(tag => {
                            defaults.tags.forEach(tags => {
                                if (tags.slug === tag) {
                                    tagList += tags.name + ", ";
                                };
                            });
                        });
                        await fetch(`${process.env.DATABASE_URL}?do=find&username=${post.author}`, {
                            method: 'GET',
                            headers: {
                                Accept: '*/*',
                                'User-Agent': `${defaults.siteName} (${defaults.domain})`
                            }
                        })
                            .then(db => db.json())
                            .then(async db => {
                                if (db.info.status === 1) {
                                    var authorName = db.data.firstname + " " + db.data.lastname;
                                    var authorBadge = JSON.parse(db.data.badges)[JSON.parse(db.data.badges).length - 1];
                                    defaults.badges.forEach(badge => {
                                        if (badge.slug === authorBadge) {
                                            authorBadge = badge;
                                        };
                                    });
                                    sortedPosts.push({
                                        id: post.id,
                                        post: `<div class="list post"><a href="${defaults.domain}/forum/posts/${post.slug}/manage" class="twenty">${post.name}</a><a href="${defaults.domain}/users/${post.author}/manage" class="twentyfive">${authorName} (${authorBadge.name})</a><div class="twentyfive">${new Date(post["created_at"]).toLocaleDateString('en-us', { weekday: "long", month: "short", day: "numeric" })} at ${new Date(post["created_at"]).toLocaleTimeString('en-US')}</div><div class="ten">${(post.pinned) ? `<a href="${defaults.domain}/forum/posts/${post.slug}/unpin"><i class="fa-solid fa-thumbtack"></i></a>` : ''} ${(post.images != "{}") ? ' <i class="fa-solid fa-image"></i>' : ''}</div><div class="ten">${tagList.slice(0, -2)}</div><div class="ten"><a href="${defaults.domain}/forum/posts/${post.slug}/delete"><i class="fa-solid fa-trash"></i></a>${(post.flagged) ? ` <a href="${defaults.domain}/forum/posts/${post.slug}/unflag"><i class="fa-solid fa-flag"></i></a>` : ` <a href="${defaults.domain}/forum/posts/${post.slug}/flag"><i class="fa-regular fa-flag"></i></a>`}</div></div>`,
                                    });
                                };
                                done++;
                                if (done === wanted) {
                                    sortedPosts.sort((a, b) => parseFloat(b.id) - parseFloat(a.id));
                                    sortedPosts.forEach(async post => {
                                        postsList += post.post;
                                    });
                                    if (postsList === "") {
                                        postsList = "No posts yet.";
                                    };
                                    await fetch(`${process.env.DATABASE_URL}?do=all`, {
                                        method: 'GET',
                                        headers: {
                                            Accept: '*/*',
                                            'User-Agent': `${defaults.siteName} (${defaults.domain})`
                                        }
                                    })
                                        .then(db => db.json())
                                        .then(db => {
                                            var usersList = "";
                                            var wanted = db.data.length;
                                            var done = 0;
                                            var sortedUsers = [];
                                            db.data.sort((a, b) => parseFloat(b.id) - parseFloat(a.id)).forEach(async user => {
                                                var authorName = user.firstname + " " + user.lastname;
                                                var authorBadge = JSON.parse(user.badges)[JSON.parse(user.badges).length - 1];
                                                defaults.badges.forEach(badge => {
                                                    if (badge.slug === authorBadge) {
                                                        authorBadge = badge;
                                                    };
                                                });
                                                sortedUsers.push({
                                                    id: user.id,
                                                    user: `<div class="list user"><a href="${defaults.domain}/users/${user.username}/manage" class="twenty">${authorName} (${authorBadge.name}, ${user.age})</a><div class="twentyfive">${user.email}</div><div class="twentyfive">${new Date(user["created_at"]).toLocaleDateString('en-us', { weekday: "long", month: "short", day: "numeric" })} at ${new Date(user["created_at"]).toLocaleTimeString('en-US')}</div><div class="ten">${user.gradyear}</div><div class="ten">${user.dob}</div><div class="ten"><a href="${defaults.domain}/users/${user.username}/delete"><i class="fa-solid fa-trash"></i></a></div></div>`,
                                                });
                                                done++;
                                                if (done === wanted) {
                                                    sortedUsers.sort((a, b) => parseFloat(b.id) - parseFloat(a.id));
                                                    sortedUsers.forEach(async user => {
                                                        usersList += user.user;
                                                    });
                                                    if (usersList === "") {
                                                        usersList = "No users yet.";
                                                    };
                                                    await fetch(`${process.env.DATABASE_URL}?do=allcomments`, {
                                                        method: 'GET',
                                                        headers: {
                                                            Accept: '*/*',
                                                            'User-Agent': `${defaults.siteName} (${defaults.domain})`
                                                        }
                                                    })
                                                        .then(comments => comments.json())
                                                        .then(async comments => {
                                                            if (comments.data) {
                                                                var commentsList = [];
                                                                var wanted = comments.data.length;
                                                                var done = 0;
                                                                var sortedComments = [];
                                                                comments.data.sort((a, b) => parseFloat(b.id) - parseFloat(a.id)).forEach(async comment => {
                                                                    await fetch(`${process.env.DATABASE_URL}?do=find&username=${comment.author}`, {
                                                                        method: 'GET',
                                                                        headers: {
                                                                            Accept: '*/*',
                                                                            'User-Agent': `${defaults.siteName} (${defaults.domain})`
                                                                        }
                                                                    })
                                                                        .then(db => db.json())
                                                                        .then(db => {
                                                                            if (db.info.status === 1) {
                                                                                var commentAuthorName = db.data.firstname + " " + db.data.lastname;
                                                                                var commentAuthorBadge = JSON.parse(db.data.badges)[JSON.parse(db.data.badges).length - 1];
                                                                                defaults.badges.forEach(badge => {
                                                                                    if (badge.slug === commentAuthorBadge) {
                                                                                        commentAuthorBadge = badge;
                                                                                    };
                                                                                });
                                                                                sortedComments.push({
                                                                                    id: comment.id,
                                                                                    comment: `<div class="list comment"><a href="${defaults.domain}/comments/${comment.id}/manage" class="thirtyfive">${comment.content}</a><a href="${defaults.domain}/users/${comment.author}/manage" class="twenty">${commentAuthorName}</a><div class="twentyfive">${new Date(comment["created_at"]).toLocaleDateString('en-us', { weekday: "long", month: "short", day: "numeric" })} at ${new Date(comment["created_at"]).toLocaleTimeString('en-US')}</div><div class="ten">${(comment.images != "{}") ? ' <i class="fa-solid fa-image"></i>' : ''}</div><div class="ten"><a href="${defaults.domain}/comments/${comment.id}/delete"><i class="fa-solid fa-trash"></i></a></div></div>`,
                                                                                });
                                                                            };
                                                                            done++;
                                                                            if (done === wanted) {
                                                                                sortedComments.sort((a, b) => parseFloat(b.id) - parseFloat(a.id));
                                                                                sortedComments.forEach(async comment => {
                                                                                    commentsList += comment.comment;
                                                                                });
                                                                                res.render('admin', { vars: defaults, session: req.session, title: 'Admin', user: req.session.userData, posts: postsList, users: usersList, comments: commentsList });
                                                                            };
                                                                        });
                                                                });
                                                            } else {
                                                                commentsList = "No comments yet.";
                                                                res.render('admin', { vars: defaults, session: req.session, title: 'Admin', user: req.session.userData, posts: postsList, users: usersList, comments: commentsList });
                                                            };
                                                        });
                                                };
                                            });
                                        });
                                };
                            });
                    });
                });
        } else {
            res.redirect('/');
        };
    } else {
        res.redirect('/');
    }
});

app.get('*', async (req, res) => {
    await allRoutes(req);
    res.render('404', { vars: defaults, session: req.session, title: '404', user: req.session.userData });
});

app.listen(port, () => {
    console.log(`${defaults.siteName} listening on port ${port}`);
});
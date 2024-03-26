window.addEventListener('scroll', () => {
    if (window.scrollY > 0) {
        document.querySelector('.toTop').classList.add('visible');
    } else {
        document.querySelector('.toTop').classList.remove('visible');
    };
});

function copyLink() {
    const el = document.createElement('textarea');
    el.value = window.location.href;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    const selected = document.getSelection().rangeCount > 0 ? document.getSelection().getRangeAt(0) : false; el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    if (selected) {
        document.getSelection().removeAllRanges();
        document.getSelection().addRange(selected);
    };
    alert('Link copied!');
};

function shareToFacebook() {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${domain}`, '_blank');
};

function shareToTwitter() {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(window.location.href)}`, '_blank');
};

function shareToWhatsapp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(window.location.href)}`, '_blank');
};

function shareToTelegram() {
    window.open(`https://telegram.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${document.title.split(" |")[0]}`, '_blank');
};

function shareToLine() {
    window.open(`https://line.me/R/share?text=${encodeURIComponent(window.location.href)}`, '_blank');
};

try {
    jQuery(".article-i .split .left .info h1").fitText(1.4);
} catch { };

try {
    document.querySelectorAll('.images').forEach(slider => {
        classes = "";
        slider.classList.forEach(class1 => { classes += `.${class1}` });
        new Splide(classes, {
            heightRatio: 0.5,
        }).mount();
    });
} catch { };

function reveal() {
    var element = document.querySelector('.loader');
    element.classList.toggle('active');
};

window.onload = () => {
    setTimeout(reveal, 1000);
};

document.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', (event) => {
        event.preventDefault();
        reveal();
        setTimeout(() => {
            window.location = link.href;
        }, 1500);
    });
});
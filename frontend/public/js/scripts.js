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
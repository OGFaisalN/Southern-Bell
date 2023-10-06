window.addEventListener('scroll', () => {
    if (window.scrollY > 0) {
        document.querySelector('.toTop').classList.add('visible');
    } else {
        document.querySelector('.toTop').classList.remove('visible');
    };
});
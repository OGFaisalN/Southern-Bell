const convertBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.readAsDataURL(file);

        fileReader.onload = () => {
            resolve(fileReader.result);
        };

        fileReader.onerror = (error) => {
            reject(error);
        };
    });
};
switch (page) {
    case "/":
        toggleSidebar();
        break;
    case "/admin":
        toggleSidebar();
        break;
    case "/forum/posts/new":
        document.getElementById("imagename").value = "";
        document.getElementById("imagename").addEventListener("change", async (event) => {
            const file = event.target.files[0];
            const base64 = await convertBase64(file);
            document.getElementById("preview").src = base64;
            if (file.size < 400000) {
                document.getElementById("image").value = base64;
            } else {
                document.getElementById("imagename").value = "";
                document.getElementById("preview").src = "";
                alert("File too large");
            };
        });
        break;
    case "/forum/comments/new":
        document.getElementById("imagename").value = "";
        document.getElementById("imagename").addEventListener("change", async (event) => {
            const file = event.target.files[0];
            const base64 = await convertBase64(file);
            document.getElementById("preview").src = base64;
            if (file.size < 400000) {
                document.getElementById("image").value = base64;
            } else {
                document.getElementById("imagename").value = "";
                document.getElementById("preview").src = "";
                alert("File too large");
            };
        });
        break;
    case "/signup":
        document.getElementById("imagename").value = "";
        document.getElementById("imagename").addEventListener("change", async (event) => {
            const file = event.target.files[0];
            const base64 = await convertBase64(file);
            document.getElementById("preview").src = base64;
            if (file.size < 400000) {
                document.getElementById("image").value = base64;
            } else {
                document.getElementById("imagename").value = "";
                document.getElementById("preview").src = "";
                alert("File too large");
            };
        });
        break;
};

if ((document.querySelector("sidebar").classList[0] === "loggedin") && (window.screen.width < 800)) {
    document.querySelectorAll(".topics .link").forEach(link => link.remove());
    document.querySelector("sidebar").style.marginTop = "-35px";
    document.querySelector("sidebar").style.paddingTop = "125px";
    toggleSidebar();
};

function toggleSidebar() {
    if (window.screen.width < 800) {
        if (document.querySelector("header").style.overflowY === "visible") {
            document.querySelector("header").classList.add("collapsed");
            document.querySelector("header").style.overflowY = "hidden";
            document.querySelector("sidebar").style.marginTop = "-150px";
        } else {
            document.querySelector("header").classList.remove("collapsed");
            document.querySelector("header").style.overflowY = "visible";
            if (document.querySelector("sidebar").classList[0] === "loggedin") {
                document.querySelector("sidebar").style.marginTop = "-35px";
            } else {
                document.querySelector("sidebar").style.marginTop = "";
            };
        };
    } else {
        if ((document.querySelector("sidebar").style.marginLeft === "calc(-30px - 15rem)") || (document.querySelector("sidebar").style.marginLeft === "calc(-15rem + -30px)")) {
            document.querySelector("sidebar").style.width = "calc(15rem - 30px)";
            document.querySelector("main").style.paddingLeft = "calc(15rem + 30px)";
            document.querySelector("sidebar").style.marginLeft = "0";
        } else {
            document.querySelector("main").style.paddingLeft = "0";
            document.querySelector("sidebar").style.marginLeft = "calc(-15rem + -30px)";
        };
    };
};
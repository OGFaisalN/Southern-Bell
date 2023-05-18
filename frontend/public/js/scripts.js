switch (page) {
    case "/forum/posts/new":
        document.getElementById("imagename").value = "";
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
        document.getElementById("imagename").addEventListener("change", async (event) => {
            const file = event.target.files[0];
            const base64 = await convertBase64(file);
            document.getElementById("preview").src = base64;
            if (file.size < 400000) {
                document.getElementById("image").value = base64;
            } else {
                document.getElementById("imagename").value = "";
                alert("File too large");
            };
        });
        break;
};
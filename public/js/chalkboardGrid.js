function chalkboardGrid() {
    // get elements
    let uploader = document.getElementById('uploader');
    let fileButton = document.getElementById('fileButton');
    let uploadLabel = document.getElementById('uploadLabel');
    var img = document.getElementById('my-img');

    let fileUrls = {};
    // listen for file selection
    fileButton.addEventListener('change', (e) => {
        let i = 0;

        // for each file selected
        for (i; i < e.target.files.length; i++) {
            // get file
            let file = e.target.files[i];
            // create storage ref to empty storage object
            // https://firebase.google.com/docs/reference/js/firebase.storage.Reference#getdownloadurl
            let storageRef = firebase.storage().ref('chalkboards/' + file.name);
            // upload file to storage ref location
            let task = storageRef.put(file);
            // update progress bar and save download URL
            // https://firebase.google.com/docs/reference/js/firebase.storage.UploadTask#on
            task.on('state_changed',
                // called when upload state of upload changes
                function progress(snapshot) {
                    // update status bar
                    let percentage = snapshot.bytesTransferred /
                        snapshot.totalBytes * 100;
                    uploader.value = percentage;
                },
                // called when upload fails
                function error(err) {
                    console.log(err);
                },
                // called when upload finishes, get URL and display corresponding image
                async function complete() {
                    try {
                        let url = await storageRef.getDownloadURL();
                        let displayResponse = await displayImg(url);
                        console.log(displayResponse);
                    } catch (err) {
                        console.log(err);
                    }
                }
            );
        };

        // takes a url and uses it to insert an image element into the grid
        function displayImg(url) {
            return new Promise((resolve, reject) => {
                let img = document.createElement("img");
                img.src = url;
                document.getElementById("grid").appendChild(img);
                resolve('image displayed');
            })

        }

    });
}
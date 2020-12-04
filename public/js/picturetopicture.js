const videoElement = document.getElementById('video');
const chooseButton = document.getElementById('choose-pip-button');
const startButton = document.getElementById('start-pip-button');

window.onload = function() {
    // if PIP isn't supported by browser, hide button and cancel PIP
    if (!document.pictureInPictureEnabled || videoElement.disablePictureInPicture) {
        return;
    }
    // returns promise, resolves meadia stream a user chooses when prompted
    function selectMediaStream() {

        let p = async (resolve, reject) => {
            try {
                // get user-selected media stream for PIP and add stream to video element
                const mediaStream = await navigator.mediaDevices.getDisplayMedia();
                videoElement.srcObject = mediaStream;
                videoElement.onloadedmetadata = () => {
                    console.log('metadata loaded for PIP');
                    resolve(mediaStream);
                    return;
                }
            }
            catch (error) {
                console.log('error selectedMediaStream');
                reject(error);
                return;
            }
        }

        return new Promise(p);
    }

    chooseButton.addEventListener('click', async (event) => {
        // ask user to select media stream for PIP
        await selectMediaStream();
        // show start button, and hide it again when PiP is closed
        startButton.style.display = 'initial';
        videoElement.onleavepictureinpicture = () => startButton.style.display = 'none';
        console.log('stream set to PIP video element');
    });

    startButton.addEventListener('click', async (event) => {
        try {
            startButton.disabled=true;
            // remove anything that may already be in PIP
            if(document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            }
            // add new user-selected element to PIP and start stream
            await videoElement.requestPictureInPicture();
            videoElement.play();
            startButton.disabled = false;
        }
        catch (err) {
            console.log(err);
        }

    });

}

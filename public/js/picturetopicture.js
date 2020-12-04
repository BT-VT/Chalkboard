const videoElement = document.getElementById('video');
const button = document.getElementById('button1');

window.onload = function() {
    // if PIP isn't supported by browser, hide button and cancel PIP
    if (!document.pictureInPictureEnabled || videoElement.disablePictureInPicture) {
        button.style.visibility = 'hidden';
        return;
    }
    // returns the meadia stream a user chooses when prompted
    async function selectMediaStream() {
        try {
            // get user-selected media stream for PIP and add stream to video element
            const mediaStream = await navigator.mediaDevices.getDisplayMedia();
            videoElement.srcObject = mediaStream;
            return mediaStream;
        }
        catch (error) {
            return error;
        }
    }

    button.addEventListener('click', async (event) => {
        // ask user to select media stream for PIP
        await selectMediaStream();

        videoElement.onloadedmetadata = async (event) => {
            button.disabled=true;
            // remove anything that may already be in PIP
            if(document.pictureInPictureElement) { document.exitPictureInPicture(); }
            // add new user-selected element to PIP and start stream
            await videoElement.requestPictureInPicture();
            videoElement.play();
            button.disabled = false;
        }
    });

}

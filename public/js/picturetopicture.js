const videoElement = document.getElementById('video');
const button = document.getElementById('button1');

// Prompt user to select what they want to share 
async function selectMediaStream(){
    try {
        const mediaStream = await navigator.mediaDevices.getDisplayMedia();
        videoElement.srcObject= mediaStream;
        videoElement.onloadedmetadata = ()=>{
            videoElement.play();
        }
    }catch(error){
        // Catch error here
    }
}

button.addEventListener('click',async()=>{
    
    button.disabled=true;
    await videoElement.requestPictureInPicture();
    button.disabled = false;
});
selectMediaStream();
function myChalkboards () {

    var content = `
    <div class="top">
        <h1>My Chalkboards</h1>

        <label id="uploadLabel" for="fileButton">Upload Image: </label>
        <progress value="0" max="100" id="uploader">0%</progress>
        <input type="file" value="upload" id="fileButton" multiple="multiple"/>
    </div>

    <div class="content">
        <div class="chalkboards" id="grid">

        </div>
    </div>
        `;
        var ele = document.createElement("div");
        ele.innerHTML = content;
        ele.setAttribute("id", "my-chalkboards");
        return ele;
    }
    
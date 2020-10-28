function myChalkboards () {

    var content = `

    <div class="content">
        <div class="chalkboards" id="grid">
            <h3>My Chalkboards</h3>
        </div>
    </div>
        `;
        var ele = document.createElement("div");
        ele.innerHTML = content;
        ele.setAttribute("id", "my-chalkboards");
        return ele;
    }
    
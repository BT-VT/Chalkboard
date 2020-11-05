function myChalkboards () {

    var content = `

    <div class="content">
        <div class="chalkboards" id="grid">
            <h2 style="font-weight: 500; font-size: 28px; color: #00A6C1; font-family: Helvetica; text-align: center; ">My chalkboards</h2>
        </div>
    </div>
        `;
        var ele = document.createElement("div");
        ele.innerHTML = content;
        ele.setAttribute("id", "my-chalkboards");
        return ele;
    }
    
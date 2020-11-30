function myChalkboards () {

    var content = `

    <div class="content">
        <div class="chalkboards" id="grid">
            <h2 style="text-align: center; font-weight: 500; font-size: 28px; color: #AFAFAF; font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif;">My chalkboards</h2>
        </div>
    </div>
        `;
        var ele = document.createElement("div");
        ele.innerHTML = content;
        ele.setAttribute("id", "my-chalkboards");
        return ele;
    }
    
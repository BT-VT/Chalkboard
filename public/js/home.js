function home () {

    var content = `
            <!-- tool box on left panel -->
            <div class="toolbox left">
                <div class="group commands">
                    <div class="item" data-command="undo" title="Undo">
                        <img src="images/undo-icon.png" />
                    </div>
                    <div class="item" data-command="download" title="Download">
                        <img src="images/download-icon.png" />
                    </div>
                </div>
                <div class="group tools">
                    <div class="item" data-tool="line" title="Line Tool"><img src="images/line-icon.png"></div>
                    <div class="item active" data-tool="rectangle" title="Rectangle Tool"><img src="images/rect-icon.png">
                    </div>
                    <div class="item" data-tool="circle" title="Circle Tool"><img src="images/circle-icon.png"></div>
                    <div class="item" data-tool="triangle" title="Triangle Tool"><img src="images/tri-icon.png"></div>
                </div>
                <div class="group tools">
                    <div class="item" data-tool="pencil" title="Pencil Tool"><img src="images/pencil-icon.png"></div>
                    <div class="item" data-tool="eraser" title="Eraser Tool"><img src="images/eraser-icon.png"></div>
                </div>
            </div>
            <!-- Paint sheet where we draw-->
            <canvas id="canvas" width="1000" height="500"></canvas>
            <!-- right toolbox with colors-->
            <div class="toolbox right">
                <div class="group colors">
                    <div class="item color-box" data-color="#ffffff">
                        <div class="swatch" style="background-color:#fff"></div>
                    </div>
                    <div class="item active color-box" data-color="#000000">
                        <div class="swatch" style="background-color:#000"></div>
                    </div>
                    <div class="item color-box" data-color="#ff0000">
                        <div class="swatch" style="background-color:red"></div>
                    </div>
                    <div class="item color-box" data-color="#00ff00">
                        <div class="swatch" style="background-color:#0f0"></div>
                    </div>
                    <div class="item color-box" data-color="#0000ff">
                        <div class="swatch" style="background-color:#00f"></div>
                    </div>
                    <div class="item color-box" data-color="#00ffff">
                        <div class="swatch" style="background-color:#0ff"></div>
                    </div>
                    <div class="item color-box" data-color="#ff00ff">
                        <div class="swatch" style="background-color:#f0f"></div>
                    </div>
                    <div class="item color-box" data-color="#ffff00">
                        <div class="swatch" style="background-color:#ff0"></div>
                    </div>
                    <div class="item color-box" data-color="#c46f0f">
                        <div class="swatch" style="background-color:#c46f0f"></div>
                    </div>
                    <div class="item color-box" data-color="#fd8f27">
                        <div class="swatch" style="background-color:#fd8f27"></div>
                    </div>
                    <div class="item color-box" data-color="#0099ff">
                        <div class="swatch" style="background-color:#09f"></div>
                    </div>
                    <div class="item color-box" data-color="#ff009d">
                        <div class="swatch" style="background-color:#ff009d"></div>
                    </div>
                </div>
            </div>
        `;
        
        var ele = document.createElement("div");
        ele.setAttribute("id", "canvas-container");
        ele.setAttribute("style", "z-index: 10");
        ele.innerHTML = content;
        return ele;
    }
    
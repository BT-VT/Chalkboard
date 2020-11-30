function home() {
  var content = `
    <!-- tool box on left panel -->
            <div class="toolbox left">
                <div class="group commands">
                    <div class="item undo" data-command="undo" title="Undo">
                        <img src="images/undo-icon.png" />
                    </div>
                    <div class="item download" data-command="download" title="Download">
                        <img src="images/download-icon.png" />
                    </div>

                    <a href="#modal" class="modal-trigger" data-target="modal-save" style="color: #02A6C1">
                        <div class="item " title="Upload">
                            <img src="images/upload-icon.png" />
                        </div>
                    </a>
                    <div class="item"  title="Color Picker">
                        <div class="color-picker"></div>
                </div>
                <div class="group tools">
                    <div class="item" id="line" data-tool="line" title="Line Tool"><img src="images/line-icon.png"></div>
                    <div class="item" id="rect" data-tool="rectangle" title="Rectangle Tool"><img src="images/rect-icon.png"></div>
                    <div class="item" id="ellipse" data-tool="ellipse"  title="Ellipse Tool"><img src="images/ellipse-icon.png"></div>
                    <div class="item" id="circle" data-tool="circle" title="Circle Tool"><img src="images/circle-icon.png"></div>
                    <div class="item" id="triangle" data-tool="triangle" title="Triangle Tool"><img src="images/tri-icon.png"></div>
                </div>
                <div class="group tools">
                    <div class="item active" id="marker" data-tool="pencil" title="Pencil Tool"><img src="images/pencil-icon.png"></div>
                    <div class="item" id="eraser" data-tool="eraser" title="Eraser Tool"><img src="images/eraser-icon.png"></div>
                    <div class="item" id="fill" data-tool="fill" title="Fill Tool"><img src="images/paint-bucket-icon.png"></div>
                    <div class="item" id="grab" data-tool="grab" title="Grab Tool"><img src="images/grabicon.png"></div>
                    <div class="item" id="text" data-tool="text" title="Text Tool"><img src="images/text-icon.png"></div>
                    </div>
                </div>
            </div>
            <!-- Paint sheet where we draw-->
            <canvas id="canvas" width="1200" height="500" style=""></canvas>
            <!-- right toolbox with colors-->
            <div id="video-grid"></div>
        `;

/* vertical bar
<div class="item" id="text" data-tool="text" title="Text Tool"><img src="images/text-icon.png">
    <li>
        <input
          id="slider"
          type="range"
          min="1"
          max="100"
          value="50"
          step="2"
          style="-webkit-transform: rotate(90deg)"
          orient="vertical"
        />
      </li>
    </div>
    */
var ele = document.createElement("div");
  ele.setAttribute("id", "canvas-container");
  ele.setAttribute("style", "z-index: 10");
  ele.innerHTML = content;
  return ele;
}

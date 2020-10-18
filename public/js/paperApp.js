let paths = {};
let curPath;
project.currentStyle = {
	strokeWidth: 5,
	strokeCap: 'round',
	strokeColor: 'black'
}

// Create a new path once, when the script is executed:
function onMouseDown(event) {
	// create new path
	curPath = new Path();

	// rotate colors of current paths
	let keys = Object.keys(paths);
	if(keys.length > 1) {
		let path0Color = paths[keys[0]].strokeColor;
		// change the rest of the colors
		for(let i = 0; i < keys.length-1; i++) {
			paths[keys[i]].strokeColor = paths[keys[i+1]].strokeColor;
		}
		// assign random color to most recent path, set curPath color to original color of path0
		paths[keys[keys.length-1]].strokeColor = new Color(Math.random(), Math.random(), Math.random());
		curPath.strokeColor = path0Color;
	}
	else {
		curPath.strokeColor = new Color(Math.random(), Math.random(), Math.random());
	}


	paths['path'+ Object.keys(paths).length] = curPath;
	console.log(paths);
}
// This function is called whenever the user
// clicks the mouse in the view:
function onMouseDrag(event) {
	// Add a segment to the path at the position of the mouse:
	curPath.add(event.point);
}

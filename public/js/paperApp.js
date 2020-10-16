let paths = {};
var curPath;

// Create a new path once, when the script is executed:
function onMouseDown(event) {
	curPath = new Path();
	curPath.strokeColor = 'black';
	paths['path'+ Object.keys(paths).length] = curPath;
	for(var key in paths) {
		path = paths[key];
		path.strokeColor = "red";
	}
	console.log(paths);
}
// This function is called whenever the user
// clicks the mouse in the view:
function onMouseDrag(event) {
	// Add a segment to the path at the position of the mouse:
	curPath.add(event.point);
}

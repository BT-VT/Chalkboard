console.log("hello world");
var myPath;
// Create a new path once, when the script is executed:
function onMouseDown(event) {
	myPath = new Path();
	myPath.strokeColor = 'black';
}
// This function is called whenever the user
// clicks the mouse in the view:
function onMouseDrag(event) {
	// Add a segment to the path at the position of the mouse:
	myPath.add(event.point);
}

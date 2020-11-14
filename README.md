# ChalkboardMain

How to run the project

1. Download the zip file

2. Download Visual Studio Code or some text editor 

3. Download and install node.js

4. Run the command "npm install" from the directory with package.json in it

5. run command "node server.js" from the directory with server.js file

6. The port number where the web app is beign hosted will be listed in the terminal,
- default is: port 5000
- example: go to https://localhost:5000 in a browswer (Firefox or Chrome are recommended)

### Extremely Basic Troubleshooting:

If code is not running properly, press ctrl+shift+i on windows or option+command+i on mac and click "console"
to view dev tools and error messages.

Try turning off add blockers for the webpage


### IMPLEMENTING THE text edit FEATURE
When a new path is finished being created, the client calls the setPathFunctions(pahtsItem, attributes.scale) function and
passes it a reference to the new path (it is usually called from a finishShape() callback function that is called when a 
client receives a message from the server stating that the current shape should be finished and added to the clients paths
list). The setPathFunctions() function (line ~ 795) set's event listeners on the specific path, these event listeners are 
used to detect mouse interactions with the paths and make figuring out what path is being interacted with extremely easy 
(because we don't have to figure it out, paper.js does for us). When you see a line scale up when you hover the mouse over 
it, thats because of the onMouseEnter and onMouseLeave path event listeners. Likewise, when you "grab" a path and move it, 
or change it's color, that is because of the onMouseDown, onMouseDrag, and onMouseUp path event listeners, all which are set 
in the setPathFunctions() function. Basically, any interaction with a specific path after it is created should be handled using 
these event listeners, and not the generic mouse event listeners that are fired any time you do anything with the mouse on the
canvas.

In order to edit an existing text path (aka a string of text on the canvas, which behind the scenes is a paper.js Item object
but is treated like a path in our program, so I'll refer to it as a text path) we will have to figure out when a user clicks 
on it which is a perfect job for the path event listeners onMouseDown and onMouseUp within setPathFunctions(). Sometimes a user
may click on it without wanting to edit the text, so we should only switch to text-edit mode if the user has selected the grab
icon and is holding down the shift key (we can change the key that needs to be held down to start editing, I just wanted to use 
a key that wouldnt also start appending text to the text string being edited if the user hold's it down to long after choosing
to edit it). in the path.onMouseDown() event listener on line ~813, we are already requesting the lock if the grab tool is selected
and the user clicks down on a path, presuming their trying to move that path. We want to request the lock for editing text as 
well when the grab tool is selected and the user clicks down, so we don't have to change anything here. When the lock is 
requested by a client, a message is sent to the server which tells it to tell all other clients the lock is now owned by the
reqesting client, preventing everyone else from interacting with the chalkboard canvas.

The path.onMouseUp() event listener (line ~858) can be used to tell the server that we want to actually edit the text path that
the mouse is lifting up from. Using the onMouseUp() function to do this instead of the onMouseDown() function gives the server
enough time to grab the lock for the client trying to edit the text. We know we should only go into text-edit mode if the grab
tool is selected AND the shift key is held down. If both of these statements are true, then we can switch the client into 
textEdit mode (via setDrawingTools('textEdit') which sets all tools to false except drawingTools.textEdit) and tell the server
to send a message to all clients to begin editing a specific pre-existing text path in their 'paths' array. this is done with
socket.emit('requestEditText', pathInd, user), where 'user' helps the server ID the session it needs to forward the message to,
and 'pathInd' is a variable within the scope of setPathFunctions() that is set to the index of the path that needs to be edited
in the paths array (on both client and server, as they should mirror eachother) in the onMouseDown() function. We need to be
able to tell every other client what text path they should edit, so we have the server forward pathInd to all clients in a 
broadcast method. This is done by the server around line 310, where it broadcasts the 'editText' message to each client.

When the client receives the 'editText' message from the server it calls the editText() function (around line 120 on client).
This function is defined at line ~454, and it uses the provided index value from the server to assign the global variable 
curPath (which points to whatever path is currently being added/edited on the canvas) to the text path that will be edited. the 
line that says curPath.data.setBounds(curPath) uses a function I wrote and attached to every text path, which makes a dashed red 
rectangle around the textbox when it is being edited, this function is called every time the textbox changes size, so the box 
around the text will change its size as well. after editText() is called, every client has put the desired text path into 'edit 
mode'.

Once each client is in edit mode, we can start allowing the editor (client) to edit the text path. This is done by using a keyboard 
event listener provided by paper.js, tool.onKeyDown() found around line 223. every time a key is pressed, this event listener
is fired and it checks the function it points to. If a key is pressed and that client also has drawingTools.textEdit set to
true (which should only ever be true for one client at a time, the editor) then we know this client is trying to edit a text path that
has been set to the curPath variable. appending and deleting characters from the text path is the same in edit mode as it is
in 'text' mode (when drawingTools.text = true) which is used when the text path is first created. However, the way we need to handle
ending an edit is different than the way we handle ending a new text path. With a new text path, we need to tell every client
to add the text path to the paths array. With a text path being edited, we need to tell every client to stop editing, but dont
add the path that curPath refers to to the paths array because it's already in the paths array. This distinction is made around
line 245, where a different message is sent to the server for each scenario. When a client finishes editing a text path (rather
than creating one), they'll use socket.emit('requestFinishEditText', user) to notify the server, who broadcasts the 
'finishEditText' message to all clients (line ~197 on server).

When each client receives the 'finishEditText' message from the server (line ~130 on client), it calls the finishEditText()
function (line ~687). This function removes the red bounding rectangle from the text box, and sets the curPath variable to a new
empty path (basically setting it to null, but it's safer to use an empty paper.js path). Then, only the client who was editing
the text (which will be the LOCK owner) will send the updated version of the text path to the server so it can add it to its
paths array (the paths array on the server is used to save the state of the chalkboard to the database, but more frequently it is
used to send existing paths to new clients joining a session, therefore it must keep records of all paths on the chalkboard, and
must be updated with any changes made to those paths). Additionally, the client who was drawing has their drawing tool set back
to 'grab' - the tool used to select a text to edit - , which sets drawingTools.textEdit to false (along with all other drawingTools
values). the updated path info is sent to the server using socket.emit('confirmPathUpdated', updatedPath, index, user) (line ~698),
which updates the server's paths array (line ~317 on server), checks if any users have joined the session while the chalkboard was
being edited (and sendsthem the paths array if they're waiting), and finally broadcasts a message to all clients telling them to
unlock their chalkboard canvas's so that someone else can start interacting with it.

"mic drop"

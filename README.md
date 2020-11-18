# Chalkboard
Chalkboard is an online interactive canvas that allows users to meet and collaborate remotely. Users can work with different drawing tools
to add shapes and objects to a Chalkboard canvas. Anything added to a chalkboard canvas will instantly be displayed for all users viewing
that canvas through a web browser. Users can create chalkboard "sessions" where each session has its own unique canvas independent of all
other canvas's, allowing multiple groups of collaborators to work simultaneously within their own workspaces hosted by Chalkboard.
Chalkboard is *definitely not* buggy and if you are having trouble using it it's probably just you, not us... we swear...

#### Resources
Chalkboard was developed using an Express server built ontop of Node.js. The client side uses a number of libraries, primarily Paper.js
and Socket.io for the implementation of the networked drawing canvas.
- http://paperjs.org
- https://socket.io/
- https://firebase.google.com/docs/auth
- https://firebase.google.com/docs/firestore

### Download And Run Chalkboard

1. Download and install node.js https://nodejs.org/en/download/

2. Run the command "npm install" from the directory with package.json in it (should be the root dir). This will install all
required dependencies for the application.

3. run command "npm start" from the same root dir, where the server.js file is found.

4. The port number where the web app is being hosted will be listed in the terminal,
- default port: 5000
- example: go to https://localhost:5000 in a browswer (Firefox or Chrome are recommended)

#### Extremely Basic Troubleshooting:

*If code is not running properly, press ctrl+shift+i on windows or option+command+i on mac and click "console"
to view dev tools and error messages.*

*Try turning off add blockers for the webpage*

## USER GUIDE

#### User Account and NavBar
- **Sign Up:** a user can choose a unique email and a password to create a Chalkboard account managed through google Auth. Users must
be signed into an account to access all features.
- **Log in:** allows a user to log into their existing Chalkboard account. Once a user is logged in, they can sign out or delete their
account by clicking on their email in the top right corner of the app. When a user is signed in, they will be able to view their
saved chalkboard sessions on the My chalkboards page, and select teh Audio/Video dropdown menu to call other users.
- **My chalkboards:** the my chalkboards page is personalized for each user and displays snapshots of chalkboard sessions which the
user has chosen to save via the **Upload** button on the Tool bar. The snapshots are displayed dynamically in a grid format, along with
a title chosen by the user and a date/time stamp showing when the snapshot was saved. The images act as references to the sessions and
can be clicked on if a user would like to join the session the snapshot references. If updates have been made to the session after it
was saved by a user, they will not be reflected in the snapshot image under the My chalkboards page, however the user will see the
updates after entering the session. If the same session is saved more than once by a user the new snapshot will overwrite the old
snapshot of that particular session, i.e. the same session will never be represented simultaneously by two snapshots on the same My
chalkboards page.
- **Join/Create a Session:** allows a user to join an existing chalkboard session or create a new one by entering a session name. Each
Chalkboard session has its own unique drawing canvas, chat feature and audio/video feature. Users in different sessions should not be
able to interact with eachother.
  -**Default Session:** the default session is the session that is loaded when a user first visits the chalkboard home page. The
  default session cannot be saved by a user. Eventually, the default session will also not be networked, and will act as an initial
  demo / playground for the user to be introduced to the application.
- **Audio/Video:** allows a user to enter another users peer ID (found at the bottom of the dropdown menu, unique for each user) to
start a video call with them. The end goal is to allow every user in a session to join a session video/audio call.


#### Tool Bar
- **Undo:** removes the last object added to the canvas (shape or text). Does not undo color, angle, or position changes of objects.
- **Download:** saves a .png image of the chalkboard to local drive. the default name of the image is "my-image.png".
- **Upload:** saves a copy of the chalkboard session to the chalkboard database, and adds the chalkboard session to the users
"My chalkboards" page. A title will be requested for the Chalkboard session, and the title will be displayed next to a snapshot of
the chalkboard under the "My chalkboards" page.
- **Color Picker:** Allows a user to change the color output of objects. When the save button is clicked, the color selected is added
to a row of pre-selected colors for quick access.
- **Straight Line:** draws a straight line from the down-point of the mouse to the release-point of the mouse.
- **Rectangle:** draws a rectangle from the down-point of the mouse to the release-point of the mouse.
- **Ellipse:** draws an ellipse from the down-point of the mouse to the release-point of the mouse.
- **Circle:** draws a circle where the down-point of the mouse defines the center and the distance between the release-point and 
down-point of the mouse defines the radius.
- **Triangle:** draws a right triangle where the down-point of the mouse defines the location of the angle formed by the hypotenuse
and adjacent sides, while the release-point of the mouse defines the location of the angle formed by the hypotenuse and the opposite
sides.
- **Pencil:** allows a user to free-draw a line that is defined by the path made by a mouse being dragged on the canvas.
- **Eraser:** perminantly removes objects from the canvas when a user clicks on an object, or holds down the mouse and passes over
an object (works by detecting the mouse over a line, if a line is very small it works best to move slowly).
- **Paint Bucket:** Allows a user to change the fill color and edge color of objects on the chalkboard canvas.
  - **Fill object with color:** select the edge of the object, when the object edge scales up in size, click.
  - **Remove fill color from object:** hold down the "backspace" key when selecting an object edge with the paint bucket.
  - **Change color of object edge:** hold down the "l" key when selecting an object edge with the paint bucket.
- **Grab:** allows users to relocate objects, rotate objects, and edit text on the canvas (see **Text**).
  - **Relocate object:** select the edge of the object, when the object edge scales up in size, click and drag it to a new location.
  - **Rotate object left:** hold down the "left arrow" key, select an object and drag the mouse in any direction.
  - **Rotate object right:** hold down the "right arrow" key, select an object and drag the mouse in any direction.
- **Text:** allows a user to add a text box to the canvas. Click on the canvas to determine the starting position of the text box, and
begin typing. To end typing, press the "enter" key. To break to a new line, press "shift + enter".
  - **Edit Existing Text box:** when the **Grab** icon is selected, hold down shift and select a text box on the canvas.


#### Chat Box
The chatbox can be found in the bottom left corner o the app, and is a pink icon that expands when clicked. The chat feature allows
users within the same chalkboard session to communicate with eachother through text. When a user sends a chat through the chat box
their name is displayed next to their message in the message thread.


## Known Bugs
- **Loading Issue Prevents buttons and other features from working properly**
  - Behavior: Several tools (shapes) cannot be selected, only the pencil tool can add paths to the canvas. If an object is relocated
  on the canvas a line will be drawn while it is being moved. Objects added to the canvas by a user will be added more than once,
  resulting in duplicate objects with the same path name. This affects how they are erased. The eraser will only remove one of the
  duplicates, and some paths will not be able to be erased. All paths can be "undone" using hte undo button.
  - Reproduce: It is unknown exactly why this happens, however it will occasionally occur when a client joins a session. If the
  console log is open through the debugger, a pickr.js error will be thrown every time this error occurs, and certain function output
  will appear twice on both the client and server side when drawing new lines on the canvas.
  
  _this image shows the pickr.js error on the client side, which always occurs when the bug occurs_
  ![pickr.js error](https://github.com/Capstone-Projects-2020-Fall/ChalkboardMain/blob/main/error_screenshots/pickr_error.png)
  
  _this image shows output on the server, signifying a function being called more than it should be_
  ![output on server showing functions being called twice](https://github.com/Capstone-Projects-2020-Fall/ChalkboardMain/blob/main/error_screenshots/server_double_output.png)
  
  _this image shows paths being added twice on the client side (at the bottom of the image)_
  ![shows paths being added twice (bottom of image)](https://github.com/Capstone-Projects-2020-Fall/ChalkboardMain/blob/main/error_screenshots/paperSockets_called_mult_times.png)
  
- **Paths not automatically loaded when accessing canvas session from Chalkboard Logo link**
  - Behavior: When on the My-chalkboards page, if a user clicks the Chalkboard logo to get back to the session they were in, the paths
  in that session will not display on the canvas until the user manually refreshes the page. This can be avioded by selecting a saved
  chalkboard image in the my-chalkboards grid to navigate to that session.
  - Reproduce: while signed in to an account, navigate to the My-Chalkboards page from the session canvas page (using the navbar option,
  and make sure there is at least one drawing on the canvas). From the my-chalkboards page, select the chalkboard logo on the navbar to
  be brought back to the session canvas page.
- **More than two users cannot share a video/audio call**
  - Behavior: When multiple people try to call the same user, the user receiving the calls can establish an independent video connection
  with each caller however the callers cannot see or hear eachother.
  - Reproduce: with three client accessing a session, have two clients call the same client by entering the receiving clients peer ID into
  the callbox in the dropdown menu.
- **Attempts to save sessions do not always succeed**
  - Behavior: When the upload/save button is selected (while logged in) and a user give the session a title, then hits "enter" or clicks 
  the "save" button, the save modal closes but the chalkboard session does not save to the database and is not accessible through the 
  my-chalkboards page. This behavior resembles what happens if a guest tries saving a chalkboard without being logged in. When a session 
  is saved successfully, the save modal does not close automatically and can be closed by clicking outside of its boundary.
  - Reproduce: This bug is not consistantly reproducable, and will happen randomly when a session is being saved by a user who is signed in.


### IMPLEMENTING THE text edit FEATURE (testers can ignore)
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

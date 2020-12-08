# [Chalkboard](https://chalkboardonline.herokuapp.com/)
Chalkboard is an online interactive canvas that allows users to meet and collaborate remotely. Users can work with different drawing tools
to add shapes and objects to a Chalkboard canvas. Anything added to a chalkboard canvas will instantly be displayed for all users viewing
that canvas through a web browser. Users can create chalkboard "sessions" where each session has its own unique canvas independent of all
other canvas's, allowing multiple groups of collaborators to work simultaneously within their own workspaces hosted by Chalkboard.

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

#### NOTE
- *A .env file must be created in the main directory and include a service account key object for google FireBase set to the*
*SERVICE_ACCOUNT_KEY environment variable. the env_sample file shows an example of where to add the key object.*
- *Mac Users: works best with Chrome (version ~80+)*

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
- **Audio/Video:** the default state of audio/video feed is muted. To unmute both, click the microphone icon at the top of the toolbar
on the left.
- **Picture in picture:** to use the PIP feature, press the "Choose PIP" button and select the screen or tab you would like to use
with picture in picture mode. Then, press the "Start PIP" button in the navigation bar to launch picture in picture mode.


#### Tool Bar
- **Mute/Unmute:** used to mute and unmute audio / video stream.
- **Undo:** removes the last object added to the canvas (shape or text). Does not undo color, angle, or position changes of objects.
- **Add Image:** select a local image file (png) to add to the chalkboard canvas.
- **Download Snapshot:** saves a .png image of the chalkboard to local drive. the default name of the image is "my-image.png".
- **Save to My Chalkboards:** Saves a link to the current session as well as a snapshot of the session in a users 'My Chalkboards'
page.
- **Color Picker:** Allows a user to change the color output of objects. When the save button is clicked, the color selected is added
to a row of pre-selected colors for quick access.
- **Grab Tool:** allows users to relocate objects, rotate objects, and edit text on the canvas (see **Text**).
  - **Relocate object:** select the edge of the object, when the object edge scales up in size, click and drag it to a new location.
  - **Rotate object left:** hold down the "left arrow" key, select an object and drag the mouse in any direction.
  - **Rotate object right:** hold down the "right arrow" key, select an object and drag the mouse in any direction.
- **Fill Tool:** Allows a user to change the fill color and edge color of objects on the chalkboard canvas.
  - **Fill object with color:** select the edge of the object, when the object edge scales up in size, click.
  - **Remove fill color from object:** hold down the "backspace" key when selecting an object edge with the paint bucket.
  - **Change color of object edge:** hold down the "shift" key when selecting an object edge with the paint bucket.
- **Eraser:** perminantly removes objects from the canvas when a user clicks on an object, or holds down the mouse and passes over
an object (works by detecting the mouse over a line, if a line is very small it works best to move slowly).
  - **Erase Image:** hold down the "shift" key while using the eraser.
- **Pencil:** allows a user to free-draw a line that is defined by the path made by a mouse being dragged on the canvas.
- **Straight Line:** draws a straight line from the down-point of the mouse to the release-point of the mouse.
- **Rectangle:** draws a rectangle from the down-point of the mouse to the release-point of the mouse.
- **Ellipse:** draws an ellipse from the down-point of the mouse to the release-point of the mouse.
- **Circle:** draws a circle where the down-point of the mouse defines the center and the distance between the release-point and
down-point of the mouse defines the radius.
- **Triangle:** draws a right triangle where the down-point of the mouse defines the location of the angle formed by the hypotenuse
and adjacent sides, while the release-point of the mouse defines the location of the angle formed by the hypotenuse and the opposite
sides.
- **Text:** allows a user to add a text box to the canvas. Click on the canvas to determine the starting position of the text box, and
begin typing. To end typing, press the "enter" key. To break to a new line, press "shift + enter".
  - **Edit Existing Text box:** when the **Grab** icon is selected, hold down shift and select a text box on the canvas.


#### Chat Box
The chatbox can be found in the bottom left corner o the app, and is a pink icon that expands when clicked. The chat feature allows
users within the same chalkboard session to communicate with eachother through text. When a user sends a chat through the chat box
their name is displayed next to their message in the message thread.
The chatbox also displays the usernames of all users in a session.

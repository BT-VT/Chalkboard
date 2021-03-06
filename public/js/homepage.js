

export default class Homepage {

    addWelcomeText() {
        let welcomeString = "Welcome to";
        let welcomeText = new paper.PointText( {
            point: [114, 139],
            fillColor: '#000000',
            fontFamily: 'Courier New',
            fontSize: 99,
            content:''
        });

        welcomeText.onFrame = (event) => {
            if(event.count % 10 != 0) { return; }
            if(welcomeString.length > 0) {
                welcomeText.content += welcomeString.charAt(0);
                welcomeString = welcomeString.substr(1);
                if(welcomeString.length == 0) {
                    console.log('welcome text added to canvas');
                    this.addChalkWriting();
                }
            }
        }
    }

    addChalkWriting() {
        let chalkPathSegs =  [
            [{ point: { x: 171, y: 257 }, handleOut: { x: 0, y: -7.44854 } },{ point: { x: 151, y: 220 }, handleIn: { x: 7.41171, y: 3.70585 }, handleOut: { x: -6.19647, y: -3.09824 } },{ point: { x: 129, y: 230 }, handleIn: { x: 2.53816, y: -5.07633 }, handleOut: { x: -9.0784, y: 18.15681 } },{ point: { x: 110, y: 291 }, handleIn: { x: 4.21557, y: -21.07785 }, handleOut: { x: -1.0054, y: 5.027 } },{ point: { x: 110, y: 308 }, handleIn: { x: 0, y: -5.08262 }, handleOut: { x: 0, y: 23.56038 } },{ point: { x: 131, y: 368 }, handleIn: { x: -17.17457, y: -17.17457 }, handleOut: { x: 2.507, y: 2.507 } },{ point: { x: 142, y: 371 }, handleIn: { x: -3.45651, y: 0 }, handleOut: { x: 5.88778, y: 0 } },{ point: { x: 156, y: 369 }, handleIn: { x: -4.26883, y: 2.13442 }, handleOut: { x: 6.36532, y: -3.18266 } },{ point: { x: 166, y: 352 }, handleIn: { x: -3.31534, y: 3.31534 }, handleOut: { x: 0.71544, y: -0.71544 } },{ point: { x: 170, y: 348 }, handleIn: { x: 0, y: 1.55427 } }],
            [{ point: { x: 205, y: 215 }, handleOut: { x: 0, y: 51.36683 } },{ point: { x: 206, y: 369 }, handleIn: { x: 0, y: -51.53697 } }],
            [{ point: { x: 210, y: 312 }, handleOut: { x: 0, y: -9.11127 } },{ point: { x: 241, y: 291 }, handleIn: { x: -10.17391, y: 0 }, handleOut: { x: 2.95357, y: 0 } },{ point: { x: 252, y: 292 }, handleIn: { x: -2.0552, y: -2.0552 }, handleOut: { x: 13.00276, y: 13.00276 } },{ point: { x: 267, y: 344 }, handleIn: { x: 0, y: -19.32222 }, handleOut: { x: 0, y: 8.39544 } },{ point: { x: 266, y: 370 }, handleIn: { x: 0, y: -6.76239 }, handleOut: { x: 0, y: 1.33333 } },{ point: { x: 265, y: 372 }, handleIn: { x: 1.56667, y: 0 } }],
            [{ point: { x: 343, y: 294 }, handleOut: { x: 0, y: -1.03642 } },{ point: { x: 341, y: 292 }, handleIn: { x: 1.09102, y: 0.54551 }, handleOut: { x: -0.29814, y: -0.14907 } },{ point: { x: 340, y: 292 }, handleIn: { x: 0.2357, y: 0.2357 }, handleOut: { x: -0.66004, y: -0.66004 } },{ point: { x: 317, y: 286 }, handleIn: { x: 4.00368, y: -4.00368 }, handleOut: { x: -1.93294, y: 1.93294 } },{ point: { x: 309, y: 291 }, handleIn: { x: 1.58361, y: -1.58361 }, handleOut: { x: -3.52522, y: 3.52522 } },{ point: { x: 298, y: 308 }, handleIn: { x: 3.0754, y: -6.1508 }, handleOut: { x: -3.45887, y: 6.91773 } },{ point: { x: 294, y: 333 }, handleIn: { x: 2.12155, y: -8.48618 }, handleOut: { x: -1.82333, y: 7.29332 } },{ point: { x: 297, y: 362 }, handleIn: { x: -5.42065, y: -5.42065 }, handleOut: { x: 2.23526, y: 2.23526 } },{ point: { x: 306, y: 365 }, handleIn: { x: -3.10216, y: -1.55108 }, handleOut: { x: 3.15245, y: 1.57622 } },{ point: { x: 317, y: 366 }, handleIn: { x: -3.77515, y: 0 }, handleOut: { x: 19.45979, y: 0 } },{ point: { x: 348, y: 338 }, handleIn: { x: -10.14931, y: 10.14931 }, handleOut: { x: 3.4387, y: -3.4387 } },{ point: { x: 351, y: 319 }, handleIn: { x: -1.08958, y: 4.35831 }, handleOut: { x: 1.2452, y: -4.9808 } },{ point: { x: 351, y: 294 }, handleIn: { x: 3.28305, y: 3.28305 }, handleOut: { x: -2.15068, y: -2.15068 } },{ point: { x: 349, y: 301 }, handleIn: { x: 0, y: -0.61935 }, handleOut: { x: 0, y: 5.82199 } },{ point: { x: 352, y: 318 }, handleIn: { x: -2.61806, y: -5.23611 }, handleOut: { x: 8.02265, y: 16.04529 } },{ point: { x: 369, y: 358 }, handleIn: { x: -14.03215, y: -14.03215 }, handleOut: { x: 0.86551, y: 0.86551 } },{ point: { x: 373, y: 363 }, handleIn: { x: -1.30952, y: 0 } }],
            [{ point: { x: 405, y: 203 }, handleOut: { x: 0, y: 1.69153 } },{ point: { x: 403, y: 208 }, handleIn: { x: 0.64878, y: -0.64878 }, handleOut: { x: -1.01344, y: 1.01344 } },{ point: { x: 403, y: 218 }, handleIn: { x: 0, y: -1.59241 }, handleOut: { x: 0, y: 10.66667 } },{ point: { x: 403, y: 250 }, handleIn: { x: 0, y: -10.66667 }, handleOut: { x: 0, y: 38.80342 } },{ point: { x: 402, y: 365 }, handleIn: { x: 0, y: -38.70321 } }],
            [{ point: { x: 437, y: 203 }, handleOut: { x: 0, y: 13.81247 } },{ point: { x: 435, y: 258 }, handleIn: { x: -3.88418, y: -11.65253 }, handleOut: { x: 4.84595, y: 14.53786 } },{ point: { x: 437, y: 308 }, handleIn: { x: 0, y: -15.84965 }, handleOut: { x: 0, y: 11.7883 } },{ point: { x: 435, y: 343 }, handleIn: { x: 0, y: -11.98551 }, handleOut: { x: 0, y: 3.23901 } },{ point: { x: 435, y: 359 }, handleIn: { x: 0, y: 3.85296 } }],
            [{ point: { x: 498, y: 239 }, handleOut: { x: -13.36089, y: 13.36089 } },{ point: { x: 455, y: 277 }, handleIn: { x: 13.0907, y: -13.0907 }, handleOut: { x: -0.33333, y: 0.33333 } },{ point: { x: 454, y: 278 }, handleIn: { x: 0.33333, y: -0.33333 }, handleOut: { x: -0.66667, y: 0.66667 } },{ point: { x: 452, y: 280 }, handleIn: { x: 0.56569, y: -0.75425 }, handleOut: { x: -2.77541, y: 3.70054 } },{ point: { x: 442, y: 290 }, handleIn: { x: 3.48398, y: -3.48398 }, handleOut: { x: -0.19526, y: 0.19526 } },{ point: { x: 441, y: 292 }, handleIn: { x: -0.7357, y: -0.7357 }, handleOut: { x: 0.83333, y: 0.83333 } },{ point: { x: 446, y: 292 }, handleIn: { x: -0.83333, y: -0.83333 }, handleOut: { x: 2.02316, y: 2.02316 } },{ point: { x: 455, y: 296 }, handleIn: { x: -1.85173, y: -1.85173 }, handleOut: { x: 7.38292, y: 7.38292 } },{ point: { x: 475, y: 325 }, handleIn: { x: -6.15159, y: -9.22739 }, handleOut: { x: 3.41756, y: 5.12634 } },{ point: { x: 483, y: 341 }, handleIn: { x: -3.17858, y: -3.17858 }, handleOut: { x: 2.4694, y: 2.4694 } },{ point: { x: 487, y: 355 }, handleIn: { x: 0, y: -3.16031 }, handleOut: { x: 0, y: 0.33333 } },{ point: { x: 487, y: 356 }, handleIn: { x: -0.2357, y: -0.2357 }, handleOut: { x: 0.89814, y: 0.89814 } },{ point: { x: 491, y: 364 }, handleIn: { x: 0, y: -0.68418 } }]
        ];

        // each set of paths requires different colors
        let chalkPathAttrs = {
        	strokeColor: '#5B5B5B',
        	strokeWidth: 15,
        	strokeCap: 'round',
        	strokeJoin: 'round'
        }

        // Create a new path and style it:
        var chalkPath = new paper.Path(chalkPathAttrs);

        // function called to start adding 'chalk' paths to canvas.
        // while there are chalk paths left, add one per frame
        let animateChalk = (event) => {
            if(event.count % 2 != 0) { return; }
            if(chalkPathSegs.length > 0) {
                if(chalkPathSegs[0].length > 0) {
                    chalkPath.add(chalkPathSegs[0].shift());
                }
                else {
                    chalkPathSegs.shift();
                    chalkPath.onFrame = null;
                    chalkPath = new paper.Path(chalkPathAttrs);
                    chalkPath.onFrame = animateChalk;
                }
            }
            else {
                console.log('"Chalk" writing added to canvas');
                chalkPath.onFrame = null;
                this.addBoardWriting();
            }
        }

        chalkPath.onFrame = animateChalk;

    }

    addBoardWriting() {
        let boardPathSegs = [
            [{ point: { x: 524, y: 200 }, handleOut: { x: 0, y: 16.33333 } },{ point: { x: 524, y: 249 }, handleIn: { x: 0, y: -16.33333 }, handleOut: { x: 0, y: 5.205 } },{ point: { x: 524, y: 270 }, handleIn: { x: 2.24446, y: -4.48892 }, handleOut: { x: -2.0794, y: 4.15879 } },{ point: { x: 523, y: 286 }, handleIn: { x: 0, y: -4.92375 }, handleOut: { x: 0, y: 8.51596 } },{ point: { x: 523, y: 324 }, handleIn: { x: -2.5528, y: -7.65839 }, handleOut: { x: 3.75621, y: 11.26863 }  },{ point: { x: 525, y: 364 }, handleIn: { x: 0, y: -12.4045 } }],
            [{ point: { x: 530, y: 289 }, handleOut: { x: 0, y: -4.92749 } },{ point: { x: 539, y: 280 }, handleIn: { x: -2.5949, y: 2.5949 }, handleOut: { x: 8.04776, y: -8.04776 } },{ point: { x: 578, y: 285 }, handleIn: { x: -7.26794, y: -7.26794 }, handleOut: { x: 15.73705, y: 15.73705 } },{ point: { x: 579, y: 350 }, handleIn: { x: 13.21038, y: -13.21038 }, handleOut: { x: -4.32329, y: 4.32329 } },{ point: { x: 562, y: 362 }, handleIn: { x: 4.80554, y: -4.80554 }, handleOut: { x: -1.15991, y: 1.15991 } },{ point: { x: 533, y: 366 }, handleIn: { x: 1.67221, y: 1.67221 }, handleOut: { x: -0.49552, y: -0.49552 } },{ point: { x: 530, y: 363 }, handleIn: { x: 0.6606, y: 0 } }],
            [{ point: { x: 660, y: 288 }, handleOut: { x: 0, y: -5.96157 } },{ point: { x: 631, y: 279 }, handleIn: { x: 5.6469, y: -5.6469 }, handleOut: { x: -3.41009, y: 3.41009 } },{ point: { x: 620, y: 288 }, handleIn: { x: 2.44301, y: -2.44301 }, handleOut: { x: -1.97677, y: 1.97677 } },{ point: { x: 616, y: 298 }, handleIn: { x: 1.7408, y: -1.7408 }, handleOut: { x: -6.93138, y: 6.93138 } },{ point: { x: 613, y: 351 }, handleIn: { x: -5.18872, y: -10.37744 }, handleOut: { x: 1.87443, y: 3.74886 } },{ point: { x: 623, y: 362 }, handleIn: { x: -3.09834, y: -3.09834 }, handleOut: { x: 2.82148, y: 2.82148 } },{ point: { x: 642, y: 364 }, handleIn: { x: -4.42983, y: 0 }, handleOut: { x: 2.42286, y: 0 } },{ point: { x: 652, y: 364 }, handleIn: { x: -2.12006, y: 1.06003 }, handleOut: { x: 15.26921, y: -7.63461 } },{ point: { x: 671, y: 313 }, handleIn: { x: 0, y: 19.98383 }, handleOut: { x: 0, y: -11.69613 } },{ point: { x: 659, y: 284 }, handleIn: { x: 13.77337, y: 0 } }],
            [{ point: { x: 752, y: 289 }, handleOut: { x: 0, y: -4.57957 } },{ point: { x: 717, y: 279 }, handleIn: { x: 9.74687, y: -4.87344 }, handleOut: { x: -5.12246, y: 2.56123 } },{ point: { x: 705, y: 287 }, handleIn: { x: 4.13887, y: -4.13887 }, handleOut: { x: -1.34485, y: 1.34485 } },{ point: { x: 703, y: 295 }, handleIn: { x: 1.4951, y: -1.4951 }, handleOut: { x: -4.72978, y: 4.72978 } },{ point: { x: 695, y: 327 }, handleIn: { x: 0, y: -8.43153 }, handleOut: { x: 0, y: 4.02466 } },{ point: { x: 696, y: 347 }, handleIn: { x: -1.42948, y: -1.42948 }, handleOut: { x: 3.64676, y: 3.64676 } },{ point: { x: 704, y: 358 }, handleIn: { x: -3.7387, y: -3.7387 }, handleOut: { x: 2.87462, y: 2.87462 } },{ point: { x: 719, y: 360 }, handleIn: { x: -4.27017, y: 0 }, handleOut: { x: 6.34616, y: 0 } },{ point: { x: 736, y: 358 }, handleIn: { x: -4.47037, y: 2.23519 }, handleOut: { x: 11.72058, y: -5.86029 } },{ point: { x: 752, y: 325 }, handleIn: { x: -4.39458, y: 8.78916 }, handleOut: { x: 3.77045, y: -7.54091 } },{ point: { x: 755, y: 298 }, handleIn: { x: 0, y: 9.05833 }, handleOut: { x: 0, y: -1.40098 } },{ point: { x: 755, y: 288 }, handleIn: { x: 1.02682, y: 1.02682 }, handleOut: { x: -1.19333, y: -1.19333 } },{ point: { x: 755, y: 296 }, handleIn: { x: -0.47164, y: -0.94328 }, handleOut: { x: 2.30008, y: 4.60016 } },{ point: { x: 756, y: 314 }, handleIn: { x: -1.71364, y: -5.14091 }, handleOut: { x: 3.80646, y: 11.41937 } },{ point: { x: 768, y: 348 }, handleIn: { x: -7.5314, y: -7.5314 }, handleOut: { x: 2.19694, y: 2.19694 } },{ point: { x: 775, y: 357 }, handleIn: { x: -3.21669, y: 0 } }],
            [{ point: { x: 797, y: 268 }, handleOut: { x: 0, y: 17.31125 } },{ point: { x: 798, y: 322 }, handleIn: { x: 0, y: -17.95392 }, handleOut: { x: 0, y: 4.81872 } },{ point: { x: 799, y: 342 }, handleIn: { x: -2.66455, y: -2.66455 }, handleOut: { x: 1.93677, y: 1.93677 } },{ point: { x: 800, y: 358 }, handleIn: { x: -3.27599, y: 0 } }],
            [{ point: { x: 803, y: 294 }, handleOut: { x: 0, y: -4.57676 } },{ point: { x: 808, y: 282 }, handleIn: { x: -1.91656, y: 1.91656 }, handleOut: { x: 1.28228, y: -1.28228 } },{ point: { x: 835, y: 278 }, handleIn: { x: -4.3596, y: -2.1798 }, handleOut: { x: 4.53145, y: 2.26572 } },{ point: { x: 843, y: 285 }, handleIn: { x: -2.52113, y: -2.52113 }, handleOut: { x: 1.49057, y: 1.49057 } },{ point: { x: 845, y: 294 }, handleIn: { x: -2.75298, y: 0 } }],
            [{ point: { x: 914, y: 287 }, handleOut: { x: 0, y: -3.29191 } },{ point: { x: 897, y: 276 }, handleIn: { x: 3.56723, y: 0 }, handleOut: { x: -1.43233, y: 0 } },{ point: { x: 888, y: 276 }, handleIn: { x: 0.91161, y: -0.91161 }, handleOut: { x: -3.46489, y: 3.46489 } },{ point: { x: 876, y: 285 }, handleIn: { x: 2.98628, y: -2.98628 }, handleOut: { x: -8.2681, y: 8.2681 } },{ point: { x: 866, y: 325 }, handleIn: { x: 0, y: -14.47102 }, handleOut: { x: 0, y: 6.97784 } },{ point: { x: 869, y: 346 }, handleIn: { x: -4.29692, y: -4.29692 }, handleOut: { x: 2.61395, y: 2.61395 } },{ point: { x: 907, y: 351 }, handleIn: { x: -6.79127, y: 6.79127 }, handleOut: { x: 3.40836, y: -3.40836 } },{ point: { x: 918, y: 342 }, handleIn: { x: -3.10469, y: 3.10469 }, handleOut: { x: 2.9504, y: -2.9504 } },{ point: { x: 923, y: 333 }, handleIn: { x: -2.1585, y: 2.1585 }, handleOut: { x: 1.78763, y: -1.78763 } },{ point: { x: 927, y: 304 }, handleIn: { x: 0, y: 3.58865 }, handleOut: { x: 0, y: -3 } },{ point: { x: 927, y: 295 }, handleIn: { x: 0, y: 3 }, handleOut: { x: 0, y: -0.90617 } },{ point: { x: 927, y: 291 }, handleIn: { x: 0, y: -2.33707 } }],
            [{ point: { x: 927, y: 290 }, handleOut: { x: 0, y: -21.43669 } },{ point: { x: 925, y: 230 }, handleIn: { x: 0, y: 20.50051 }, handleOut: { x: 0, y: -6.63439 } },{ point: { x: 923, y: 211 }, handleIn: { x: 0, y: 5.56414 }, handleOut: { x: 0, y: -2.40897 } },{ point: { x: 923, y: 202 }, handleIn: { x: 0, y: -3.96365 } }],
            [{ point: { x: 928, y: 314 }, handleOut: { x: 0, y: 6.80765 } },{ point: { x: 934, y: 343 }, handleIn: { x: -3.48038, y: -3.48038 }, handleOut: { x: 0.9751, y: 0.9751 } },{ point: { x: 939, y: 351 }, handleIn: { x: 0, y: -1.80319 } }]
        ];

        let boardPathAttrs = {
        	strokeColor: '#008DB0',
        	strokeWidth: 15,
        	strokeCap: 'round',
        	strokeJoin: 'round'
        }

        // Create a new path and style it:
        var boardPath = new paper.Path(boardPathAttrs);

        // function called to start adding 'board' paths to canvas.
        // While there are board paths left, add one per frame.
        let animateBoard = (event) => {
            if(event.count % 2 != 0) { return; }
            if(boardPathSegs.length > 0) {
                if(boardPathSegs[0].length > 0) {
                    boardPath.add(boardPathSegs[0].shift());
                }
                else {
                    boardPathSegs.shift();
                    boardPath.onFrame = null;
                    boardPath = new paper.Path(boardPathAttrs);
                    boardPath.onFrame = animateBoard;
                }
            }
            else {
                console.log('"board" writing added to canvas');
                boardPath.onFrame = null;
                this.addAppDescriptionText();
            }
        }

        boardPath.onFrame = animateBoard;

    }

    addAppDescriptionText() {

        let descriptionString =
`Chalkboard is an online interactive canvas that allows users to meet
and collaborate remotely. Users can work with different drawing tools
to add shapes and objects to a Chalkboard canvas. Anything added to a
chalkboard canvas will instantly be displayed for all users viewing
that canvas through a web browser. Users can create chalkboard
"sessions" where each session has its own unique canvas independent of
all other canvas's, allowing multiple groups of collaborators to work
simultaneously within their own workspaces hosted by Chalkboard.

To get started, join or create a session from the navigation bar.


Want to learn more? select the question mark (?) in the navigation bar!`;

        let descriptionText = new paper.PointText( {
            point: [114, 518],
            fillColor: '#000000',
            fontFamily: 'Courier New',
            fontSize: 25,
            content:''
        });

        descriptionText.onFrame = (event) => {
            if(event.count % 2 != 0) { return; }
            if(descriptionString.length > 0) {
                descriptionText.content += descriptionString.charAt(0);
                descriptionString = descriptionString.substr(1);
            }
            else {
                console.log('description text added to canvas');
                descriptionText.onFrame = null;
            }
        }
    }
}

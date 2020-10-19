const draw = require('../public/js/draw.js');
const lockDrawing = draw.lockDrawing;

test('lockDrawing should return true when called', () => {
    expect(lockDrawing()).toBe(true)
});

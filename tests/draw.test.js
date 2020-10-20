const draw = require('../public/js/draw.js');


test('lockDrawing should return true when called', () => {
    const lockDrawing = draw.lockDrawing;
    expect(lockDrawing()).toBe(true)
});

test('getLineAttributes does not set strokeStyle to black', () => {
    const getLineAttributes = draw.getLineAttributes;
    const selectedColor = 'black';
    let obj = getLineAttributes(true);
    expect(obj.strokeStyle).toEqual(expect.not.stringContaining(selectedColor));
});

test('getLineAttribute sets strokeStyle to black', () => {
    const getLineAttributes = draw.getLineAttributes;
    const selectedColor = 'black';
    let obj = getLineAttributes(false);
    expect(obj.strokeStyle).toEqual(selectedColor);
});

function onReady(callback) {
    var intervalId = window.setInterval(function() {
      if (document.getElementsByTagName('body')[0] !== undefined) {
        window.clearInterval(intervalId);
        callback.call(this);
      }
    }, 5000);
  }

function setVisible(selector, visible) {
document.querySelector(selector).style.display = visible ? 'block' : 'none';
}

onReady(function() {
setVisible('#page', true);
setVisible('#loading', false);
}); 
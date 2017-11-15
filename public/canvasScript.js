var canvas = $('#canvas');
var context = document.getElementById('canvas').getContext('2d');


canvas.on('mousedown', function() {
    context.beginPath();
    context.strokeStyle = 'black';
    canvas.on('mousemove.event', function(e) {
        context.lineTo(e.offsetX, e.offsetY);
        context.stroke();
    });
}).on('mouseup', function(e){
    canvas.off('.event');

}).on('mouseleave', function(e){
    canvas.off('.event');
    // canvas[0].toDataURL("image/png");
    var img = document.getElementById('canvas').toDataURL();
    $("input[name=signature]").val(img);
});

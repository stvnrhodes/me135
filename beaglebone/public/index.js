if (!window.WebSocket) {
  alert("WebSocket NOT supported by your Browser! This whole thing's gonna fail");
}
var host = window.document.location.host.replace(/:.*/, '');
var ws = new WebSocket('ws://' + host + ':8080');


function onLoad() {
  ws.onMessage = onMessage;
  var speed = 5;
  function wsSend(msg) {
    ws.send(JSON.stringify(msg));
  }
  $('#speed').html(speed);
  $(document).keydown ( function ( event ) {
    if(event.keyCode === 87) {  // 'W'
      wsSend({ id:'move', dir:'f', spd:speed });
    }
    else if(event.keyCode === 65) {  // 'A'
      wsSend({ id:'move', dir:'l', spd:speed });
    }
    else if(event.keyCode === 83) {  // 'S'
      wsSend({ id:'move', dir:'b', spd:speed });
    }
    else if(event.keyCode === 68) {  // 'D'
      wsSend({ id:'move', dir:'r', spd:speed });
    }
    else if(event.keyCode === 32) {  // Space bar
      wsSend({ id:'move', dir:'s', spd:speed });
    }
    else if(event.keyCode === 88) { // 'X'
      if (speed < 10) {
        speed += 1;
      }
      $('#speed').html(speed);
    }
    else if(event.keyCode === 90) { // 'Z'
      if (speed > 0) {
        speed -= 1;
      }
      $('#speed').html(speed);
    }
  });
  $(document).keyup( function(event) {
    var k = event.keyCode;
    if ( k === 87 || k === 65 || k === 83 || k === 68 ) {  // 'WASD'
      wsSend({ id:'move', dir:'s', spd:0 });
    }
  });
  $('#Cam').click(function () {
    $('img').attr('src', "cam.png");
  } );
  $('#LED1').click(function () {
    wsSend({ id:'led', num: 1 } );
  });
  $('#LED2').click ( function() {
    wsSend({ id:'led', num: 2 } );
  });
  $('#resetEncoder').click ( function () {
    wsSend({ id:'enc', action: 'rst' });
  });
}

function onMessage(event) {
  data = JSON.parse(event.data);
  if (data.id === 'b') {
    buttonText = $('#buttonText');
    if (data.val) {
      buttonText.html("not pressed");
    } else {
      buttonText.html("pressed");
    }
  } else if (data.id === 'ctr') {
    $('#counterText').html(data.val.toString());
  } else if (data.id === 'e') {
    $('#lEnc').html(data[1]);
    $('#rEnc').html(data[2]);
  }
}

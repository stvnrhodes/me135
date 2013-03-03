var ref = require('ref');
var ffi = require('ffi');

// typedef
var CvCapture = ref.types.void; // we don't know what the layout of "sqlite3" looks like
var CvCapturePtr = ref.refType(CvCapture);
var IplImage = ref.types.void;
var IplImagePtr = ref.refType(CvCapture);

var highgui = ffi.Library('libopencv_highgui', {
  'cvCreateCameraCapture': [ CvCapturePtr, [ 'int' ] ],
  'cvSetCaptureProperty': [ 'int', [CvCapturePtr, 'int', 'int'] ],
  'cvNamedWindow': ['int', [ref.types.CString] ],
  'cvQueryFrame': [ IplImagePtr, [CvCapturePtr] ],
  'cvShowImage': ['int', [ref.types.CString, IplImagePtr] ],
  'cvWaitKey': ['int', ['int'] ],
  'cvSaveImage': ['int', [ref.types.CString, IplImagePtr] ],
  // 'cvDestroyWindow'
});
for (var attrname in highgui) {
  var shortname = attrname.replace(/cv(.*)/, '$1')
  exports[shortname] = highgui[attrname];
}

var CameraSettingsEnum = {
  CV_CAP_PROP_POS_MSEC: 0,
  CV_CAP_PROP_POS_FRAMES: 1,
  CV_CAP_PROP_POS_AVI_RATIO: 2,
  CV_CAP_PROP_FRAME_WIDTH: 3,
  CV_CAP_PROP_FRAME_HEIGHT: 4,
  CV_CAP_PROP_FPS: 5,
  CV_CAP_PROP_FOURCC: 6,
  CV_CAP_PROP_FRAME_COUNT: 7,
  CV_CAP_PROP_FORMAT: 8,
  CV_CAP_PROP_MODE: 9,
  CV_CAP_PROP_BRIGHTNESS: 10,
  CV_CAP_PROP_CONTRAST: 11,
  CV_CAP_PROP_SATURATION: 12,
  CV_CAP_PROP_HUE: 13,
  CV_CAP_PROP_GAIN: 14,
  CV_CAP_PROP_EXPOSURE: 15,
  CV_CAP_PROP_CONVERT_RGB: 16,
  CV_CAP_PROP_WHITE_BALANCE: 17,
  CV_CAP_PROP_RECTIFICATION: 18
}
for (var attrname in CameraSettingsEnum) {
  exports[attrname] = CameraSettingsEnum[attrname];
}


// // now use them:
// var n = (new Date()).getTime();
// var capture = cv.cvCreateCameraCapture(0);
// cv.cvSetCaptureProperty(capture, CameraSettingsEnum.CV_CAP_PROP_FRAME_WIDTH, 160);
// cv.cvSetCaptureProperty(capture, CameraSettingsEnum.CV_CAP_PROP_FRAME_HEIGHT, 120);
// cv.cvSetCaptureProperty(capture, CameraSettingsEnum.CV_CAP_PROP_FPS, 5);
// cv.cvNamedWindow("Hello World");
// console.log((new Date()).getTime() - n);
// var takePicture = function() {
//   var frame = cv.cvQueryFrame(capture);
//   cv.cvShowImage("Hello World", frame);
// }
// setInterval(takePicture, 100)

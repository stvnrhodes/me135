#include <node/v8.h>
#include <node/node.h>
#include <opencv/cv.h>
#include <opencv/highgui.h>

using namespace v8;

Handle<Value> TheAnswer(const Arguments& args) {
  HandleScope scope;

  // Do stuff here.

  return scope.Close(Integer::New(42));
}

Handle<Value> Fibonacci(const Arguments& args) {
    HandleScope scope;

    if (args.Length() < 1) {
        return ThrowException(Exception::TypeError(
            String::New("First argument must be a number")));
    }
    Local<Integer> integer = args[0]->ToInteger();
    int32_t seq = integer->Value();
    return scope.Close(Integer::New(2));
}

Handle<Value> CallbackFunction(const Arguments& args) {
    HandleScope scope;

    if (!args[0]->IsFunction()) {
        return ThrowException(Exception::TypeError(String::New(
            "First argument must be a callback function")));
    }
    Local<Function> callback = Local<Function>::Cast(args[1]);

    // ...
    int error = 0;
    if (error) {
        Local<Value> err = Exception::Error(
            String::New("Something went wrong!"));
        Local<Value> argv[] = { err };
        callback->Call(Context::GetCurrent()->Global(), 1, argv);
    } else {
        Local<Value> argv[] = {
            Local<Value>::New(Null()),
            Local<Value>::New(Integer::New(42))
        };
        callback->Call(Context::GetCurrent()->Global(), 2, argv);
    }

    return Undefined();
}

Handle<Value> InitCam(const Arguments& args) {
  HandleScope scope;

  CvCapture *capture = 0;
  IplImage  *frame = 0;
  IplImage  *newframe = 0;
  CvMemStorage* storage = cvCreateMemStorage(0);
  CvSeq* contour = 0;
  CvMoments moments;
  int       key = 0;

    /* initialize camera */
  capture = cvCaptureFromCAM(0);
  cvSetCaptureProperty(capture, CV_CAP_PROP_FRAME_WIDTH, 160);
  cvSetCaptureProperty(capture, CV_CAP_PROP_FRAME_HEIGHT, 120);
  cvSetCaptureProperty(capture, CV_CAP_PROP_FPS, 5);

    return Undefined();
}

void RegisterModule(Handle<Object> target) {
  NODE_SET_METHOD(target, "theAnswer", TheAnswer);
  NODE_SET_METHOD(target, "fib", Fibonacci);
  NODE_SET_METHOD(target, "back", CallbackFunction);
  NODE_SET_METHOD(target, "cam", InitCam);
}

// Register the module with node.
NODE_MODULE(nodemodule, RegisterModule)

// var mod = require('./build/Release/nodemodule.node');

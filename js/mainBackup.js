//Info on Media Stream and base code can be found at 
//https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API/Recording_a_media_element

//global variables we need
let preview = document.getElementById("preview");
let recording = document.getElementById("recording");
let startButton = document.getElementById("startButton");
let stopButton = document.getElementById("stopButton");
let downloadButton = document.getElementById("downloadButton");
let logElement = document.getElementById("log");

//Specifies the length of the videos we will record
let recordingTimeMS = 5000;

//
function wait(delayInMS) {
  return new Promise(resolve => setTimeout(resolve, delayInMS));
}

//the recording process
function startRecording(stream, lengthInMS) {
  let recorder = new MediaRecorder(stream);
  let data = []; //holds Blobds of media data
 
  recorder.ondataavailable = event => data.push(event.data);
  recorder.start();
 
  let stopped = new Promise((resolve, reject) => {
    recorder.onstop = resolve;
    recorder.onerror = event => reject(event.name);
  });

  let recorded = wait(lengthInMS).then(
    () => recorder.state == "recording" && recorder.stop()
  );
 
  return Promise.all([
    stopped,
    recorded
  ])
  .then(() => data);
}

//stops the input stream
function stop(stream) {
  stream.getTracks().forEach(track => track.stop());
}

//event handlers for a click event
startButton.addEventListener("click", function() {
  //request a new Media stream
  navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  }).then(stream => {
    preview.srcObject = stream;
    downloadButton.href = stream;
    preview.captureStream = preview.captureStream || preview.mozCaptureStream;
    return new Promise(resolve => preview.onplaying = resolve);
  }).then(() => startRecording(preview.captureStream(), recordingTimeMS))
  .then (recordedChunks => {
    let recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
    recording.src = URL.createObjectURL(recordedBlob);
    downloadButton.href = recording.src;
    downloadButton.download = "RecordedVideo.webm";
  })
  .catch("Error");
}, false);

//stop button for click event
stopButton.addEventListener("click", function() {
  stop(preview.srcObject);
}, false);
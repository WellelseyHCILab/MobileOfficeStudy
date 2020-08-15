//Info on Media Stream and base code can be found at 
//https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API/Recording_a_media_element

console.log("Edited 5");

if(top.location.pathname.includes("5") || top.location.pathname.includes("6") || top.location.pathname.includes("7") || top.location.pathname.includes("8")){
	
	console.log("in a scenario page");
	
	//variables for voice recording
	let previewVoice = document.getElementById("previewVoice");
	let recordingVoice = document.getElementById("recordingVoice");
	let startButtonVoice = document.getElementById("startButtonVoice");
	let stopButtonVoice = document.getElementById("stopButtonVoice");

	//variables for gesture recording
	let previewGest = document.getElementById("previewGest");
	let recordingGest = document.getElementById("recordingGest");
	let startButtonGest = document.getElementById("startButtonGest");
	let stopButtonGest = document.getElementById("stopButtonGest");
	
	var taskNum = document.getElementById('taskNum').value;
	var taskType = document.getElementById('taskType').value;
	
	//Specifies the length of the videos we will record
	let recordingTimeMS = 15000;

	function wait(delayInMS) {
	  return new Promise(resolve => setTimeout(resolve, delayInMS));
	}

	//the recording process
	function startRecording(stream, lengthInMS) {
	  let recorder = new MediaRecorder(stream);
	  let data = []; //holds Blobs of media data

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

	//function that controls the start button procedure
	function startButtonAction(preview,recording,type){
	  //request a new Media stream
	  navigator.mediaDevices.getUserMedia({
		video: true,
		audio: true
	  }).then(stream => {
		preview.srcObject = stream;
		preview.captureStream = preview.captureStream || preview.mozCaptureStream;
		return new Promise(resolve => preview.onplaying = resolve);
	  }).then(() => startRecording(preview.captureStream(), recordingTimeMS))
	  .then (recordedChunks => {
		let recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
		recording.src = URL.createObjectURL(recordedBlob);
		  if(type=="voice"){
			  console.log("Task Num is..."+taskNum);
			  console.log("Task Type is..."+taskType);
			  sessionStorage.setItem('test','test1');
			  console.log("storing a session variable...");
			  //store in a session var
			  console.log(recording.src);
			  sessionStorage.setItem('blobURL', recording.src);
		  }
		  else {

		  }
	  })
	  .catch("Error");
	}

	//function that controls the stop button procedure
	function stopButtonAction(preview){
	  stop(preview.srcObject);
//		 if(type=="voice"){
//			  console.log("Task Num is..."+taskNum);
//			  console.log("Task Type is..."+taskType);
//			  sessionStorage.setItem('test','test1');
//			  console.log("storing a session variable...");
//			  //store in a session var
//			  console.log(recording.src);
//			  sessionStorage.setItem('blobURL', recording.src);
//		  }
//		  else {
//
//		  }
	}

	//event handlers for a click event in the voice record buttons
	startButtonVoice.addEventListener("click", function(){startButtonAction(previewVoice,recordingVoice,"voice")}, false);
	stopButtonVoice.addEventListener("click", function(){stopButtonAction(previewVoice)}, false);

	//event handlers for a click event in the gesture record buttons
	startButtonGest.addEventListener("click", function(){startButtonAction(previewGest,recordingGest,"gesture")}, false);
	stopButtonGest.addEventListener("click", function(){stopButtonAction(previewGest)}, false);
}

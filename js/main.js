//Info on Media Stream and base code can be found at 
//https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API/Recording_a_media_element

console.log("Version 10");

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
	
	let taskNum = document.getElementById('taskNum').value;
	let taskType = document.getElementById('taskType').value;
	
	
	//Specifies the length of the videos we will record
	let recordingTimeMS = 15000;
	
	let form = document.getElementById('surveyForm');

	let blobsArray = [];
	
	form.addEventListener("submit", function (event) {
         event.preventDefault(); // prevent form submission and reloading the page.
			let formInfo = new FormData(form);
			console.log(`formInfo is ${formInfo}`);
			formInfo.append("blobs", blobsArray[0], "voiceBlob.webm");
			formInfo.append("blobs", blobsArray[1], "gestureBlob.webm");
			console.log('form info', ...formInfo);
		var url = `https://cs.wellesley.edu:8133/${taskType}/`;

		//send a post request with video data
		fetch(url, {
			method: 'post',
			credentials: 'include',
			body: formInfo
			})
		.then(data => {
		console.log('Request succeeded with JSON response', data);
		//redirect to the next task
		if (data.url.includes("podcast") || data.url.includes("presentation")){
			//go to a random leisure task
			let leisureTaskUrl = selectLeisureTask();
		    window.location.href = leisureTaskUrl;
		}
		else if (data.url.includes("karaoke") || data.url.includes("audiobook")){
			//after finishing leisure task, go to the end
			window.location.href = 'https://cs.wellesley.edu/~mobileoffice/study/9_endsurvey.html';
		}
		
		})
		.catch(function (error) {
		console.log('Request failed', error);
		});
			
     });
	
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
	function startButtonAction(preview,recording){
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
		  console.log(recordedBlob);
		  blobsArray.push(recordedBlob);
	  })
	  .catch("Error");
	}

	//function that controls the stop button procedure
	function stopButtonAction(preview){
	  stop(preview.srcObject);
	}

	//event handlers for a click event in the voice record buttons
	startButtonVoice.addEventListener("click", function(){startButtonAction(previewVoice,recordingVoice)}, false);
	stopButtonVoice.addEventListener("click", function(){stopButtonAction(previewVoice)}, false);

	//event handlers for a click event in the gesture record buttons
	startButtonGest.addEventListener("click", function(){startButtonAction(previewGest,recordingGest)}, false);
	stopButtonGest.addEventListener("click", function(){stopButtonAction(previewGest)}, false);
}

let selectLeisureTask = () => {
	var randNum = Math.floor(Math.random() * 2);
	if (randNum){
		//Generate a random number, 1 or 5 inclusive
		let randTaskNum = 1+ Math.floor(Math.random() * 5);
		return `https://cs.wellesley.edu/~mobileoffice/study/6_karaoke_t${randTaskNum}.html`;
	} else {
		let randTaskNum = 1+ Math.floor(Math.random() * 5);
		return `https://cs.wellesley.edu/~mobileoffice/study/7_audiobook_t${randTaskNum}.html`;
	}
}

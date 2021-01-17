//Info on Media Stream and base code can be found at 
//https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API/Recording_a_media_element

console.log("Version 10");
//let sessionStorage = window.localStorage;
//console.log("sessionstorage is" + JSON.stringify(sessionStorage))

if (top.location.pathname.includes("5") || top.location.pathname.includes("6") || top.location.pathname.includes("7") || top.location.pathname.includes("8")) {

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
	let texts = document.getElementsByClassName("recordingtext");
	console.log("texts is", texts)


	let stopBttn1 = document.getElementsByClassName("stopBttn1");
	let stopBttn2 = document.getElementsByClassName("stopBttn2");
	stopBttn1[0].addEventListener('click', (event) => {
		texts[0].textContent = "Loading......";
	});
	stopBttn2[0].addEventListener('click', (event) => {
		texts[1].textContent = "Loading......";
	});


	let blobsArray = [];
	// let video1 = document.getElementById("recordingGest");
	// let video2 = document.getElementById("recordingVoice");

	// if (video1.getAttribute("src")) {
	// 	texts[0].textContent = "Recording Completed"
	// }
	// if (video2.getAttribute("src")) {
	// 	texts[1].textContent = "Recording Completed"
	// }

	let currURL = top.location.pathname;

	form.addEventListener("submit", function (event) {
		event.preventDefault(); // prevent form submission and reloading the page.
		let formInfo = new FormData(form);
		if (blobsArray.length !== 2) {
			alert("Please complete both video recordings.");
			return;
		}
		try {
			formInfo.append("blobs", blobsArray[0], "voiceBlob.webm");
			formInfo.append("blobs", blobsArray[1], "gestureBlob.webm");
		}
		catch (err) {
			console.log("user did not record for both options")
			throw new Error(e.message);
		}

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
				if (currURL.includes("podcast") && !currURL.includes("t6")) {
					//go to the next podcast task

					let nextTaskNum = parseInt(currURL.slice(-6)[0]) + 1;
					window.location.href = `https://cs.wellesley.edu/~mobileoffice/study/5_podcast_t${nextTaskNum}.html`;

				}
				else if ((currURL.includes("presentation") && !currURL.includes("t8"))) {
					//go to the next presentation task
					let nextTaskNum = parseInt(currURL.slice(-6)[0]) + 1;
					window.location.href = `https://cs.wellesley.edu/~mobileoffice/study/8_presentation_t${nextTaskNum}.html`;
				}
				else if ((currURL.includes("audiobook") && !currURL.includes("t5"))) {
					//go to the next audiobook task
					let nextTaskNum = parseInt(currURL.slice(-6)[0]) + 1;
					window.location.href = `https://cs.wellesley.edu/~mobileoffice/study/7_audiobook_t${nextTaskNum}.html`;
				}
				else if ((currURL.includes("karaoke") && !currURL.includes("t5"))) {
					//go to then next karaoke task
					let nextTaskNum = parseInt(currURL.slice(-6)[0]) + 1;
					window.location.href = `https://cs.wellesley.edu/~mobileoffice/study/6_karaoke_t${nextTaskNum}.html`;
				}
				else if (currURL.includes("podcast_t6") || currURL.includes("presentation_t8")) {
					//go to leisure task or to the end
					console.log(sessionStorage.getItem('hasDoneTaskBefore'));
					if (sessionStorage.getItem('hasDoneTaskBefore')) {
						//to the end
						sessionStorage.setItem('hasDoneTaskBefore', false);
						window.location.href = 'https://cs.wellesley.edu/~mobileoffice/study/9_endsurvey.html';
					}

					else {
						//to leisure task
						sessionStorage.setItem('hasDoneTaskBefore', true);
						let leisureTaskUrl = selectLeisureTask();
						window.location.href = leisureTaskUrl;
					}
				}
				else if (currURL.includes("karaoke_t5") || currURL.includes("audiobook_t5")) {
					//after finishing leisure task, go to the end
					console.log(sessionStorage.getItem('hasDoneTaskBefore'));
					if (sessionStorage.getItem('hasDoneTaskBefore')) {
						sessionStorage.setItem('hasDoneTaskBefore', false);
						window.location.href = 'https://cs.wellesley.edu/~mobileoffice/study/9_endsurvey.html';
					}
					//to the end

					else {
						//to work task
						sessionStorage.setItem('hasDoneTaskBefore', true);
						let workTaskUrl = selectWorkTask();
						window.location.href = workTaskUrl;
					}

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
	function startButtonAction(preview, recording, type) {
		//request a new Media stream
		navigator.mediaDevices.getUserMedia({
			video: true,
			audio: true
		}).then(stream => {
			preview.srcObject = stream;
			preview.captureStream = preview.captureStream || preview.mozCaptureStream;
			return new Promise(resolve => preview.onplaying = resolve);
		}).then(() => startRecording(preview.captureStream(), recordingTimeMS))
			.then(recordedChunks => {
				let recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
				recording.src = URL.createObjectURL(recordedBlob);
				console.log(recordedBlob);
				if (type === "voice")
				texts[0].textContent = "Completed"
				else
				texts[1].textContent = "Completed"
				blobsArray.push(recordedBlob);
			})
			.catch("Error");
	}

	//function that controls the stop button procedure
	function stopButtonAction(preview) {
		stop(preview.srcObject);
	}

	//event handlers for a click event in the voice record buttons
	startButtonVoice.addEventListener("click", function () { startButtonAction(previewVoice, recordingVoice, "voice") }, false);
	stopButtonVoice.addEventListener("click", function () { stopButtonAction(previewVoice) }, false);

	//event handlers for a click event in the gesture record buttons
	startButtonGest.addEventListener("click", function () { startButtonAction(previewGest, recordingGest, "gesture") }, false);
	stopButtonGest.addEventListener("click", function () { stopButtonAction(previewGest) }, false);
}

const selectLeisureTask = () => {
	var randNum = Math.floor(Math.random() * 2);
	if (randNum) {
		//Generate a random number, 1 to 5 inclusive
		//let randTaskNum = 1+ Math.floor(Math.random() * 5);
		return `https://cs.wellesley.edu/~mobileoffice/study/6_karaoke_t1.html`;
	} else {
		//let randTaskNum = 1+ Math.floor(Math.random() * 5);
		return `https://cs.wellesley.edu/~mobileoffice/study/7_audiobook_t1.html`;
	}
}

const selectWorkTask = () => {
	var randNum = Math.floor(Math.random() * 2);
	if (randNum) {
		//Generate a random number, 1 to 5 inclusive
		//let randTaskNum = 1+ Math.floor(Math.random() * 5);
		return `https://cs.wellesley.edu/~mobileoffice/study/5_podcast_t1.html`;
	} else {
		//let randTaskNum = 1+ Math.floor(Math.random() * 5);
		return `https://cs.wellesley.edu/~mobileoffice/study/8_presentation_t1.html`;
	}
}

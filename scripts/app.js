const record = document.querySelector(".record");
const stop = document.querySelector(".stop");
const soundClips = document.querySelector(".sound-clips");
const canvas = document.querySelector(".visualizer");
const mainSection = document.querySelector(".main-controls");

stop.disabled = true;

let audioCtx;
const canvasCtx = canvas.getContext("2d");

if (navigator.mediaDevices.getUserMedia) {
  const constraints = { audio: true };
  let chunks = [];

  navigator.mediaDevices.getUserMedia(constraints).then(stream => {
    const mediaRecorder = new MediaRecorder(stream);
    visualize(stream);

    record.onclick = () => {
      mediaRecorder.start();
      record.style.background = "red";
      stop.disabled = false;
      record.disabled = true;
    };

    stop.onclick = () => {
      mediaRecorder.stop();
      record.style.background = "";
      stop.disabled = true;
      record.disabled = false;
    };

    mediaRecorder.onstop = () => {
      const clipName = prompt("Enter a name for your sound clip?", "My unnamed clip");
      const clipContainer = document.createElement("article");
      const clipLabel = document.createElement("p");
      const audio = document.createElement("audio");
      const deleteButton = document.createElement("button");

      clipContainer.classList.add("clip");
      audio.setAttribute("controls", "");
      deleteButton.textContent = "Delete";
      deleteButton.className = "delete";

      clipLabel.textContent = clipName === null ? "My unnamed clip" : clipName;

      clipContainer.appendChild(audio);
      clipContainer.appendChild(clipLabel);
      clipContainer.appendChild(deleteButton);
      soundClips.appendChild(clipContainer);

      const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
      chunks = [];
      const audioURL = window.URL.createObjectURL(blob);
      audio.src = audioURL;

      deleteButton.onclick = (e) => {
        e.target.closest(".clip").remove();
      };

      clipLabel.onclick = () => {
        const existingName = clipLabel.textContent;
        const newClipName = prompt("Enter a new name for your sound clip?");
        if (newClipName !== null) {
          clipLabel.textContent = newClipName;
        } else {
          clipLabel.textContent = existingName;
        }
      };
    };

    mediaRecorder.ondataavailable = (e) => {
      chunks.push(e.data);
    };
  }).catch(err => {
    console.log("The following error occurred: " + err);
  });
} else {
  console.log("getUserMedia not supported on your browser!");
}

function visualize(stream) {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }

  const source = audioCtx.createMediaStreamSource(stream);
  const analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  source.connect(analyser);

  function draw() {
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    requestAnimationFrame(draw);

    analyser.getByteTimeDomainData(dataArray);

    canvasCtx.fillStyle = "rgb(200, 200, 200)";
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = "rgb(0, 0, 0)";
    canvasCtx.beginPath();

    let sliceWidth = WIDTH / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      let v = dataArray[i] / 128.0;
      let y = v * HEIGHT / 2;

      if (i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height / 2);
    canvasCtx.stroke();
  }

  draw();
}

window.onresize = () => {
  canvas.width = mainSection.offsetWidth;
};

window.onresize();

const videoElement = document.querySelector("video")
const startBtn = document.getElementById("startBtn")
const stopBtn = document.getElementById("stopBtn")
const vidSelectBtn = document.getElementById("vidSelectBtn")
vidSelectBtn.onclick = getVideoSources

const { desktopCapturer, remote } = require("electron")
const { Menu, dialog } = remote

async function getVideoSources(){
    const inputSources = await desktopCapturer.getSources({
        types: ["window", "screen"],
    })

    const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map(source => {
          return {
            label: source.name,
            click: () => selectSource(source)
          }
        })
      )

    videoOptionsMenu.popup()
}

let mediaRecorder
let recordedChunks = []

async function selectSource(source) {
    vidSelectBtn.innerText = source.name
    
    const constraints = {
        audio: false,
        video: {
        mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: source.id
            }
        }
    }

    const stream = await navigator.mediaDevices
        .getUserMedia(constraints)

    videoElement.srcObject = stream
    videoElement.play()

    const options = { mimeType: 'video/webm', codecs: 'vp9'}
    mediaRecorder = new MediaRecorder(stream, options)
    mediaRecorder.ondataavailable = handleDataAvailable
    mediaRecorder.onstop = handleStop

    function handleDataAvailable(e) {
        console.log("Video data available")
        recordedChunks.push(e.data)
    }

    const { writeFile } = require("fs")

    startBtn.onclick = e => {
        recordedChunks = []
        mediaRecorder.start()
        startBtn.classList.add('is-danger')
        startBtn.innerText = 'Recording'
      }

    stopBtn.onclick = e => {
        mediaRecorder.stop()
        startBtn.classList.remove('is-danger')
        startBtn.innerText = 'Start'
      }

    async function handleStop(e) {
        console.log("Handling stop")
        const blob = new Blob(recordedChunks, {
            type: "video/webm; codecs=vp9"
        })

        const buffer = Buffer.from(await blob.arrayBuffer())

        const { filePath } = await dialog.showSaveDialog({
            buttonLabel: 'Save video',
            defaultPath: `esr-Video-${Date.now()}.webm`
        })

        console.log(filePath)

        writeFile(filePath, buffer, () => console.log('File successfully saved'))
    }

    
}


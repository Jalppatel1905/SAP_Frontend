import Peer from 'peerjs'
import Network from '../services/Network'
import store from '../stores'
import { setVideoConnected } from '../stores/UserStore'

export default class WebRTC {
  private myPeer: Peer
  private peers = new Map<string, { call: Peer.MediaConnection; video: HTMLVideoElement }>()
  private onCalledPeers = new Map<string, { call: Peer.MediaConnection; video: HTMLVideoElement }>()
  private videoGrid = document.querySelector('.video-grid')
  private buttonGrid = document.querySelector('.button-grid')
  private myVideo = document.createElement('video')
  private myStream?: MediaStream
  private network: Network

  constructor(userId: string, network: Network) {
    const sanitizedId = this.replaceInvalidId(userId)
    this.myPeer = new Peer(sanitizedId)
    this.network = network
    console.log('userId:', userId)
    console.log('sanitizedId:', sanitizedId)
    this.myPeer.on('error', (err) => {
      console.log(err.type)
      console.error(err)
    })

    // mute your own video stream (you don't want to hear yourself)
    this.myVideo.muted = true

    // config peerJS
    this.initialize()
  }

  // PeerJS throws invalid_id error if it contains some characters such as that colyseus generates.
  // https://peerjs.com/docs.html#peer-id
  private replaceInvalidId(userId: string) {
    return userId.replace(/[^0-9a-z]/gi, 'G')
  }

  initialize() {
    this.myPeer.on('call', (call) => {
      if (!this.onCalledPeers.has(call.peer)) {
        call.answer(this.myStream)
        const video = document.createElement('video')
        this.onCalledPeers.set(call.peer, { call, video })

        call.on('stream', (userVideoStream) => {
          this.addVideoStream(video, userVideoStream)
        })
      }
      // on close is triggered manually with deleteOnCalledVideoStream()
    })
  }

  // check if permission has been granted before
  checkPreviousPermission() {
    const permissionName = 'microphone' as PermissionName
    navigator.permissions?.query({ name: permissionName }).then((result) => {
      if (result.state === 'granted') this.getUserMedia(false)
    })
  }

  getUserMedia(alertOnError = true) {
    // ask the browser to get user media
    navigator.mediaDevices
      ?.getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        this.myStream = stream
        this.addVideoStream(this.myVideo, this.myStream)
        this.setUpButtons()
        store.dispatch(setVideoConnected(true))
        this.network.videoConnected()
      })
      .catch((error) => {
        if (alertOnError) window.alert('No webcam or microphone found, or permission is blocked')
      })
  }

  // method to call a peer
  connectToNewUser(userId: string) {
    if (this.myStream) {
      const sanitizedId = this.replaceInvalidId(userId)
      if (!this.peers.has(sanitizedId)) {
        console.log('calling', sanitizedId)
        const call = this.myPeer.call(sanitizedId, this.myStream)
        const video = document.createElement('video')
        this.peers.set(sanitizedId, { call, video })

        call.on('stream', (userVideoStream) => {
          this.addVideoStream(video, userVideoStream)
        })

        // on close is triggered manually with deleteVideoStream()
      }
    }
  }

  // method to add new video stream to videoGrid div
  addVideoStream(video: HTMLVideoElement, stream: MediaStream) {
    video.srcObject = stream
    video.playsInline = true
    video.addEventListener('loadedmetadata', () => {
      video.play()
    })
    if (this.videoGrid) this.videoGrid.append(video)
  }

  // method to remove video stream (when we are the host of the call)
  deleteVideoStream(userId: string) {
    const sanitizedId = this.replaceInvalidId(userId)
    if (this.peers.has(sanitizedId)) {
      const peer = this.peers.get(sanitizedId)
      peer?.call.close()
      peer?.video.remove()
      this.peers.delete(sanitizedId)
    }
  }

  // method to remove video stream (when we are the guest of the call)
  deleteOnCalledVideoStream(userId: string) {
    const sanitizedId = this.replaceInvalidId(userId)
    if (this.onCalledPeers.has(sanitizedId)) {
      const onCalledPeer = this.onCalledPeers.get(sanitizedId)
      onCalledPeer?.call.close()
      onCalledPeer?.video.remove()
      this.onCalledPeers.delete(sanitizedId)
    }
  }

  // method to set up mute/unmute and video on/off buttons
  setUpButtons() {
    // Create a container for buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 15px;
        background: rgba(24, 26, 42, 0.9);
        padding: 10px 20px;
        border-radius: 12px;
        box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3);
    `;

    const createButton = (icon, tooltip, colorOn, colorOff, initialState) => {
        const button = document.createElement('button');
        button.innerHTML = `<i class="fas ${icon}"></i>`;
        button.title = tooltip;
        button.style.cssText = `
            width: 50px; height: 50px; border: none; border-radius: 50%;
            font-size: 18px; color: white; cursor: pointer; transition: background 0.3s ease;
            display: flex; align-items: center; justify-content: center;
            background-color: ${initialState ? colorOn : colorOff};
        `;
        return button;
    };

    const audioButton = createButton("fa-microphone", "Mute", "#4CAF50", "#FF4B4B", true);
    audioButton.addEventListener('click', () => {
        if (this.myStream) {
            const audioTrack = this.myStream.getAudioTracks()[0];
            audioTrack.enabled = !audioTrack.enabled;
            audioButton.innerHTML = `<i class="fas ${audioTrack.enabled ? "fa-microphone" : "fa-microphone-slash"}"></i>`;
            audioButton.title = audioTrack.enabled ? "Mute" : "Unmute";
            audioButton.style.backgroundColor = audioTrack.enabled ? "#4CAF50" : "#FF4B4B";
        }
    });

    const videoButton = createButton("fa-video", "Turn Video Off", "#4CAF50", "#FF4B4B", true);
    videoButton.addEventListener('click', () => {
        if (this.myStream) {
            const videoTrack = this.myStream.getVideoTracks()[0];
            videoTrack.enabled = !videoTrack.enabled;
            videoButton.innerHTML = `<i class="fas ${videoTrack.enabled ? "fa-video" : "fa-video-slash"}"></i>`;
            videoButton.title = videoTrack.enabled ? "Turn Video Off" : "Turn Video On";
            videoButton.style.backgroundColor = videoTrack.enabled ? "#4CAF50" : "#FF4B4B";
        }
    });

    // Append buttons to the container
    buttonContainer.appendChild(audioButton);
    buttonContainer.appendChild(videoButton);

    // Append the container to the body
    document.body.appendChild(buttonContainer);
}
}


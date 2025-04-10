import Peer from 'peerjs'
import Network from '../services/Network'
import store from '../stores'
import { setVideoConnected } from '../stores/UserStore'

export default class WebRTC {
  private myPeer: Peer
  private peers = new Map<string, { call: Peer.MediaConnection; video: HTMLVideoElement }>()
  private onCalledPeers = new Map<string, { call: Peer.MediaConnection; video: HTMLVideoElement }>()
  private videoGrid = document.querySelector('.video-grid')
  private myVideo = document.createElement('video')
  private myStream?: MediaStream
  private network: Network

  constructor(userId: string, network: Network) {
    const sanitizedId = this.replaceInvalidId(userId)
    this.myPeer = new Peer(sanitizedId)
    this.network = network

    this.myVideo.muted = true // Keep user's own video always muted

    this.myPeer.on('error', (err) => {
      console.error('Peer error:', err)
    })

    this.initialize()
  }

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
    })
  }

  checkPreviousPermission() {
    const permissionName = 'microphone' as PermissionName
    navigator.permissions?.query({ name: permissionName }).then((result) => {
      if (result.state === 'granted') this.getUserMedia(false)
    })
  }

  getUserMedia(alertOnError = true) {
    navigator.mediaDevices
      ?.getUserMedia({
        video: true,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
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

  connectToNewUser(userId: string) {
    if (this.myStream) {
      const sanitizedId = this.replaceInvalidId(userId)
      if (!this.peers.has(sanitizedId)) {
        const call = this.myPeer.call(sanitizedId, this.myStream)
        const video = document.createElement('video')
        this.peers.set(sanitizedId, { call, video })

        call.on('stream', (userVideoStream) => {
          this.addVideoStream(video, userVideoStream)
        })
      }
    }
  }

  addVideoStream(video: HTMLVideoElement, stream: MediaStream) {
    video.srcObject = stream
    video.playsInline = true

    // ✅ Only unmute other users' videos, not your own
    video.muted = (video === this.myVideo)

    this.myVideo.style.transform = 'scaleX(-1)'
    this.myVideo.style.objectFit = 'cover'

    video.style.cssText = `
      width: 140px;
      height: 140px;
      object-fit: cover;
      border-radius: 20px;
      margin: 8px;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
      border: 3px solid rgba(255, 255, 255, 0.1);
      transition: all 0.3s ease;
      backdrop-filter: blur(4px);
    `

    video.addEventListener('mouseover', () => {
      video.style.transform = 'scale(1.05)'
      video.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.35)'
    })

    video.addEventListener('mouseout', () => {
      video.style.transform = 'scale(1)'
      video.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.25)'
    })

    video.addEventListener('loadedmetadata', () => {
      video.play()
    })

    if (this.videoGrid) {
      this.videoGrid.style.cssText = `
        display: flex;
        justify-content: center;
        align-items: flex-start;
        gap: 12px;
        padding: 12px;
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        overflow-x: auto;
        white-space: nowrap;
        max-width: 90vw;
      `
      this.videoGrid.append(video)
    }
  }

  deleteVideoStream(userId: string) {
    const sanitizedId = this.replaceInvalidId(userId)
    const peer = this.peers.get(sanitizedId)
    peer?.call.close()
    peer?.video.remove()
    this.peers.delete(sanitizedId)
  }

  deleteOnCalledVideoStream(userId: string) {
    const sanitizedId = this.replaceInvalidId(userId)
    const onCalledPeer = this.onCalledPeers.get(sanitizedId)
    onCalledPeer?.call.close()
    onCalledPeer?.video.remove()
    this.onCalledPeers.delete(sanitizedId)
  }

  setUpButtons() {
    const existingContainer = document.getElementById('webrtc-button-container')
    if (existingContainer) existingContainer.remove()

    const buttonContainer = document.createElement('div')
    buttonContainer.id = 'webrtc-button-container'
    buttonContainer.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 16px;
      padding: 14px 24px;
      background: rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(12px);
      border-radius: 18px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
      z-index: 1000;
    `

    const createButton = (icon: string, tooltip: string, colorOn: string, colorOff: string, initialState: boolean) => {
      const button = document.createElement('button')
      button.innerHTML = `<i class="fas ${icon}"></i>`
      button.title = tooltip
      button.style.cssText = `
        width: 55px;
        height: 55px;
        border-radius: 50%;
        font-size: 22px;
        border: none;
        outline: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.25s ease, transform 0.2s;
        background-color: ${initialState ? colorOn : colorOff};
        color: white;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
      `
      button.onmouseenter = () => (button.style.transform = 'scale(1.1)')
      button.onmouseleave = () => (button.style.transform = 'scale(1)')
      return button
    }

    const audioButton = createButton('fa-microphone', 'Mute/Unmute', '#4CAF50', '#FF4B4B', true)
    audioButton.addEventListener('click', () => {
      if (this.myStream) {
        const audioTrack = this.myStream.getAudioTracks()[0]
        audioTrack.enabled = !audioTrack.enabled
        audioButton.innerHTML = `<i class="fas ${audioTrack.enabled ? 'fa-microphone' : 'fa-microphone-slash'}"></i>`
        audioButton.style.backgroundColor = audioTrack.enabled ? '#4CAF50' : '#FF4B4B'
      }
    })

    const videoButton = createButton('fa-video', 'Turn Video On/Off', '#4CAF50', '#FF4B4B', true)
    videoButton.addEventListener('click', () => {
      if (this.myStream) {
        const videoTrack = this.myStream.getVideoTracks()[0]
        videoTrack.enabled = !videoTrack.enabled
        videoButton.innerHTML = `<i class="fas ${videoTrack.enabled ? 'fa-video' : 'fa-video-slash'}"></i>`
        videoButton.style.backgroundColor = videoTrack.enabled ? '#4CAF50' : '#FF4B4B'
      }
    })

    buttonContainer.append(audioButton, videoButton)
    document.body.appendChild(buttonContainer)
  }
}

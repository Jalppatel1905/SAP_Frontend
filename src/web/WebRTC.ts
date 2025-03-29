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
    console.log('userId:', userId)
    console.log('sanitizedId:', sanitizedId)

    this.myPeer.on('error', (err) => {
      console.log(err.type)
      console.error(err)
    })

    this.myVideo.muted = true
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
      }
    }
  }

  addVideoStream(video: HTMLVideoElement, stream: MediaStream) {
    video.srcObject = stream
    video.playsInline = true
    video.muted = false // Keep the video unmuted for other users
    video.style.transform = 'scaleX(1)' // Fix mirror effect
    this.myVideo.style.transform = 'scaleX(-1)'
    this.myVideo.style.objectFit = 'cover'

    video.addEventListener('loadedmetadata', () => {
      video.play()
    })

    if (this.videoGrid) {
      video.style.cssText = `
        width: 120px;
        height: 120px;
        object-fit: cover;
        border-radius: 16px;
        margin: 0 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      `

      video.addEventListener('mouseover', () => {
        video.style.transform = 'scale(1.05)'
        video.style.boxShadow = '0 6px 18px rgba(0, 0, 0, 0.4)'
      })

      video.addEventListener('mouseout', () => {
        video.style.transform = 'scale(1)'
        video.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)'
      })

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
        box-shadow: none;
      `

      this.videoGrid.append(video)
    }
  }

  deleteVideoStream(userId: string) {
    const sanitizedId = this.replaceInvalidId(userId)
    if (this.peers.has(sanitizedId)) {
      const peer = this.peers.get(sanitizedId)
      peer?.call.close()
      peer?.video.remove()
      this.peers.delete(sanitizedId)
    }
  }

  deleteOnCalledVideoStream(userId: string) {
    const sanitizedId = this.replaceInvalidId(userId)
    if (this.onCalledPeers.has(sanitizedId)) {
      const onCalledPeer = this.onCalledPeers.get(sanitizedId)
      onCalledPeer?.call.close()
      onCalledPeer?.video.remove()
      this.onCalledPeers.delete(sanitizedId)
    }
  }

  setUpButtons() {
    const existingContainer = document.getElementById('webrtc-button-container')
    if (existingContainer) existingContainer.remove()

    const buttonContainer = document.createElement('div')
    buttonContainer.id = 'webrtc-button-container'
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
    `

    const createButton = (icon: string, tooltip: string, colorOn: string, colorOff: string, initialState: boolean) => {
      const button = document.createElement('button')
      button.innerHTML = `<i class="fas ${icon}"></i>`
      button.title = tooltip
      button.style.cssText = `
        width: 50px;
        height: 50px;
        border: none;
        border-radius: 50%;
        font-size: 18px;
        color: white;
        cursor: pointer;
        transition: background 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: ${initialState ? colorOn : colorOff};
      `
      return button
    }

    const audioButton = createButton('fa-microphone', 'Mute', '#4CAF50', '#FF4B4B', true)
    audioButton.addEventListener('click', () => {
      if (this.myStream) {
        const audioTrack = this.myStream.getAudioTracks()[0]
        audioTrack.enabled = !audioTrack.enabled
        audioButton.innerHTML = `<i class="fas ${audioTrack.enabled ? 'fa-microphone' : 'fa-microphone-slash'}"></i>`
        audioButton.style.backgroundColor = audioTrack.enabled ? '#4CAF50' : '#FF4B4B'
      }
    })

    const videoButton = createButton('fa-video', 'Turn Video Off', '#4CAF50', '#FF4B4B', true)
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

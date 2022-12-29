const playIcon = require('./assets/icons/play-icon.png')
const pauseIcon = require('./assets/icons/pause-icon.png')

const totalVideos = 1

let videoSelected = -1  // Starts with no video visible (closed state)
const videos = Array(totalVideos)
const videoButtons = Array(totalVideos)
const videoTextures = Array(totalVideos)

// Permitted colors from the DCB Identity Guide
const PAUSE_PLAY_SELECTED_COLOR = 'rgba(47, 27, 148, 0.75)'  // Tinted Blue
const PAUSE_PLAY_UNSELECTED_COLOR = 'rgba(33, 181, 219, 0.75)'  // Light Cyan
const CLOSED_COLOR = 'rgba(47, 27, 148, 0.75)'  // Tinted Blue
const UNCLOSED_COLOR = 'rgba(33, 181, 219, 0.75)'  // Light Cyan

// Checks if a device is an iPad (or iPad Pro)
// Yoinked from https://stackoverflow.com/a/58979271/18265640
function isIpad() {
  if (/iPad/.test(navigator.platform)) {
    return true
  } else {
    return navigator.maxTouchPoints &&
      navigator.maxTouchPoints > 2 &&
      /MacIntel/.test(navigator.platform)
  }
}

// Correction factor for the world space calculation
function getCorrectionFactor() {
  // Handle different devices (0.65 for iPads, otherwise 0.75)
  if (isIpad()) {
    return 0.65
  } else {
    return 0.75
  }
}

// Yoinked from https://discourse.threejs.org/t/functions-to-calculate-the-visible-width-height-at-a-given-z-depth-from-a-perspective-camera/269
const visibleHeightAtZDepth = (depth, camera) => {
  // compensate for cameras not positioned at z=0
  const cameraOffset = camera.position.z
  if (depth < cameraOffset) depth -= cameraOffset
  else depth += cameraOffset

  // vertical fov in radians
  const vFOV = camera.fov * (Math.PI / 180)

  // Math.abs to ensure the result is always positive
  return 2 * Math.tan(vFOV / 2) * Math.abs(depth) * getCorrectionFactor()
}

const visibleWidthAtZDepth = (depth, camera) => {
  const height = visibleHeightAtZDepth(depth, camera)
  return height * camera.aspect
}

// Positions the alpha video entity on the screen. Automatically calculates
// it to a spot above the video control buttons (id='controlButtonsTable')
function positionVideo(alphaVideoEntity) {
  // Calculate the alpha video dimensions
  const scale = alphaVideoEntity.getAttribute('scale')
  const geometry = alphaVideoEntity.getAttribute('geometry')
  const videoWidth = geometry.width * scale.x
  const videoHeight = geometry.height * scale.y

  // Calculate worldspace dimensions
  const videoZ = alphaVideoEntity.object3D.position.z
  const {camera} = document.getElementById('camera').components.camera
  const worldHeight = visibleHeightAtZDepth(videoZ, camera)
  const worldWidth = visibleWidthAtZDepth(videoZ, camera)

  // Get the height of the video control table, and convert to world dimensions
  const videoControlTable = document.getElementById('controlButtonsTable')
  const controlTableHeight = worldHeight * (videoControlTable.offsetHeight / window.innerHeight)
  
  // Position the video at the bottom left corner of the screen
  // alphaVideoEntity.object3D.position.x = -worldWidth / 2 + videoWidth / 2
  alphaVideoEntity.object3D.position.x = -worldWidth / 1.7 + videoWidth / 2
  alphaVideoEntity.object3D.position.y = -worldHeight / 2 + videoHeight / 2 + controlTableHeight

  // Position the video at the center of the screen
  // alphaVideoEntity.object3D.position.x = 0
  // alphaVideoEntity.object3D.position.y = -worldHeight / 2 + videoHeight / 2 + controlTableHeight
}

// Pauses un-selected videos using the global videoSelected
function pauseUnselectedVideos() {
  for (let i = 0, n = videos.length; i < n; ++i) {
    if (i !== videoSelected) {
      // this video should be paused
      videos[i].pause()
      videoButtons[i].src = playIcon
      videoButtons[i].style.backgroundColor = PAUSE_PLAY_UNSELECTED_COLOR
    }
  }
}

function controlVideo(alphaVideoEntity, videoNum) {
  const video = videos[videoNum]
  video.mute = false
  if (videoSelected === videoNum) {
    // Toggling between pause/play
    if (video.paused) {
      videoButtons[videoNum].src = pauseIcon
      videoButtons[videoNum].style.backgroundColor = PAUSE_PLAY_SELECTED_COLOR
      video.play()
    } else {
      videoButtons[videoNum].src = playIcon
      videoButtons[videoNum].style.backgroundColor = PAUSE_PLAY_UNSELECTED_COLOR
      video.pause()
    }
  } else {
    // Starting to play this video when another was playing (or closed altogether)
    videoSelected = videoNum
    pauseUnselectedVideos()
    video.currentTime = 0

    // Update video texture (there may be a better way since this relies on implementation
    // details of the chromakey shader but this works)
    // See how "videoTexture" was used in https://github.com/nikolaiwarner/aframe-chromakey-material/blob/master/index.js
    alphaVideoEntity.components.material.material.uniforms.texture.value = videoTextures[videoNum]
    positionVideo(alphaVideoEntity)
    alphaVideoEntity.object3D.visible = true
    videoButtons[videoNum].src = pauseIcon
    videoButtons[videoNum].style.backgroundColor = PAUSE_PLAY_SELECTED_COLOR  // cyan highlight color
    document.getElementById('closeVideoButton').style.backgroundColor = UNCLOSED_COLOR    // lightens red highlight from close button if necessary
    video.play()
  }
}

function setUpVideoControls(alphaVideoEntity) {
  // Store the videos
  videos[0] = document.querySelector('#dunbar-welcome-alpha-video')
  //videos[1] = document.querySelector('#dunbar-declaration-alpha-video')
  videoButtons[0] = document.getElementById('welcomeVideoButton')
  // Moving the declaration section to Worldcast audio.
  //videoButtons[1] = document.getElementById('declarationVideoButton')

  // Save the current texture as texture 0 and create new textures for other videos
  // NOTE: the current material in the alphaVideoEntity must have #dunbar-welcome-alpha-video as the src
  videoTextures[0] = alphaVideoEntity.components.material.material.uniforms.texture.value
  for (let i = 1; i < videos.length; ++i) {
    videoTextures[i] = new THREE.VideoTexture(videos[i])
    videoTextures[i].minFilter = THREE.LinearFilter
  }

  for (let i = 0; i < totalVideos; ++i) {
    // Video end listener
    videos[i].addEventListener('ended', (e) => {
      // swap to play icon if they want to replay the video
      videos[i].pause()
      videoButtons[i].src = playIcon
    })

    // Play / pause video click listeners
    videoButtons[i].addEventListener('click', (e) => {
      // Pause/play the welcome video
      controlVideo(alphaVideoEntity, i)
    })
  }

  // Close video click listener
  const closeVideoButton = document.getElementById('closeVideoButton')
  closeVideoButton.addEventListener('click', (e) => {
    // Pause and hide videos
    videoSelected = -1
    pauseUnselectedVideos()
    closeVideoButton.style.backgroundColor = CLOSED_COLOR  // red highlight color
    document.getElementById('alpha-video-entity').object3D.visible = false
  })
}

const videoControlComponent = () => ({
  init() {
    document.getElementById('beginTourButton').addEventListener('click', (e) => {
      document.getElementById('initialPopup').remove()
      document.getElementById('controlButtonsTable').style.visibility = 'visible'  // Make the control table visible
      document.getElementById('tableBackground').style.visibility = 'visible'
      document.getElementById('linkButtonsTable').style.visibility = 'visible'
      setUpVideoControls(this.el)
      controlVideo(this.el, 0)
    })
  },
})

export {videoControlComponent}

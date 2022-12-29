/**
 * Makes the info container fade in
 */
 function fadeInInfo() {
    const imageInfoContainer = document.getElementById('imageInfoContainer')
    imageInfoContainer.className = 'fadeIn'
  }
  
  /**
   * Makes the info container fade out
   */
  function fadeOutInfo() {
    const imageInfoContainer = document.getElementById('imageInfoContainer')
    imageInfoContainer.className = 'fadeOut'
  }
  
  /**
   * Collapses the info container (CODE COPIED FROM HEAD.HTML)
   */
  function collapseInfo() {
    const content = document.getElementById('infoContent')
    const indicator = document.getElementById('expandCollapse')
    content.style.maxHeight = null
    indicator.textContent = '+'
  }
  
  /**
   * Expands the info container (CODE COPIED FROM HEAD.HTML)
   */
  function expandInfo() {
    const content = document.getElementById('infoContent')
    const indicator = document.getElementById('expandCollapse')
    content.style.maxHeight = '50vh'
    indicator.textContent = '–'
  }
  
  /**
   * Converts the rotation to the correct photo number for a metadata
   * with the given number of photos. Rotation is given in radians (0 - 2pi)
   */
  function rotationToPhotoNum(numPhotos, rotation) {
    const twoPi = 2 * Math.PI
    const radPerPhoto = (twoPi) / numPhotos   // angle given to each photo
    rotation += radPerPhoto / 2             // since rotation 0 is head-on, range is (-rpp/2, rpp/2) for photo 0
    
    // Convert the rotation to [0, 2pi)
    rotation = ((rotation % twoPi) + twoPi) % twoPi
    return Math.floor(rotation / radPerPhoto)
  }
  
  // Icon image to place in front of each name in info popup
  const personIconSrc = require('./assets/icons/person-icon.png')
  const locationIconSrc = require('./assets/icons/location-icon.png')
  const calendarIconSrc = require('./assets/icons/calendar-icon.png')
  
  const artGalleryFrameComponent = () => ({
    schema: {
      name: {type: 'string'},
      rotated: {type: 'bool'},
      metadata: {type: 'string'},
    },
    init() {
      const {object3D, sceneEl} = this.el
  
      // Hide the image target until it is found
      object3D.visible = false
  
      // Metadata comes to the primitive as a string, so we parse and destructure it
      this.photoNum = 0;
      const {model, initialRotation, infos} = JSON.parse(this.data.metadata)
      this.infos = infos;   // list of objects with fields "people", "location", "date"
  
      this.frameEl = document.createElement('a-entity')
      this.frameEl.setAttribute('rotation', `0 ${initialRotation} 0`)
      this.frameEl.setAttribute('scale', '1 1 1')
      this.frameEl.setAttribute('gltf-model', model)    // set model to the specified photo prism
      this.frameEl.setAttribute('xrextras-pinch-scale', '')
      this.frameEl.setAttribute('xrextras-one-finger-rotate', '')
  
      if (this.data.rotated) {
        // Rotate the frame for a landscape target
        this.frameEl.setAttribute('rotation', '0 0 90')
      }
      this.el.appendChild(this.frameEl)
  
      // Add tap listener to the image
      this.frameEl.addEventListener('mousedown', (e) => {
        // Update the InfoContainer with the metadata (only if visible)
        // console.log("For model " + model)
        // console.log(object3D.visible)
        if (object3D.visible) {
          this.updateImageInfo()
        }
      })
  
      this.frameEl.addEventListener('mouseup', (e) => {
        // Update the InfoContainer with the metadata (only if visible)
        // console.log("For model " + model)
        // console.log(object3D.visible)
        if (object3D.visible) {
          this.updateImageInfo()
        }
      })
  
  
      // photo.addEventListener('click', (e) => {
      //   // Removing the collapsed class from container triggers a CSS transition to show the content
      //   container.classList.remove('collapsed')
      // })
  
  
      // TODO: Uncomment if we want to display text about the photo outside of the info popup
      // Instantiate the element with information about the painting
      // const infoDisplay = document.createElement('a-entity')
      // infoDisplay.setAttribute('info-display', {title, artist, date})
      // infoDisplay.object3D.position.set(0, this.data.rotated ? -0.4 : -0.5, 0.1)
      // this.el.appendChild(infoDisplay)
  
  
      // showImage handles displaying and moving the virtual object to match the image
      const showImage = ({detail}) => {
        // Updating position/rotation/scale using object3D is more performant than setAttribute
        object3D.position.copy(detail.position)
        // object3D.position.z = -6
        object3D.quaternion.copy(detail.rotation)
        object3D.scale.set(detail.scale, detail.scale, detail.scale)
        object3D.visible = true
        this.frameEl.classList.add('cantap')    // makes raycaster register the model
      }
  
      // hideImage handles hiding the virtual object when the image target is lost
      const hideImage = () => {
        object3D.visible = false
        // set image back to normal size
        this.scale = 1
  
        // Remove tapTarget from clickable objects
        this.frameEl.classList.remove('cantap')
      }
  
      // These events are routed and dispatched by xrextras-generate-image-targets
      this.el.addEventListener('xrimagefound', showImage)
      this.el.addEventListener('xrimageupdated', showImage)
      this.el.addEventListener('xrimagelost', hideImage)
  
      // Display / hide the image information
      this.el.addEventListener('xrimagefound', () => {
        this.showImageInfo()
      })
      this.el.addEventListener('xrimagelost', () => {
        this.hideImageInfo()
      })
    },
  
    showImageInfo() {
      // Update image info
      this.updateImageInfo()
  
      // Re-expand if the content had been expanded when image was lost
      const content = document.getElementById('infoContent')
      if (content.getAttribute('wasexpanded') === 'true') {
        expandInfo()
      }
  
      // Fade in
      fadeInInfo()
    },
  
    hideImageInfo() {
      // Fade out
      fadeOutInfo()
  
      // Collapse the info container at the same time
      collapseInfo()
    },
  
    updateImageInfo() {
      // Get info for correct photo based on object rotation
      const photoNum = rotationToPhotoNum(this.infos.length, this.frameEl.object3D.rotation.y)
      const photoInfo = this.infos[photoNum]
      
      // Update people
      const peopleDiv = document.getElementById('people')
      peopleDiv.innerHTML = ''
      photoInfo.people.forEach((person) => {
        peopleDiv.innerHTML += `<img class="infoIcon" src="${personIconSrc}">`
        peopleDiv.innerHTML += `<span class="infoField">${person}</span>`
        peopleDiv.innerHTML += '<br>'
      })
  
      // Update location, date, photographer, and description
      document.getElementById('location').textContent = photoInfo.location
      // document.getElementById('location').textContent = `Scan num: ${photoInfo.scan}`
      document.getElementById('date').textContent = (photoInfo.date === '') ? 'Unknown' : photoInfo.date
      // document.getElementById('photographer').textContent = photoInfo.photographer
      // document.getElementById('description').textContent = photoInfo.description
    },
  })
  
  // This component uses the A-Frame text component to display information about a painting
  const infoDisplayComponent = () => ({
    schema: {
      title: {default: ''},
      artist: {default: ''},
      date: {default: ''},
    },
    init() {
      // Limit title to 20 characters
      const displayTitle =
        this.data.title.length > 20 ? `${this.data.title.substring(0, 17)}...` : this.data.title
      const text = `${displayTitle}\n${this.data.artist}, ${this.data.date}`
      const textData = {
        align: 'left',
        width: 0.7,
        wrapCount: 22,
        value: text,
        color: 'white',
      }
  
      this.el.setAttribute('text', textData)
  
      // Instantiate a second text object behind the first to achieve an shadow effect
      const textShadowEl = document.createElement('a-entity')
      textData.color = 'black'
      textShadowEl.setAttribute('text', textData)
      textShadowEl.object3D.position.z = -0.01
      this.el.appendChild(textShadowEl)
    },
  })
  
  // xrextras-generate-image-targets uses this primitive to populate multiple image targets
  const artGalleryPrimitive = () => ({
    defaultComponents: {
      artgalleryframe: {},
    },
  
    mappings: {
      name: 'artgalleryframe.name',
      rotated: 'artgalleryframe.rotated',
      metadata: 'artgalleryframe.metadata',
    },
  })
  
  
  // Configure the image targets
  // Not needed because of xrextras-generate-image-targets="primitive: artgallery-frame" in body.html
  
  // XR8.XrController.configure({
  //   disableWorldTracking: true,
  //   imageTargets: ['Image One', 'Image Two', 'Image Three', 'Image Four', 'Image Five'],
  // })
  
  export {artGalleryFrameComponent, infoDisplayComponent, artGalleryPrimitive}
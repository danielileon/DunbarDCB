// Copyright (c) 2021 8th Wall, Inc.
//
// app.js is the main entry point for your 8th Wall app. Code here will execute after head.html
// is loaded, and before body.html is loaded.

import './index.css'

import {
  artGalleryFrameComponent,
  infoDisplayComponent,
  artGalleryPrimitive,
} from './artgallery-components'

import {videoControlComponent} from './video-control-component'
AFRAME.registerComponent('video-control', videoControlComponent())

// Art frame things
AFRAME.registerComponent('artgalleryframe', artGalleryFrameComponent())
AFRAME.registerComponent('info-display', infoDisplayComponent())
AFRAME.registerPrimitive('artgallery-frame', artGalleryPrimitive())
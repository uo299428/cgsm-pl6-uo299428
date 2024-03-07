import * as THREE from 'three';
import WEBGL from 'three/examples/jsm/capabilities/WebGL.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min';
import Stats from 'three/examples/jsm/libs/stats.module';
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls.js';
import adapter from 'webrtc-adapter';
const video = document.querySelector( 'video' );
const constraints = {
  
    audio: false,
    video: { width: { exact: 640 }, height: { exact: 480 } }
};
// navigator.mediaDevices.getUserMedia( constraints )
//     // Called when we get the requested streams
//     .then( ( stream ) => {

//         // Video tracks (usually only one)
//         const videoTracks = stream.getVideoTracks( );
//         console.log( 'Stream characteristics: ', constraints );
//         console.log( 'Using device: ' + videoTracks[0].label );

//         // End of stream handler
//         stream.onended = () => {

//             console.log( 'End of stream' );
//         };

//         // Bind the stream to the html video element
//         video.srcObject = stream;
// })
//     // Called in case of error
//     .catch( ( error ) => {

//         if ( error.name === 'ConstraintNotSatisfiedError' ) {

//             console.error( 'The resolution ' + constraints.video.width.exact + 'x' +
//                           constraints.video.width.exact + ' px is not supported by the camera.' );
//         } else if ( error.name === 'PermissionDeniedError' ) {

//             console.error( 'The user has not allowed the access to the camera and the microphone.' );
//         }
//         console.error( ' Error in getUserMedia: ' + error.name, error );
// });

// const canvas = document.querySelector( 'canvas' );          // Select by element type
// const captureButton = document.getElementById( 'capture' ); // Select by id

// captureButton.addEventListener( 'click', ( event ) => {

//     takepicture( );
// }, false );

// let streaming = false;
// const width = 320;
// let height = 0;  // Computed based on the width

// video.addEventListener( 'canplay', ( event ) => {

//     if ( !streaming ) {  // To prevent re-entry

//         height = video.videoHeight / ( video.videoWidth / width );
//         video.width = width;
//         video.height = height;
//         canvas.width = width;
//         canvas.height = height;
//         streaming = true;
//     }
// }, false );

// function takepicture( ) {

//     canvas.width = width;
//     canvas.height = height;
//     canvas.getContext( '2d' ).drawImage( video, 0, 0, width, height );

//     // Start downloading (thanks to the 'download' attribute of the link)
//     const dataURL = canvas.toDataURL( 'image/png' );
//     captureButton.href = dataURL;
// }

let localStream,            // Local stream
    localPeerConnection,    // RTC local peer
    remotePeerConnection;   // RTC remote peer
const offerOptions = {        // The options to create the offer
    offerToReceiveAudio: true,
    offerToReceiveVideo: true
};

const localVideo = document.getElementById( 'localVideo' );
const remoteVideo = document.getElementById( 'remoteVideo' );
const startButton = document.getElementById( 'startButton' );
const callButton = document.getElementById( 'callButton' );
const hangupButton = document.getElementById( 'hangupButton' );

// Initial state of the buttons
startButton.disabled = false;
callButton.disabled = true;
hangupButton.disabled = true;

// Call handlers
startButton.onclick = start;
callButton.onclick = call;
hangupButton.onclick = hangup;
function start(){
    navigator.mediaDevices.getUserMedia( constraints )
    // Called when we get the requested streams
    .then( ( stream ) => {

        // Video tracks (usually only one)
        const videoTracks = stream.getVideoTracks( );
        console.log( 'Stream characteristics: ', constraints );
        console.log( 'Using device: ' + videoTracks[0].label );

        // End of stream handler
        stream.onended = () => {

            console.log( 'End of stream' );
        };

        // Bind the stream to the html video element
        video.srcObject = stream;
        localStream  = stream; 
})
    // Called in case of error
    .catch( ( error ) => {

        if ( error.name === 'ConstraintNotSatisfiedError' ) {

            console.error( 'The resolution ' + constraints.video.width.exact + 'x' +
                          constraints.video.width.exact + ' px is not supported by the camera.' );
        } else if ( error.name === 'PermissionDeniedError' ) {

            console.error( 'The user has not allowed the access to the camera and the microphone.' );
        }
        console.error( ' Error in getUserMedia: ' + error.name, error );
});
startButton.disabled = true;
callButton.disabled = false;
}

function call(){
    // TODO: Update UI (state of the buttons)
callButton.disabled =true;
hangupButton.disabled = false;
// No STUN/TURN servers
const servers = null;

// Local peer of the connection (caller)
//   - create the local peer
//   - bind the handler for receiving ICE candidates
localPeerConnection = new RTCPeerConnection( servers );
localPeerConnection.onicecandidate = gotLocalIceCandidate;

// The same for the remote peer (callee)
// We are calling ourselves
//    - create the remote peer
//    - bind the handler for receiving ICE candidates
//    - bind the handler for receiving the counterpart stream
remotePeerConnection = new RTCPeerConnection( servers );
remotePeerConnection.onicecandidate = gotRemoteIceCandidate;
remotePeerConnection.ontrack = gotRemoteTrack;

// Add local stream to the connection. This will trigger the onaddstream event
// in the other side (the remote, callee)
localStream.getTracks().forEach( track => localPeerConnection.addTrack( track, localStream ) );

// Start negotiation: the description depends on the streams added to the connection
// This description is requested asynchronously
localPeerConnection.createOffer( offerOptions ).then( gotLocalDescription );
}

function gotLocalDescription( description ){

    // The multimedia configuration offered by the caller (local peer) is received
    localPeerConnection.setLocalDescription( description );

    //
    // This description (offer) would be sent using some signaling mechanism to the other side
    //

    // Remote peer received the offer from the caller
    remotePeerConnection.setRemoteDescription( description );
    // Create an answer for the offer
    remotePeerConnection.createAnswer( ).then( gotRemoteDescription );
}
function gotRemoteDescription( description ){

    // The multimedia configuration as an answer for the offer y received
    remotePeerConnection.setLocalDescription( description );

    //
    // This answer would be sent using some signaling mechanism to the other side
    //

    localPeerConnection.setRemoteDescription( description );
}
function gotLocalIceCandidate( event ){

    // New ICE candidate
    if (event.candidate) {

        remotePeerConnection.addIceCandidate( new RTCIceCandidate( event.candidate ) );
  }
}

function gotRemoteIceCandidate( event ){

    // New ICE candidate
    if (event.candidate) {

        localPeerConnection.addIceCandidate( new RTCIceCandidate( event.candidate ) );
  }
}
function gotRemoteTrack( event ){

    // New remote stream
    remoteVideo.srcObject = event.streams[0];
}
function hangup(){
    localPeerConnection.close();    // RTC local peer
    remotePeerConnection.close();
    callButton.disabled = false;
    hangupButton.disabled = true;
}
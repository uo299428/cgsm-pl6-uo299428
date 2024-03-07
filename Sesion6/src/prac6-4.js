import * as THREE from 'three';
import WEBGL from 'three/examples/jsm/capabilities/WebGL.js';

import adapter from 'webrtc-adapter';

if ( WEBGL.isWebGLAvailable() ) {
    // WebGL is available
    console.log('soporta')
    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer( {antialias: true} );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );
    const camera = new THREE.PerspectiveCamera ( 45, window.innerWidth / window.innerHeight, 1, 4000 );
    camera.position.set( 0, 0, 700 );
    



    const video = document.querySelector( 'video' );
const constraints = {
  
    audio: false,
    video: { width: { exact: 640 }, height: { exact: 480 } }
};
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

    const image = document.createElement( 'canvas' );
    image.width = 640;  // Video width
    image.height = 480; // Video height
    const imageContext = image.getContext( '2d' );
    imageContext.fillStyle = '#000000';
    imageContext.fillRect( 0, 0, image.width - 1, image.height - 1 );
    const texture = new THREE.Texture( image );

    const material = new THREE.MeshBasicMaterial( { map: texture } );
    const wall = new THREE.Mesh( new THREE.PlaneGeometry( image.width, image.height, 4, 4 ), material );


    

    //  Light
     const light = new THREE.PointLight(0xffffff, 10, 0, 0);
     light.position.set(0, 0, 200);
     scene.add( light );
    scene.add( wall );
    renderer.render( scene, camera );


    const clock = new THREE.Clock( );
    rotate();

    

    function rotate( ) {

        const delta = clock.getDelta( ); // Elapsed time in seconds

        // UPDATE THE SCENE ACCORDING TO THE ELAPSED TIME
        const rotation = ( delta * Math.PI * 2 ) / 24;
        wall.rotation.y += rotation;
        
        if ( video.readyState === video.HAVE_ENOUGH_DATA ) {

            imageContext.drawImage( video, 0, 0 );
            if ( texture ) texture.needsUpdate = true;
        }

        // Render the scene
        renderer.render( scene, camera );

        // Request the browser to execute the animation-rendering loop
        requestAnimationFrame( rotate );
    };


    window.addEventListener( 'resize', ( ) => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix( );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.render( scene, camera );
}, false );
}

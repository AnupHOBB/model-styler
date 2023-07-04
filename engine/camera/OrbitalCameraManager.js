import * as THREE from 'three'
import { CameraManager, PerspectiveCamera } from './CameraManager.js'
import { OrbitControl } from '../OrbitControl.js'

/**
 * Wraps OrbitalCameraManagerCore object.
 */
export class OrbitalCameraManager extends CameraManager
{
    /**
     * @param {String} name name of the object which is used in sending or receiving message
     * @param {Number} fov camera field of view
     * @param {THREE.Vector3} axis orbit axis
     * @param {THREE.Vector3} lookAtPosition point to focus on during orbit
     */
    constructor(name, fov, lookAtPosition) 
    { 
        super(name)
        this.core = new OrbitalCameraManagerCore(fov, lookAtPosition) 
    }

    /**
     * Delegates call to the register input function of OrbitalCameraManagerCore
     * @param {InputManager} inputManager the input manager object that manages user input 
     */
    registerInput(inputManager) { this.core.registerInput(inputManager) }
    
    /**
     * Sets the position of the camera in world space
     * @param {Number} x x-coordinate in world space
     * @param {Number} y y-coordinate in world space
     * @param {Number} z z-coordinate in world space 
     */
    setPosition(x, y, z) { this.core.setPosition(x, y, z) }

    /**
     * Sets the rotation of the camera in world space
     * @param {Number} x x-coordinate in world space
     * @param {Number} y y-coordinate in world space
     * @param {Number} z z-coordinate in world space 
     */
    setRotation(x, y, z) { this.core.setRotation(x, y, z) }
    
    /**
     * Returns world space position of the camera
     * @returns {THREE.Vector3} world space position of camera 
     */
    getPosition() { return this.core.getPosition() }

    /**
     * Sets the aspect ratio value in camera
     * @param {Number} ratio camera aspect ratio
     */
    setAspectRatio(ratio) { this.core.camera.aspect = ratio }

    /**
     * Delegates call to OrbitalCameraManagerCore's updateMatrices
     */
    updateMatrices() { this.core.updateMatrices() }
    
    /**
     * Delegates call to OrbitalCameraManagerCore's worldToRaster
     * @param {THREE.Vector3} worldPosition position of point in world whose raster coordinate is required
     * @returns {[THREE.Vector2, Boolean]} [raster coordinate of the point whose world coordinate was given, 
     * boolean value to indicate whether the raster coordinate is valid or not]
     */
    worldToRaster(worldPosition) { return this.core.worldToRaster(worldPosition) }

    /**
     * Delegates call to OrbitalCameraManagerCore's worldToView
     * @param {THREE.Vector3} worldPosition position of point in world whose view space coordinate is required
     * @returns {THREE.Vector3} position of point in view space whose world coordinate was given
     */
    worldToView(worldPosition) { return this.core.worldToView(worldPosition) }

    /**
     * Returns the threejs camera object stored within
     * @returns {THREE.PerspectiveCamera} threejs camera object
     */
    getCamera() { return this.core.camera }

    /**
     * Adds a restriction to the orbit movement in yaw direction
     * @param {Function} restriction callback function that decides if the object position should be updated
     */
    addYawRestriction(restriction) { this.core.addYawRestriction(restriction) }

    /**
     * Adds a restriction to the orbit movement in pitch direction
     * @param {Function} restriction callback function that decides if the object position should be updated
     */
    addPitchRestriction(restriction) { this.core.addPitchRestriction(restriction) }

    /**
     * Called by SceneManager when there is a message for this object posted by any other object registered in SceneManager.
     * However, this function only delegates call to OrbitalCameraManagerCore's onMessage.
     * @param {SceneManager} sceneManager the SceneManager object
     * @param {String} senderName name of the object who posted the message
     * @param {any} data any object sent as part of the message
     */
    onMessage(sceneManager, senderName, data) { this.core.onMessage(sceneManager, senderName, data) }

    /**
     * Called by SceneManager when this camera object is set as active.
     * However, this function only delegates call to OrbitalCameraManagerCore's onActive.
     * @param {SceneManager} sceneManager the SceneManager object
     */
    onActive(sceneManager) { this.core.onActive(sceneManager, this.name) }

    /**
     * Returns a boolean value that indicates whether the camera is zoomed in or not,
     * @returns {Boolean} the zoom status of camera
     */
    isZoomed() { return this.core.zoom }
}

/**
 * Extends the functionality of PerspectiveCameraManager to provide orbital camera feature
 */
class OrbitalCameraManagerCore extends PerspectiveCamera
{
    /**
     * @param {Number} fov camera field of view
     * @param {THREE.Vector3} axis orbit axis
     * @param {THREE.Vector3} lookAt point to focus on during orbit
     */
    constructor(fov, lookAt)
    {
        super(fov)
        this.orbitSpeed = 60
        this.cameraOrbiterYaw = new OrbitControl(this.camera, lookAt)
        this.cameraOrbiterPitch = new OrbitControl(this.camera, lookAt)
        this.ogPosition = this.camera.position
        this.vDisplacement = new THREE.Vector3()
        this.sourcePosition = this.camera.position
        this.targetPosition = this.camera.position
        this.targetDistance = 0
        this.autoOrbiting = false
    }

    /**
     * Used to register inputs
     * @param {InputManager} inputManager the input manager object that manages user input 
     */
    registerInput(inputManager) 
    {
        inputManager.registerMoveEvent((dx, dy) => this.onMoveEvent(dx, dy))
        inputManager.setCursorSensitivity(0.5)
    }

    /**
     * Adds a restriction to the orbit movement in yaw direction
     * @param {Function} restriction callback function that decides if the object position should be updated
     */
    addYawRestriction(restriction) { this.cameraOrbiterYaw.addRestriction(restriction) }

    /**
     * Adds a restriction to the orbit movement in pitch direction
     * @param {Function} restriction callback function that decides if the object position should be updated
     */
    addPitchRestriction(restriction) { this.cameraOrbiterPitch.addRestriction(restriction) }

    /**
     * Called by OrbitCameraManager when this camera object is set as active.
     * Once its active, it broadcasts message to input manger demanding for its instance.
     * @param {SceneManager} sceneManager the SceneManager object
     */
    onActive(sceneManager, myName) { sceneManager.broadcastTo(myName, 'Input', null) }

    /**
     * Called by InputManager whenever it detects mouse movement. This function is only called
     * when the user holds LMB or RMB and moves the mouse.
     * This function rotates the the camera around based on mouse movement.
     * @param {Number} deltaX displacement of cursor in x-direction
     * @param {Number} deltaY displacement of cursor in y-direction
     * @param {Number} x position of cursor in x-axis
     * @param {Number} y position of cursor in y-axis
     */
    onMoveEvent(deltaX, deltaY, x, y) 
    { 
        this.cameraOrbiterYaw.pan(new THREE.Vector3(0, 1, 0), -deltaX) 
        this.cameraOrbiterPitch.pan(this.right, -deltaY)
    }
}
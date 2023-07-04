import * as THREE from 'three'
import { CameraManager, PerspectiveCamera } from './CameraManager.js'
import { Maths } from '../helpers/maths.js'

/**
 * Wraps FirstPersonCameraManagerCore object.
 */
export class FirstPersonCameraManager extends CameraManager
{
    /**
     * @param {String} name name of the object which is used in sending or receiving message
     * @param {Number} fov camera field of view
     */
    constructor(name, fov) 
    { 
        super(name)
        this.core = new FirstPersonCameraManagerCore(fov) 
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
     * Delegates call to FirstPersonCameraManagerCore's updateMatrices
     */
    updateMatrices() { this.core.updateMatrices() }
    
    /**
     * Delegates call to FirstPersonCameraManagerCore's worldToRaster
     * @param {THREE.Vector3} worldPosition position of point in world whose raster coordinate is required
     * @returns {[THREE.Vector2, Boolean]} [raster coordinate of the point whose world coordinate was given, 
     * boolean value to indicate whether the raster coordinate is valid or not]
     */
    worldToRaster(worldPosition) { return this.core.worldToRaster(worldPosition) }

    /**
     * Delegates call to FirstPersonCameraManagerCore's worldToView
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
     * Called by SceneManager when there is a message for this object posted by any other object registered in SceneManager.
     * However, this function only delegates call to FirstPersonCameraManagerCore's onMessage.
     * @param {SceneManager} sceneManager the SceneManager object
     * @param {String} senderName name of the object who posted the message
     * @param {any} data any object sent as part of the message
     */
    onMessage(sceneManager, senderName, data) { this.core.onMessage(sceneManager, senderName, data) }

    /**
     * Called by SceneManager when this camera object is set as active.
     * However, this function only delegates call to FirstPersonCameraManagerCore's onActive.
     * @param {SceneManager} sceneManager the SceneManager object
     */
    onActive(sceneManager) { this.core.onActive(sceneManager, this.name) }
}

/**
 * Extends the functionality of PerspectiveCameraManager to provide first person camera feature
 */
class FirstPersonCameraManagerCore extends PerspectiveCamera
{
    /**
     * @param {Number} fov camera field of view
     */
    constructor(fov) { super(fov) }

    /**
     * Used to register inputs
     * @param {InputManager} inputManager the input manager object that manages user input 
     */
    registerInput(inputManager)  
    {
        inputManager.registerKeyEvent((w,s,a,d)=>this.onKeyinput(w,s,a,d))
        inputManager.registerMoveEvent((dx, dy) => this.onMoveEvent(dx, dy))
        inputManager.setCursorSensitivity(0.05) 
    }

    /**
     * Called by FirstPersonCameraManager when this camera object is set as active.
     * Once its active, it broadcasts message to input manger demanding for its instance.
     * @param {SceneManager} sceneManager the SceneManager object
     */
    onActive(sceneManager, myName) { sceneManager.broadcastTo(myName, 'Input', null) }

    /**
     * Called by InputManager whenever it detects key strokes.
     * This function moves the camera around based on user input.
     * @param {Map} keyMap map consisting of keys that are currently being pressed by user
     */
    onKeyinput(keyMap) 
    {
        let scale = 0.1
        let front = new THREE.Vector3()
        this.camera.getWorldDirection(front)
        let right = Maths.cross(front, new THREE.Vector3(0, 1, 0))
        let newPosition = new THREE.Vector3()
        front = new THREE.Vector3(front.x * scale, front.y * scale, front.z * scale)
        right = new THREE.Vector3(right.x * scale, right.y * scale, right.z * scale)
        if (keyMap.get('w') != undefined)
        {
            newPosition = Maths.addVectors(this.camera.position, front)
            this.camera.position.set(newPosition.x, newPosition.y, newPosition.z)
        }
        if (keyMap.get('s') != undefined)
        {
            newPosition = Maths.subtractVectors(this.camera.position, front)
            this.camera.position.set(newPosition.x, newPosition.y, newPosition.z)
        }
        if (keyMap.get('a') != undefined)
        {
            newPosition = Maths.subtractVectors(this.camera.position, right)
            this.camera.position.set(newPosition.x, newPosition.y, newPosition.z)
        }
        if (keyMap.get('d') != undefined)
        {
            newPosition = Maths.addVectors(this.camera.position, right)
            this.camera.position.set(newPosition.x, newPosition.y, newPosition.z)
        }
    }

    /**
     * Called by InputManager whenever it detects mouse movement. This function is only called when the user holds LMB or RMB and moves the mouse.
     * This function rotates the the camera around based on mouse movement.
     * @param {Number} deltaX displacement of cursor in x-direction
     * @param {Number} deltaY displacement of cursor in y-direction
     * @param {Number} x position of cursor in x-axis
     * @param {Number} y position of cursor in y-axis
     */
    onMoveEvent(deltaX, deltaY, x, y)
    {
        let pitchDeg = Maths.toDegrees(this.camera.rotation.x - deltaY)
        if (pitchDeg > -85 && pitchDeg < 85)
            this.camera.rotation.x -= deltaY
        this.camera.rotation.y -= deltaX
    }
}
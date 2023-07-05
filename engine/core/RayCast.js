import * as THREE from 'three'

/**
 * Responsible for raycasting. Ray casting is done here in world space.
 */
export class RayCast
{
    constructor()
    {
        this.raycaster = new THREE.Raycaster()
        this.raycastObjectMap = new Map()
        this.raycastObjects = []
    }

    /**
     * Adds scene objects for ray casting
     * @param {String} name name of the scene object
     * @param {THREE.Object3D} raycastObject the object itself
     */
    add(name, raycastObject) 
    { 
        let objects = this.raycastObjectMap.get(name)
        if (objects != undefined)
            objects.push(raycastObject)
        else
            this.raycastObjectMap.set(name, [raycastObject])
        this.raycastObjects.push(raycastObject)
    }

    /**
     * Adds scene objects for ray casting
     * @param {String} name name of the scene object
     */
    remove(name) 
    { 
        let objects = this.raycastObjectMap.get(name)
        if (objects != undefined)
        {
            for (let raycastObject of objects)
                this.raycastObjects.splice(this.raycastObjects.indexOf(raycastObject), 1)
            this.raycastObjects = Array.from(this.raycastObjectMap.values())
        }
    }

    /**
     * Raycasts among objects and returns the array of hit point data.
     * @param {THREE.Vector2} ndcCoord 2D coordinates in normalized device coordinates (NDC)---X and Y components should be between -1 and 1.
     * @param {CameraManager} cameraManager BaseCameraManager object
     * @returns {any} object that holds the intersection data of all the hit objects
     */
    raycastFromCamera(ndcCoord, cameraManager)
    {
        this.raycaster.setFromCamera(ndcCoord, cameraManager.getCamera())
        let hitObjects = this.raycaster.intersectObjects(this.raycastObjects)
        return (hitObjects.length > 0) ? hitObjects : []
    }

    /**
     * Raycasts among objects from origin and along the direction and returns the array of hit point data.
     * @param {THREE.Vector3} origin ray origin
     * @param {THREE.Vector3} direction ray direction
     * @returns {any} object that holds the intersection data of all the hit objects
     */
    raycast(origin, direction)
    {
        this.raycaster.set(origin, direction)
        let hitObjects = this.raycaster.intersectObjects(this.raycastObjects)
        return (hitObjects.length > 0) ? hitObjects : []
    }
}
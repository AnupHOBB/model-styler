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
     * Raycasts among objects and returns the hit point.
     * @param {THREE.Vector2} rasterCoord raster coordinate that is used as the ray cast origin point
     * @param {CameraManager} cameraManager BaseCameraManager object
     * @returns {any} object that holds the intersection data of all the hit objects
     */
    raycast(rasterCoord, cameraManager)
    {
        let screenSpaceX = (rasterCoord.x / window.innerWidth) *  2 - 1
        let screenSpaceY = -(rasterCoord.y / window.innerHeight) *  2 + 1
        this.raycaster.setFromCamera({ x: screenSpaceX, y: screenSpaceY }, cameraManager.getCamera())
        let hitObjects = this.raycaster.intersectObjects(this.raycastObjects)
        return (hitObjects.length > 0) ? hitObjects : []
    }
}
import * as THREE from 'three'
import { EffectComposer } from '../../node_modules/three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from '../../node_modules/three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from '../../node_modules/three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { PixelAdderPass } from './pass/PixelAdderPass.js'
import { PixelMergerPass } from './pass/PixelMergerPass.js'
import { SaturationPass } from './pass/SaturationPass.js'
import { BrightnessPass } from './pass/BrightnessPass.js'
import { ContrastPass } from './pass/ContrastPass.js'
import { GammaCorrectionPass } from './pass/GammaCorrectionPass.js'
import { SharpnessPass } from './pass/SharpnessPass.js'
import { ColorBalancePass } from './pass/ColorBalancePass.js'
import { ShaderPass } from '../../node_modules/three/examples/jsm/postprocessing/ShaderPass.js'
import { SSAOPass } from '../../node_modules/three/examples/jsm/postprocessing/SSAOPass.js'
import { SSAARenderPass } from '../../node_modules/three/examples/jsm/postprocessing/SSAARenderPass.js'
import { FXAAShader } from '../../node_modules/three/examples/jsm/shaders/FXAAShader.js'
import { Misc } from '../helpers/misc.js'
import { Stats } from './Stats.js'

/**
 * Wraps SceneRendererCore object
 */
export class SceneRenderer
{
    /**
     * @param {HTMLCanvasElement} canvas HTML canvas element
     */
    constructor(canvas) { this.core = new SceneRendererCore(canvas) }

    /**
     * Delegates call to SceneRendererCore add
     * @param {String} name name of the sceneObject that is registered in the scene manager.
     * @param {THREE.Object3D} threeJsObject the threejsobject to be rendered or included in the threejs scene
     * @param {Boolean} isLuminant if true then the objet3D will be rendered with bloom effect
     */
    add(name, threeJsObject, isLuminant) { this.core.add(name, threeJsObject, isLuminant) }

    /**
     * Delegates call to SceneRendererCore remove
     * @param {String} name name of the sceneObject that is registered in the scene manager.
     */
    remove(name) { this.core.remove(name) }

    /**
     * Delegates call to SceneRendererCore setup
     * @param {THREE.Camera} threeJsCamera threejs camera object
     */
    setup(threeJsCamera) { this.core.setup(threeJsCamera) }

    /**
     * Delegates call to SceneRendererCore shouldPause
     * @param {Boolean} pause if true then the render loop will stop
     */
    shouldPause(pause) { this.core.shouldPause(pause) }

    setEnvironmentMap(envmap) { this.core.setEnvironmentMap(envmap) }

    setBloomPercentage(percent) { this.core.setBloomPercentage(percent) }

    setBloomIntensity(intensity) { this.core.setBloomIntensity(intensity) }

    setBloomThreshold(threshold) { this.core.setBloomThreshold(threshold) }

    setBloomRadius(radius) { this.core.setBloomRadius(radius) }

    enableSSAO(enable) { this.core.enableSSAO(enable) }

    setSSAORadius(radius) { this.core.setSSAORadius(radius) }

    setSSAOMinDistance(minDist) { this.core.setSSAOMinDistance(minDist) }

    setSSAOMaxDistance(maxDist) { this.core.setSSAOMaxDistance(maxDist) }

    setSSAOShowAOMap(show) { this.core.setSSAOShowAOMap(show) }

    setSSAOShowNormalMap(show) { this.core.setSSAOShowNormalMap(show) }

    setSharpness(sharpness) { this.core.setSharpness(sharpness) }

    enableFXAA(enable) { this.core.enableFXAA(enable) }

    enableSSAA(enable) { this.core.enableSSAA(enable) }

    setSSAASampleLevel(samplelevel) { this.core.setSSAASampleLevel(samplelevel) }

    setShadowsColorBalance(shadowsRgb) { this.core.setShadowsColorBalance(shadowsRgb) }

    setMidtonesColorBalance(midtonesRgb) { this.core.setMidtonesColorBalance(midtonesRgb) }

    setHighlightsColorBalance(highlightsRgb) { this.core.setHighlightsColorBalance(highlightsRgb) }

    setToneMapping(toneMapping) { this.core.setToneMapping(toneMapping) }

    setExposure(exposure) { this.core.setExposure(exposure) }

    setSaturation(saturation) { this.core.setSaturation(saturation) }

    setContrast(contrast) { this.core.setContrast(contrast) }
    
    setBrightness(brightness) { this.core.setBrightness(brightness) }

    setGamma(gamma) { this.core.setGamma(gamma) }

    showStats(htmlElement) { this.core.showStats(htmlElement) }
    
    /**
     * Delegates call to SceneRendererCore render
     */
    render() { this.core.render() }
}

/**
 * Responsible for rendering the overall scene
 */
class SceneRendererCore
{
    /**
     * @param {HTMLCanvasElement} canvas HTML canvas element
     */
    constructor(canvas)
    {
        this.shouldRender = false
        this.scene = new THREE.Scene()
        this.renderer = new THREE.WebGLRenderer({canvas, alpha: true})
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
        this.renderer.toneMapping = THREE.LinearToneMapping
        this.renderer.toneMappingExposure = 1
        this.bloomObjects = []
        this.mainSceneObjects = []
        this.dataMap = new Map()

        this.bloomComposer = new EffectComposer(this.renderer)
        this.bloomComposer.renderToScreen = false
        this.ssaoComposer = new EffectComposer(this.renderer)
        this.ssaoComposer.renderToScreen = false
        this.ssrComposer = new EffectComposer(this.renderer)
        this.ssrComposer.renderToScreen = false
        this.sceneRenderComposer = new EffectComposer(this.renderer)
        this.sceneRenderComposer.renderToScreen = false
        this.finalComposer = new EffectComposer(this.renderer)

        this.bloomIntensity = 0
        this.bloomPercent = 1
        this.sceneBloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), this.bloomIntensity, 0, 0)
        this.renderPass = null
        this.ssaoPass = null
        this.ssaaPass = null
        this.pixelMergerPass = new PixelMergerPass(this.sceneRenderComposer.readBuffer.texture, this.ssaoComposer.readBuffer.texture)
        this.saturationPass = new SaturationPass(1)
        this.contrastPass = new ContrastPass(0)
        this.brightnessPass = new BrightnessPass(0)
        this.sharpnessPass = new SharpnessPass(0.2)
        this.fxaaPass = new ShaderPass(new THREE.ShaderMaterial(FXAAShader))
        this.colorBalancePass = new ColorBalancePass(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3())
        this.gammaPass = new GammaCorrectionPass(2.2)
        this.bloomComposer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 3, 1, 0))
        this.sceneRenderComposer.addPass(this.sceneBloomPass)
        this.finalComposer.addPass(this.pixelMergerPass)
        this.finalComposer.addPass(new PixelAdderPass(null, this.bloomComposer.readBuffer.texture, 1, 3))
        this.finalComposer.addPass(this.saturationPass)
        this.finalComposer.addPass(this.contrastPass)
        this.finalComposer.addPass(this.brightnessPass)
        this.finalComposer.addPass(this.sharpnessPass)
        this.finalComposer.addPass(this.fxaaPass)
        this.finalComposer.addPass(this.colorBalancePass)
        this.finalComposer.addPass(this.gammaPass)
        this.groundReflector = null
        this.envmap = new THREE.Color(1, 1, 1)
        this.fxaaEnabled = true
        this.ssaaEnabled = false
        this.ssaoEnabled = true
        this.blackMaterial = new THREE.MeshBasicMaterial({color: new THREE.Color(0, 0, 0)})

        this.stats = null
    }

    setEnvironmentMap(envmap)
    {
        envmap.mapping = THREE.EquirectangularReflectionMapping
        this.envmap = envmap
    }

    setBloomPercentage(percent) 
    {
        this.bloomPercent = percent
        this.sceneBloomPass.strength = this.bloomIntensity * this.bloomPercent 
    }

    setBloomIntensity(intensity) 
    {
        this.bloomIntensity = intensity 
        this.sceneBloomPass.strength = this.bloomIntensity * this.bloomPercent  
    }

    setBloomThreshold(threshold) { this.sceneBloomPass.threshold = threshold }

    setBloomRadius(radius) { this.sceneBloomPass.radius = radius }

    enableSSAO(enable) 
    { 
        this.ssaoEnabled = enable
        this.pixelMergerPass.enableMerge(enable) 
    }

    setSSAORadius(radius) { this.ssaoPass.kernelRadius = radius }

    setSSAOMinDistance(minDist) { this.ssaoPass.minDistance = minDist }

    setSSAOMaxDistance(maxDist) { this.ssaoPass.maxDistance = maxDist }

    setSSAOShowAOMap(show) 
    {
        if (this.ssaoPass.output != SSAOPass.OUTPUT.Blur)
            this.ssaoPass.output = SSAOPass.OUTPUT.Blur
        this.pixelMergerPass.showAOMap(show) 
    }

    setSSAOShowNormalMap(show) 
    { 
        this.ssaoPass.output = (show) ? SSAOPass.OUTPUT.Normal : SSAOPass.OUTPUT.Blur
        this.pixelMergerPass.showAOMap(show) 
    }

    setSharpness(sharpness) { this.sharpnessPass.setSharpness(sharpness) }

    setGamma(gamma) { this.gammaPass.setGamma(gamma) }

    enableFXAA(enable)
    {
        if (enable && !this.fxaaEnabled)
        {
            let fxaaIndex = this.finalComposer.passes.length - 2
            this.finalComposer.insertPass(this.fxaaPass, fxaaIndex)
            this.fxaaEnabled = true
        }
        else if (!enable && this.fxaaEnabled)
        {    
            this.finalComposer.removePass(this.fxaaPass)
            this.fxaaEnabled = false
        }
    }

    enableSSAA(enable)
    {
        if (enable && !this.ssaaEnabled)
        {
            this.sceneRenderComposer.removePass(this.renderPass)
            this.sceneRenderComposer.insertPass(this.ssaaPass, 0)
            this.ssaaEnabled = true
        }
        else if (!enable && this.ssaaEnabled)
        {
            this.sceneRenderComposer.removePass(this.ssaaPass)
            this.sceneRenderComposer.insertPass(this.renderPass, 0)
            this.ssaaEnabled = false
        }
        this.finalComposer.removePass(this.pixelMergerPass)
        this.pixelMergerPass = new PixelMergerPass(this.sceneRenderComposer.readBuffer.texture, this.ssaoComposer.readBuffer.texture)
        this.finalComposer.insertPass(this.pixelMergerPass, 0)
    }

    setSSAASampleLevel(samplelevel) { this.ssaaPass.sampleLevel = samplelevel }

    setShadowsColorBalance(shadowsRgb) { this.colorBalancePass.setShadows(shadowsRgb) }

    setMidtonesColorBalance(midtonesRgb) { this.colorBalancePass.setMidtones(midtonesRgb) }

    setHighlightsColorBalance(highlightsRgb) { this.colorBalancePass.setHighlights(highlightsRgb) }

    setToneMapping(toneMapping) { this.renderer.toneMapping = toneMapping }

    setExposure(exposure) { this.renderer.toneMappingExposure = exposure }

    setSaturation(saturation) { this.saturationPass.setSaturation(saturation) }

    setContrast(contrast) { this.contrastPass.setContrast(contrast) }
    
    setBrightness(brightness) { this.brightnessPass.setBrightness(brightness) }

    showStats(htmlElement) { this.stats = new Stats(this.renderer, htmlElement) }

    /**
     * This function adds the threejs object based on its properties. If the threejs object is light, then it will be
     * included in the threejs scene directly. If the threejs object is a luminant mesh, then the threejs object will 
     * be stored in bloomObjects array for rendering later. And if threejs object is a non-luminant mesh, then the 
     * threejs object will be directly added to the scene and also will be stored in mainSceneObjects array for later use.
     * @param {String} name name of the sceneObject that is registered in the scene manager.
     * @param {THREE.Object3D} threeJsObject the threejsobject to be rendered or included in the threejs scene
     * @param {Boolean} isLuminant if true then the objet3D will be rendered with bloom effect
     */
    add(threeJsObject, isLuminant)
    {
        if (threeJsObject.isLight != undefined)  
            this.addToScene(threeJsObject)
        else
        {
            if (isLuminant)
                this.bloomObjects.push(threeJsObject)
            else
            {    
                Misc.postOrderTraversal(threeJsObject, obj=>{
                    if (obj.material != undefined)
                        this.dataMap.set(obj.uuid, { material: obj.material, visibility: obj.visible }) 
                })
                this.mainSceneObjects.push(threeJsObject)
                this.addToScene(threeJsObject)
            }
        }
    }

    /**
     * Removes the threejs object from the scene and the array in which it is stored.
     * @param {String} name name of the sceneObject that is registered in the scene manager.
     */
    remove(threeJsObject)
    {
        if (threeJsObject.isLight)
            this.removeFromScene(threeJsObject)
        else
        {
            let index = this.bloomObjects.indexOf(threeJsObject)
            if (index < 0)
            {    
                index = this.mainSceneObjects.indexOf(threeJsObject)
                if (index >= 0)
                {
                    Misc.postOrderTraversal(threeJsObject, obj => this.dataMap.delete(obj.uuid))    
                    this.removeFromScene(threeJsObject)
                    this.mainSceneObjects.splice(index, 1)
                }
            }
            this.removeFromScene(threeJsObject)
            this.bloomObjects.splice(index, 1)
        }
    }

    /**
     * Creates the render subpass and adds it in the effect composer for rendering
     * @param {THREE.Camera} threeJsCamera threejs camera object
     */
    setup(threeJsCamera) 
    { 
        this.shouldRender = false
        this.deletePassInComposer(this.renderPass, this.bloomComposer)
        this.deletePassInComposer(this.ssaoPass, this.ssaoComposer)
        this.deletePassInComposer((this.ssaaEnabled) ? this.ssaaPass : this.renderPass, this.sceneRenderComposer)
        this.renderPass = new RenderPass(this.scene, threeJsCamera)
        this.bloomComposer.insertPass(this.renderPass, 0)
        this.ssaoPass = new SSAOPass(this.scene, threeJsCamera, window.innerWidth, window.innerHeight)
        this.ssaoPass.kernelRadius = 0.115
        this.ssaoPass.output = SSAOPass.OUTPUT.Blur
        this.ssaoPass.minDistance = 0.00004
        this.ssaoPass.maxDistance = 0.1
        this.ssaoComposer.insertPass(this.ssaoPass, 0)
        this.ssaaPass = new SSAARenderPass(this.scene, threeJsCamera, 0xffffff, 1)
        this.ssaaPass.sampleLevel = 1
        this.ssaaPass.unbiased = true
        this.sceneRenderComposer.insertPass((this.ssaaEnabled) ? this.ssaaPass : this.renderPass, 0)
        this.shouldRender = true
    }

    /**
     * Renders the scene. This function should be called on every iteration of the render loop.
     * In case of this project, the render loop has been setup in SceneManagerCore class
     */
    render()
    {
        if (this.shouldRender)
        {
            this.renderer.setSize(window.innerWidth, window.innerHeight)
            this.prepareForSpecialEffects()
            this.bloomComposer.setSize(window.innerWidth, window.innerHeight)
            this.bloomComposer.render()
            if (this.ssaoEnabled)
            {
                this.ssaoComposer.setSize(window.innerWidth, window.innerHeight)
                this.ssaoComposer.render()
            }
            this.prepareForFinalPass()
            this.sceneRenderComposer.setSize(window.innerWidth, window.innerHeight)
            this.sceneRenderComposer.render()
            if (this.fxaaEnabled)
            {
                this.fxaaPass.material.uniforms['resolution'].value.x = 1/(window.innerWidth * this.renderer.getPixelRatio())
                this.fxaaPass.material.uniforms['resolution'].value.y = 1/(window.innerHeight * this.renderer.getPixelRatio())
            }
            this.finalComposer.setSize(window.innerWidth, window.innerHeight)
            this.finalComposer.render()
            if (this.stats != null)
                this.stats.update()
        }
    }

    prepareForSpecialEffects()
    {
        for (let mainSceneObject of this.mainSceneObjects)
        {    
            Misc.postOrderTraversal(mainSceneObject, obj=>{
                if (obj.material != undefined)
                {
                    if (obj.material.transparent || obj.material.opacity < 1 || obj.material._alphaTest > 0)
                        obj.visible = false
                    else if (obj.isLight == undefined || !obj.isLight)
                        obj.material = this.blackMaterial
                }
            })
        }
        for (let bloomSceneObject of this.bloomObjects)
            Misc.postOrderTraversal(bloomSceneObject, obj=>this.addToScene(obj))
        this.scene.background = null
    }

    /**
     * Prepares the scene for the final subpass
     */
    prepareForFinalPass()
    {
        for (let mainSceneObject of this.mainSceneObjects)
        {    
            Misc.postOrderTraversal(mainSceneObject, obj=>{
                let data = this.dataMap.get(obj.uuid)
                if (data != undefined)
                {
                    obj.visible = data.visibility
                    obj.material = data.material
                }
            })
        }
        for (let bloomSceneObject of this.bloomObjects)
            Misc.postOrderTraversal(bloomSceneObject, obj=>this.removeFromScene(obj))
        this.scene.background = this.envmap
    }

    /**
     * Adds the threejs object into the threejs scene
     * @param {THREE.Object3D} threeJsObject the threejs object that needs to be added into the threejs scene
     */
    addToScene(threeJsObject) { this.scene.add(threeJsObject) }

    /**
     * Removes the threejs object from the threejs scene
     * @param {THREE.Object3D} threeJsObject the threejs object that needs to be removed from the threejs scene
     */
    removeFromScene(threeJsObject) { this.scene.remove(threeJsObject) }

    /**
     * Deletes the given pass if present from the given composer
     * @param {THREE.Pass} pass 
     * @param {THREE.EffectComposer} composer 
     */
    deletePassInComposer(pass, composer)
    {
        if (pass != null)
        {    
            composer.removePass(pass)
            pass.dispose()
        }
    }
}
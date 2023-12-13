import * as THREE from 'three'
import * as ENGINE from 'engine'
import { GLTFLoader } from 'gltf-loader'
import { DRACOLoader } from 'draco-loader'

window.onload = () => 
{
    const DRACO_DECODER_PATH = '../node_modules/three/examples/jsm/libs/draco/'
    const ASSET_FOLDER = '../assets/'
    const ENV_MAP_PATH = 'CGSkies_0339_freecopy.webp'
    const MODEL_PATH = '1bhk.glb'
    const TEXTURES_PATHS = ['00_Fab_13.png', '00_Fab_14.png', '00_Fab_15.png']
    const Y_OFFSET = -68

    const textures = []
    let selectedModel
    let loader = new ENGINE.AssetLoader()
    for(let i=0; i< TEXTURES_PATHS.length; i++)
        loader.addLoader('Texture'+i, ASSET_FOLDER + TEXTURES_PATHS[i], new THREE.TextureLoader())
    loader.addLoader('Envmap', ASSET_FOLDER + ENV_MAP_PATH, new THREE.TextureLoader())
    let dracoLoader = new DRACOLoader()
    dracoLoader.setDecoderPath(DRACO_DECODER_PATH)
    let gltfLoader = new GLTFLoader()
    gltfLoader.setDRACOLoader(dracoLoader)
    loader.addLoader('Model', ASSET_FOLDER + MODEL_PATH, gltfLoader)
    loader.execute(p=>{}, assetMap => 
    {
        let sceneManager = new ENGINE.SceneManager(document.querySelector('canvas'), true)
        let cameraManager = new ENGINE.StaticCameraManager('Camera', 50)
        sceneManager.register(cameraManager)
        sceneManager.setActiveCamera('Camera')
        let ambientLight = new ENGINE.AmbientLight('AmbientLight', new THREE.Color(1, 1, 1), 1)
        sceneManager.register(ambientLight)
        let input = new ENGINE.InputManager('Input', document.querySelector('canvas'))
        sceneManager.register(input)
        cameraManager.registerInput(input)
        let model = new ENGINE.MeshModel('Model', assetMap.get('Model'), true)
        model.setPosition(2, -1.5, -4)
        model.applyEnvmap(assetMap.get('Envmap'))
        model.enableRayCastingOnTriMesh(true)
        sceneManager.register(model)
        let textureItemBaseId = 'texture-item'
        for (let i=0; i<TEXTURES_PATHS.length; i++)
        {
            textures.push(assetMap.get('Texture'+i))
            let textureItem = document.getElementById(textureItemBaseId+i)
            textureItem.addEventListener('click', e=>
            {
                if (selectedModel != undefined && selectedModel != null)
                    selectedModel.material.map = textures[i]
            })
        }

        let canvas = document.querySelector('canvas')
        canvas.addEventListener('click', e => {
            let rasterCoord = { x: e.screenX, y: e.screenY + Y_OFFSET }
            let hitData = sceneManager.shootRayFromCamera(rasterCoord, true)
            if (hitData.length > 0)
                selectedModel = hitData[0].object
        })

        let downloadBtn = document.getElementById('download-btn')
        downloadBtn.addEventListener('click', e=>downloadSceneAsImage(canvas))
    })
}

function downloadSceneAsImage(canvas)
{
    var link = document.createElement('a');
    link.download = 'filename.jpg';
    link.href = canvas.toDataURL('image/jpeg')
    link.click();
    alert('download complete')
}
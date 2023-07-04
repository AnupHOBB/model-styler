import * as THREE from 'three'
import { ShaderPass } from '../../../node_modules/three/examples/jsm/postprocessing/ShaderPass.js'

const PixelMergerShader =
{
    vertexShader: `
        varying vec2 vUv;
        void main()
        {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,

    fragmentShader: `
        uniform sampler2D texture1, texture2;
        uniform bool merge;
        uniform bool showAO;
        varying vec2 vUv;

        void main() 
        {
            if (merge)        
            {    
                vec4 aoColor = texture2D(texture2, vUv);
                vec4 finalColor = texture2D(texture1, vUv) * aoColor;
                if (showAO)
                    gl_FragColor = aoColor;
                else
                    gl_FragColor = texture2D(texture1, vUv) * aoColor;
            }
            else
                gl_FragColor = texture2D(texture1, vUv);
        }
    `
}

export class PixelMergerPass extends ShaderPass
{
    /**
     * @param {THREE.Texture} texture2 texture with SSAO values that is to be included in the scene
     */
    constructor(texture1, texture2)
    {
        super(new THREE.ShaderMaterial({
            uniforms: 
            {
                texture1: { value: texture1 },
                texture2: { value: texture2 },
                merge: { value: true },
                showAO: { value: false }
            },
            vertexShader : PixelMergerShader.vertexShader,
            fragmentShader : PixelMergerShader.fragmentShader,
        }), (texture1 != null) ? undefined : 'texture1')
    }

    enableMerge(enable) { this.material.uniforms.merge.value = enable }

    showAOMap(show) { this.material.uniforms.showAO.value = show }
}
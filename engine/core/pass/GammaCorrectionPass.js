import * as THREE from 'three'
import { ShaderPass } from '../../../node_modules/three/examples/jsm/postprocessing/ShaderPass.js'

const GammaCorrectionShader =
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
        uniform sampler2D baseTexture;
        uniform float gamma;
        varying vec2 vUv;
        void main() 
        {
            vec4 fragColor = texture2D(baseTexture, vUv);
            fragColor.xyz = pow(fragColor.xyz, vec3(1.0/gamma));
            gl_FragColor = fragColor;
        }
    `
}

export class GammaCorrectionPass extends ShaderPass
{
    constructor(gamma)
    {
        super(new THREE.ShaderMaterial({
            uniforms: 
            { 
                baseTexture: { value: null },
                gamma: { value: gamma }
            },
            vertexShader : GammaCorrectionShader.vertexShader,
            fragmentShader : GammaCorrectionShader.fragmentShader,
        }), 'baseTexture')
    }

    setGamma(gamma) { this.material.uniforms.gamma.value = gamma }
}
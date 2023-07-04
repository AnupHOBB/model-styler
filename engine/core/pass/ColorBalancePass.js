import * as THREE from 'three'
import { ShaderPass } from '../../../node_modules/three/examples/jsm/postprocessing/ShaderPass.js'

const ColorBalanceShader =
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
        varying vec2 vUv;
        uniform sampler2D baseTexture;
        uniform vec3 shadows;
        uniform vec3 highlights;
        uniform vec3 midtones;
        float shadowThreshold = 1.0;
        float highlightThreshold = 2.0;

        void main()
        {
            vec4 finalColor = texture2D(baseTexture, vUv);
            float sum = finalColor.x + finalColor.y + finalColor.z;
            vec3 finalColorXYZ = finalColor.xyz;
            if (sum < shadowThreshold)    
                finalColorXYZ *= shadows;
            else if (sum > highlightThreshold)
                finalColorXYZ *= highlights;
            else
                finalColorXYZ *= midtones;
            finalColor.xyz += finalColorXYZ;
            gl_FragColor = finalColor;
        }
    `
}

export class ColorBalancePass extends ShaderPass
{
    constructor(shadowRgb, midtoneRgb, highlightRgb)
    {
        super(new THREE.ShaderMaterial({
            uniforms: 
            { 
                baseTexture: { value: null },
                shadows: { value: shadowRgb },
                midtones: { value: midtoneRgb },
                highlights: { value: highlightRgb },
            },
            vertexShader: ColorBalanceShader.vertexShader,
            fragmentShader: ColorBalanceShader.fragmentShader
        }), 'baseTexture')
    }

    setShadows(shadowRgb) { this.material.uniforms.shadows.value = shadowRgb }

    setMidtones(midtoneRgb) { this.material.uniforms.midtones.value = midtoneRgb }

    setHighlights(highlightRgb) { this.material.uniforms.highlights.value = highlightRgb }
}
import Phaser from 'phaser';

/* la Light2D di phaser ruota le normali col game object ma ignora il flip:
   un nemico girato verso destra prendeva la luce dal lato sbagliato.
   qui il flip entra nella stessa matrice che phaser già manda allo shader */

type LightPipe = Phaser.Renderer.WebGL.Pipelines.LightPipeline & {
    __flip?: number;
    inverseRotationMatrix: Float32Array;
    currentNormalMapRotation: number | null;
    vertexCount: number;
};

let patched = false;

export function patchNormalFlip(): void {
    if (patched) return;
    patched = true;
    const proto = Phaser.Renderer.WebGL.Pipelines.LightPipeline.prototype as unknown as {
        setGameObject: (this: LightPipe, go: Phaser.GameObjects.GameObject, frame?: Phaser.Textures.Frame) => number;
        setTexture2D: (this: LightPipe, tex: unknown, go?: Phaser.GameObjects.GameObject) => number;
        setNormalMapRotation: (this: LightPipe, rotation: number) => void;
    };
    const flipOf = (go?: Phaser.GameObjects.GameObject): number => {
        const s = go as (Phaser.GameObjects.GameObject & { flipX?: boolean; flipY?: boolean; scaleX?: number; scaleY?: number }) | undefined;
        if (!s) return 0;
        const fx = !!s.flipX !== (s.scaleX ?? 1) < 0;
        const fy = !!s.flipY !== (s.scaleY ?? 1) < 0;
        return (fx ? 1 : 0) | (fy ? 2 : 0);
    };
    const origGO = proto.setGameObject;
    proto.setGameObject = function (go, frame) {
        this.__flip = flipOf(go);
        return origGO.call(this, go, frame);
    };
    const origTex = proto.setTexture2D;
    proto.setTexture2D = function (tex, go) {
        this.__flip = flipOf(go);
        return origTex.call(this, tex, go);
    };
    proto.setNormalMapRotation = function (rotation) {
        const flip = this.__flip ?? 0;
        // chiave unica per rotazione e flip: cambia la matrice solo quando serve
        const key = (rotation || 0) + flip * 1000;
        if (key === this.currentNormalMapRotation && this.vertexCount !== 0) return;
        if (this.vertexCount > 0) this.flush();
        const m = this.inverseRotationMatrix;
        const c = Math.cos(-(rotation || 0));
        const s = Math.sin(-(rotation || 0));
        m[0] = c;
        m[1] = s;
        m[3] = -s;
        m[4] = c;
        if (flip & 1) {
            m[0] = -m[0];
            m[1] = -m[1];
        }
        if (flip & 2) {
            m[3] = -m[3];
            m[4] = -m[4];
        }
        this.setMatrix3fv('uInverseRotationMatrix', false, m);
        this.currentNormalMapRotation = key;
    };
}

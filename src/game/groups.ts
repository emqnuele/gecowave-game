import type Phaser from 'phaser';

/** i gruppi fisici del livello: li toccano in tanti (collider, film, abilità), e phaser li processa nell'ordine in cui nascono */
export class GameGroups {
    readonly enemies: Phaser.GameObjects.Group;
    /** nidi nelle grotte chiuse: spenti da lontano, armati da vicino */
    readonly spawners: Phaser.GameObjects.Group;
    readonly playerProjectiles: Phaser.Physics.Arcade.Group;
    readonly enemyProjectiles: Phaser.Physics.Arcade.Group;
    readonly lamette: Phaser.Physics.Arcade.Group;
    readonly barre: Phaser.Physics.Arcade.Group;
    /** le porte della mente */
    readonly doors: Phaser.Physics.Arcade.StaticGroup;
    /** sbarre che chiudono l'arena finché il boss è vivo */
    readonly arenaBars: Phaser.Physics.Arcade.StaticGroup;

    constructor(scene: Phaser.Scene) {
        this.enemies = scene.add.group({ runChildUpdate: false });
        this.spawners = scene.add.group({ runChildUpdate: false });
        this.playerProjectiles = scene.physics.add.group({ allowGravity: false });
        this.enemyProjectiles = scene.physics.add.group({ allowGravity: false });
        this.lamette = scene.physics.add.group({ allowGravity: false });
        this.barre = scene.physics.add.group();
        this.doors = scene.physics.add.staticGroup();
        this.arenaBars = scene.physics.add.staticGroup();
    }
}

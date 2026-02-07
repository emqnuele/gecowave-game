import Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
    constructor() {
        super('MainMenuScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 1. Background + Parallax
        const baseBackground = this.add.image(width / 2, height / 2, 'mainmenu');
        baseBackground.setDisplaySize(width, height);

        const glowBackground = this.add.image(width / 2, height / 2, 'mainmenu');
        glowBackground.setDisplaySize(width * 1.05, height * 1.05);
        glowBackground.setAlpha(0.25);
        glowBackground.setBlendMode(Phaser.BlendModes.ADD);

        this.tweens.add({
            targets: baseBackground,
            x: width / 2 + 10,
            y: height / 2 - 6,
            duration: 8000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.tweens.add({
            targets: glowBackground,
            x: width / 2 - 14,
            y: height / 2 + 8,
            duration: 10000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 1.5 Post-FX (shader)
        if (this.cameras.main.postFX) {
            this.cameras.main.postFX.addVignette(0.5, 0.5, 0.75);
            this.cameras.main.postFX.addBloom(0xffffff, 0.4, 0.4, 1.1, 0.6);
        }

        // 2. Buttons
        this.createButton(width / 2, height * 0.56, 'NEW GAME', () => {
            this.startGame();
        });

        this.createButton(width / 2, height * 0.64, 'LOAD GAME', () => {
            this.loadGame();
        });

        this.createButton(width / 2, height * 0.72, 'SETTINGS', () => {
            this.toggleSettings();
        });

        this.createButton(width / 2, height * 0.80, 'QUIT', () => {
            this.quitGame();
        });

        // footer
        this.add.text(width / 2, height * 0.9, 'v0.1.0 PRE-ALPHA', {
            fontFamily: 'Courier, monospace',
            fontSize: '16px',
            color: '#444444'
        }).setOrigin(0.5);
    }

    private createButton(x: number, y: number, text: string, callback: () => void) {
        const buttonText = this.add.text(x, y, text, {
            fontFamily: 'Courier, monospace',
            fontSize: '44px',
            color: '#d9e6ef',
            padding: { x: 32, y: 16 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        buttonText.setShadow(0, 0, '#000000', 0, false, false);

        // Hover effects
        buttonText.on('pointerover', () => {
            buttonText.setColor('#e9fbff');
            buttonText.setShadow(0, 0, '#8fe6ff', 22, true, true);
            this.tweens.add({
                targets: buttonText,
                scaleX: 1.06,
                scaleY: 1.06,
                duration: 120
            });
        });

        buttonText.on('pointerout', () => {
            buttonText.setColor('#d9e6ef');
            buttonText.setShadow(0, 0, '#000000', 0, false, false);
            this.tweens.add({
                targets: buttonText,
                scaleX: 1,
                scaleY: 1,
                duration: 120
            });
        });

        buttonText.on('pointerdown', callback);
    }

    private startGame() {
        this.scene.start('GameScene');
        // UIScene is launched by GameScene, but we can ensure it's clean if needed.
        // GameScene code currently launches UIScene, so we just start GameScene.
    }

    private loadGame() {
        this.scene.start('GameScene', { loadGame: true });
    }

    private toggleSettings() {
        this.scene.start('SettingsScene', { returnScene: 'MainMenuScene' });
    }

    private quitGame() {
        this.game.destroy(true);
        if (typeof window !== 'undefined' && window.close) {
            window.close();
        }
    }
}

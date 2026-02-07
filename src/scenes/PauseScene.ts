import Phaser from 'phaser';

export class PauseScene extends Phaser.Scene {
    constructor() {
        super('PauseScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 1. Semi-transparent dark overlay
        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 0.7);
        graphics.fillRect(0, 0, width, height);

        // 2. "PAUSED" Title
        const title = this.add.text(width / 2, height * 0.3, 'PAUSED', {
            fontFamily: 'Courier, monospace',
            fontSize: '64px',
            color: '#e9fbff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        title.setShadow(0, 0, '#8fe6ff', 18, true, true);

        // 3. Buttons

        // RESUME
        this.createButton(width / 2, height * 0.5, 'RESUME', () => {
            this.resumeGame();
        });

        // SETTINGS (Toggle)
        this.createButton(width / 2, height * 0.6, 'SETTINGS', () => {
            this.toggleSettings();
        });

        // QUIT TO MENU
        this.createButton(width / 2, height * 0.7, 'QUIT TO MENU', () => {
            this.quitToMenu();
        });
    }

    private createButton(x: number, y: number, text: string, callback: () => void) {
        const button = this.add.text(x, y, text, {
            fontFamily: 'Courier, monospace',
            fontSize: '40px',
            color: '#d9e6ef',
            padding: { x: 28, y: 14 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        button.setShadow(0, 0, '#000000', 0, false, false);

        button.on('pointerover', () => {
            button.setColor('#e9fbff');
            button.setShadow(0, 0, '#8fe6ff', 22, true, true);
            this.tweens.add({
                targets: button,
                scaleX: 1.06,
                scaleY: 1.06,
                duration: 120
            });
        });

        button.on('pointerout', () => {
            button.setColor('#d9e6ef');
            button.setShadow(0, 0, '#000000', 0, false, false);
            this.tweens.add({
                targets: button,
                scaleX: 1,
                scaleY: 1,
                duration: 120
            });
        });

        button.on('pointerdown', callback);
    }

    private resumeGame() {
        this.scene.resume('GameScene');
        this.scene.stop();
    }

    private toggleSettings() {
        this.scene.start('SettingsScene', { returnScene: 'PauseScene' });
    }

    private quitToMenu() {
        console.log('Quitting to Menu...');
        this.scene.stop('UIScene'); // Stop UI FIRST
        this.scene.stop('GameScene');
        this.scene.start('MainMenuScene');
        this.scene.stop();
    }
}

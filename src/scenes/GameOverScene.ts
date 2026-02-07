import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 1. Semi-transparent black overlay
        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000, 0.8);
        graphics.fillRect(0, 0, width, height);

        // 2. Big Text "YOU DIED"
        this.add.text(width / 2, height * 0.4, 'YOU DIED', {
            fontFamily: 'Courier, monospace',
            fontSize: '84px',
            color: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 3. Subtext
        this.add.text(width / 2, height * 0.5, 'SIGNAL LOST', {
            fontFamily: 'Courier, monospace',
            fontSize: '24px',
            color: '#bbbbbb'
        }).setOrigin(0.5);

        // 4. "TRY AGAIN" Button
        const restartBtn = this.add.text(width / 2, height * 0.65, 'TRY AGAIN', {
            fontFamily: 'Courier, monospace',
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        })
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        restartBtn.on('pointerover', () => {
            restartBtn.setColor('#000000');
            restartBtn.setBackgroundColor('#ffffff');
        });

        restartBtn.on('pointerout', () => {
            restartBtn.setColor('#ffffff');
            restartBtn.setBackgroundColor('#000000');
        });

        restartBtn.on('pointerdown', () => {
            this.restartGame();
        });
    }

    private restartGame() {
        console.log('Restarting Game...');
        // Stop the GameScene and restart it to reset everything
        this.scene.stop('UIScene'); // Ensure UI is stopped FIRST
        this.scene.stop('GameScene');
        this.scene.start('GameScene');
        this.scene.stop();
    }
}

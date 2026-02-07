import Phaser from 'phaser';

export class SettingsScene extends Phaser.Scene {
    private contentContainer!: Phaser.GameObjects.Container;
    private activeTab: string = 'AUDIO';
    private tabs: { [key: string]: Phaser.GameObjects.Text } = {};

    private returnScene: string = 'MainMenuScene';

    constructor() {
        super('SettingsScene');
    }

    init(data: { returnScene?: string }) {
        if (data && data.returnScene) {
            this.returnScene = data.returnScene;
        }
    }

    create() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 1. Background
        this.cameras.main.setBackgroundColor('#101010');

        // 2. Title
        this.add.text(width * 0.05, height * 0.1, 'SYSTEM CONFIGURATION', {
            fontFamily: 'Courier, monospace',
            fontSize: '48px',
            color: '#ff0000',
            fontStyle: 'bold'
        });

        // 3. Navigation Tabs (Left Sidebar)
        const tabStyle = {
            fontFamily: 'Courier, monospace',
            fontSize: '28px',
            color: '#aaaaaa'
        };



        const tabs = ['AUDIO', 'VIDEO', 'GAMEPLAY'];
        let startY = height * 0.25;

        tabs.forEach(tabName => {
            const btn = this.add.text(width * 0.05, startY, `[ ${tabName} ]`, tabStyle)
                .setInteractive({ useHandCursor: true });

            btn.on('pointerover', () => btn.setColor('#ffffff'));
            btn.on('pointerout', () => {
                if (this.activeTab !== tabName) btn.setColor('#aaaaaa');
            });
            btn.on('pointerdown', () => this.switchTab(tabName));

            this.tabs[tabName] = btn;
            startY += 60;
        });

        // 4. Content Area
        this.contentContainer = this.add.container(width * 0.3, height * 0.25);

        // 5. Back Button
        const backBtn = this.add.text(width * 0.05, height * 0.85, '< BACK', {
            fontFamily: 'Courier, monospace',
            fontSize: '32px',
            color: '#ff0000'
        })
            .setInteractive({ useHandCursor: true });

        backBtn.on('pointerover', () => backBtn.setScale(1.1));
        backBtn.on('pointerout', () => backBtn.setScale(1));
        backBtn.on('pointerdown', () => {
            this.scene.start(this.returnScene);
        });

        // Initial render
        this.switchTab('AUDIO');
    }

    private switchTab(tabName: string) {
        this.activeTab = tabName;

        // Update Tab Styles
        Object.keys(this.tabs).forEach(key => {
            if (key === tabName) {
                this.tabs[key].setColor('#ffffff');
                this.tabs[key].setText(`> ${key} <`);
            } else {
                this.tabs[key].setColor('#aaaaaa');
                this.tabs[key].setText(`[ ${key} ]`);
            }
        });

        // Clear previous content
        this.contentContainer.removeAll(true);

        // Render new content
        switch (tabName) {
            case 'AUDIO':
                this.renderAudioSettings();
                break;
            case 'VIDEO':
                this.renderVideoSettings();
                break;
            case 'GAMEPLAY':
                this.renderGameplaySettings();
                break;
        }
    }

    private renderAudioSettings() {
        this.addSectionTitle(0, 0, 'AUDIO MIXER');

        this.addSlider(0, 60, 'MASTER VOLUME', 80);
        this.addSlider(0, 140, 'MUSIC VOLUME', 60);
        this.addSlider(0, 220, 'SFX VOLUME', 100);
    }

    private renderVideoSettings() {
        this.addSectionTitle(0, 0, 'DISPLAY SETTINGS');

        this.addToggle(0, 60, 'FULLSCREEN', false);
        this.addToggle(0, 140, 'VSYNC', true);
        this.addToggle(0, 220, 'CRT FILTER', false);
    }

    private renderGameplaySettings() {
        this.addSectionTitle(0, 0, 'GAMEPLAY PREFERENCES');

        this.addToggle(0, 60, 'SHOW DAMAGE NUMBERS', true);
        this.addToggle(0, 140, 'SCREEN SHAKE', true);
        this.addTextRaw(0, 220, 'DIFFICULTY: HARDCORE (LOCKED)');
    }

    // --- UI Helpers ---

    private addSectionTitle(x: number, y: number, title: string) {
        this.contentContainer.add(this.add.text(x, y, title, {
            fontFamily: 'Courier, monospace',
            fontSize: '36px',
            color: '#ffffff',
            fontStyle: 'bold'
        }));
    }

    private addTextRaw(x: number, y: number, text: string) {
        this.contentContainer.add(this.add.text(x, y, text, {
            fontFamily: 'Courier, monospace',
            fontSize: '24px',
            color: '#aaaaaa'
        }));
    }

    private addSlider(x: number, y: number, label: string, value: number) {
        const labelText = this.add.text(x, y, label, {
            fontFamily: 'Courier, monospace',
            fontSize: '24px',
            color: '#ffffff'
        });

        // Mock Slider Bar
        const barWidth = 300;
        const barHeight = 20;
        const filledWidth = (value / 100) * barWidth;

        const graphics = this.add.graphics();
        graphics.fillStyle(0x333333);
        graphics.fillRect(x, y + 35, barWidth, barHeight); // Background
        graphics.fillStyle(0xff0000);
        graphics.fillRect(x, y + 35, filledWidth, barHeight); // Fill

        const valueText = this.add.text(x + barWidth + 20, y + 30, `${value}%`, {
            fontFamily: 'Courier, monospace',
            fontSize: '24px',
            color: '#ffffff'
        });

        this.contentContainer.add([labelText, graphics, valueText]);
    }

    private addToggle(x: number, y: number, label: string, value: boolean) {
        const labelText = this.add.text(x, y, label, {
            fontFamily: 'Courier, monospace',
            fontSize: '24px',
            color: '#ffffff'
        });

        const toggleBtn = this.add.text(x + 300, y, value ? '[ ON ]' : '[ OFF ]', {
            fontFamily: 'Courier, monospace',
            fontSize: '24px',
            color: value ? '#00ff00' : '#ff0000'
        }).setInteractive({ useHandCursor: true });

        toggleBtn.on('pointerdown', () => {
            // Mock toggle logic
            value = !value;
            toggleBtn.setText(value ? '[ ON ]' : '[ OFF ]');
            toggleBtn.setColor(value ? '#00ff00' : '#ff0000');
        });

        this.contentContainer.add([labelText, toggleBtn]);
    }
}

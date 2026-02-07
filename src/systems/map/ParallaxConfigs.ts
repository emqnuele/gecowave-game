import type { ParallaxLayerConfig } from "./ParallaxManager";

export const PARALLAX_THEMES: Record<string, ParallaxLayerConfig[]> = {
    'default': [
        // Fallback
        { key: 'bg_layer_1', speed: 0.02, depth: -20 },
        { key: 'bg_layer_2', speed: 0.2, depth: -19, offsetY: 100 },
        { key: 'bg_layer_3', speed: 0.5, depth: -18, opacity: 0.8 },
        { key: 'bg_layer_4', speed: 0.8, depth: -17, opacity: 0.6 }
    ],
    'ruins': [
        // The Dark Metroidvania Ruins
        // fitHeight: true scales the texture to cover the full screen height
        { key: 'background', speed: 0.01, depth: -20, fitHeight: true },

        // Columns (Midground - "Inside the castle")
        { key: 'ruins_columns', speed: 0.5, speedY: 1, depth: -10, scale: 0.8 },

        // Fog overlay (Visible: lighter grey, slight movement)
        { key: 'fog', speed: 1.2, depth: 10, opacity: 0.15 } // Depth 10 = Foreground (in front of player)
    ],
    'forest': [
        // Example for future level
        { key: 'bg_layer_1', speed: 0.02, depth: -20 },
        // ... add forest specific layers here
    ]
};

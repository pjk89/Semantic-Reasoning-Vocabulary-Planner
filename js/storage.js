class AppStorage {
    static SETTINGS_KEY = 'vocab_planner_settings';

    static saveSettings(settings) {
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    }

    static getSettings() {
        const defaults = {
            aiProvider: 'cloudflare',
            cloudflareWorkerUrl: '',
            qwenApiKey: '',
            qwenProxyUrl: 'https://qwenproxy.philkey.workers.dev/',
            qwenTextModel: 'qwen3.7-plus',
            qwenImageModel: 'qwen-image-3-pro',
            qwenAvailableModels: null,
            generationMode: 'auto'
        };

        const data = localStorage.getItem(this.SETTINGS_KEY);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                return { ...defaults, ...parsed };
            } catch (e) {
                console.error('Failed to parse settings', e);
            }
        }
        return defaults;
    }
}

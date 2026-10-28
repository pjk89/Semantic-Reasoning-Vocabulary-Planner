class AppStorage {
    static SETTINGS_KEY = 'vocab_planner_settings';

    static saveSettings(settings) {
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    }

    static getSettings() {
        const data = localStorage.getItem(this.SETTINGS_KEY);
        if (data) {
            try {
                return JSON.parse(data);
            } catch (e) {
                console.error('Failed to parse settings', e);
            }
        }
        return {
            openRouterKey: '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',
            aiModel: 'openrouter/free',
            cloudflareWorkerUrl: '',
            generationMode: 'auto'
        };
    }
}

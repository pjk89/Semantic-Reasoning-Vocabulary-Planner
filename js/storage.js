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
            cloudflareWorkerUrl: '',
            generationMode: 'auto'
        };
    }
}

class ImageGenerator {
    constructor(settings) {
        this.settings = settings;
    }

    /**
     * Generates an image and returns a Blob URL
     * @returns {Promise<string>} - Blob URL of the generated image
     */
    async generate(prompt, provider = 'cloudflare-phoenix') {
        const enhancedPrompt = "A high quality photo realistic image of " + prompt + ". Ensure the image is highly appropriate for primary-school children, with no revealing clothing, no bikinis, and no nudity.";

        if (provider.startsWith('cloudflare') && this.settings.cloudflareWorkerUrl) {
            return await this._generateWithCloudflare(enhancedPrompt, provider);
        }

        throw new Error("No valid image provider configured.");
    }

    async _generateWithCloudflare(prompt, provider) {
        let modelString = '@cf/leonardo/phoenix-1.0';

        if (provider === 'cloudflare-qwen') {
            modelString = 'alibaba/qwen-image-3.0-pro';
        } else if (provider === 'cloudflare-sdxl') {
            modelString = '@cf/stabilityai/stable-diffusion-xl-base-1.0';
        } else if (provider === 'cloudflare-sdxl-lightning') {
            modelString = '@cf/bytedance/stable-diffusion-xl-lightning';
        } else if (provider === 'cloudflare-phoenix') {
            modelString = '@cf/leonardo/phoenix-1.0';
        } else if (provider === 'cloudflare-flux') {
            modelString = '@cf/black-forest-labs/flux-1-schnell';
        }

        let url = this.settings.cloudflareWorkerUrl;
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }

        let requestBody = {
            type: 'image',
            model: modelString,
            prompt: prompt
        };

        if (provider === 'cloudflare-phoenix' || provider === 'cloudflare-flux') {
            requestBody.width = 512;
            requestBody.height = 512;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Cloudflare Image Generation Failed (${modelString}): ${response.status} - ${errText}`);
        }

        // Check if response is JSON (some newer models might return base64 instead of binary blob)
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            if (data.success && data.result && data.result.image) {
                // Decode base64 if returned in JSON
                const binaryStr = atob(data.result.image);
                const bytes = new Uint8Array(binaryStr.length);
                for (let i = 0; i < binaryStr.length; i++) {
                    bytes[i] = binaryStr.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: 'image/jpeg' });
                return URL.createObjectURL(blob);
            } else {
                throw new Error("Failed to parse image from JSON response.");
            }
        }

        // Default binary blob return
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    }

}

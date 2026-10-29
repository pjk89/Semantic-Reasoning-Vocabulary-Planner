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

        if (provider.startsWith('cloudflare')) {
            if (!this.settings.cloudflareWorkerUrl) {
                throw new Error("Cloudflare Worker URL is not configured. Please check Settings.");
            }
            return await this._generateWithCloudflare(enhancedPrompt, provider);
        }

        if (provider.startsWith('qwen') || provider.startsWith('wan')) {
            if (!this.settings.qwenApiKey) {
                throw new Error("Qwen API Key is missing. Please configure it in Settings.");
            }
            if (!this.settings.qwenProxyUrl) {
                throw new Error("Qwen Proxy Worker URL is missing. Please configure it in Settings.");
            }
            return await this._generateWithQwen(enhancedPrompt, provider);
        }

        throw new Error("No valid image provider configured.");
    }

    async _generateWithQwen(prompt, provider) {
        let modelString = provider || this.settings.qwenImageModel || 'qwen-image-3.0-pro';
        if (provider === 'wan-2.7-image') {
            modelString = 'wan2.7-image';
        } else if (provider === 'wan-2.7-image-pro') {
            modelString = 'wan2.7-image-pro';
        } else if (provider === 'qwen-image-3-pro') {
            modelString = 'qwen-image-3.0-pro';
        }

        let url = this.settings.qwenProxyUrl;
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.settings.qwenApiKey}`
            },
            body: JSON.stringify({
                type: 'image',
                model: modelString,
                prompt: prompt
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Qwen Image Generation Failed (${modelString}): ${response.status} - ${errText}`);
        }

        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const data = await response.json();
            // Check for direct image URL in results (OpenAI, DashScope native, or custom format)
            const imageUrl = data.url 
                || (data.data && data.data[0] && data.data[0].url)
                || data.output?.results?.[0]?.url 
                || (data.output?.choices && data.output.choices[0]?.message?.content?.[0]?.image)
                || data.result?.image_url;

            if (imageUrl) {
                // Fetch the image URL to create a blob URL (avoids CORS issues on <img> tags)
                const imgRes = await fetch(imageUrl);
                const imgBlob = await imgRes.blob();
                return URL.createObjectURL(imgBlob);
            } else if (data.image || (data.data && data.data[0] && data.data[0].b64_json) || data.result?.image) {
                // Base64 image
                const base64Data = data.image || data.data[0].b64_json || data.result.image;
                const binaryStr = atob(base64Data);
                const bytes = new Uint8Array(binaryStr.length);
                for (let i = 0; i < binaryStr.length; i++) {
                    bytes[i] = binaryStr.charCodeAt(i);
                }
                const blob = new Blob([bytes], { type: 'image/jpeg' });
                return URL.createObjectURL(blob);
            }
        }

        // Default binary blob return
        const blob = await response.blob();
        return URL.createObjectURL(blob);
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

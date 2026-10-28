/**
 * Cloudflare Worker: Qwen Cloud Proxy
 * 
 * Proxies OpenAI-compatible text completions and image generation requests
 * from your GitHub Pages frontend to Alibaba Cloud's Qwen Model Studio (DashScope / Token Plan) API with CORS headers.
 * 
 * Authentication: Requires the caller's Qwen API key in the `Authorization: Bearer <sk-...>` header.
 * 
 * Target Endpoint:
 * - Token Plan (subscription, sk-sp-...): https://token-plan.maas.qwencloudapi.com
 * - Pay-As-You-Go DashScope (sk-...): https://dashscope-intl.aliyuncs.com
 * Can also be customized via the `QWEN_BASE_URL` Worker environment variable.
 */

const DEFAULT_BASE_URL = 'https://token-plan.maas.qwencloudapi.com';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Ensure authorization header is provided
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header. Provide your Qwen API key.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Determine the base URL (defaults to Token Plan, can be overridden by env variable)
    let baseUrl = (env?.QWEN_BASE_URL || DEFAULT_BASE_URL).trim().replace(/\/+$/, '');
    // Strip trailing /compatible-mode/v1 if the user provided the full compatible mode path
    baseUrl = baseUrl.replace(/\/compatible-mode\/v1\/?$/, '');

    // Support GET requests to query available models
    if (request.method === 'GET') {
      try {
        const qwenRes = await fetch(`${baseUrl}/compatible-mode/v1/models`, {
          method: 'GET',
          headers: { 'Authorization': authHeader }
        });
        const qwenData = await qwenRes.text();
        return new Response(qwenData, {
          status: qwenRes.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    try {
      const body = await request.json();

      // 0. Query Models Route
      if (body.type === 'models') {
        const qwenRes = await fetch(`${baseUrl}/compatible-mode/v1/models`, {
          method: 'GET',
          headers: { 'Authorization': authHeader }
        });
        const qwenData = await qwenRes.text();
        return new Response(qwenData, {
          status: qwenRes.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 1. Text Generation Route (Chat Completions)
      if (body.type === 'text') {
        const textPayload = {
          model: body.model || 'qwen3.7-plus',
          messages: [
            { role: 'system', content: body.systemPrompt },
            { role: 'user', content: body.prompt }
          ],
          response_format: { type: 'json_object' }
        };

        const qwenRes = await fetch(`${baseUrl}/compatible-mode/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify(textPayload)
        });

        const qwenData = await qwenRes.text();
        return new Response(qwenData, {
          status: qwenRes.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 2. Image Generation Route (Synchronous)
      if (body.type === 'image') {
        const modelName = body.model || 'qwen-image-3.0-pro';

        // 1. Try OpenAI-compatible endpoint first (standard for Token Plan & Qwen-Image)
        const openAiPayload = {
          model: modelName,
          prompt: body.prompt,
          size: body.size || '1024*1024',
          n: 1
        };

        const imageRes = await fetch(`${baseUrl}/compatible-mode/v1/images/generations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify(openAiPayload)
        });

        if (imageRes.ok) {
          const imageData = await imageRes.text();
          return new Response(imageData, {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // If the error wasn't 404 (route not found), return it directly
        if (imageRes.status !== 404) {
          const errText = await imageRes.text();
          return new Response(errText, {
            status: imageRes.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // 2. Fallback to native DashScope synchronous multimodal endpoint
        const nativePayload = {
          model: modelName,
          input: {
            messages: [
              {
                role: 'user',
                content: [{ text: body.prompt }]
              }
            ]
          },
          parameters: {
            size: '1024*1024'
          }
        };

        const nativeRes = await fetch(`${baseUrl}/api/v1/services/aigc/multimodal-generation/generation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authHeader
          },
          body: JSON.stringify(nativePayload)
        });

        const nativeData = await nativeRes.text();
        return new Response(nativeData, {
          status: nativeRes.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify({ error: 'Invalid request type. Expected "text" or "image".' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};


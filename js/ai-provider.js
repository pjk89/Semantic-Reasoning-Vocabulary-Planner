class AIProvider {
    constructor(settings) {
        this.settings = settings;
    }

    async generateLesson(word, contextSentence, numExamples = 3, gradeLevel = "Grade 3") {
        let systemPrompt = `You are an expert curriculum designer creating a vocabulary-learning lesson for primary-school students based on semantic reasoning and inference.
The target audience is ${gradeLevel} students. You MUST tailor sentence complexity and vocabulary in captions and quiz questions to precisely match this grade level, ensuring accessibility for ESL students.

PEDAGOGICAL PURPOSE:
Students infer the meaning of the target vocabulary word by observing ${numExamples} different visual situations. The captions are hidden during the lesson and only revealed as 'the answer' once students have reasoned about what the image shows.

CONTEXT HANDLING:
- If a context sentence is provided, use it as a semantic anchor to determine the intended meaning, then apply that concept to fresh, unrelated contexts.
- If no context sentence is provided, use the word's most common ${gradeLevel}-appropriate meaning and show how it applies across different areas of a student's world.

FOR EACH OF THE ${numExamples} EXAMPLES:
1. caption (The Intended Inference):
   - This serves as the target success criteria for the image—what a student should conclude when looking at the picture.
   - Describe the observable action, state, or quality demonstrating the concept at a ${gradeLevel} reading level.
   - CRITICAL: Never use the target vocabulary word or directly define it.
2. visual_description:
   - A concrete, highly-detailed scene engineered specifically so that a student can visually arrive at the intended inference.
   - Describe the subjects, their exact action or expression, the environment, and lighting. Do NOT use the target word or phrases like "A photograph of" or "An image of".

SCENARIO DIVERSITY:
- Each of the ${numExamples} examples must draw from a completely different sphere of a ${gradeLevel} student's world.
- Do NOT reuse the same narrative formula or interpersonal dynamic.

QUIZ GUIDELINES:
Generate a multiple-choice question to test if the student understands the underlying meaning.
- The question MUST exactly be "The meaning of [vocabulary word] is..." (replacing [vocabulary word] with the actual word).
- The 4 choices MUST be sentence completions written at a ${gradeLevel} reading level, roughly equal in length.
- The CORRECT choice must be a clear, student-friendly explanation of the word's core meaning that naturally reflects the common idea across all examples.
- The 3 DISTRACTORS (incorrect choices) must be plausible student misconceptions, opposite meanings, or related but incorrect actions.
- QUIZ DISTRACTOR RULES:
  * Distractors must NEVER repeat the correct definition or share the opening phrasing of the correct choice.
  * Do NOT pad distractors with lists of unrelated background objects from the scenes.

Return valid JSON exactly matching this structure, without markdown wrappers if possible:
{
  "word": "...",
  "context_sentence": "...",
  "examples": [
    {
      "caption": "...",
      "visual_description": "..."
    }
  ],
  "quiz": {
    "question": "...",
    "choices": ["...", "...", "...", "..."],
    "correct_index": 0
  }
}`;

        let userContent = `Vocabulary word: ${word}`;
        if (contextSentence) {
            userContent += `\nContext sentence: ${contextSentence}`;
        }

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
        ];

        if (this.settings.aiProvider === 'qwen') {
            if (!this.settings.qwenApiKey) {
                throw new Error("Qwen API Key is missing. Please configure it in Settings.");
            }
            if (!this.settings.qwenProxyUrl) {
                throw new Error("Qwen Proxy Worker URL is missing. Please configure it in Settings.");
            }
            return await this._callQwen(systemPrompt, userContent);
        }

        // Default: Cloudflare Workers AI
        if (!this.settings.cloudflareWorkerUrl) {
            throw new Error("Cloudflare Worker URL is not configured. Please configure it in Settings.");
        }

        return await this._callCloudflare(systemPrompt, userContent);
    }

    async _callQwen(systemPrompt, userPrompt) {
        let url = this.settings.qwenProxyUrl;
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }

        const model = this.settings.qwenTextModel || 'qwen3.7-plus';

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.settings.qwenApiKey}`
            },
            body: JSON.stringify({
                type: 'text',
                model: model,
                systemPrompt: systemPrompt,
                prompt: userPrompt
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Qwen API Error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        if (data.choices && data.choices[0] && data.choices[0].message) {
            return this._parseJson(data.choices[0].message.content);
        } else if (data.response) {
            return this._parseJson(data.response);
        } else if (data.result && data.result.response) {
            return this._parseJson(data.result.response);
        } else {
            return this._parseJson(data);
        }
    }

    async _callCloudflare(systemPrompt, userPrompt) {
        if (!this.settings.cloudflareWorkerUrl) {
            throw new Error("Cloudflare Worker URL is missing. Please configure it in Settings.");
        }

        let url = this.settings.cloudflareWorkerUrl;
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'text',
                model: '@cf/qwen/qwen2.5-coder-32b-instruct',
                systemPrompt: systemPrompt,
                prompt: userPrompt
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Cloudflare API Error: ${response.status} - ${errText}`);
        }

        const data = await response.json();

        // Return text completion
        // Return text completion parsed as JSON
        if (data.response) {
            return this._parseJson(data.response); // Cloudflare standard response format
        } else if (data.result && data.result.response) {
            return this._parseJson(data.result.response);
        } else {
            throw new Error("Unexpected response format from Cloudflare API.");
        }
    }

    _parseJson(content) {
        if (typeof content === 'object' && content !== null) {
            return content;
        }

        // Clean up markdown block if present
        let cleaned = content.trim();
        if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7);
        if (cleaned.startsWith('```')) cleaned = cleaned.substring(3);
        if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);
        cleaned = cleaned.trim();

        // Attempt to auto-fix common LLM JSON syntax errors (missing commas)
        cleaned = cleaned.replace(/"\s*\n\s*"/g, '",\n"');
        cleaned = cleaned.replace(/}\s*\n\s*"/g, '},\n"');
        cleaned = cleaned.replace(/]\s*\n\s*"/g, '],\n"');

        try {
            return JSON.parse(cleaned);
        } catch (e) {
            console.error("Failed to parse JSON:", cleaned);
            throw new Error('AI returned invalid JSON.');
        }
    }
}

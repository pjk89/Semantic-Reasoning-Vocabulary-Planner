class AIProvider {
    constructor(settings) {
        this.settings = settings;
    }

    async generateLesson(word, contextSentence, numExamples = 3, gradeLevel = "Grade 3") {
        let systemPrompt = `You are an expert curriculum designer creating a vocabulary-learning lesson for primary-school students.
The target audience is ${gradeLevel} students. You MUST tailor the reading level, sentence complexity, and vocabulary in the captions and quiz questions to precisely match this grade level. It is critical that the language is accessible for ESL students at this grade level.

The purpose is to help students infer the meaning of a vocabulary word by seeing it represented in multiple different situations.

The teacher may provide a sentence from a story or reading passage where the vocabulary word appears. If a context sentence is provided, use it to determine the intended meaning or sense of the target word.
The supplied context sentence is a semantic anchor, not a template. Do NOT simply reproduce the situation from the supplied sentence.
Instead, identify the underlying meaning demonstrated by the word in that sentence and generate ${numExamples} genuinely different situations that demonstrate the same meaning.
The ${numExamples} situations should deliberately expand beyond the original story context so that students learn how the word applies in different circumstances.

For each situation generate:
1. A highly-detailed visual description of the scene. This will be used as a prompt for an AI image generator. Include details about the subject, their exact action or expression, the environment, and the lighting. Do NOT use the vocabulary word in the visual description. Do NOT prepend the visual description with "A photograph of" or "An image of" (this is handled elsewhere).
2. A short student-friendly caption describing the situation, written at a ${gradeLevel} reading level.

CRITICAL RULES:
- The caption must NOT use the target vocabulary word.
- The caption must NOT directly define the target word.
- The ${numExamples} examples should be meaningfully different rather than ${numExamples} variations of the same situation.
- Use concrete situations that could realistically be represented by a photograph or illustration.

Finally, generate a multiple-choice question to test if the student understands the underlying meaning.
The question MUST exactly be "The meaning of [vocabulary word] is..." (replacing [vocabulary word] with the actual word).
The 4 choices MUST be sentence completions written at a ${gradeLevel} reading level.

CRITICAL QUIZ RULE:
The correct choice must seamlessly combine the core dictionary definition and the specific visual details from the generated images.
For example, if the word is 'equator' and the images show hot places, the correct answer should be something like: "an imaginary line around the middle of the Earth where the weather is usually very hot and sunny."
Ensure all 4 choices are roughly the same length and follow a similar structure. Do NOT use brackets like [Core Definition] or [Detail] in your output. Do NOT just provide a dictionary definition of the word.

Return valid JSON exactly matching this structure, without markdown wrappers if possible:
{
  "word": "...",
  "context_sentence": "...",
  "examples": [
    {
      "visual_description": "...",
      "caption": "..."
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

        if (!this.settings.cloudflareWorkerUrl) {
            throw new Error("Cloudflare Worker URL is not configured. Please configure it in Settings.");
        }

        return await this._callCloudflare(systemPrompt, userContent);
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

# Vocabulary Context Learning Tool — PRD v1.1

## 1. Project Overview

Build a small, local web-based authoring tool for a teacher to create vocabulary-learning lessons inspired by the principles of InferCabulary.

The teacher provides a vocabulary word, and the application uses an AI model through OpenRouter to generate six varied contextual examples.

For each example, the AI generates:

- A visual description
- A concise image-search query
- A short student-friendly caption
- The intended semantic context

The application then automatically performs the image search and displays **six candidate images** for that particular context.

The teacher selects the most appropriate image and proceeds to the next example.

Once all six examples have been completed, the teacher reviews the lesson and exports it as a **standalone HTML lesson package** containing the lesson content and selected images.

The exported lesson must work without the generator, AI, API keys, or internet access.

This is a **personal, non-commercial teaching tool**. It does not require accounts, cloud storage, student tracking, analytics, or production infrastructure.

---

# 2. Core User Workflow

The primary workflow should be:

```text
Teacher enters vocabulary word
        ↓
AI generates six contextual examples
        ↓
Example 1
        ↓
AI-generated caption + search query
        ↓
Application performs image search
        ↓
Six candidate images displayed
        ↓
Teacher selects one
        ↓
Example 2
        ↓
...
        ↓
Example 6
        ↓
Teacher reviews lesson
        ↓
Preview
        ↓
Export standalone lesson
```

The teacher should NOT have to manually copy the search query into Google.

The application performs the image search automatically.

---

# 3. Primary Goal

Reduce the time required for a teacher to create a contextual vocabulary lesson.

The teacher should only need to:

1. Enter the word.
2. Review AI-generated examples.
3. Select one image from each batch of six.
4. Edit anything necessary.
5. Export the lesson.

The AI handles the repetitive creative work.

The image search system handles finding candidate images.

The teacher remains the final judge of whether an image appropriately represents the intended context.

---

# 4. Non-Goals for v1

Do NOT implement:

- Google Classroom integration
- Student accounts
- Teacher accounts
- Online database
- Cloud hosting
- Student progress tracking
- Analytics
- Automatic image selection
- AI image generation
- Mobile application
- React Native
- Complex authentication
- Multi-user support
- Commercial deployment

The generator is intended to run locally on the teacher's computer.

---

# 5. Two Distinct Products

The project consists of:

## A. Generator

A private local HTML application.

Example:

```text
generator.html
```

It contains:

- Vocabulary input
- OpenRouter API integration
- AI lesson generation
- Image-search integration
- Image-selection interface
- Content editing
- Lesson preview
- Export functionality
- Draft saving

The OpenRouter API key may be embedded in this private generator for v1.

IMPORTANT:

The API key must NEVER be included in exported lessons.

The generator should not be designed for public distribution.

---

## B. Exported Lesson

A standalone lesson package.

Example:

```text
reluctant.zip
```

Containing:

```text
reluctant/
    index.html
    images/
        image-01.jpg
        image-02.jpg
        image-03.jpg
        image-04.jpg
        image-05.jpg
        image-06.jpg
```

The exported lesson must not require:

- OpenRouter
- Image-search APIs
- API keys
- Internet access
- The generator

---

# 6. Technology

Prefer a simple technology stack:

- HTML
- CSS
- Vanilla JavaScript

No frontend framework is required for v1.

The application should be a local web application.

Avoid unnecessary dependencies.

---

# 7. AI Provider

Use OpenRouter for AI generation.

The AI model should be configurable.

The initial model should be a suitable free Qwen model available through OpenRouter.

Configuration should include:

```text
OpenRouter API Key:
[********************]

Model:
[qwen/...]
```

The API key can be stored in localStorage or directly in the private generator configuration.

Do not include it in exported lessons.

---

# 8. Vocabulary Input

The primary input is a single vocabulary word.

Example:

```text
Vocabulary word:

[ reluctant                  ]
```

Provide an optional **Context Sentence** field.

This should contain the sentence from the story, reading passage, or other target text where the vocabulary word appears.

Example:

```text
Context sentence (optional):

[ The reluctant explorer stepped into the dark cave. ]
```

The purpose of the context sentence is to help the AI identify **which meaning or sense of the vocabulary word is being taught**.

The context sentence must NOT restrict the generated lesson to that particular situation.

The AI should:

1. Use the context sentence to determine the intended meaning of the word.
2. Identify the semantic concept being demonstrated.
3. Generate six different situations demonstrating that same meaning.
4. Deliberately vary the situations so students encounter the concept in contexts beyond the original story.

If no context sentence is provided, the AI should determine the most likely appropriate meaning from the vocabulary word itself.

The UI should make clear that the context sentence is optional but recommended when the word comes from a specific reading passage.

Suggested helper text:

> Provide the sentence from the story or text where the word appears. This helps identify the meaning you want students to learn.


# 9. AI Generation

The AI should generate exactly six contextual examples.

If a context sentence has been provided, it should be treated as the **semantic anchor** for the lesson.

The AI must first determine the intended meaning of the target vocabulary word from the supplied sentence.

It should then generate six different situations demonstrating that meaning.

The original context should NOT simply be reproduced six times or used as the template for all examples.

The purpose is to help students understand that the vocabulary word represents a broader concept that can occur across many situations.

The response must be structured JSON.

Suggested structure:

```json
{
  "word": "reluctant",
  "meaning": "Not wanting to do something or feeling unsure about doing it.",
  "context_sentence": "The reluctant explorer stepped into the dark cave.",
  "examples": [
    {
      "visual_description": "A child stands at the edge of a swimming pool while other children swim nearby and appears unsure about entering.",
      "search_query": "child hesitant to enter swimming pool",
      "caption": "The boy watches his friends swimming but stays at the edge."
    }
  ],
  "quiz": {
    "question": "If someone is reluctant to do something, they...",
    "choices": [
      "really want to do it",
      "are unsure or don't really want to do it",
      "don't know how to do it",
      "have already done it many times"
    ],
    "correct_index": 1
  }
}
```

The `context_sentence` field should be retained in the generated lesson data so the teacher can review how the AI interpreted the original text.

The teacher must be able to edit the generated meaning if the AI has interpreted the context incorrectly.


---

## 10. Six Context Requirements

The six examples are the core pedagogical feature.

If a context sentence is provided, it establishes the **intended meaning** of the vocabulary word, but it should not determine the specific situations generated.

The six examples must demonstrate the same underlying meaning through genuinely different contexts.

For example:

**Target sentence:**

> "The reluctant explorer stepped into the dark cave."

The AI should identify the relevant meaning as something like:

> Hesitant or unsure about doing something; not wanting to do it.

It should then deliberately move beyond the explorer/cave context.

Possible examples:

1. A child hesitating to enter a swimming pool.
2. A dog resisting going into a veterinarian.
3. A student hesitating before answering a question.
4. A child unsure about trying unfamiliar food.
5. A person hesitating before entering an unfamiliar location.
6. Someone hesitating before accepting an invitation.

The examples should vary:

* People
* Locations
* Activities
* Circumstances
* Causes
* Emotional situations

The examples must remain clearly connected to the same meaning.

Avoid generating six examples that are essentially the same situation as the supplied context sentence.

The goal is **contextual breadth**: students should learn that the vocabulary concept can apply beyond the specific situation in the story.


# 11. Visual Description

Each example must include a `visual_description`.

This describes what the desired image should show.

Example:

```text
A young boy stands at the edge of a swimming pool while several children are already swimming. He appears unsure about entering.
```

Requirements:

- Concrete
- Visually representable
- Suitable for image search
- No target vocabulary word
- No abstract explanation of the vocabulary

The visual description is primarily for the image-search process and teacher review.

---

# 12. Search Query Generation

Each example must include a concise `search_query`.

Example:

```text
child hesitant to enter swimming pool
```

The query should describe the **visible situation**, not simply the vocabulary concept.

Bad:

```text
reluctant
```

Bad:

```text
person showing reluctance
```

Better:

```text
child hesitant to enter swimming pool
```

The query should:

- Be concrete
- Describe visible actions
- Describe relevant people/objects
- Avoid the target vocabulary where possible
- Avoid abstract educational terminology
- Be appropriate for a general image-search engine

The AI should generate the query specifically to retrieve useful photographs or illustrations.

---

# 13. Caption Generation

Each example must have a short caption.

The caption should:

- Describe what is happening.
- Provide clues toward the meaning.
- Be understandable to primary-school students.
- Avoid the target vocabulary.
- Avoid directly defining the vocabulary.
- Avoid making the answer immediately obvious.

Bad:

```text
The boy is reluctant to enter the pool.
```

Bad:

```text
The boy doesn't want to enter the pool.
```

Better:

```text
The boy watches his friends swimming but stays at the edge.
```

The AI prompt should explicitly enforce this requirement.

---

# 14. Image Search Architecture

Image search must be implemented as a separate provider/module.

The rest of the application should not depend directly on a specific image-search provider.

Use an interface conceptually equivalent to:

```javascript
imageSearch(query, page)
```

The provider returns normalized results such as:

```json
{
  "results": [
    {
      "thumbnailUrl": "...",
      "imageUrl": "...",
      "sourceUrl": "...",
      "title": "..."
    }
  ],
  "page": 1,
  "hasMore": true
}
```

This abstraction is important because the image-search provider may change.

---

# 15. Initial Image Search Provider

Prefer **Google image search through an appropriate Google image-search API** if a suitable API can be used within the project's cost and access constraints.

Google's Custom Search API supports image search via `searchType=image`, supports up to 10 results per request, and supports pagination using the `start` parameter. It also provides filtering options such as SafeSearch, image type, size, and licensing rights.

However, do NOT hard-code the entire application around Google.

The image-search provider must be replaceable.

If Google is impractical because of API access, pricing, quota, or authentication requirements, implement the same interface with another suitable image-search provider.

The application should be designed so that changing providers does not require rewriting the lesson-generation system.

---

# 16. Image Search Result Quantity

For each vocabulary example:

**Initial search:**

Return/display exactly six candidate images where possible.

Example:

```text
Example 1 of 6

Caption:
"The boy watches his friends swimming but stays at the edge."

Search query:
child hesitant to enter swimming pool

[ IMAGE 1 ] [ IMAGE 2 ] [ IMAGE 3 ]
[ IMAGE 4 ] [ IMAGE 5 ] [ IMAGE 6 ]
```

The teacher selects one.

---

# 17. More Images

Provide a:

```text
[ More Images ]
```

button.

If the teacher does not like the initial six results, clicking "More Images" should request the next batch of results for the same search query.

The teacher should NOT have to regenerate the AI example.

Conceptually:

```text
Search page 1
    ↓
6 images
    ↓
More Images
    ↓
Search page 2
    ↓
6 more images
```

The exact pagination mechanism depends on the chosen image-search provider.

Google Custom Search supports pagination and can return subsequent result pages using `start`.

---

# 18. Edit Search Query

The generated search query must be editable.

Example:

```text
Search query:

[ child hesitant to enter swimming pool ]

[ Search ]
```

The teacher can modify the query and perform another search.

For example:

```text
child nervous entering swimming pool
```

This should perform a new search starting at page 1.

The teacher should not need to regenerate the AI content just because an image search isn't producing good results.

---

# 19. Image Selection Interface

The image-selection interface should focus the teacher on one example at a time.

Display:

```text
Example 1 of 6
```

Then:

```text
Target word:
RELUCTANT

Context:
A child stands at the edge of a swimming pool while other
children swim nearby and appears unsure about entering.

Caption:
"The boy watches his friends swimming but stays at the edge."

Search query:
[ child hesitant to enter swimming pool ]

[ Search ]
```

Then show six candidate images.

Each candidate should be clickable.

When selected:

```text
✓ Image selected
```

The selected image should be visually highlighted.

Provide:

```text
[ More Images ]    [ Next Example → ]
```

The teacher then moves to Example 2.

---

# 20. Sequential Image Selection

Do NOT show all 36 images for the six examples simultaneously.

The default workflow should be sequential:

```text
Example 1 / 6
    ↓
Select image
    ↓
Example 2 / 6
    ↓
Select image
    ↓
Example 3 / 6
    ↓
...
```

This keeps the authoring process focused.

After completing all six examples, provide a summary/review screen.

---

# 21. Teacher Review

After image selection, display all six completed examples in a review screen.

Example:

```text
RELUCTANT

1. [image]
   The boy watches his friends swimming but stays at the edge.

2. [image]
   The dog pulls backward while its owner tries to lead it inside.

3. [image]
   ...

[ Edit Example ]
```

The teacher can go back to any example and:

- Replace image
- Change search query
- Search again
- Edit caption
- Edit visual description

---

# 22. AI Regeneration

Provide individual regeneration rather than requiring regeneration of the whole lesson.

For each example:

```text
[ Regenerate Example ]
```

Regeneration should produce a new:

- Visual description
- Search query
- Caption

The teacher should then perform image selection again.

Also provide:

```text
[ Regenerate Quiz ]
```

The word and other approved examples should remain unchanged.

---

# 23. Quiz Generation

Generate at least one four-option multiple-choice question.

Example:

```text
If someone is reluctant to do something, they...

A. really want to do it
B. are unsure or don't really want to do it
C. don't know how to do it
D. have already done it many times
```

Requirements:

- Four options
- One clearly correct answer
- Plausible distractors
- Student-friendly wording
- Tests meaning rather than spelling
- Avoids unnecessarily difficult vocabulary in the choices

The teacher can edit:

- Question
- Four choices
- Correct answer

---

# 24. Optional Application Question

If straightforward to implement, generate a second question demonstrating the word in a new context.

Example:

```text
Which person is being reluctant?

A. Sam immediately volunteers to help.
B. Mia hesitates before agreeing to join the activity.
C. Tom runs excitedly toward the playground.
D. Lucy finishes her work quickly.
```

This is desirable but should not delay the core implementation.

---

# 25. Generator UI

Use a simple workflow-oriented interface.

## Step 1 — Word

```text
Vocabulary word:

[ reluctant ]

Optional passage/context:

[                               ]

[ Generate Lesson ]
```

---

## Step 2 — Generate

Display generation progress:

```text
Generating vocabulary contexts...

✓ Meaning
✓ Contexts
✓ Search queries
✓ Captions
✓ Quiz
```

---

## Step 3 — Select Images

Display one example at a time.

```text
Example 1 of 6

Caption:
"The boy watches his friends swimming but stays at the edge."

Search query:
[ child hesitant to enter swimming pool ]

[ Search ]

[image] [image] [image]
[image] [image] [image]

[ More Images ]

[ Next Example → ]
```

---

## Step 4 — Review

Show all six examples.

```text
[ Edit ]
[ Replace Image ]
[ Preview Lesson ]
[ Export Lesson ]
```

---

# 26. Student Preview

Provide a student-mode preview.

The teacher should be able to see exactly what students will see.

Student mode should hide:

- API controls
- Search controls
- Editing controls
- Teacher notes

The lesson should present:

1. Six contextual images and captions
2. Vocabulary reveal
3. Student-friendly meaning
4. Multiple-choice question
5. Optional application question

---

# 27. Export

The teacher clicks:

```text
[ Export Lesson ]
```

The application creates a ZIP.

Example:

```text
reluctant.zip
```

Contents:

```text
reluctant/
    index.html
    images/
        image-01.jpg
        image-02.jpg
        image-03.jpg
        image-04.jpg
        image-05.jpg
        image-06.jpg
```

---

# 28. Image Handling During Export

The exported lesson should contain local copies of the selected images.

Do NOT make the final lesson dependent on the original image-search URLs.

The generator should attempt to download/copy the selected image into the export package.

If an image cannot be downloaded because the source blocks direct access, the application should clearly notify the teacher and provide an opportunity to:

- Choose another result
- Download/save the image manually
- Upload a local copy

Do not silently create an exported lesson containing broken image URLs.

---

# 29. Offline Export Requirement

After extraction, the teacher must be able to open:

```text
index.html
```

without internet access.

The lesson must not make:

- OpenRouter requests
- Image-search requests
- External JavaScript requests
- External CSS requests
- External font requests

All necessary CSS and JavaScript should be embedded or included locally.

The selected images must be local files.

---

# 30. API Keys

The generator may contain:

- OpenRouter API key
- Image-search API credentials

because it is a private local tool.

However:

**NO API credentials may appear anywhere in exported lessons.**

The export process should explicitly construct a clean lesson rather than copying the generator HTML.

The exported HTML should contain only:

- Lesson data
- Lesson UI
- Lesson JavaScript
- Lesson CSS

---

# 31. Draft Saving

The generator should support saving unfinished lessons.

Use local browser storage for v1 if practical.

Drafts should preserve:

- Word
- Meaning
- Six contexts
- Captions
- Search queries
- Selected images
- Quiz
- Application question

The teacher should be able to:

```text
Saved Lessons

Reluctant
Enormous
Cautious

[ Open ] [ Delete ]
```

If storing externally sourced images in browser storage proves unnecessarily complicated, it is acceptable for v1 to require the teacher to reselect/re-upload images before final export.

However, preserving the selected images locally is preferable.

---

# 32. Error Handling

## AI failure

Display:

> Unable to generate the lesson. Check your OpenRouter settings and try again.

## Image search failure

Display:

> Image search failed. Check your image-search configuration or try again.

Do not lose the generated caption or query.

## No useful results

Allow:

- Edit query
- Search again
- More Images

## Image download failure

Clearly identify the affected image.

Do not produce an apparently complete lesson containing broken images.

## Invalid AI response

Attempt to parse structured JSON.

If parsing fails, display an error and allow regeneration.

---

# 33. AI Prompt Requirements

The AI should be instructed along these lines:

> You are creating a vocabulary-learning lesson for primary-school students.
>
> The purpose is to help students infer the meaning of a vocabulary word by seeing it represented in multiple different situations.
>
> The teacher may provide a sentence from a story or reading passage where the vocabulary word appears. If a context sentence is provided, use it to determine the intended meaning or sense of the target word.
>
> The supplied context sentence is a **semantic anchor, not a template**.
>
> Do NOT simply reproduce the situation from the supplied sentence.
>
> Instead, identify the underlying meaning demonstrated by the word in that sentence and generate six genuinely different situations that demonstrate the same meaning.
>
> The six situations should deliberately expand beyond the original story context so that students learn how the word applies in different circumstances.
>
> For each situation generate:
>
> 1. A concrete visual description.
> 2. A concise image-search query describing the visible scene.
> 3. A short student-friendly caption.
>
> The caption must NOT use the target vocabulary word.
>
> The caption must NOT directly define the target word.
>
> The search query should describe the visible situation rather than simply using the vocabulary word or an abstract synonym.
>
> The six examples should be meaningfully different rather than six variations of the same situation.
>
> Use concrete situations that could realistically be represented by a photograph or illustration.
>
> Generate a student-friendly definition and a four-option multiple-choice question.
>
> Return valid JSON matching the required schema.


---

# 34. Image Search Provider Abstraction

Implement image search behind a provider interface.

Conceptually:

```javascript
class ImageSearchProvider {
    async search(query, page) {
        // return normalized results
    }
}
```

The UI should only interact with:

```javascript
imageSearchProvider.search(query, page)
```

It should not know whether results came from:

- Google
- Another commercial API
- A free image-search service
- A future provider

This allows the image-search provider to be replaced later without redesigning the application.

---

# 35. Image Result Data

Normalize results to something like:

```json
{
  "id": "provider-specific-id",
  "thumbnailUrl": "...",
  "imageUrl": "...",
  "sourceUrl": "...",
  "title": "...",
  "width": 1200,
  "height": 800
}
```

Only fields actually supplied by the provider need to be populated.

The UI should primarily display:

- Thumbnail
- Title/source if available

The source URL should be retained in lesson metadata where practical.

---

# 36. Image Search Defaults

Where supported by the selected provider, prefer:

- SafeSearch enabled
- Photograph results
- Reasonable image size
- English-language results
- Duplicate filtering
- Relevant geographic/search settings

Do not over-filter results during v1.

The teacher is the final image-selection authority.

Google's image-search API supports filters for SafeSearch, image type, image size, language, and licensing rights, so these can be used if Google is selected as the provider.

---

# 37. Image Licensing

The application should not assume that an image returned by an image search is freely reusable.

Where the provider supplies licensing information, preserve/display it.

Where supported, allow filtering to appropriate licensing categories.

The application is a personal teaching tool and should not automatically republish selected images to a public service.

The teacher remains responsible for determining whether a selected image is appropriate for their intended use.

---

# 38. Design Principles

Prioritize:

1. Simple workflow
2. Fast content generation
3. Teacher control
4. Good image selection
5. Editable AI output
6. Portable exported lessons
7. Offline operation
8. Replaceable AI/image providers

Do not spend significant time on visual polish before the complete workflow works.

---

# 39. Acceptance Criteria

The first iteration is successful if the teacher can:

- [ ] Open the generator locally.
- [ ] Enter a vocabulary word.
- [ ] Optionally enter a reading passage/context.
- [ ] Generate a lesson through OpenRouter.
- [ ] Receive six genuinely different contextual examples.
- [ ] Receive a visual description for each.
- [ ] Receive a concrete image-search query for each.
- [ ] Receive a caption for each.
- [ ] Automatically search for images using the generated query.
- [ ] See six image candidates for an example.
- [ ] Select one image.
- [ ] Move to the next example.
- [ ] Request another batch of images.
- [ ] Edit the search query.
- [ ] Perform a new search.
- [ ] Replace a selected image.
- [ ] Regenerate an individual example.
- [ ] Edit generated captions.
- [ ] Edit the vocabulary meaning.
- [ ] Generate/edit a multiple-choice question.
- [ ] Preview the complete student lesson.
- [ ] Export the lesson as a ZIP.
- [ ] Extract the ZIP.
- [ ] Open the HTML lesson directly.
- [ ] Use the lesson without internet access.
- [ ] Confirm no API keys are present in the exported lesson.
- [ ] Save and reopen unfinished lessons.

---

# 40. Example End-to-End Test

Use:

```text
Vocabulary:
reluctant
```

Expected AI output:

Six different situations illustrating reluctance.

For Example 1:

```text
Visual description:
A boy stands at the edge of a swimming pool while his friends
swim nearby. He appears unsure about entering.

Search query:
child hesitant to enter swimming pool

Caption:
The boy watches his friends swimming but stays at the edge.
```

The application automatically searches for:

```text
child hesitant to enter swimming pool
```

It displays six image candidates.

The teacher selects one.

The teacher clicks:

```text
Next Example
```

The application displays Example 2.

After all six examples:

```text
Review
    ↓
Preview
    ↓
Export
    ↓
reluctant.zip
```

The teacher extracts the ZIP and opens `index.html`.

The lesson works completely offline.

---

# 41. Development Priority

Implement in this order:

### Priority 1 — Basic UI

Vocabulary input and lesson-generation workflow.

### Priority 2 — OpenRouter

Generate structured lesson content.

### Priority 3 — Six contextual examples

Display/edit the generated contexts, captions and search queries.

### Priority 4 — Image-search provider

Implement the replaceable image-search interface.

### Priority 5 — Image selection

Display six results, select one, move to next example.

### Priority 6 — Pagination/search editing

Implement "More Images" and editable search queries.

### Priority 7 — Review and preview

Allow teacher to review the complete lesson.

### Priority 8 — Export

Create standalone HTML + local images ZIP.

### Priority 9 — Draft saving

Save/reopen unfinished lessons.

### Priority 10 — Polish

Improve usability after the complete workflow has been tested.

If a teacher provides a sentence from the target reading material, that sentence should be used to establish the intended meaning of the vocabulary word.

However, the lesson must deliberately move beyond that original context.

The pedagogical goal is:

> **Anchor the meaning in the student's reading, then broaden the meaning through varied contexts.**

For example:

**Story:**
"The reluctant explorer stepped into the dark cave."

**Lesson:**
Students should subsequently encounter reluctance in situations involving swimming, school, food, animals, social situations, and other everyday circumstances.

This helps students understand the vocabulary as a transferable concept rather than memorizing its meaning only in relation to the story.


---

# 42. Guiding Principle

Do not build a vocabulary platform.

Build a **small AI-assisted teacher content generator**.

The desired division of labour is:

**AI**

- Understand the vocabulary
- Generate six varied semantic contexts
- Describe the intended visual scene
- Generate image-search queries
- Generate captions
- Generate assessment questions

**Image-search provider**

- Find candidate images matching the AI-generated visual query

**Teacher**

- Judge the quality of the contexts
- Select the best image from the candidates
- Edit AI-generated content when necessary
- Approve the final lesson

**Exported lesson**

- Deliver the finished activity offline without requiring any AI or external service.

The teacher should never have to manually search for each image unless the automated image-search results are inadequate.

The goal is:

> **One vocabulary word → six contextual examples → six AI-assisted image searches → teacher selects six images → ready-to-use lesson.**

This workflow is the core of v1 and should be considered complete before adding any other integrations.
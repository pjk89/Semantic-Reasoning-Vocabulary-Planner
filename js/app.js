document.addEventListener('DOMContentLoaded', () => {
    // State
    let settings = AppStorage.getSettings();
    let currentLessons = []; // Array of AI generated JSON objects
    let generatedImages = []; // Array of Arrays for Blob URLs: generatedImages[lessonIdx][exampleIdx]

    let currentLessonIndex = 0;
    let currentExampleIndex = 0;

    let imageGenerator = new ImageGenerator(settings);

    // Elements - Settings
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeSettingsBtn = document.getElementById('closeSettingsBtn');
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');

    // Elements - Inputs
    const generationModeSelect = document.getElementById('generationMode');
    const wordInputsContainer = document.getElementById('wordInputsContainer');
    const addWordBtn = document.getElementById('addWordBtn');
    const generateBtn = document.getElementById('generateBtn');

    // Steps
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step1_5 = document.getElementById('step1-5'); // QA
    const step3 = document.getElementById('step3');
    const step4 = document.getElementById('step4');

    // Initialize UI from settings
    if (settings.generationMode) generationModeSelect.value = settings.generationMode;

    // --- Dynamic Input Logic ---
    function updateGenerateBtnState() {
        const inputs = wordInputsContainer.querySelectorAll('.vocab-word-input');
        let hasValidWord = false;
        inputs.forEach(input => {
            if (input.value.trim() !== '') hasValidWord = true;
        });
        generateBtn.disabled = !hasValidWord;
    }

    wordInputsContainer.addEventListener('input', updateGenerateBtnState);
    ['change', 'keyup', 'paste'].forEach(evt => wordInputsContainer.addEventListener(evt, updateGenerateBtnState));

    // Run once on load in case browser autofilled/restored the inputs
    updateGenerateBtnState();

    addWordBtn.addEventListener('click', () => {
        const groups = wordInputsContainer.querySelectorAll('.word-input-group');
        if (groups.length >= 6) return;

        const div = document.createElement('div');
        div.className = 'word-input-group';
        div.innerHTML = `
            <button class="remove-word-btn" title="Remove Word">&times;</button>
            <div class="form-group">
                <label>Vocabulary Word</label>
                <input type="text" class="vocab-word-input" placeholder="e.g., reluctant" autocomplete="off">
            </div>
            <div class="form-group">
                <label>Context Sentence (Optional)</label>
                <textarea class="context-sentence-input" placeholder="e.g., The reluctant explorer stepped into the dark cave." rows="2"></textarea>
            </div>
        `;

        div.querySelector('.remove-word-btn').addEventListener('click', () => {
            div.remove();
            if (wordInputsContainer.querySelectorAll('.word-input-group').length < 6) {
                addWordBtn.disabled = false;
            }
            updateGenerateBtnState();
        });

        wordInputsContainer.appendChild(div);

        if (wordInputsContainer.querySelectorAll('.word-input-group').length >= 6) {
            addWordBtn.disabled = true;
        }
    });

    // --- Settings Modal ---
    settingsBtn.addEventListener('click', () => {
        document.getElementById('cloudflareWorkerUrl').value = settings.cloudflareWorkerUrl || '';
        settingsModal.classList.remove('hidden');
    });

    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });

    saveSettingsBtn.addEventListener('click', () => {
        settings.cloudflareWorkerUrl = document.getElementById('cloudflareWorkerUrl').value.trim();
        settings.generationMode = generationModeSelect.value;
        AppStorage.saveSettings(settings);

        imageGenerator = new ImageGenerator(settings);

        settingsModal.classList.add('hidden');
        showToast('Settings saved successfully!');
    });

    generationModeSelect.addEventListener('change', () => {
        settings.generationMode = generationModeSelect.value;
        AppStorage.saveSettings(settings);
    });

    // --- Workflow: Generation ---
    generateBtn.addEventListener('click', async () => {
        const groups = wordInputsContainer.querySelectorAll('.word-input-group');
        const inputData = [];
        groups.forEach(g => {
            const word = g.querySelector('.vocab-word-input').value.trim();
            const context = g.querySelector('.context-sentence-input').value.trim();
            if (word) inputData.push({ word, context });
        });

        if (inputData.length === 0) return;

        const numExamples = parseInt(document.getElementById('examplesCount').value, 10);
        const gradeLevel = document.getElementById('gradeLevel').value;

        // Transition to Step 2
        switchStep(step1, step2);

        currentLessons = [];
        generatedImages = inputData.map(() => new Array(numExamples).fill(null));
        currentLessonIndex = 0;
        currentExampleIndex = 0;

        const ai = new AIProvider(settings);
        const statusEl = document.getElementById('generationStatus');
        const progList = document.getElementById('progressList');
        progList.innerHTML = ''; // Clear progress

        try {
            // Generate Text for all words
            for (let i = 0; i < inputData.length; i++) {
                statusEl.textContent = `Generating text for "${inputData[i].word}" (${i + 1}/${inputData.length})...`;

                const li = document.createElement('li');
                li.className = 'pending';
                li.textContent = `Reasoning for: ${inputData[i].word}`;
                progList.appendChild(li);

                const lesson = await ai.generateLesson(inputData[i].word, inputData[i].context, numExamples, gradeLevel);
                
                // Shuffle quiz choices and update correct_index
                if (lesson.quiz && lesson.quiz.choices && lesson.quiz.choices.length > 0) {
                    const originalCorrect = lesson.quiz.choices[lesson.quiz.correct_index] || lesson.quiz.choices[0];
                    const shuffled = [...lesson.quiz.choices]
                        .map(value => ({ value, sort: Math.random() }))
                        .sort((a, b) => a.sort - b.sort)
                        .map(({ value }) => value);
                    lesson.quiz.choices = shuffled;
                    lesson.quiz.correct_index = shuffled.indexOf(originalCorrect);
                }

                currentLessons.push(lesson);

                li.className = 'completed';
            }

            if (settings.generationMode === 'qa') {
                showStep1_5_QA();
            } else {
                startImageGeneration();
            }

        } catch (e) {
            showToast(e.message, true);
            switchStep(step2, step1);
        }
    });

    // --- Step 1.5: Manual QA ---
    function showStep1_5_QA() {
        switchStep(step2, step1_5);
        const container = document.getElementById('qaFormsContainer');
        container.innerHTML = '';

        currentLessons.forEach((lesson, lIdx) => {
            const section = document.createElement('div');
            section.className = 'qa-form-group';
            section.innerHTML = `<h3>Word: <span style="text-transform: capitalize;">${lesson.word}</span></h3>`;

            lesson.examples.forEach((ex, eIdx) => {
                section.innerHTML += `
                    <div style="margin-bottom: 1rem; padding-left: 1rem; border-left: 2px solid var(--border);">
                        <strong>Example ${eIdx + 1}</strong>
                        <div class="form-group" style="margin-bottom: 0.5rem; margin-top: 0.5rem;">
                            <label>Caption</label>
                            <input type="text" id="qa-cap-${lIdx}-${eIdx}" value="${ex.caption.replace(/"/g, '&quot;')}">
                        </div>
                        <div class="form-group" style="margin-bottom: 0.5rem;">
                            <label>Visual Description (Image Prompt)</label>
                            <textarea id="qa-vis-${lIdx}-${eIdx}" rows="2">${ex.visual_description}</textarea>
                        </div>
                    </div>
                `;
            });

            // Quiz QA
            let choicesHtml = '';
            lesson.quiz.choices.forEach((choice, cIdx) => {
                const isChecked = cIdx === lesson.quiz.correct_index ? 'checked' : '';
                choicesHtml += `
                    <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center;">
                        <input type="radio" name="qa-quiz-correct-${lIdx}" value="${cIdx}" ${isChecked}>
                        <input type="text" id="qa-quiz-c-${lIdx}-${cIdx}" value="${choice.replace(/"/g, '&quot;')}" style="flex: 1;">
                    </div>
                `;
            });

            section.innerHTML += `
                <div style="margin-top: 1rem; padding-left: 1rem; border-left: 2px solid var(--primary);">
                    <strong>Quiz Question</strong>
                    <div class="form-group" style="margin-bottom: 0.5rem;">
                        <input type="text" id="qa-quiz-q-${lIdx}" value="${lesson.quiz.question.replace(/"/g, '&quot;')}">
                    </div>
                    <strong>Quiz Choices (Select correct answer)</strong>
                    <div style="margin-top: 0.5rem;">
                        ${choicesHtml}
                    </div>
                </div>
            `;
            container.appendChild(section);
        });
    }

    document.getElementById('approveQaBtn').addEventListener('click', () => {
        // Save edited data back to state
        currentLessons.forEach((lesson, lIdx) => {
            lesson.examples.forEach((ex, eIdx) => {
                ex.caption = document.getElementById(`qa-cap-${lIdx}-${eIdx}`).value;
                ex.visual_description = document.getElementById(`qa-vis-${lIdx}-${eIdx}`).value;
            });
            lesson.quiz.question = document.getElementById(`qa-quiz-q-${lIdx}`).value;
            lesson.quiz.choices = lesson.quiz.choices.map((_, cIdx) => {
                return document.getElementById(`qa-quiz-c-${lIdx}-${cIdx}`).value;
            });
            const selectedRadio = document.querySelector(`input[name="qa-quiz-correct-${lIdx}"]:checked`);
            if (selectedRadio) {
                lesson.quiz.correct_index = parseInt(selectedRadio.value);
            }
        });

        // Sync dropdowns
        const initialProvider = document.getElementById('initialImageProviderSelect').value;
        if (initialProvider) {
            document.getElementById('imageProviderSelect').value = initialProvider;
        }

        switchStep(step1_5, step2);
        document.getElementById('generationStatus').textContent = "Preparing images...";
        document.getElementById('progressList').innerHTML = ''; // Clear text progress
        startImageGeneration();
    });


    // --- Step 3: Image Generation & Selection ---
    function startImageGeneration() {
        switchStep(step2, step3);
        preloadImages(); // start background load
        loadCurrentExample();
    }

    async function preloadImages() {
        const defaultProvider = document.getElementById('imageProviderSelect').value || 'cloudflare-phoenix';
        const lIdx = currentLessonIndex;
        
        if (!currentLessons[lIdx]) return;

        const numExamples = currentLessons[lIdx].examples.length;

        for (let eIdx = 0; eIdx < numExamples; eIdx++) {
            if (!generatedImages[lIdx][eIdx]) {
                try {
                    const prompt = currentLessons[lIdx].examples[eIdx].visual_description;
                    const blobUrl = await imageGenerator.generate(prompt, defaultProvider);
                    generatedImages[lIdx][eIdx] = blobUrl;

                    // If user is staring at this exact loader right now, refresh
                    if (lIdx === currentLessonIndex && eIdx === currentExampleIndex && step3.classList.contains('active')) {
                        loadCurrentExample();
                    }
                } catch (e) {
                    console.error("Failed to preload image:", e);
                    if (lIdx === currentLessonIndex && eIdx === currentExampleIndex && step3.classList.contains('active')) {
                        showToast(`Failed to generate image. Try regenerating with a different provider.`, true);
                        document.getElementById('imageLoader').classList.add('hidden');
                        document.getElementById('regenerateImageBtn').disabled = false;
                    }
                }
                // Rate limit spacing
                await new Promise(r => setTimeout(r, 1000));
            }
        }
    }

    function loadCurrentExample() {
        const lesson = currentLessons[currentLessonIndex];
        const example = lesson.examples[currentExampleIndex];

        document.getElementById('exampleCounter').textContent = `Word ${currentLessonIndex + 1}/${currentLessons.length} • Example ${currentExampleIndex + 1}/${lesson.examples.length}`;
        document.getElementById('targetWordDisplay').textContent = lesson.word;
        document.getElementById('visualDescriptionDisplay').textContent = example.visual_description;
        document.getElementById('captionDisplay').textContent = `"${example.caption}"`;

        const loader = document.getElementById('imageLoader');
        const imgEl = document.getElementById('generatedImage');
        const nextBtn = document.getElementById('nextExampleBtn');
        const regenerateBtn = document.getElementById('regenerateImageBtn');

        imgEl.classList.add('hidden');
        loader.classList.remove('hidden');
        nextBtn.disabled = true;
        regenerateBtn.disabled = true;

        const imgUrl = generatedImages[currentLessonIndex][currentExampleIndex];

        if (imgUrl) {
            imgEl.onload = () => {
                loader.classList.add('hidden');
                imgEl.classList.remove('hidden');
                nextBtn.disabled = false;
                regenerateBtn.disabled = false;
            };
            imgEl.onerror = () => {
                loader.classList.add('hidden');
                regenerateBtn.disabled = false;
                showToast("Failed to load image blob.", true);
            };
            imgEl.src = imgUrl;

            // If it's the very last image of the current word
            if (currentExampleIndex === lesson.examples.length - 1) {
                if (currentLessonIndex === currentLessons.length - 1) {
                    nextBtn.textContent = 'Finish & Review';
                } else {
                    nextBtn.textContent = 'Next Word';
                }
            } else {
                nextBtn.textContent = 'Next Example';
            }

        } else {
            // Background preload hasn't reached this yet
        }
    }

    document.getElementById('regenerateImageBtn').addEventListener('click', async () => {
        const btn = document.getElementById('regenerateImageBtn');
        btn.disabled = true;
        document.getElementById('generatedImage').classList.add('hidden');
        document.getElementById('imageLoader').classList.remove('hidden');

        const prompt = currentLessons[currentLessonIndex].examples[currentExampleIndex].visual_description;
        const provider = document.getElementById('imageProviderSelect').value;

        try {
            const newUrl = await imageGenerator.generate(prompt, provider);
            generatedImages[currentLessonIndex][currentExampleIndex] = newUrl;
            loadCurrentExample();
        } catch (e) {
            showToast(e.message, true);
            document.getElementById('imageLoader').classList.add('hidden');
            btn.disabled = false;
        }
    });

    document.getElementById('nextExampleBtn').addEventListener('click', () => {
        const lesson = currentLessons[currentLessonIndex];
        if (currentExampleIndex < lesson.examples.length - 1) {
            currentExampleIndex++;
            loadCurrentExample();
        } else {
            if (currentLessonIndex < currentLessons.length - 1) {
                currentLessonIndex++;
                currentExampleIndex = 0;
                preloadImages(); // start background load for the NEW word
                loadCurrentExample();
            } else {
                showStep4();
            }
        }
    });

    // --- Step 4: Final Review & Export ---
    function showStep4() {
        switchStep(step3, step4);

        const list = document.getElementById('reviewList');
        list.innerHTML = ''; // Clear
        const manualUploadInput = document.getElementById('manualImageUpload');
        
        let targetLIdx = -1;
        let targetEIdx = -1;

        manualUploadInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file && targetLIdx !== -1 && targetEIdx !== -1) {
                const objectUrl = URL.createObjectURL(file);
                generatedImages[targetLIdx][targetEIdx] = objectUrl;
                // Refresh the review step to show new image
                showStep4();
            }
        };

        currentLessons.forEach((lesson, lIdx) => {
            const section = document.createElement('div');
            section.innerHTML = `<h3 style="margin-top: 1.5rem; text-transform: capitalize; color: var(--primary);">${lesson.word}</h3>`;

            lesson.examples.forEach((example, eIdx) => {
                const item = document.createElement('div');
                item.className = 'review-item';

                const imgContainer = document.createElement('div');
                imgContainer.className = 'review-img-container';
                const img = document.createElement('img');
                img.src = generatedImages[lIdx][eIdx];
                imgContainer.appendChild(img);

                const content = document.createElement('div');
                content.className = 'review-content';
                
                const captionContainer = document.createElement('div');
                captionContainer.style = 'display: flex; align-items: flex-start; gap: 8px; margin-bottom: 10px; width: 100%;';
                
                const captionDisplay = document.createElement('p');
                captionDisplay.className = 'review-caption';
                captionDisplay.textContent = `"${example.caption}"`;
                captionDisplay.style = 'margin: 0; flex: 1;';
                
                const editBtnPencil = document.createElement('button');
                editBtnPencil.innerHTML = '✏️';
                editBtnPencil.style = 'background: none; border: none; cursor: pointer; font-size: 1.2rem; padding: 0;';
                editBtnPencil.title = "Edit Caption";
                
                const captionEditInput = document.createElement('textarea');
                captionEditInput.value = example.caption;
                captionEditInput.style = 'flex: 1; display: none; font-family: inherit; font-size: 1rem; padding: 5px;';
                captionEditInput.rows = 2;
                
                editBtnPencil.addEventListener('click', () => {
                    if (captionEditInput.style.display === 'none') {
                        captionDisplay.style.display = 'none';
                        captionEditInput.style.display = 'block';
                        editBtnPencil.innerHTML = '💾';
                        editBtnPencil.title = "Save Caption";
                        captionEditInput.focus();
                    } else {
                        // Save
                        example.caption = captionEditInput.value;
                        captionDisplay.textContent = `"${example.caption}"`;
                        captionDisplay.style.display = 'block';
                        captionEditInput.style.display = 'none';
                        editBtnPencil.innerHTML = '✏️';
                        editBtnPencil.title = "Edit Caption";
                    }
                });
                
                captionContainer.appendChild(captionDisplay);
                captionContainer.appendChild(captionEditInput);
                captionContainer.appendChild(editBtnPencil);

                const actions = document.createElement('div');
                actions.className = 'review-actions';
                const editBtn = document.createElement('button');
                editBtn.className = 'btn secondary';
                editBtn.textContent = 'Regenerate AI';
                editBtn.addEventListener('click', () => {
                    currentLessonIndex = lIdx;
                    currentExampleIndex = eIdx;
                    switchStep(step4, step3);
                    loadCurrentExample();
                });

                const uploadBtn = document.createElement('button');
                uploadBtn.className = 'btn secondary';
                uploadBtn.textContent = 'Upload Image';
                uploadBtn.addEventListener('click', () => {
                    targetLIdx = lIdx;
                    targetEIdx = eIdx;
                    manualUploadInput.click();
                });

                actions.appendChild(editBtn);
                actions.appendChild(uploadBtn);
                content.appendChild(captionContainer);
                content.appendChild(actions);
                item.appendChild(imgContainer);
                item.appendChild(content);
                section.appendChild(item);
            });

            // Add Quiz Review per word
            const quizContainer = document.createElement('div');
            quizContainer.className = 'quiz-review-section';
            quizContainer.style = 'margin-top: 1rem; padding: 1.5rem; background: var(--surface); border: 1px solid var(--border); border-radius: 8px;';
            
            let choicesHtml = '';
            lesson.quiz.choices.forEach((choice, cIdx) => {
                const isChecked = cIdx === lesson.quiz.correct_index ? 'checked' : '';
                choicesHtml += `
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 0.5rem;">
                        <input type="radio" name="review-quiz-correct-${lIdx}" value="${cIdx}" ${isChecked}>
                        <input type="text" id="review-quiz-c-${lIdx}-${cIdx}" value="${choice.replace(/"/g, '&quot;')}" style="flex: 1; padding: 8px; border: 1px solid var(--border); border-radius: 4px;">
                    </div>
                `;
            });

            quizContainer.innerHTML = `
                <h4 style="margin-bottom: 1rem; color: var(--text-primary);">Quiz Options</h4>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 1rem;">
                    <strong style="width: 80px;">Question:</strong>
                    <input type="text" id="review-quiz-q-${lIdx}" value="${lesson.quiz.question.replace(/"/g, '&quot;')}" style="flex: 1; padding: 8px; border: 1px solid var(--border); border-radius: 4px;">
                </div>
                <div style="margin-bottom: 0.5rem;"><strong>Choices:</strong> (Select the correct answer)</div>
                ${choicesHtml}
            `;
            
            section.appendChild(quizContainer);
            list.appendChild(section);
        });

        // Hide the quiz preview logic for now as it's complex for multi-words
        document.querySelector('.quiz-review').style.display = 'none';
    }

    document.getElementById('exportBtn').addEventListener('click', async () => {
        const btn = document.getElementById('exportBtn');
        btn.disabled = true;
        btn.textContent = 'Exporting...';

        // Save all quiz edits
        currentLessons.forEach((lesson, lIdx) => {
            const qInput = document.getElementById(`review-quiz-q-${lIdx}`);
            if (qInput) lesson.quiz.question = qInput.value;
            
            lesson.quiz.choices = lesson.quiz.choices.map((_, cIdx) => {
                const cInput = document.getElementById(`review-quiz-c-${lIdx}-${cIdx}`);
                return cInput ? cInput.value : lesson.quiz.choices[cIdx];
            });
            
            const selectedRadio = document.querySelector(`input[name="review-quiz-correct-${lIdx}"]:checked`);
            if (selectedRadio) {
                lesson.quiz.correct_index = parseInt(selectedRadio.value);
            }
        });

        try {
            await LessonExporter.exportLesson(currentLessons, generatedImages);
            showToast('Lesson exported successfully!');
        } catch (e) {
            showToast(e.message, true);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Export Lesson (ZIP)';
        }
    });

    // Helpers
    function switchStep(oldStep, newStep) {
        oldStep.classList.remove('active');
        oldStep.classList.add('hidden');
        newStep.classList.remove('hidden');
        newStep.classList.add('active');
    }

    function showToast(message, isError = false) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast show ${isError ? 'error' : ''}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }
});

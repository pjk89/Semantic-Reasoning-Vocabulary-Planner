class LessonExporter {
    /**
     * @param {Array} currentLessons - array of lesson data objects
     * @param {Array} generatedImages - array of arrays of image URLs
     */
    static async exportLesson(currentLessons, generatedImages) {
        const zip = new JSZip();
        const imagesFolder = zip.folder("images");

        // Download images and add to ZIP
        for (let lIdx = 0; lIdx < currentLessons.length; lIdx++) {
            const lessonData = currentLessons[lIdx];
            for (let i = 0; i < lessonData.examples.length; i++) {
                const example = lessonData.examples[i];
                const imageUrl = generatedImages[lIdx][i];
                
                if (!imageUrl) continue;

                try {
                    // Fetch image directly
                    const response = await fetch(imageUrl);
                    if (!response.ok) throw new Error('Network response was not ok');
                    
                    const blob = await response.blob();
                    
                    // Determine extension based on content type or url
                    let ext = 'jpg';
                    if (blob.type === 'image/png') ext = 'png';
                    else if (blob.type === 'image/gif') ext = 'gif';
                    else if (blob.type === 'image/webp') ext = 'webp';

                    const filename = `word${lIdx + 1}-image0${i + 1}.${ext}`;
                    imagesFolder.file(filename, blob);
                    
                    // Update lessonData with relative path for offline use
                    example.localImagePath = `images/${filename}`;

                } catch (err) {
                    console.warn(`Could not download image ${imageUrl}`, err);
                    throw new Error(`Failed to download image ${i + 1} for word ${lessonData.word}.`);
                }
            }
        }

        // Embed template content directly to avoid file:// CORS issues
        let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vocabulary Lesson</title>
    <!-- INJECT_CSS -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <!-- INJECT_DATA -->
</head>
<body>
    <div id="app" class="container">
        <!-- Screens will be dynamically rendered here -->
    </div>
    <!-- INJECT_JS -->
</body>
</html>`;
        
        const cssContent = `:root { --primary: #3772C4; --secondary: #6BCAA1; --background: #3772C4; --surface: #FFFFFF; --text-primary: #FFFFFF; --text-secondary: #E0E0E0; --border: #E5E7EB; --radius: 8px; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Inter', sans-serif; background-color: var(--background); color: var(--text-primary); line-height: 1.6; display: flex; justify-content: center; padding: 20px; margin: 0; min-height: 100vh; }
.container { max-width: 1400px; width: 95%; margin: 0 auto; }
.lesson-section { margin-bottom: 60px; padding-bottom: 40px; }
.lesson-section:last-child { margin-bottom: 0; padding-bottom: 0; }
.header-section { text-align: center; margin-bottom: 30px; }
h1.word-reveal { font-size: 3.5rem; color: #FFFFFF; text-transform: lowercase; margin-bottom: 10px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 15px; }
h1.word-reveal::before { content: '🔊'; font-size: 1.5rem; background: rgba(255,255,255,0.2); border-radius: 50%; width: 40px; height: 40px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
.meaning { font-size: 1.25rem; color: #FFFFFF; margin-top: 15px; font-weight: 500; }
.controls { display: flex; justify-content: center; margin-bottom: 20px; }
.toggle-label { display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 500; color: #FFFFFF; }
.toggle-switch { position: relative; width: 44px; height: 24px; background: rgba(255,255,255,0.3); border-radius: 12px; transition: background 0.3s; }
.toggle-switch::after { content: ''; position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; background: white; border-radius: 50%; transition: transform 0.3s; }
input[type="checkbox"]:checked + .toggle-switch { background: var(--secondary); }
input[type="checkbox"]:checked + .toggle-switch::after { transform: translateX(20px); }
input[type="checkbox"] { display: none; }
.grid-gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 10px; margin-bottom: 40px; }
@media (min-width: 1024px) { .grid-gallery { grid-template-columns: repeat(3, 1fr); } }
.grid-item { display: flex; flex-direction: column; background: transparent; overflow: hidden; page-break-inside: avoid; }
.grid-item img { width: 100%; aspect-ratio: 4/3; object-fit: cover; cursor: pointer; transition: transform 0.2s; border-radius: 4px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
.grid-item img:hover { transform: scale(1.02); }
.caption { display: none; padding: 12px; font-size: 1rem; text-align: center; font-style: italic; color: #FFFFFF; background: rgba(0,0,0,0.5); border-radius: 4px; margin-top: 5px; }
.show-captions .caption { display: block; }
.quiz-section { background: var(--surface); color: #333333; padding: 40px; border-radius: var(--radius); text-align: center; page-break-inside: avoid; max-width: 800px; margin: 0 auto; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
.quiz-question { font-size: 1.5rem; font-weight: 600; margin-bottom: 25px; color: #111827; }
.quiz-options { display: flex; flex-direction: column; gap: 15px; margin: 0 auto; }
.quiz-option { background: #F9FAFB; border: 2px solid var(--border); padding: 15px 20px; border-radius: 8px; cursor: pointer; font-size: 1.1rem; transition: all 0.2s; text-align: left; }
.quiz-option:hover { border-color: var(--primary); background: #F3F6FA; }
.quiz-option.correct { background: #D1FAE5; border-color: #10B981; color: #065F46; }
.quiz-option.wrong { background: #FEE2E2; border-color: #EF4444; color: #991B1B; }
.feedback { margin-top: 20px; font-size: 1.2rem; font-weight: 600; min-height: 30px; }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 1000; opacity: 0; pointer-events: none; transition: opacity 0.3s; padding: 20px; }
.modal-overlay.active { opacity: 1; pointer-events: auto; }
.modal-img { max-width: 100%; max-height: 75vh; object-fit: contain; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
.modal-caption-container { margin-top: 20px; display: flex; flex-direction: column; align-items: center; min-height: 60px; }
.modal-caption { color: white; font-size: 1.5rem; font-style: italic; text-align: center; max-width: 800px; display: none; }
.modal-caption.visible { display: block; }
.reveal-caption-btn { background: var(--secondary); color: white; border: none; padding: 12px 24px; border-radius: 25px; cursor: pointer; font-size: 1.1rem; font-weight: 600; font-family: inherit; transition: all 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
.reveal-caption-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0,0,0,0.15); }
.modal-close { position: absolute; top: 20px; right: 30px; color: white; font-size: 3rem; cursor: pointer; line-height: 1; opacity: 0.8; }
.modal-close:hover { opacity: 1; }
@media print { 
    body { background: white !important; color: black !important; padding: 0; } 
    h1.word-reveal { color: black !important; }
    h1.word-reveal::before { display: none; }
    .meaning { color: black !important; }
    .container { box-shadow: none; border: none; padding: 0; width: 100%; max-width: none; } 
    .lesson-section { page-break-after: always; border: none; margin-bottom: 0; } 
    .controls, .modal-overlay { display: none !important; } 
    .caption { display: block !important; color: black !important; background: transparent !important; } 
    .grid-item img { box-shadow: none !important; }
    .quiz-section { box-shadow: none !important; background: white !important; border: 1px solid #ccc; }
    .quiz-option { break-inside: avoid; }
}`;

        const jsContent = `document.addEventListener('DOMContentLoaded', () => {
    if (typeof CURRENT_LESSONS === 'undefined' || !CURRENT_LESSONS.length) {
        document.getElementById('app').innerHTML = '<h2>Error: Lesson data not found.</h2>';
        return;
    }
    const app = document.getElementById('app');
    
    function render() {
        app.innerHTML = '';
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = '<div class="modal-close">&times;</div><img class="modal-img" src="" alt=""><div class="modal-caption-container"><button class="reveal-caption-btn">Reveal Caption</button><div class="modal-caption"></div></div>';
        document.body.appendChild(modal);
        
        const revealBtn = modal.querySelector('.reveal-caption-btn');
        const captionDiv = modal.querySelector('.modal-caption');
        
        revealBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            captionDiv.classList.add('visible');
            revealBtn.style.display = 'none';
        });

        modal.addEventListener('click', () => {
            modal.classList.remove('active');
        });
        
        CURRENT_LESSONS.forEach((lesson, lessonIdx) => {
            const section = document.createElement('div');
            section.className = 'lesson-section';

            const header = document.createElement('div');
            header.className = 'header-section';
            header.innerHTML = \`<h1 class="word-reveal">\${lesson.word}</h1><p class="meaning">Look at the pictures below. What do all three pictures have in common?</p>\`;
            section.appendChild(header);
            
            const controls = document.createElement('div');
            controls.className = 'controls';
            const toggleId = 'toggle-' + lessonIdx;
            controls.innerHTML = \`
                <label class="toggle-label" for="\${toggleId}">
                    <input type="checkbox" id="\${toggleId}">
                    <div class="toggle-switch"></div>
                    <span>Show Captions</span>
                </label>
            \`;
            section.appendChild(controls);

            const toggleInput = controls.querySelector('input');
            toggleInput.addEventListener('change', (e) => {
                if (e.target.checked) {
                    section.classList.add('show-captions');
                } else {
                    section.classList.remove('show-captions');
                }
            });

            const grid = document.createElement('div');
            grid.className = 'grid-gallery';
            lesson.examples.forEach(ex => {
                const item = document.createElement('div');
                item.className = 'grid-item';
                const img = document.createElement('img');
                img.src = ex.localImagePath;
                
                img.addEventListener('click', () => {
                    modal.querySelector('.modal-img').src = ex.localImagePath;
                    captionDiv.textContent = \`"\${ex.caption}"\`;
                    captionDiv.classList.remove('visible');
                    revealBtn.style.display = 'block';
                    modal.classList.add('active');
                });
                
                const caption = document.createElement('div');
                caption.className = 'caption';
                caption.textContent = \`"\${ex.caption}"\`;
                item.appendChild(img);
                item.appendChild(caption);
                grid.appendChild(item);
            });
            section.appendChild(grid);

            const quizContainer = document.createElement('div');
            quizContainer.className = 'quiz-section';
            const qText = document.createElement('h2');
            qText.className = 'quiz-question';
            qText.textContent = lesson.quiz.question;
            quizContainer.appendChild(qText);
            
            const optionsDiv = document.createElement('div');
            optionsDiv.className = 'quiz-options';
            let answered = false;
            const feedback = document.createElement('div');
            feedback.className = 'feedback';
            
            lesson.quiz.choices.forEach((choice, index) => {
                const opt = document.createElement('button');
                opt.className = 'quiz-option';
                opt.textContent = choice;
                opt.onclick = () => {
                    if (answered) return;
                    answered = true;
                    if (index === lesson.quiz.correct_index) {
                        opt.classList.add('correct');
                        feedback.textContent = 'Correct! Great job.';
                        feedback.style.color = '#10B981';
                    } else {
                        opt.classList.add('wrong');
                        feedback.textContent = 'Incorrect.';
                        feedback.style.color = '#EF4444';
                        optionsDiv.children[lesson.quiz.correct_index].classList.add('correct');
                    }
                };
                optionsDiv.appendChild(opt);
            });
            quizContainer.appendChild(optionsDiv);
            quizContainer.appendChild(feedback);
            section.appendChild(quizContainer);

            app.appendChild(section);
        });
    }
    render();
});`;

        // Embed CSS and JS into HTML to make it truly standalone
        htmlContent = htmlContent.replace('<!-- INJECT_CSS -->', `<style>\n${cssContent}\n</style>`);
        htmlContent = htmlContent.replace('<!-- INJECT_JS -->', `<script>\n${jsContent}\n</script>`);
        
        // Inject data
        const dataScript = `<script>\nconst CURRENT_LESSONS = ${JSON.stringify(currentLessons, null, 2)};\n</script>`;
        htmlContent = htmlContent.replace('<!-- INJECT_DATA -->', dataScript);

        zip.file("index.html", htmlContent);

        // Generate zip
        const content = await zip.generateAsync({ type: "blob" });
        
        // Trigger download
        const url = URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        const safeWord = currentLessons.length > 0 ? currentLessons[0].word.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'vocabulary';
        a.download = `${safeWord}_lesson_pack.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

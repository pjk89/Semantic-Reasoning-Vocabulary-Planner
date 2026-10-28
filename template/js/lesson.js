document.addEventListener('DOMContentLoaded', () => {
    if (typeof LESSON_DATA === 'undefined') {
        document.getElementById('app').innerHTML = '<h2>Error: Lesson data not found.</h2>';
        return;
    }

    const app = document.getElementById('app');

    function render() {
        app.innerHTML = '';
        
        // Header Section
        const header = document.createElement('div');
        header.className = 'header-section';
        header.innerHTML = `
            <h1 class="word-reveal">${LESSON_DATA.word}</h1>
            <p class="meaning">Look at the pictures below. What do all three pictures have in common?</p>
        `;
        app.appendChild(header);

        // 3x2 Grid
        const grid = document.createElement('div');
        grid.className = 'grid-gallery';
        
        LESSON_DATA.examples.forEach(ex => {
            const item = document.createElement('div');
            item.className = 'grid-item';
            
            const img = document.createElement('img');
            img.src = ex.localImagePath;
            
            const caption = document.createElement('div');
            caption.className = 'caption';
            caption.textContent = `"${ex.caption}"`;
            
            item.appendChild(img);
            item.appendChild(caption);
            grid.appendChild(item);
        });
        
        app.appendChild(grid);

        // Quiz Section
        const quizContainer = document.createElement('div');
        quizContainer.className = 'quiz-section';
        
        const qText = document.createElement('h2');
        qText.className = 'quiz-question';
        qText.textContent = LESSON_DATA.quiz.question;
        quizContainer.appendChild(qText);
        
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'quiz-options';
        
        let answered = false;
        const feedback = document.createElement('div');
        feedback.className = 'feedback';

        LESSON_DATA.quiz.choices.forEach((choice, index) => {
            const opt = document.createElement('button');
            opt.className = 'quiz-option';
            opt.textContent = choice;
            opt.onclick = () => {
                if (answered) return;
                answered = true;
                
                if (index === LESSON_DATA.quiz.correct_index) {
                    opt.classList.add('correct');
                    feedback.textContent = 'Correct! Great job.';
                    feedback.style.color = '#10B981';
                } else {
                    opt.classList.add('wrong');
                    feedback.textContent = 'Incorrect.';
                    feedback.style.color = '#EF4444';
                    optionsDiv.children[LESSON_DATA.quiz.correct_index].classList.add('correct');
                }
            };
            optionsDiv.appendChild(opt);
        });
        
        quizContainer.appendChild(optionsDiv);
        quizContainer.appendChild(feedback);
        app.appendChild(quizContainer);
    }

    render();
});

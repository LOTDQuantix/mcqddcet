import { MATHS_PREMIUM, PHYSICS_PREMIUM } from "./premium_bank.js";

/**
 * DDCET PREMIUM GENERATOR
 * Rebuilt to produce high-quality, exam-style MCQs with zero placeholders.
 */

/**
 * Procedurally generate a full batch of 100 MCQs.
 * Uses a combination of bank templates and high-quality variations.
 */
export function generateDailyBatch() {
    const mcqs = [];
    
    // Target distribution:
    // 50 Maths, 50 Physics
    // 30 Easy, 40 Medium, 30 Hard
    
    // Per subject: 
    // 15 Easy, 20 Medium, 15 Hard
    
    const subjects = [
        { name: "Maths", bank: MATHS_PREMIUM },
        { name: "Physics", bank: PHYSICS_PREMIUM }
    ];

    subjects.forEach(sub => {
        const counts = { "Easy": 15, "Medium": 20, "Hard": 15 };
        
        // Flatten the bank by difficulty
        const pool = { "Easy": [], "Medium": [], "Hard": [] };
        Object.keys(sub.bank).forEach(topic => {
            sub.bank[topic].forEach(q => {
                pool[q.d].push({ ...q, subject: sub.name, topic });
            });
        });

        Object.keys(counts).forEach(diff => {
            const needed = counts[diff];
            const available = pool[diff];
            
            if (available.length === 0) {
                throw new Error(`No ${diff} questions found for ${sub.name}`);
            }

            // Shuffle available
            const shuffled = [...available].sort(() => Math.random() - 0.5);
            
            for (let i = 0; i < needed; i++) {
                const base = shuffled[i % shuffled.length];
                
                // Create final MCQ object
                const options = [base.a, ...base.o];
                const finalOptions = [...options].sort(() => Math.random() - 0.5);
                const correctLetter = ["A", "B", "C", "D"][finalOptions.indexOf(base.a)];

                mcqs.push({
                    question: base.q,
                    option_a: finalOptions[0],
                    option_b: finalOptions[1],
                    option_c: finalOptions[2],
                    option_d: finalOptions[3],
                    correct_answer: correctLetter,
                    subject: base.subject,
                    topic: base.topic,
                    difficulty: base.d
                });
            }
        });
    });

    // Final shuffle of the entire batch
    return mcqs.sort(() => Math.random() - 0.5);
}

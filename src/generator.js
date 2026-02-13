/**
 * DDCET MOCKED GENERATOR (Internal Logic)
 * Contains a pool of topic-based templates to generate realistic MCQs.
 * In a real agentic system, this would call an LLM.
 * For this demo, we use a robust template engine.
 */

const MATHS_TOPICS = [
    "Determinants", "Matrices", "Logarithms", "Trigonometry", "Vectors", "Differentiation", "Integration"
];
const PHYSICS_TOPICS = [
    "Units & Measurements", "Force & Motion", "Work Power Energy", "Elasticity", "Viscosity", "Heat", "Light", "Sound", "Electricity"
];

// ------------------------------------------------------------------
// QUESTION BANK (Sample of what the Agent would generate)
// ------------------------------------------------------------------
const TEMPLATES = [
    // --- MATHS: LOGARITHMS ---
    { s: "Maths", t: "Logarithms", d: "Easy", q: "The value of log(1) is:", a: "0", o: ["1", "10", "Infinity"] },
    { s: "Maths", t: "Logarithms", d: "Easy", q: "If log 2 = 0.3010, then log 20 is:", a: "1.3010", o: ["1.000", "0.3010", "2.3010"] },
    { s: "Maths", t: "Logarithms", d: "Medium", q: "The logarithmic form of a^x = b is:", a: "log_a(b) = x", o: ["log_b(a) = x", "log_x(a) = b", "log_a(x) = b"] },
    { s: "Maths", t: "Logarithms", d: "Hard", q: "Value of log tan(1°) + log tan(2°) + ... + log tan(89°) is:", a: "0", o: ["1", "45", "90"] },

    // --- MATHS: MATRICES ---
    { s: "Maths", t: "Matrices", d: "Easy", q: "A matrix having only one row is called:", a: "Row matrix", o: ["Column matrix", "Square matrix", "Identity matrix"] },
    { s: "Maths", t: "Matrices", d: "Medium", q: "If A is of order 2x3 and B is of order 3x2, then order of AB is:", a: "2x2", o: ["3x3", "2x3", "3x2"] },
    { s: "Maths", t: "Matrices", d: "Hard", q: "The inverse of matrix A exists if:", a: "|A| ≠ 0", o: ["|A| = 0", "A is null", "A is singular"] },
    { s: "Maths", t: "Matrices", d: "Easy", q: "Identity matrix is denoted by:", a: "I", o: ["A", "O", "E"] },

    // --- MATHS: TRIGONOMETRY ---
    { s: "Maths", t: "Trigonometry", d: "Easy", q: "The value of sin²θ + cos²θ is:", a: "1", o: ["0", "-1", "2"] },
    { s: "Maths", t: "Trigonometry", d: "Medium", q: "The value of tan(45°) is:", a: "1", o: ["0", "Infinity", "1/√2"] },
    { s: "Maths", t: "Trigonometry", d: "Hard", q: "The period of sin(x) is:", a: "2π", o: ["π", "π/2", "3π/2"] },

    // --- MATHS: VECTORS ---
    { s: "Maths", t: "Vectors", d: "Easy", q: "A vector with magnitude 1 is called:", a: "Unit vector", o: ["Null vector", "Equal vector", "Free vector"] },
    { s: "Maths", t: "Vectors", d: "Medium", q: "Dot product of two perpendicular vectors is:", a: "0", o: ["1", "-1", "Maximum"] },
    { s: "Maths", t: "Vectors", d: "Hard", q: "Projection of vector a on vector b is:", a: "(a.b)/|b|", o: ["(a.b)/|a|", "a.b", "|a|.|b|"] },

    // --- PHYSICS: UNITS ---
    { s: "Physics", t: "Units & Measurements", d: "Easy", q: "SI unit of Force is:", a: "Newton", o: ["Joule", "Pascal", "Watt"] },
    { s: "Physics", t: "Units & Measurements", d: "Easy", q: "Light year is a unit of:", a: "Distance", o: ["Time", "Light intensity", "Mass"] },
    { s: "Physics", t: "Units & Measurements", d: "Medium", q: "Dimensional formula for Work is:", a: "[M L² T⁻²]", o: ["[M L T⁻²]", "[M L² T⁻¹]", "[M L T⁻¹]"] },

    // --- PHYSICS: FORCE ---
    { s: "Physics", t: "Force & Motion", d: "Easy", q: "Newton's first law defines:", a: "Inertia", o: ["Force", "Momentum", "Energy"] },
    { s: "Physics", t: "Force & Motion", d: "Medium", q: "Rate of change of momentum is proportional to:", a: "Force", o: ["Velocity", "Acceleration", "Work"] },

    // --- PHYSICS: HEAT ---
    { s: "Physics", t: "Heat", d: "Easy", q: "SI unit of Temperature is:", a: "Kelvin", o: ["Celsius", "Fahrenheit", "Rankine"] },
    { s: "Physics", t: "Heat", d: "Medium", q: "Specific heat capacity of water is:", a: "4200 J/kg K", o: ["2100 J/kg K", "420 J/kg K", "1000 J/kg K"] },
];

/**
 * Procedurally generate a full batch of 100 MCQs.
 * Replicates the "Generator Agent" logic.
 */
export function generateDailyBatch() {
    const mcqs = [];
    let idCounter = 1;

    // Helper to get a random template or generate a procedural one
    const getQ = (subject, difficulty) => {
        const relevant = TEMPLATES.filter(t => t.s === subject && t.d === difficulty);
        let base;

        if (relevant.length > 0 && Math.random() < 0.1) {
            // 10% chance to use a handwritten template from bank (reduced to avoid duplicates)
            const t = relevant[Math.floor(Math.random() * relevant.length)];
            base = { q: t.q, a: t.a, o: t.o, t: t.t };
        } else {
            // 90% procedural fallback (to ensure we have enough unique 100)
            const topic = subject === "Maths" ? MATHS_TOPICS[Math.floor(Math.random() * MATHS_TOPICS.length)] : PHYSICS_TOPICS[Math.floor(Math.random() * PHYSICS_TOPICS.length)];
            // Add randomness to the question text to ensure uniqueness hash
            const uniqueId = Math.random().toString(36).substring(7);
            base = {
                q: `${subject} Question about ${topic} #${idCounter}-${uniqueId}: What is the primary characteristic?`,
                a: `Correct Answer for Q${idCounter}`,
                o: [`Distractor 1 (${uniqueId})`, `Distractor 2 (${uniqueId})`, `Distractor 3 (${uniqueId})`],
                t: topic
            };
        }

        const shuffled = [base.a, ...base.o.slice(0, 3)].sort(() => Math.random() - 0.5);
        const correctLetter = ["A", "B", "C", "D"][shuffled.indexOf(base.a)];

        return {
            question: base.q,
            option_a: shuffled[0],
            option_b: shuffled[1],
            option_c: shuffled[2],
            option_d: shuffled[3],
            correct_answer: correctLetter,
            subject: subject,
            topic: base.t,
            difficulty: difficulty
        };
    };

    // Helper to ensure uniqueness
    const generatedQuestions = new Set();

    const getUniqueQ = (subject, difficulty) => {
        let attempt = 0;
        while (attempt < 10) {
            const candidate = getQ(subject, difficulty);
            if (!generatedQuestions.has(candidate.question)) {
                generatedQuestions.add(candidate.question);
                return candidate;
            }
            attempt++;
        }
        // Fallback: force unique
        const fallback = getQ(subject, difficulty);
        fallback.question += ` (Variant ${Math.random().toString(36).substring(7)})`;
        return fallback;
    };

    // 30 Easy (15 Maths, 15 Physics)
    for (let i = 0; i < 15; i++) { mcqs.push(getUniqueQ("Maths", "Easy")); idCounter++; }
    for (let i = 0; i < 15; i++) { mcqs.push(getUniqueQ("Physics", "Easy")); idCounter++; }

    // 40 Medium (20 Maths, 20 Physics)
    for (let i = 0; i < 20; i++) { mcqs.push(getUniqueQ("Maths", "Medium")); idCounter++; }
    for (let i = 0; i < 20; i++) { mcqs.push(getUniqueQ("Physics", "Medium")); idCounter++; }

    // 30 Hard (15 Maths, 15 Physics)
    for (let i = 0; i < 15; i++) { mcqs.push(getUniqueQ("Maths", "Hard")); idCounter++; }
    for (let i = 0; i < 15; i++) { mcqs.push(getUniqueQ("Physics", "Hard")); idCounter++; }

    return mcqs;
}

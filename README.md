# 🔥 DDCET MCQ ELITE: BATCH GENERATION ENGINE 🔥

> **UNLEASHING THE NEXUS OF CONCEPTUAL SUPREMACY**

Welcome to the **DDCET MCQ Generation Suite!** This isn't just a question bank; it's a precisely engineered, high-fidelity generator designed to push the boundaries of Maths and Physics mastery for DDCET aspirants.

---

## 🚀 MISSION CORE
We generate **Tier-S Conceptual MCQs** that leave rote memorization in the dust. Every question is a battle-tested challenge involving:
- 🧠 **Applied Reasoning**: No direct formula recall. THINK or FAIL.
- 🔗 **Multi-Step Integration**: Connecting multiple concepts in a single strike.
- 📐 **LaTeX Precision**: Crisp, mathematical beauty in every equation.
- 🚫 **Zero Duplicate Policy**: SHA-256 enforcement on the database layer.

---

## 🛠️ THE ARCHITECTURE

### 🧠 The Brain (`src/generator.js`)
- **Procedural Variation**: Shuffles options and adapts bases to ensure no two sessions are identical.
- **Dynamic Balancing**: Maintains a strict 30/40/30 difficulty ratio (Easy/Medium/Hard).

### 🛡️ The Shield (`src/storage.js`)
- **Supabase Integration**: Direct, high-speed batch inserts.
- **Strict Deduplication**: Every question is normalized and hashed before the DB even sees it.

### 🧪 The Vault (`material/`)
- Contains the raw DDCET syllabus and reference papers. Restricted and ignored by Git to keep the codebase lean.

---

## 📊 BATCH STATUSBOARD

| Batch | Status | Quality Tier | Highlights |
| :--- | :--- | :--- | :--- |
| **Batch 1** | ✅ DEPLOYED | Standard | Foundation concepts. |
| **Batch 2** | ✅ DEPLOYED | Advanced | Increased depth. |
| **Batch 3** | 🛠️ IN PROGRESS | **SUPREME** | Multi-step reasoning & complex Physics scenarios. |

---

## 🛠️ DEVELOPER NEXUS

### Standard Workflow
1. **Clean**: `python .agent/scripts/checklist.py .`
2. **Generate**: Trigger via internal generator scripts.
3. **Verify**: Strict SHA-256 collision checks.
4. **Deploy**: Batch insert to Supabase.

### Commands (/slash)
- `/generate-batch`: (Planned) Trigger next 100 MCQs.
- `/status`: Check DB saturation and parity.

---

## ⚠️ PROTOCOLS
- **PURPLE BAN**: UI elements must avoid violet/purple hues (Premium Aesthetics Only).
- **NO PLACEHOLDERS**: Every question must be production-ready.
- **LATEX MANDATORY**: `\int`, `\matrix`, `\vec` — use it all.

---

*“Physics is the poetry of nature, and Maths is its language. We speak both fluently.”* 🌌

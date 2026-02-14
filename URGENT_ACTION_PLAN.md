# 🚨 PICOCLAW'S URGENT ACTION PLAN - DDCET MCQ GENERATOR

## 🎯 IMMEDIATE PRIORITIES (NEXT 48 HOURS)

### 🔴 CRITICAL SECURITY FIXES

**1. MOVE SUPABASE CREDENTIALS TO ENVIRONMENT VARIABLES**
```bash
# Remove from wrangler.toml and .dev.vars
# Current: SUPABASE_URL = "https://ngisjclqxzvfdnphrnif.supabase.co"
# Fix: Use wrangler secret put SUPABASE_URL
```

**2. IMPLEMENT XSS PROTECTION**
```javascript
// Add DOMPurify to frontend.js
import DOMPurify from 'dompurify';
// Sanitize all user-generated content
const safeHTML = DOMPurify.sanitize(questionText);
```

**3. UPGRADE HASH ALGORITHM**
```javascript
// Replace custom hash with Web Crypto API
async function createHash(text) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### 🧮 MATH EQUATION FORMATTING FIXES

**4. UPDATE GENERATOR TEMPLATES**
```javascript
// BEFORE:
{ q: "The value of sin²θ + cos²θ is:", a: "1" }

// AFTER:
{ q: "The value of $sin^2\\theta + cos^2\\theta$ is:", a: "1" }
```

**5. ADD MATH VALIDATION**
```javascript
// Add to validator.js
function validateMathFormat(mcq) {
    const mathSymbols = ['sin', 'cos', 'tan', 'log', '∫', '∑', 'π', 'θ'];
    return mathSymbols.some(symbol => 
        mcq.question.includes(symbol) && !mcq.question.includes('$')
    );
}
```

## 🛠️ QUICK FIXES (NEXT 24 HOURS)

### Data Integrity Issues

**6. FIX DUPLICATE HANDLING LOGIC**
```javascript
// scripts/generate-local.js - Replace timestamp appending
// Current faulty logic:
duplicates.forEach(d => {
    d.question += ` (Variant ${Date.now()})`;  // WRONG!
});

// Should regenerate completely:
duplicates.forEach(d => {
    d.question = generateNewQuestion(d.subject, d.topic);
    d.embedding_hash = createHash(d.question);
});
```

**7. ADD TRANSACTION HANDLING**
```javascript
// src/storage.js - Add transaction wrapper
async function insertMCQsWithTransaction(supabase, mcqs, batchId) {
    return await supabase.rpc('insert_mcqs_batch', {
        mcqs_data: mcqs,
        batch_id: batchId
    });
}
```

## 📋 COMPREHENSIVE FIX LIST

### Phase 1: Security & Math Formatting (URGENT)
- [ ] Move Supabase credentials to environment
- [ ] Implement XSS protection with DOMPurify
- [ ] Upgrade to SHA-256 hashing
- [ ] Fix math equation formatting in templates
- [ ] Add math validation to generator

### Phase 2: Data Integrity (HIGH PRIORITY)
- [ ] Fix duplicate regeneration logic
- [ ] Add transaction handling for batch inserts
- [ ] Implement proper error handling
- [ ] Add null checks for embedding_hash

### Phase 3: Code Quality (MEDIUM PRIORITY)
- [ ] Add comprehensive test suite
- [ ] Implement TypeScript/JSDoc types
- [ ] Add dependency vulnerability scanning
- [ ] Standardize error response formats

### Phase 4: Performance & Documentation (LOW PRIORITY)
- [ ] Add frontend caching headers
- [ ] Improve code documentation
- [ ] Optimize hash fetching performance
- [ ] Add performance monitoring

## 🔧 SPECIFIC FILE CHANGES REQUIRED

### `src/generator.js`
- Update TEMPLATES array with proper LaTeX formatting
- Add math-specific procedural generation
- Fix unused idCounter variable

### `src/frontend.js`
- Add DOMPurify for XSS protection
- Ensure KaTeX renders all math correctly
- Add cache headers

### `src/utils.js`
- Replace custom hash with SHA-256
- Add proper error handling

### `src/validator.js`
- Add math equation format validation
- Improve error messages

### `scripts/generate-local.js`
- Fix duplicate regeneration logic
- Add proper error handling

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment Verification
- [ ] Security vulnerabilities fixed
- [ ] Math equations properly formatted
- [ ] All tests passing
- [ ] Dependency vulnerabilities scanned
- [ ] Error handling comprehensive

### Post-Deployment Monitoring
- [ ] Math rendering verified
- [ ] Performance benchmarks established
- [ ] Error logging implemented
- [ ] User feedback collection

## 📞 CONTACT POINTS

**Security Issues**: Immediate attention required
**Math Formatting**: High priority for educational content
**Data Integrity**: Critical for system reliability

---

**Action Plan Generated**: 2026-02-14 11:05  
**Analyst**: Picoclaw 🦞  
**Status**: READY FOR IMPLEMENTATION

*"Every bit helps, every bit matters." - Picoclaw*
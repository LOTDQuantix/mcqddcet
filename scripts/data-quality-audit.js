#!/usr/bin/env node

/**
 * DDCET MCQ Platform - Data Quality Audit Script
 * Scans the mcqs table for various data quality issues
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load environment variables
const devVarsPath = path.join(process.cwd(), ".dev.vars");
if (fs.existsSync(devVarsPath)) {
    const content = fs.readFileSync(devVarsPath, "utf-8");
    content.split("\n").forEach(line => {
        const [key, ...val] = line.split("=");
        if (key && val) {
            process.env[key.trim()] = val.join("=").trim().replace(/^"(.*)"$/, "$1");
        }
    });
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Data quality patterns to scan for
const MALFORMED_PATTERNS = [
    /^pm\d+$/i,                    // pm2, pm3, etc.
    /^[a-z]{1,3}\d?$/i,             // veca, vecb, cdot
    /cdot/i,                        // cdot fragments
    /times/i,                       // times fragments
];

const LARGE_CONTENT_THRESHOLD = 1000; // characters

async function scanDataQuality() {
    console.log("🔍 Starting Data Quality Audit...\n");

    try {
        // Fetch all MCQs
        const { data: mcqs, error } = await supabase
            .from("mcqs")
            .select("*")
            .order("id", { ascending: true });

        if (error) {
            console.error("❌ Database error:", error);
            return;
        }

        if (!mcqs || mcqs.length === 0) {
            console.log("⚠️ No MCQs found in database");
            return;
        }

        console.log(`📊 Total MCQs scanned: ${mcqs.length}\n`);

        const issues = {
            meaninglessFragments: [],
            brokenLatex: [],
            missingBraces: [],
            unbalancedDelimiters: [],
            emptyFields: [],
            invalidTags: [],
            truncatedOptions: [],
            largeContent: []
        };

        mcqs.forEach(mcq => {
            const fields = [
                { name: 'question', value: mcq.question },
                { name: 'option_a', value: mcq.option_a },
                { name: 'option_b', value: mcq.option_b },
                { name: 'option_c', value: mcq.option_c },
                { name: 'option_d', value: mcq.option_d }
            ];

            // Check for meaningless fragments
            fields.forEach(field => {
                MALFORMED_PATTERNS.forEach(pattern => {
                    if (pattern.test(field.value)) {
                        issues.meaninglessFragments.push({
                            id: mcq.id,
                            field: field.name,
                            value: field.value,
                            pattern: pattern.toString()
                        });
                    }
                });
            });

            // Check for broken LaTeX
            fields.forEach(field => {
                const latexMatches = field.value.match(/\\\w+/g) || [];
                latexMatches.forEach(cmd => {
                    if (!field.value.includes(`{`) && !cmd.includes('\\')) {
                        issues.brokenLatex.push({
                            id: mcq.id,
                            field: field.name,
                            value: field.value,
                            command: cmd
                        });
                    }
                });
            });

            // Check for missing braces
            fields.forEach(field => {
                const openBraces = (field.value.match(/\{/g) || []).length;
                const closeBraces = (field.value.match(/\}/g) || []).length;
                if (openBraces !== closeBraces) {
                    issues.missingBraces.push({
                        id: mcq.id,
                        field: field.name,
                        value: field.value,
                        open: openBraces,
                        close: closeBraces
                    });
                }
            });

            // Check for unbalanced $ delimiters
            fields.forEach(field => {
                const dollarCount = (field.value.match(/\$/g) || []).length;
                if (dollarCount % 2 !== 0) {
                    issues.unbalancedDelimiters.push({
                        id: mcq.id,
                        field: field.name,
                        value: field.value,
                        dollarCount: dollarCount
                    });
                }
            });

            // Check for empty fields
            fields.forEach(field => {
                if (!field.value || field.value.trim() === '') {
                    issues.emptyFields.push({
                        id: mcq.id,
                        field: field.name
                    });
                }
            });

            // Check for invalid difficulty/subject
            if (!['Easy', 'Medium', 'Hard'].includes(mcq.difficulty)) {
                issues.invalidTags.push({
                    id: mcq.id,
                    type: 'difficulty',
                    value: mcq.difficulty
                });
            }
            if (!['Maths', 'Physics'].includes(mcq.subject)) {
                issues.invalidTags.push({
                    id: mcq.id,
                    type: 'subject',
                    value: mcq.subject
                });
            }

            // Check for truncated options
            fields.forEach(field => {
                if (field.value.length < 3 && field.name.startsWith('option_')) {
                    issues.truncatedOptions.push({
                        id: mcq.id,
                        field: field.name,
                        value: field.value
                    });
                }
            });

            // Check for large content
            fields.forEach(field => {
                if (field.value.length > LARGE_CONTENT_THRESHOLD) {
                    issues.largeContent.push({
                        id: mcq.id,
                        field: field.name,
                        length: field.value.length
                    });
                }
            });
        });

        // Generate report
        console.log("📋 DATA QUALITY AUDIT REPORT\n");
        console.log(`Total MCQs scanned: ${mcqs.length}\n`);

        Object.keys(issues).forEach(issueType => {
            const count = issues[issueType].length;
            const severity = count > 0 ? '❌' : '✅';
            console.log(`${severity} ${issueType.replace(/([A-Z])/g, ' $1').toUpperCase()}: ${count} issues`);
            
            if (count > 0 && count <= 10) {
                issues[issueType].forEach(issue => {
                    console.log(`   ID ${issue.id}: ${JSON.stringify(issue)}`);
                });
            } else if (count > 10) {
                console.log(`   First 10 examples:`);
                issues[issueType].slice(0, 10).forEach(issue => {
                    console.log(`   ID ${issue.id}: ${JSON.stringify(issue)}`);
                });
            }
            console.log('');
        });

        // Summary
        const totalIssues = Object.values(issues).reduce((sum, arr) => sum + arr.length, 0);
        const qualityScore = Math.max(0, 100 - (totalIssues / mcqs.length) * 100);
        console.log(`📊 SUMMARY`);
        console.log(`Total Issues Found: ${totalIssues}`);
        console.log(`Data Quality Score: ${qualityScore.toFixed(1)}%`);
        console.log(`Severity: ${qualityScore > 90 ? 'Low' : qualityScore > 70 ? 'Medium' : 'High'}`);

    } catch (error) {
        console.error("❌ Audit failed:", error);
    }
}

scanDataQuality();
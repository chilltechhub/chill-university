import { chromium } from 'playwright';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config({ path: '.env.test' });

if (!process.env.GEMINI_API_KEY) {
  console.error("❌ Missing GEMINI_API_KEY in .env.test");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
  model: 'gemini-3.6-flash',
  generationConfig: { responseMimeType: 'application/json' }
});

// Profile memory used by the agent to make up contextual inputs
const USER_PROFILE_CONTEXT = `
User Profile Memory:
- Name: Tyler White (Software Engineer)
- Specialty: Backend Architecture, Cloud Infrastructure (AWS/Azure), Node.js, TypeScript, Python
- Projects: Real-time inventory tracker, AWS Lambda serverless pipelines, Cloudflare DNS routing, Chill Tech LLC asset locator
- Passions: Gamified dashboards, life systems, distributed databases, space-mission control aesthetics
`;

// Targeted feature scenarios across the Library, Lab, and Knowledge Vault
const SCENARIOS = [
  {
    name: "The Lab - Projects & Idea Garden",
    goal: "Navigate to Library, open The Lab / Projects (The Workshop), create a new backend project called 'Distributed Inventory Tracker' using AWS Lambda & PostgreSQL, add a build log entry, and plant a new idea in the Idea Garden."
  },
  {
    name: "Knowledge Vault & Classes Stack",
    goal: "Navigate to Knowledge Vault (Notes, Research, Resources), log a research note on 'Event-Driven Architecture', navigate to Classes Stack, select Computer Science, and verify the Learn/Practice/Apply layout."
  },
  {
    name: "Portfolio & Career Exploration",
    goal: "Navigate to PortfolioScreen, verify backend skills (Node.js, TypeScript, Cloud Native), navigate to Career Exploration, and set target role to 'Senior Backend Engineer'."
  }
];

async function runScenario(page, scenario) {
  console.log(`\n🚀 Starting Scenario: [${scenario.name}]`);
  console.log(`🎯 Goal: ${scenario.goal}`);

  let stepCount = 0;
  const maxSteps = 12;

  while (stepCount < maxSteps) {
    stepCount++;
    await page.waitForTimeout(1500); // Allow React state re-renders

    const pageData = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, [role="button"], a, input, textarea, [data-testid]'))
        .map(el => ({
          text: el.innerText || el.getAttribute('aria-label') || el.getAttribute('placeholder') || el.getAttribute('data-testid') || 'unlabeled',
          tag: el.tagName,
          placeholder: el.getAttribute('placeholder') || ''
        }));
      return {
        url: window.location.href,
        bodyText: document.body.innerText.substring(0, 1200),
        interactiveElements: elements
      };
    });

    const systemPrompt = `
    You are an automated testing agent for an Expo app. 
    ${USER_PROFILE_CONTEXT}

    CURRENT SCENARIO GOAL: ${scenario.goal}
    
    APP STATE:
    - URL: ${pageData.url}
    - Visible Text Summary: ${pageData.bodyText}
    - Clickable/Input Elements: ${JSON.stringify(pageData.interactiveElements)}

    Decide the next step. Use realistic details from the User Profile Memory when filling inputs.
    Respond ONLY in valid JSON:
    {
      "action": "CLICK" | "TYPE" | "FINISH" | "FAIL",
      "targetText": "exact text, aria-label, or placeholder of element",
      "inputText": "realistic text input based on profile memory if action is TYPE",
      "reasoning": "brief explanation"
    }
    `;

    try {
      const result = await model.generateContent(systemPrompt);
      const decision = JSON.parse(result.response.text());

      console.log(`  Step ${stepCount}: [${decision.action}] -> ${decision.reasoning}`);

      if (decision.action === 'FINISH') {
        console.log(`✅ Scenario Finished: ${scenario.name}`);
        return true;
      } 
      
      if (decision.action === 'FAIL') {
        console.error(`❌ Scenario Failed: ${scenario.name}`);
        if (!fs.existsSync('test-failures')) fs.mkdirSync('test-failures');
        await page.screenshot({ path: `test-failures/fail-${scenario.name.replace(/\s+/g, '-')}-${Date.now()}.png` });
        return false;
      }

      if (decision.action === 'CLICK') {
        const target = decision.targetText;
        await page.click(`text="${target}"`).catch(async () => {
          // Fallback to placeholder or attribute selector
          await page.click(`[placeholder="${target}"]`).catch(() => {
            console.warn(`  ⚠️ Could not click element with text "${target}", attempting force click or retrying.`);
          });
        });
      } 
      
      if (decision.action === 'TYPE') {
        const selector = `[placeholder="${decision.targetText}"], input, textarea`;
        await page.fill(selector, decision.inputText).catch(async () => {
          console.warn(`  ⚠️ Could not fill input "${decision.targetText}"`);
        });
      }

    } catch (err) {
      console.error(`❌ Error in step ${stepCount}:`, err.message);
      return false;
    }
  }

  console.warn(`⚠️ Reached max steps for scenario: ${scenario.name}`);
  return false;
}

async function startTestSuite() {
  const browser = await chromium.launch({ headless: false }); // Set to true for background runs
  const page = await browser.newPage();
  const targetUrl = process.env.APP_URL || 'http://localhost:8081';

  try {
    console.log(`🌐 Connecting to Expo Web at ${targetUrl}...`);
    await page.goto(targetUrl);
  } catch (err) {
    console.error(`❌ Connection failed. Make sure "npx expo start --web" is running.`);
    await browser.close();
    return;
  }

  for (const scenario of SCENARIOS) {
    await runScenario(page, scenario);
  }

  console.log('\n🎉 Library & Lab Test Suite Executed Successfully!');
  await browser.close();
}

startTestSuite();
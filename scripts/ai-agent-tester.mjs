import { chromium } from 'playwright';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables from .env.test
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

async function runAIAgentTest(goalPrompt) {
  console.log(`🤖 Starting AI Agent Test for Goal: "${goalPrompt}"`);
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  const targetUrl = process.env.APP_URL || 'http://localhost:8081';

  try {
    await page.goto(targetUrl);
  } catch (egerrr) {
    console.error(`❌ Could not connect to Expo Web at ${targetUrl}. Did you run "npx expo start --web"?`);
    await browser.close();
    return;
  }

  let stepCount = 0;
  const maxSteps = 10;

  while (stepCount < maxSteps) {
    stepCount++;
    await page.waitForTimeout(1500); // Wait for React elements to render

    const pageData = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, [role="button"], a, input'))
        .map(el => ({
          text: el.innerText || el.getAttribute('aria-label') || el.getAttribute('placeholder') || 'unlabeled',
          tag: el.tagName
        }));
      return {
        url: window.location.href,
        bodyText: document.body.innerText.substring(0, 1000),
        interactiveElements: buttons
      };
    });

    const systemPrompt = `
    You are an automated testing agent for an Expo app. 
    GOAL: ${goalPrompt}
    CURRENT STATE: 
    - URL: ${pageData.url}
    - Text Summary: ${pageData.bodyText}
    - Clickable Elements: ${JSON.stringify(pageData.interactiveElements)}

    Decide the next action. Respond ONLY in valid JSON:
    {
      "action": "CLICK" | "TYPE" | "FINISH" | "FAIL",
      "targetText": "text or placeholder of element to act on",
      "inputText": "text if action is TYPE",
      "reasoning": "explanation"
    }
    `;

    try {
      const result = await model.generateContent(systemPrompt);
      const decision = JSON.parse(result.response.text());

      console.log(`Step ${stepCount}: [${decision.action}] - ${decision.reasoning}`);

      if (decision.action === 'FINISH') {
        console.log('✅ Goal achieved!');
        break;
      } else if (decision.action === 'FAIL') {
        console.error('❌ Agent determined test failed.');
        break;
      } else if (decision.action === 'CLICK') {
        await page.click(`text="${decision.targetText}"`).catch(() => {
          console.warn(`Could not click "${decision.targetText}", retrying next loop.`);
        });
      } else if (decision.action === 'TYPE') {
        await page.fill(`[placeholder="${decision.targetText}"]`, decision.inputText);
      }
    } catch (apiErr) {
      console.error('❌ Error calling Gemini API:', apiErr.message);
      break;
    }
  }

  await browser.close();
}

// Run test scenario
runAIAgentTest("Locate the login button or guest mode link and click it.");



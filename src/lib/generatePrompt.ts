import { Agent } from '@/types/agent';
import { DebtProfile } from '@/types/debtProfile';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const AGENT_BASE_SYSTEM_PROMPT = `
You are a helpful assistant responsible for generating additional context and instructions for an AI debt collection agent. 

Given a specific debt collection "scenario", write:
2. Specific additional instructions for the agent tailored to this scenario.

Respond in a single string giving the instructions
`;

export const AGENT_DEBT_PROFILE_PROMPT = (name: string, scenario: string) => `
You are a helpful assistant. Based on the following debt collection scenario for agent "${name}":

"${scenario}"

Generate a list of 5 realistic debt profiles in the following **JSON format**:

[
  { "name": "Full Name", "amount": "$X,XXX", "context": "Brief one-sentence context about why the debt was taken and any initial condition." },
  ...
]

Ensure:
- All entries are realistic and human-like.
- Amounts are diverse and formatted as currency strings.
- The context is empathetic and aligned with the given scenario.
- Response is only the JSON array — no commentary or markdown.
- Do not include any additional text or include the list in a code block.
`;

export async function generateScenarioDetails(scenario: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `${AGENT_BASE_SYSTEM_PROMPT}\n\nScenario: "${scenario}"`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();
  
  return response;
}

export async function generateDebtProfiles(agent: Agent): Promise<DebtProfile[]> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = AGENT_DEBT_PROFILE_PROMPT(agent.name, agent.scenario);

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  try {
    const parsed = JSON.parse(response);
    if (Array.isArray(parsed)) {
      return parsed as DebtProfile[];
    }
    throw new Error('Response is not a valid JSON array');
  } catch (err) {
    if (response.startsWith('```json')) {
      const jsonStr = response.slice(7, -3).trim();
      return JSON.parse(jsonStr);
    }
    console.error('Failed to parse Gemini debt profile response:', err);
    console.error('Raw response:', response);
    throw new Error('Could not parse debt profile response');
  }
}
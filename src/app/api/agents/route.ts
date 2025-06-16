import { NextResponse } from 'next/server';
import { db } from '@/db/client';
import { agents } from '@/db/schema/agent';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { generateDebtProfiles, generateScenarioDetails } from '@/lib/generatePrompt';
import { debtProfiles } from '@/db/schema/debtProfile';

// List all agents
export async function GET() {
  const allAgents = await db.select().from(agents);
  return NextResponse.json(allAgents);
}

// Create a new agent
export async function POST(req: Request) {
  const body = await req.json();
  const { name, scenario } = body;

  if (!name || !scenario) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const id = uuidv4();

  const basePromptPath = path.join(process.cwd(), 'src', 'prompts', 'debt_sys_prompt.txt');
  const additionalInstructions = await generateScenarioDetails(scenario);
  const systemPrompt = fs.readFileSync(basePromptPath, 'utf-8').replace(
    'INSTRUCTIONS', additionalInstructions
  );

  await db.insert(agents).values({
    id,
    name,
    scenario,
    systemPrompt: systemPrompt
  });

  // Generate debt profiles for the new agent
  const profiles = await generateDebtProfiles({ id, name, score: 0, scenario, createdAt: '', systemPrompt });

    await db.insert(debtProfiles).values(
      profiles.map((p) => ({
        id: uuidv4(),
        agentId: id,
        name: p.name,
        amount: p.amount,
        context: p.context,
      }))
    );

  return NextResponse.json({ success: true, id });
}

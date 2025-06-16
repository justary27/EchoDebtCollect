// app/api/agents/[id]/route.ts
import { db } from '@/db/client';
import { agents } from '@/db/schema/agent';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  context: { params: { id: string } }
) {
  const id = context.params.id;

  const agent = db
    .select()
    .from(agents)
    .where(eq(agents.id, id))
    .get();

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  return NextResponse.json(agent);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json();
  const { score, systemPrompt } = body;

  if (!systemPrompt) {
    return NextResponse.json({ error: 'Missing systemPrompt' }, { status: 400 });
  }

  const existingAgents = await db.select().from(agents).where(eq(agents.id, id));
  if (existingAgents.length === 0) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  await db
    .update(agents)
    .set({
      score: score ?? existingAgents[0].score,
      systemPrompt,
    })
    .where(eq(agents.id, id));

  return NextResponse.json({ success: true });
}

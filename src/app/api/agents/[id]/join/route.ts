import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { db } from '@/db/client';
import { agents } from '@/db/schema/agent';
import { eq } from 'drizzle-orm';


export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const agentId = params.id;
  const { roomName } = await req.json();

  const agent = db
    .select()
    .from(agents)
    .where(eq(agents.id, agentId))
    .get();

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  const identity = `agent-${agentId}`;

  const at = new AccessToken(
    process.env.LIVEKIT_API_KEY!,
    process.env.LIVEKIT_API_SECRET!,
    { identity, name: agent.name }
  );

  at.addGrant({ roomJoin: true, room: roomName });

  const token = await at.toJwt();

  console.log(`✅ Agent "${agent.name}" joining room "${roomName}" as "${identity}"`);

  return NextResponse.json({ token, name: agent.name, identity });
}
import { db } from '@/db/client';
import { debtProfiles } from '@/db/schema/debtProfile';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  context: { params: { id: string } }
) {
  const { params } = context;
  const agentId = params.id;
  
  const profiles = await db
    .select()
    .from(debtProfiles)
    .where(eq(debtProfiles.agentId, agentId));

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ error: 'No debt profiles found for this agent' }, { status: 404 });
  }

  return NextResponse.json(profiles);
}

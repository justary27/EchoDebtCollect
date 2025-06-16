// app/api/agents/[id]/route.ts
import { db } from '@/db/client';
import { debtProfiles } from '@/db/schema/debtProfile';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET(
  req: Request,
  { params }: { params: { profileId: string } }
) {
  const id = params.profileId; // keep as string

  const agent = db
    .select()
    .from(debtProfiles)
    .where(eq(debtProfiles.id, id)) // ✅ Now both sides are strings
    .get();

  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  }

  return NextResponse.json(agent);
}

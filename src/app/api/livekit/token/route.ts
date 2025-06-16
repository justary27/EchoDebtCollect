import { NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';

export async function POST(req: Request) {
  const { identity, roomName } = await req.json();

  const at = new AccessToken(process.env.LIVEKIT_API_KEY!, process.env.LIVEKIT_API_SECRET!, {
    identity,
  });
  at.addGrant({ roomJoin: true, room: roomName });

  const token = await at.toJwt();
  return NextResponse.json({ token });
}

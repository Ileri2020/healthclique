// import { NextRequest, NextResponse } from 'next/server';
// import { AccessToken } from 'livekit-server-sdk';
// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient();

// // Do not cache endpoint result
// export const revalidate = 0;

// export async function GET(req: NextRequest) {
//   const room = req.nextUrl.searchParams.get('room');
//   const username = req.nextUrl.searchParams.get('username');
//   // console.log('conference romm', room, 'username', username)
//   if (!room) {
//     return NextResponse.json({ error: 'Missing "room" query parameter' }, { status: 400 });
//   } else if (!username) {
//     return NextResponse.json({ error: 'Missing "username" query parameter' }, { status: 400 });
//   }

//   const apiKey = process.env.LIVEKIT_API_KEY;
//   const apiSecret = process.env.LIVEKIT_API_SECRET;
//   const wsUrl = process.env.LIVEKIT_URL;

//   if (!apiKey || !apiSecret || !wsUrl) {
//     return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
//   }

//   const at = new AccessToken(apiKey, apiSecret, { identity: username });
//   at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true });

//   // console.log('sent token', await at.toJwt())

//   return NextResponse.json(
//     { token: await at.toJwt() },
//     { headers: { "Cache-Control": "no-store" } },
//   );
// }



// export async function POST(req: NextRequest) {

//   const { searchParams } = new URL(req.url);
//   // const body = searchParams.get('body') || null;

//   // Parse JSON body
//   let body = null;

//   try {
//     body = await req.json(); // This reads the JSON payload
//   } catch (err) {
//     return new Response('Invalid JSON', { status: 400 });
//   }

//   console.log("body", body)


//   if (!body.roomName) {
//     return NextResponse.json({ error: 'Missing "room" query parameter' }, { status: 400 });
//   } else if (!body.adminId) {
//     return NextResponse.json({ error: 'Missing "meeting admin" query parameter' }, { status: 400 });
//   }

//   // const apiKey = process.env.LIVEKIT_API_KEY;
//   // const apiSecret = process.env.LIVEKIT_API_SECRET;
//   // const wsUrl = process.env.LIVEKIT_URL;

//   // if (!apiKey || !apiSecret || !wsUrl) {
//   //   return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
//   // }

//   // const at = new AccessToken(apiKey, apiSecret, { identity: username });
//   // at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true });

//   // console.log('sent token', await at.toJwt())

//   const prismaModel = prisma.meeting;

//   if (!prismaModel) {
//     console.log("no model")
//     return new Response(JSON.stringify({message : "invalid model"}), {
//       status: 400,
//       headers: { 'Content-Type': 'application/json' },
//     });
//   }

  
//   try {
//     const data = {
//       ...body,
//       dateTime: new Date(body.dateTime), // Ensure Date object
//       roomId: body.roomId || `room-${Date.now()}`, // Generate if missing
//       save: body.save === 'true', // Convert string to boolean
//     };

//     // console.log("form body:", data)
    
//     const newItem = await prismaModel.create({
//       data,
//     });

//     return new Response(JSON.stringify(newItem), {
//       status: 200,
//       headers: { 'Content-Type': 'application/json' },
//     });
//   } catch (error) {
//     console.error('Database error:', error);
//     return new Response(
//       JSON.stringify({ error: 'Failed to POST items' }),
//       { status: 405, headers: { 'Content-Type': 'application/json' } }
//     );
//   }

// }
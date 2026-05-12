"use server"
import { NextRequest } from 'next/server';
import { prisma } from "@/lib/prisma";
import bcrypt from 'bcrypt';






export async function POST(req: NextRequest) {

  const { searchParams } = new URL(req.url);
  // const formData = await req.formData
  // const file = formData.
  
  // Destructure and provide defaults
  const model = searchParams.get('model') || null;
  const id = searchParams.get('id') || null;
  // const body = searchParams.get('body') || null;

  // Parse JSON body
  let body: { email?: string; password?: string } | null = null;
  try {
    body = await req.json(); // This reads the JSON payload
  } catch (err) {
    return new Response('Invalid JSON', { status: 400 });
  }

  if (!body || typeof body.email !== 'string' || typeof body.password !== 'string') {
    return new Response('Invalid request body', { status: 400 });
  }

  const { method } = req; 
  console.log("in db handler",model, id, method, body)

  
  try {
    const data = body;
    // const newItem = await prismaModel.create({
    //   data,
    // });
    const user = await prisma.user.findUnique({
      where: { email: body.email, },
      include: { addresses: true },
    });
    const isvalid = await bcrypt.compare(body.password, user.password)
    if(isvalid){
    // const { id, ...updateduser } = user;
    const updateduser = user;
    return new Response(JSON.stringify(updateduser), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    } else {
      throw new Error('wrong password')
    }
  } catch (error) {
    console.error('LOGIN ERROR:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to Login' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

}




import { NextResponse } from 'next/server';
import { apiUrl } from '../../../../../lib/api/client';
import { getAttachment } from '../../../../../lib/api/kanban';
import { authenticatedHeaders } from '../../../../../lib/auth/session';

export async function GET(_:Request,{params}:{params:Promise<{attachmentId:string}>}){const {attachmentId}=await params;try{await getAttachment(attachmentId);const response=await fetch(`${apiUrl()}/attachments/${attachmentId}/download`,{cache:'no-store',headers:await authenticatedHeaders()});if(!response.ok||!response.body)return NextResponse.json({message:'Download unavailable'},{status:response.status});return new Response(response.body,{status:200,headers:{'Content-Type':response.headers.get('content-type')||'application/octet-stream','Content-Disposition':response.headers.get('content-disposition')||'attachment','Cache-Control':'private, no-store'}});}catch{return NextResponse.json({message:'Download unavailable'},{status:404});}}

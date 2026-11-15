const base=(import.meta.env.VITE_API_URL??'').replace(/\/$/,'');
export const guestDemo=import.meta.env.VITE_GUEST_ONLY==='true';
export async function api<T>(path:string,body?:unknown):Promise<T>{
 let response:Response;
 try {response=await fetch(`${base}/api${path}`,{method:body===undefined?'GET':'POST',credentials:'include',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000)});}catch{throw new Error('Mission service is offline. You can still start a guest mission.');}
 if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('The account service is not configured for this deployment. Guest missions remain available.');
 const payload=await response.json().catch(()=>({error:'Unexpected server response'}));
 if(!response.ok)throw new Error(payload.error??'Request failed');return payload.data as T;
}
export type User={id:string;email:string;displayName:string};

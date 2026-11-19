export function createLibraryOpenTicket(secret:string,relativePath:string,now?:number):string;
export function readLibraryOpenTicket(secret:string,token:unknown,now?:number):string;
export function resolveLibraryThreeMf(root:string,relative:string):Promise<string>;

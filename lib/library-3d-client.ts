export type {LibraryEntry,LibraryProject} from './library-3d';
export function macOpenCommand(absolutePath:string){return `open -- '${absolutePath.replace(/'/g,"'\\''")}'`;}

import {mkdir,readdir,copyFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
const stage=path.join(root,'outputs','source');
const extensions=new Set(['.ts','.tsx','.js','.mjs','.json','.css','.html','.md','.prisma','.sql','.toml','.lbl','.jpg','.png']);
const files=[];
async function copy(relative){
 const source=path.join(root,relative),destination=path.join(stage,relative);
 await mkdir(path.dirname(destination),{recursive:true});await copyFile(source,destination);files.push(relative);
}
async function walk(relative){
 for(const item of await readdir(path.join(root,relative),{withFileTypes:true})){
  const name=path.join(relative,item.name);
  if(item.isDirectory())await walk(name);
  else if(item.isFile()&&extensions.has(path.extname(item.name)))await copy(name);
 }
}
for(const folder of ['apps','packages','prisma','docs','scripts','tests'])await walk(folder);
for(const file of ['README.md','.env.example','.gitignore','package.json','package-lock.json','tsconfig.json','vite.config.ts','vitest.config.ts','playwright.config.ts','tailwind.config.js','postcss.config.js','vercel.json','render.yaml'])await copy(file);
await writeFile(path.join(root,'outputs','source-manifest.json'),JSON.stringify({files:files.sort(),excluded:['.env','databases','credentials','.git','node_modules','builds','test runtime data','.openai']},null,2));
console.log(`Staged ${files.length} source/documentation files under outputs/source. No credentials or databases included.`);

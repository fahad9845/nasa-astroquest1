import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const source=readFileSync('prisma/schema.prisma','utf8');
mkdirSync('prisma/sqlite',{recursive:true});
writeFileSync('prisma/sqlite/schema.prisma',source.replace('provider = "postgresql"','provider = "sqlite"'));
for(const [directory,schema,provider] of [['prisma','prisma/schema.prisma','postgresql'],['prisma/sqlite','prisma/sqlite/schema.prisma','sqlite']]){
 const migration=directory+'/migrations/20261114000000_initial';mkdirSync(migration,{recursive:true});
 const result=spawnSync(process.execPath,['node_modules/prisma/build/index.js','migrate','diff','--from-empty','--to-schema-datamodel',schema,'--script'],{encoding:'utf8',env:{...process.env,DATABASE_URL:provider==='sqlite'?'file:./astroquest.db':'postgresql://user:password@localhost:5432/astroquest'}});
 if(result.status!==0)throw new Error(result.stderr);
 writeFileSync(migration+'/migration.sql',result.stdout);
 writeFileSync(directory+'/migrations/migration_lock.toml',`provider = "${provider}"\n`);
}
console.log('Prepared PostgreSQL and SQLite schemas and initial migrations.');

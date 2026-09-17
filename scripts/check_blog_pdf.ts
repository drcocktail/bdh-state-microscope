import { spawnSync } from 'node:child_process'
const result=spawnSync(process.env.BLOG_CHECK_PYTHON??'python3',['scripts/check_blog_pdf.py'],{stdio:'inherit'})
if(result.error)throw result.error
process.exit(result.status??1)

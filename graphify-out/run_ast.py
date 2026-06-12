import json
from graphify.extract import collect_files, extract
from pathlib import Path

code_files = []
detect = json.loads(Path(r'D:\Work\website_projects\ashkal altarf\graphify-out\.graphify_detect.json').read_text(encoding='utf-8'))
for f in detect.get('files', {}).get('code', []):
    p = Path(f)
    code_files.extend(collect_files(p) if p.is_dir() else [p])

if code_files:
    result = extract(code_files, cache_root=Path(r'D:\Work\website_projects\ashkal altarf'))
    Path(r'D:\Work\website_projects\ashkal altarf\graphify-out\.graphify_ast.json').write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding='utf-8')
    print(f'AST: {len(result.get("nodes",[]))} nodes, {len(result.get("edges",[]))} edges')
else:
    Path(r'D:\Work\website_projects\ashkal altarf\graphify-out\.graphify_ast.json').write_text(json.dumps({"nodes":[],"edges":[],"input_tokens":0,"output_tokens":0}, ensure_ascii=False), encoding='utf-8')
    print('No code files - skipping AST')

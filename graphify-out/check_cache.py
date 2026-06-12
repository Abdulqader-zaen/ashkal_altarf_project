import json
from graphify.cache import check_semantic_cache
from pathlib import Path

ROOT = Path(r'D:\Work\website_projects\ashkal altarf')

detect = json.loads((ROOT / 'graphify-out' / '.graphify_detect.json').read_text(encoding='utf-8'))
all_files = [f for files in detect['files'].values() for f in files]

cached_nodes, cached_edges, cached_hyperedges, uncached = check_semantic_cache(all_files, root=ROOT)

if cached_nodes or cached_edges or cached_hyperedges:
    (ROOT / 'graphify-out' / '.graphify_cached.json').write_text(
        json.dumps({'nodes': cached_nodes, 'edges': cached_edges, 'hyperedges': cached_hyperedges}, ensure_ascii=False), encoding='utf-8')

(ROOT / 'graphify-out' / '.graphify_uncached.txt').write_text('\n'.join(uncached), encoding='utf-8')
print(f'Cache: {len(all_files)-len(uncached)} files hit, {len(uncached)} files need extraction')

import json
import os
from collections import defaultdict, deque
from functools import lru_cache

def solve_8(n, vals, edges):
    adj = defaultdict(list)
    for u, v in edges: adj[u].append(v); adj[v].append(u)
    prefix = [0] * (n + 1)
    visited = [False] * (n + 1)
    stack = [(1, 0)]
    while stack:
        node, px = stack.pop()
        if visited[node]: continue
        visited[node] = True; prefix[node] = px ^ vals[node - 1]
        for nb in adj[node]:
            if not visited[nb]: stack.append((nb, prefix[node]))
    trie = {}
    def insert(num):
        node = trie
        for i in range(29, -1, -1):
            bit = (num >> i) & 1
            if bit not in node: node[bit] = {}
            node = node[bit]
    def query_max(num):
        node = trie; val = 0; found = False
        for i in range(29, -1, -1):
            bit = (num >> i) & 1; want = 1 - bit
            if want in node: val |= (1 << i); node = node[want]; found = True
            elif bit in node: node = node[bit]; found = True
            else: break
        return val if found else 0
    ans = 0
    if n > 1: insert(0)
    for i in range(1, n + 1):
        if i > 1 or n > 1: ans = max(ans, query_max(prefix[i]))
        insert(prefix[i])
    return str(ans)

def solve_11(n, edges):
    adj = defaultdict(list)
    for u, v in edges: adj[u].append(v); adj[v].append(u)
    def get_diam(nodes):
        if not nodes: return 0
        nodes_set = set(nodes)
        def bfs(src):
            d = {src:0}; q = deque([src]); far = src
            while q:
                curr = q.popleft()
                for nb in adj[curr]:
                    if nb in nodes_set and nb not in d:
                        d[nb]=d[curr]+1; q.append(nb)
                        if d[nb] > d[far]: far = nb
            return far, d[far]
        f1, _ = bfs(list(nodes)[0])
        f2, dist = bfs(f1)
        return dist
    
    def get_comp(start, skip_edge):
        res = []; q = deque([start]); vis = {start}
        while q:
            u = q.popleft(); res.append(u)
            for v in adj[u]:
                if v not in vis and (u, v) != skip_edge and (v, u) != skip_edge:
                    vis.add(v); q.append(v)
        return res

    ans = float('inf')
    for u, v in edges:
        s1 = get_comp(u, (u, v))
        s2 = get_comp(v, (u, v))
        d1 = get_diam(s1)
        d2 = get_diam(s2)
        ans = min(ans, max(d1, d2))
    return str(ans)

def solve_16(lo, hi, mod):
    def count_up_to(n_val, mod):
        if n_val < 0: return 0
        s = str(n_val); L = len(s)
        @lru_cache(maxsize=None)
        def dp(pos, rem, tight, started):
            if pos == L: return 1 if (started and rem == 0) else 0
            limit = int(s[pos]) if tight else 9
            total = 0
            for d in range(0, limit + 1):
                new_tight = tight and (d == limit)
                if not started and d == 0: total += dp(pos + 1, rem, new_tight, False)
                else: total += dp(pos + 1, (rem + d) % mod, new_tight, True)
            return total
        return dp(0, 0, True, False)
    return str(count_up_to(hi, mod) - count_up_to(lo - 1, mod))

# Process files
files = ["8_max_xor_tree.json", "11_tree_diameter_removal.json", "16_digit_dp_magic.json"]
for f in files:
    if not os.path.exists(f): continue
    with open(f, 'r') as jf:
        data = json.load(jf)
        for tc in data['test_cases']:
            inp = tc['input'].split()
            if f.startswith("8"):
                n = int(inp[0])
                vals = [int(inp[1+i]) for i in range(n)]
                edges = []
                for i in range(n-1): edges.append((int(inp[1+n+i*2]), int(inp[2+n+i*2])))
                tc['expected_output'] = solve_8(n, vals, edges)
            elif f.startswith("11"):
                n = int(inp[0])
                edges = []
                for i in range(n-1): edges.append((int(inp[1+i*2]), int(inp[2+i*2])))
                tc['expected_output'] = solve_11(n, edges)
            elif f.startswith("16"):
                lo, hi, mod = int(inp[0]), int(inp[1]), int(inp[2])
                tc['expected_output'] = solve_16(lo, hi, mod)
    with open(f, 'w') as jf:
        json.dump(data, jf, indent=4)

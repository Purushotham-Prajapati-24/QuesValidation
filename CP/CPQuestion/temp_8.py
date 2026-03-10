import sys
def solve(n, vals, edges):
    from collections import defaultdict
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
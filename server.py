import http.server, socketserver, json, hashlib, hmac, sqlite3, time, os, random
from urllib.parse import parse_qs

BOT_TOKEN = os.environ.get('BOT_TOKEN', '')
DB = 'data.db'

def db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = db()
    conn.execute('''CREATE TABLE IF NOT EXISTS users(
        tg_id TEXT PRIMARY KEY, username TEXT, balance REAL DEFAULT 100000,
        state TEXT DEFAULT '{}', updated REAL DEFAULT 0)''')
    conn.execute('''CREATE TABLE IF NOT EXISTS auctions(
        id TEXT PRIMARY KEY, name TEXT, cat TEXT, rarity TEXT,
        start_price REAL, current_bid REAL, leader TEXT,
        bids TEXT DEFAULT '[]', end_time REAL, status TEXT DEFAULT 'active')''')
    conn.commit()
    conn.close()

ITEMS = [
    ['VOID CHIP','TECH','RARE',12480],['BLACK SIGNAL','TECH','EPIC',48200],
    ['ORBITAL KEY','ARTIFACTS','LEGENDARY',91400],['UNKNOWN DEVICE','UNKNOWN','UNKNOWN',60000],
    ['NULL CORE','UNKNOWN','UNKNOWN',32000],['GHOST DRIVE','TECH','UNCOMMON',4200],
    ['ASH RELIC','ARTIFACTS','RARE',27800],['PALE MASK','COLLECTIBLES','COMMON',1900],
    ['IRON SPARROW','VEHICLES','EPIC',76500],['DUST RUNNER','VEHICLES','UNCOMMON',8800],
    ['LATTICE NODE','DEVICES','RARE',15900],['SIGIL 07','COLLECTIBLES','UNCOMMON',3100],
    ['CINDER LENS','DEVICES','COMMON',2400],['HOLLOW CROWN','ARTIFACTS','LEGENDARY',138000],
    ['STATIC PRISM','DEVICES','EPIC',39500],['MOTH PROTOCOL','TECH','COMMON',1500],
    ['CRYO CELL','TECH','RARE',18700],['EMBER FLUX','DEVICES','UNCOMMON',5600],
    ['NOIR CIPHER','TECH','EPIC',54300],['VELVET ECHO','ARTIFACTS','RARE',22400],
    ['RUST HALO','COLLECTIBLES','COMMON',2100],['ONYX WING','VEHICLES','EPIC',68900],
    ['PIXEL DUST','DEVICES','COMMON',1700],['MIRAGE CORE','UNKNOWN','UNKNOWN',45000],
    ['SATIN VOID','ARTIFACTS','EPIC',41200],['COBALT RUNE','COLLECTIBLES','RARE',13600],
    ['FERRIS GHOST','VEHICLES','RARE',19800],['LUNAR TICKET','COLLECTIBLES','UNCOMMON',4700],
    ['QUARTZ HOWL','DEVICES','UNCOMMON',7300],['OBSIDIAN MAP','ARTIFACTS','LEGENDARY',112000]
]
VOL = {'COMMON':.012,'UNCOMMON':.015,'RARE':.02,'EPIC':.026,'LEGENDARY':.03,'UNKNOWN':.04}

def seeded_random(seed_str):
    h = int(hashlib.md5(seed_str.encode()).hexdigest(), 16)
    return (h % 10000) / 10000.0

def get_market():
    now = int(time.time())
    tick = now // 10
    products = []
    for idx, item in enumerate(ITEMS):
        name, cat, rarity, base = item
        seed = f"{tick}_{name}"
        r1 = seeded_random(seed + "_p")
        r2 = seeded_random(seed + "_d")
        vol = VOL.get(rarity, .02)
        change = (r1 - 0.5) * 2 * vol * 8
        price = max(base * 0.5, min(base * 2.0, base * (1 + change)))
        hist = []
        for i in range(60):
            t2 = tick - (59 - i)
            r = seeded_random(f"{t2}_{name}_p")
            ch = (r - 0.5) * 2 * vol * 8
            hist.append(round(max(base * 0.5, min(base * 2.0, base * (1 + ch)))))
        products.append({
            'id': f'VM-{10000 + idx * 7 + tick % 100}',
            'name': name, 'cat': cat, 'rarity': rarity,
            'price': round(price), 'base': base,
            'seller': ['VOID_21','NEXUS','BLACKBOX','MERCURY'][idx % 4],
            'hist': hist, 'views': int(r2 * 900) + 20,
            'sup': int(seeded_random(seed + "_s") * 11) + 1,
            'exp': now + int(seeded_random(seed + "_e") * 3600) + 600
        })
    return {'tick': tick, 'time': now, 'products': products}

def get_auctions():
    conn = db()
    now = time.time()
    # завершить истёкшие: победитель получает предмет
    due = conn.execute("SELECT * FROM auctions WHERE end_time < ? AND status='active'", (now,)).fetchall()
    for r in due:
        bids = json.loads(r['bids'] or '[]')
        if bids:
            wid = bids[-1].get('id')
            if wid:
                u = conn.execute("SELECT state FROM users WHERE tg_id=?", (wid,)).fetchone()
                if u:
                    st = json.loads(u['state'] or '{}')
                    inv = st.get('inv', [])
                    inv.append({'uid': int(now * 1000), 'name': r['name'], 'rarity': r['rarity'],
                                'cat': r['cat'], 'hue': 200, 'bought': r['current_bid'],
                                'val': r['current_bid'], 'date': now})
                    st['inv'] = inv
                    conn.execute("UPDATE users SET state=? WHERE tg_id=?",
                                 (json.dumps(st, ensure_ascii=False), wid))
    conn.execute("UPDATE auctions SET status='finished' WHERE end_time < ? AND status='active'", (now,))
    active = conn.execute("SELECT COUNT(*) FROM auctions WHERE status='active'").fetchone()[0]
    if active < 5:
        for i in range(5 - active):
            item = ITEMS[random.randint(0, len(ITEMS) - 1)]
            aid = f"AU-{int(now * 1000)}-{i}"
            conn.execute("INSERT OR IGNORE INTO auctions(id,name,cat,rarity,start_price,current_bid,leader,end_time) VALUES(?,?,?,?,?,?,?,?)",
                         (aid, item[0], item[1], item[2], round(item[3]*0.5), round(item[3]*0.5), None,
                          now + random.randint(120, 600)))
    conn.commit()
    rows = conn.execute("SELECT * FROM auctions WHERE status='active' ORDER BY end_time").fetchall()
    conn.close()
    result = []
    for r in rows:
        bids = json.loads(r['bids'] or '[]')
        result.append({'id': r['id'], 'name': r['name'], 'cat': r['cat'], 'rarity': r['rarity'],
                       'start': r['start_price'], 'bid': r['current_bid'], 'leader': r['leader'],
                       'bids': bids[-10:], 'end': r['end_time'],
                       'left': max(0, int(r['end_time'] - now)), 'n': len(bids)})
    return result

def place_bid(auction_id, amount, tg_id, username):
    conn = db()
    row = conn.execute("SELECT * FROM auctions WHERE id=? AND status='active'", (auction_id,)).fetchone()
    if not row:
        conn.close()
        return {'ok': False, 'msg': 'Аукцион не найден или завершён'}
    if time.time() > row['end_time']:
        conn.close()
        return {'ok': False, 'msg': 'Аукцион завершён'}
    min_bid = row['current_bid'] + max(100, int(row['start_price'] * 0.05))
    if amount < min_bid:
        conn.close()
        return {'ok': False, 'msg': f'Минимум: {min_bid}'}
    user = conn.execute("SELECT balance FROM users WHERE tg_id=?", (tg_id,)).fetchone()
    if not user or user['balance'] < amount:
        conn.close()
        return {'ok': False, 'msg': 'Недостаточно средств'}
    bids = json.loads(row['bids'] or '[]')
    # вернуть деньги предыдущему лидеру, если его перебили
    if bids:
        prev_id = bids[-1].get('id')
        if prev_id and prev_id != tg_id:
            conn.execute("UPDATE users SET balance = balance + ? WHERE tg_id=?",
                         (row['current_bid'], prev_id))
    bids.append({'who': username or tg_id, 'id': tg_id, 'amt': amount, 't': time.time()})
    conn.execute("UPDATE auctions SET current_bid=?, leader=?, bids=? WHERE id=?",
                 (amount, username or tg_id, json.dumps(bids[-20:]), auction_id))
    conn.commit()
    conn.close()
    return {'ok': True, 'bid': amount, 'leader': username or tg_id}

class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.css': 'text/css', '.js': 'application/javascript',
        '.html': 'text/html; charset=utf-8', '.json': 'application/json',
    }
    timeout = 30
    protocol_version = 'HTTP/1.1'

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-TG-ID')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, data, code=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', len(body))
        self.end_headers()
        self.wfile.write(body)

    def read_body(self):
        length = int(self.headers.get('Content-Length', 0))
        return json.loads(self.rfile.read(length).decode('utf-8')) if length else {}

    def do_GET(self):
        if self.path == '/api/market':
            self.send_json(get_market())
        elif self.path == '/api/auctions':
            self.send_json({'auctions': get_auctions()})
        elif self.path.startswith('/api/state'):
            tg_id = self.headers.get('X-TG-ID', '')
            if not tg_id:
                return self.send_json({'error': 'no tg_id'}, 403)
            conn = db()
            row = conn.execute("SELECT * FROM users WHERE tg_id=?", (tg_id,)).fetchone()
            conn.close()
            if row:
                self.send_json({'balance': row['balance'],
                                'state': json.loads(row['state'] or '{}'),
                                'username': row['username']})
            else:
                self.send_json({'balance': 100000, 'state': {}, 'username': ''})
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/tg/validate':
            data = self.read_body()
            init_data = data.get('initData', '')
            if not init_data or not BOT_TOKEN:
                return self.send_json({'valid': False, 'msg': 'no initData or token'}, 403)
            try:
                secret = hmac.new(b'WebAppData', BOT_TOKEN.encode(), hashlib.sha256).digest()
                params = parse_qs(init_data)
                received_hash = params.get('hash', [''])[0]
                pairs = sorted(f"{k}={v[0]}" for k, v in params.items() if k != 'hash')
                computed = hmac.new(secret, '\n'.join(pairs).encode(), hashlib.sha256).hexdigest()
                if computed == received_hash:
                    user_data = json.loads(params.get('user', ['{}'])[0])
                    tg_id = str(user_data.get('id', ''))
                    username = user_data.get('username', '')
                    conn = db()
                    conn.execute("INSERT OR IGNORE INTO users(tg_id, username) VALUES(?,?)", (tg_id, username))
                    conn.execute("UPDATE users SET username=? WHERE tg_id=?", (username, tg_id))
                    conn.commit()
                    conn.close()
                    self.send_json({'valid': True, 'tg_id': tg_id, 'username': username})
                else:
                    self.send_json({'valid': False, 'msg': 'hash mismatch'}, 403)
            except Exception as e:
                self.send_json({'valid': False, 'msg': str(e)}, 500)
        elif self.path == '/api/action':
            data = self.read_body()
            tg_id = self.headers.get('X-TG-ID', '')
            if not tg_id:
                return self.send_json({'ok': False, 'msg': 'no auth'}, 403)
            action = data.get('action', '')
            conn = db()
            user = conn.execute("SELECT * FROM users WHERE tg_id=?", (tg_id,)).fetchone()
            if not user:
                conn.execute("INSERT INTO users(tg_id) VALUES(?)", (tg_id,))
                conn.commit()
                user = conn.execute("SELECT * FROM users WHERE tg_id=?", (tg_id,)).fetchone()
            balance = user['balance']
            state = json.loads(user['state'] or '{}')
            inv = state.get('inv', [])
            tx = state.get('tx', [])
            if action == 'buy':
                price = data.get('price', 0)
                item = data.get('item', {})
                if balance >= price:
                    balance -= price
                    inv.append({**item, 'uid': int(time.time()*1000), 'bought': price,
                                'val': price, 'date': time.time()})
                    tx.insert(0, {'t': time.time(), 'type': 'BUY', 'item': item.get('name',''), 'amount': -price})
                    tx = tx[:100]
                    resp = {'ok': True, 'balance': balance}
                else:
                    resp = {'ok': False, 'msg': 'Недостаточно средств'}
            elif action == 'sell':
                uid = data.get('uid', 0)
                price = data.get('price', 0)
                idx = next((i for i, x in enumerate(inv) if x.get('uid') == uid), None)
                if idx is not None and price > 0:
                    item = inv.pop(idx)
                    balance += price
                    tx.insert(0, {'t': time.time(), 'type': 'SELL', 'item': item.get('name',''), 'amount': price})
                    tx = tx[:100]
                    resp = {'ok': True, 'balance': balance}
                else:
                    resp = {'ok': False, 'msg': 'Ошибка продажи'}
            elif action == 'bid':
                resp = place_bid(data.get('auction_id'), data.get('amount', 0), tg_id, user['username'])
                if resp.get('ok'):
                    balance -= data.get('amount', 0)
                    resp['balance'] = balance
            elif action == 'save':
                state = data.get('state', {})
                resp = {'ok': True}
            else:
                resp = {'ok': False, 'msg': 'unknown action'}
            state['inv'] = inv
            state['tx'] = tx
            conn.execute("UPDATE users SET balance=?, state=?, updated=? WHERE tg_id=?",
                         (balance, json.dumps(state, ensure_ascii=False), time.time(), tg_id))
            conn.commit()
            conn.close()
            self.send_json(resp)
        else:
            self.send_json({'error': 'not found'}, 404)

if __name__ == '__main__':
    init_db()
    PORT = int(os.environ.get('PORT', 8765))
    class Server(http.server.ThreadingHTTPServer):
        daemon_threads = True
        allow_reuse_address = True
    httpd = Server(('0.0.0.0', PORT), Handler)
    print('Server on port', PORT)
    httpd.serve_forever()

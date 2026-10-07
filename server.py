import http.server, socketserver, json, hashlib, hmac, sqlite3, time, os, random
from urllib.parse import parse_qs

BOT_TOKEN = os.environ.get('BOT_TOKEN', '')
DB = 'data.db'

def db():
    conn = sqlite3.connect(DB); conn.row_factory = sqlite3.Row; return conn

def init_db():
    conn = db()
    conn.execute('''CREATE TABLE IF NOT EXISTS users(tg_id TEXT PRIMARY KEY, username TEXT,
        balance REAL DEFAULT 100000, state TEXT DEFAULT '{}', updated REAL DEFAULT 0)''')
    conn.execute('''CREATE TABLE IF NOT EXISTS auctions(id TEXT PRIMARY KEY, name TEXT, cat TEXT,
        rarity TEXT, start_price REAL, current_bid REAL, leader TEXT, bids TEXT DEFAULT '[]',
        end_time REAL, status TEXT DEFAULT 'active')''')
    conn.execute('''CREATE TABLE IF NOT EXISTS contracts(id TEXT PRIMARY KEY, npc TEXT, name TEXT,
        cat TEXT, rarity TEXT, reward REAL, rep INTEGER, exp REAL, st TEXT DEFAULT 'open',
        tg_id TEXT DEFAULT '', end_task REAL DEFAULT 0)''')
    conn.commit(); conn.close()

ITEMS = [
    ['КВАНТОВЫЙ ЧИП','TECH','RARE',12480],['ЧЁРНЫЙ СИГНАЛ','TECH','EPIC',48200],
    ['ОРБИТАЛЬНЫЙ КЛЮЧ','ARTIFACTS','LEGENDARY',91400],['НЕИЗВЕСТНОЕ УСТРОЙСТВО','UNKNOWN','UNKNOWN',60000],
    ['НУЛЬ-ЯДРО','UNKNOWN','UNKNOWN',32000],['ПРИЗРАЧНЫЙ ДИСК','TECH','UNCOMMON',4200],
    ['ПЕПЕЛЬНАЯ РЕЛИКВИЯ','ARTIFACTS','RARE',27800],['БЛЕДНАЯ МАСКА','COLLECTIBLES','COMMON',1900],
    ['ЖЕЛЕЗНЫЙ ВОРОБЕЙ','VEHICLES','EPIC',76500],['ПЫЛЬНЫЙ БЕГУН','VEHICLES','UNCOMMON',8800],
    ['РЕШЁТЧАТЫЙ УЗЕЛ','DEVICES','RARE',15900],['СИГИЛ 07','COLLECTIBLES','UNCOMMON',3100],
    ['ЛИНЗА ПЕПЛА','DEVICES','COMMON',2400],['ПОЛАЯ КОРОНА','ARTIFACTS','LEGENDARY',138000],
    ['СТАТИЧНАЯ ПРИЗМА','DEVICES','EPIC',39500],['МОТЫЛЬКОВЫЙ ПРОТОКОЛ','TECH','COMMON',1500],
    ['КРИОЯЧЕЙКА','TECH','RARE',18700],['ТЛЕЮЩИЙ ФЛЮКС','DEVICES','UNCOMMON',5600],
    ['НУАР-ШИФР','TECH','EPIC',54300],['БАРХАТНОЕ ЭХО','ARTIFACTS','RARE',22400],
    ['РЖАВЫЙ ОРЕОЛ','COLLECTIBLES','COMMON',2100],['ОНИКСОВОЕ КРЫЛО','VEHICLES','EPIC',68900],
    ['ПИКСЕЛЬНАЯ ПЫЛЬ','DEVICES','COMMON',1700],['ЯДРО МИРАЖА','UNKNOWN','UNKNOWN',45000],
    ['АТЛАСНЫЙ ВАКУУМ','ARTIFACTS','EPIC',41200],['КОБАЛЬТОВАЯ РУНА','COLLECTIBLES','RARE',13600],
    ['ПРИЗРАК ШОССЕ','VEHICLES','RARE',19800],['ЛУННЫЙ БИЛЕТ','COLLECTIBLES','UNCOMMON',4700],
    ['КВАРЦЕВЫЙ ВОЙ','DEVICES','UNCOMMON',7300],['ОБСИДИАНОВАЯ КАРТА','ARTIFACTS','LEGENDARY',112000],
    ['НЕЙРОИНТЕРФЕЙС','TECH','RARE',21400],['ГЛУБИННЫЙ СКУТЕР','VEHICLES','COMMON',3900],
    ['ВИНИЛ «ЭХО-7»','COLLECTIBLES','RARE',16800],['ШТОРМОВОЙ КАТЕР','VEHICLES','LEGENDARY',126000],
    ['ОКО БУРИ','ARTIFACTS','EPIC',44700],['ЗАПЕЧАТАННАЯ КАПСУЛА','UNKNOWN','UNKNOWN',28000],
    ['КАРТА МЁРТВЫХ','COLLECTIBLES','EPIC',37300],['ОПТИЧЕСКИЙ КАМУФЛЯЖ','TECH','UNCOMMON',6200]
]
VOL = {'COMMON':.012,'UNCOMMON':.015,'RARE':.02,'EPIC':.026,'LEGENDARY':.03,'UNKNOWN':.04}
NPCS = ['ZERO','NEXUS','BLACKBOX','MERCURY','VOID_21','RAVEN','ORBIT','GHOST']
REPR = {'COMMON':4,'UNCOMMON':7,'RARE':12,'EPIC':20,'LEGENDARY':35}
RCP = {'c3':{'need':3,'from':'COMMON','to':'UNCOMMON','p':.85},'e2':{'need':2,'from':'EPIC','to':'LEGENDARY','p':.22}}

def seeded_random(seed_str):
    h = int(hashlib.md5(seed_str.encode()).hexdigest(), 16)
    return (h % 10000) / 10000.0

RAID = {'until':0,'next':time.time()+random.randint(180,420),'frozen':None,'mult':{}}

def raid_check(now, tick):
    if RAID['frozen'] is None and now >= RAID['next']:
        RAID['frozen'] = tick; RAID['until'] = now + 60
    if RAID['frozen'] is not None and now >= RAID['until']:
        seed = str(RAID['until']); m = {}
        for it in ITEMS:
            r = seeded_random(seed + it[0])
            m[it[0]] = round(1.06 + r * 0.16, 3) if seeded_random(seed + it[0] + 'd') < 0.65 else round(0.86 + r * 0.10, 3)
        RAID['mult'] = m; RAID['frozen'] = None
        RAID['next'] = now + random.randint(300, 720)

def raid_info(now):
    return {'active': RAID['frozen'] is not None,
            'left': max(0, RAID['until'] - now) if RAID['frozen'] is not None else 0}

def item_price(item, ft):
    name, cat, rarity, base = item
    seed = f"{ft}_{name}"
    r1 = seeded_random(seed + "_p")
    vol = VOL.get(rarity, .02)
    mult = RAID['mult'].get(name, 1)
    change = (r1 - 0.5) * 2 * vol * 8
    return round(max(base * 0.4, min(base * 2.2, base * (1 + change) * mult)))

def market_price(name):
    it = next((i for i in ITEMS if i[0] == name), None)
    if not it: return None
    now = int(time.time()); tick = now // 10
    raid_check(now, tick)
    ft = RAID['frozen'] if RAID['frozen'] is not None else tick
    return item_price(it, ft)

def get_market():
    now = int(time.time()); tick = now // 10
    raid_check(now, tick)
    ft = RAID['frozen'] if RAID['frozen'] is not None else tick
    products = []
    for idx, item in enumerate(ITEMS):
        name, cat, rarity, base = item
        seed = f"{ft}_{name}"
        r2 = seeded_random(seed + "_d")
        price = item_price(item, ft)
        hist = []
        for i in range(60):
            hist.append(item_price(item, ft - (59 - i)))
        products.append({
            'id': f'VM-{10000 + idx * 7 + ft % 100}',
            'name': name, 'cat': cat, 'rarity': rarity,
            'price': price, 'base': base,
            'seller': NPCS[idx % len(NPCS)],
            'hist': hist, 'views': int(r2 * 900) + 20,
            'sup': int(seeded_random(seed + "_s") * 11) + 1,
            'exp': now + int(seeded_random(seed + "_e") * 3600) + 600
        })
    return {'tick': ft, 'time': now, 'products': products, 'raid': raid_info(now)}

def get_auctions():
    conn = db(); now = time.time()
    due = conn.execute("SELECT * FROM auctions WHERE end_time < ? AND status='active'", (now,)).fetchall()
    for r in due:
        bids = json.loads(r['bids'] or '[]')
        if bids:
            wid = bids[-1].get('id')
            if wid:
                u = conn.execute("SELECT state FROM users WHERE tg_id=?", (wid,)).fetchone()
                if u:
                    st = json.loads(u['state'] or '{}'); inv = st.get('inv', [])
                    inv.append({'uid': int(now * 1000), 'name': r['name'], 'rarity': r['rarity'],
                                'cat': r['cat'], 'hue': 200, 'bought': r['current_bid'],
                                'val': r['current_bid'], 'date': now})
                    st['inv'] = inv
                    conn.execute("UPDATE users SET state=? WHERE tg_id=?", (json.dumps(st, ensure_ascii=False), wid))
    conn.execute("UPDATE auctions SET status='finished' WHERE end_time < ? AND status='active'", (now,))
    active = conn.execute("SELECT COUNT(*) FROM auctions WHERE status='active'").fetchone()[0]
    if active < 5:
        for i in range(5 - active):
            item = random.choice(ITEMS)
            aid = f"AU-{int(now * 1000)}-{i}"
            conn.execute("INSERT OR IGNORE INTO auctions(id,name,cat,rarity,start_price,current_bid,leader,end_time) VALUES(?,?,?,?,?,?,?,?)",
                         (aid, item[0], item[1], item[2], round(item[3]*0.5), round(item[3]*0.5), None,
                          now + random.randint(120, 600)))
    conn.commit()
    rows = conn.execute("SELECT * FROM auctions WHERE status='active' ORDER BY end_time").fetchall()
    conn.close()
    out = []
    for r in rows:
        bids = json.loads(r['bids'] or '[]')
        out.append({'id': r['id'], 'name': r['name'], 'cat': r['cat'], 'rarity': r['rarity'],
                    'start': r['start_price'], 'bid': r['current_bid'], 'leader': r['leader'],
                    'bids': bids[-10:], 'end': r['end_time'],
                    'left': max(0, int(r['end_time'] - now)), 'n': len(bids)})
    return out

def place_bid(auction_id, amount, tg_id, username):
    conn = db()
    row = conn.execute("SELECT * FROM auctions WHERE id=? AND status='active'", (auction_id,)).fetchone()
    if not row: conn.close(); return {'ok': False, 'msg': 'Аукцион не найден или завершён'}
    if time.time() > row['end_time']: conn.close(); return {'ok': False, 'msg': 'Аукцион завершён'}
    min_bid = row['current_bid'] + max(100, int(row['start_price'] * 0.05))
    if amount < min_bid: conn.close(); return {'ok': False, 'msg': f'Минимум: {min_bid}'}
    user = conn.execute("SELECT balance FROM users WHERE tg_id=?", (tg_id,)).fetchone()
    if not user or user['balance'] < amount: conn.close(); return {'ok': False, 'msg': 'Недостаточно средств'}
    bids = json.loads(row['bids'] or '[]')
    if bids:
        prev_id = bids[-1].get('id')
        if prev_id and prev_id != tg_id:
            conn.execute("UPDATE users SET balance = balance + ? WHERE tg_id=?", (row['current_bid'], prev_id))
    bids.append({'who': username or tg_id, 'id': tg_id, 'amt': amount, 't': time.time()})
    conn.execute("UPDATE auctions SET current_bid=?, leader=?, bids=? WHERE id=?",
                 (amount, username or tg_id, json.dumps(bids[-20:]), auction_id))
    conn.commit(); conn.close()
    return {'ok': True, 'bid': amount, 'leader': username or tg_id}

def get_contracts(tg_id):
    conn = db(); now = time.time()
    conn.execute("DELETE FROM contracts WHERE st='open' AND exp < ?", (now,))
    conn.execute("DELETE FROM contracts WHERE st='acc' AND end_task < ?", (now,))
    open_n = conn.execute("SELECT COUNT(*) c FROM contracts WHERE st='open'").fetchone()['c']
    while open_n < 3:
        item = random.choice([i for i in ITEMS if i[2] != 'UNKNOWN'])
        cid = f"CT-{int(now*1000)}-{random.randint(100,999)}"
        mult = round(random.uniform(1.1, 1.35), 2)
        conn.execute("INSERT INTO contracts(id,npc,name,cat,rarity,reward,rep,exp) VALUES(?,?,?,?,?,?,?,?)",
                     (cid, random.choice(NPCS), item[0], item[1], item[2],
                      round(item[3] * mult), REPR.get(item[2], 5), now + random.randint(300, 900)))
        open_n += 1
    conn.commit()
    rows = conn.execute("SELECT * FROM contracts WHERE st='open' OR (st='acc' AND tg_id=?) ORDER BY st DESC", (tg_id,)).fetchall()
    conn.close()
    out = []
    for r in rows:
        d = dict(r)
        d['left'] = max(0, int((r['end_task'] if r['st'] == 'acc' else r['exp']) - now))
        out.append(d)
    return out

class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map,
        '.css': 'text/css', '.js': 'application/javascript',
        '.html': 'text/html; charset=utf-8', '.json': 'application/json'}
    timeout = 30
    protocol_version = 'HTTP/1.1'

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-TG-ID')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200); self.end_headers()

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
        tg_id = self.headers.get('X-TG-ID', '')
        if self.path == '/api/market':
            self.send_json(get_market())
        elif self.path == '/api/auctions':
            self.send_json({'auctions': get_auctions()})
        elif self.path == '/api/contracts':
            self.send_json({'contracts': get_contracts(tg_id)})
        elif self.path.startswith('/api/state'):
            if not tg_id: return self.send_json({'error': 'no tg_id'}, 403)
            conn = db()
            row = conn.execute("SELECT * FROM users WHERE tg_id=?", (tg_id,)).fetchone()
            if row:
                st = json.loads(row['state'] or '{}')
                ch = False
                for i in st.get('inv', []):
                    mp = market_price(i.get('name', ''))
                    if mp and mp != i.get('val'):
                        i['val'] = mp; ch = True
                if ch:
                    conn.execute("UPDATE users SET state=? WHERE tg_id=?",
                                 (json.dumps(st, ensure_ascii=False), tg_id))
                    conn.commit()
                self.send_json({'balance': row['balance'], 'state': st, 'username': row['username']})
            else:
                self.send_json({'balance': 100000, 'state': {}, 'username': ''})
            conn.close()
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/tg/validate':
            data = self.read_body(); init_data = data.get('initData', '')
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
                    tg_id = str(user_data.get('id', '')); username = user_data.get('username', '')
                    conn = db()
                    conn.execute("INSERT OR IGNORE INTO users(tg_id, username) VALUES(?,?)", (tg_id, username))
                    conn.execute("UPDATE users SET username=? WHERE tg_id=?", (username, tg_id))
                    conn.commit(); conn.close()
                    self.send_json({'valid': True, 'tg_id': tg_id, 'username': username})
                else:
                    self.send_json({'valid': False, 'msg': 'hash mismatch'}, 403)
            except Exception as e:
                self.send_json({'valid': False, 'msg': str(e)}, 500)
        elif self.path == '/api/action':
            data = self.read_body()
            tg_id = self.headers.get('X-TG-ID', '')
            if not tg_id: return self.send_json({'ok': False, 'msg': 'no auth'}, 403)
            action = data.get('action', '')
            conn = db()
            user = conn.execute("SELECT * FROM users WHERE tg_id=?", (tg_id,)).fetchone()
            if not user:
                conn.execute("INSERT INTO users(tg_id) VALUES(?)", (tg_id,)); conn.commit()
                user = conn.execute("SELECT * FROM users WHERE tg_id=?", (tg_id,)).fetchone()
            balance = user['balance']
            state = json.loads(user['state'] or '{}')
            inv = state.get('inv', []); tx = state.get('tx', [])
            now = time.time()

            if action == 'buy':
                if RAID['frozen'] is not None:
                    resp = {'ok': False, 'msg': 'Торги приостановлены: идёт рейд'}
                else:
                    price = data.get('price', 0); item = data.get('item', {})
                    if balance >= price:
                        balance -= price
                        inv.append({**item, 'uid': int(now*1000), 'bought': price, 'val': price, 'date': now})
                        tx.insert(0, {'t': now, 'type': 'ПОКУПКА', 'item': item.get('name',''), 'amount': -price})
                        tx = tx[:100]; resp = {'ok': True, 'balance': balance}
                    else:
                        resp = {'ok': False, 'msg': 'Недостаточно средств'}
            elif action == 'sell':
                uid = data.get('uid', 0); price = data.get('price', 0)
                idx = next((i for i, x in enumerate(inv) if x.get('uid') == uid), None)
                if idx is not None and price > 0:
                    cur = market_price(inv[idx].get('name', '')) or inv[idx].get('val', 0) or price
                    if price > cur * 1.15:
                        resp = {'ok': False, 'msg': 'НЕТ ПОКУПАТЕЛЯ: цена выше рыночной более чем на 15%'}
                    elif price < cur * 0.3:
                        resp = {'ok': False, 'msg': 'Слишком дёшево: рынок не примет такую цену'}
                    else:
                        item = inv.pop(idx); balance += price
                        tx.insert(0, {'t': now, 'type': 'ПРОДАЖА', 'item': item.get('name',''), 'amount': price})
                        tx = tx[:100]; resp = {'ok': True, 'balance': balance}
                else:
                    resp = {'ok': False, 'msg': 'Ошибка продажи'}
            elif action == 'bid':
                if RAID['frozen'] is not None:
                    resp = {'ok': False, 'msg': 'Торги приостановлены: идёт рейд'}
                else:
                    resp = place_bid(data.get('auction_id'), data.get('amount', 0), tg_id, user['username'])
                    if resp.get('ok'):
                        balance -= data.get('amount', 0); resp['balance'] = balance
            elif action == 'ct-accept':
                cid = data.get('id', '')
                cur = conn.execute("SELECT * FROM contracts WHERE id=? AND st='open'", (cid,)).fetchone()
                if cur:
                    conn.execute("UPDATE contracts SET st='acc', tg_id=?, end_task=? WHERE id=?", (tg_id, now + 600, cid))
                    resp = {'ok': True}
                else:
                    resp = {'ok': False, 'msg': 'Контракт недоступен'}
            elif action == 'ct-done':
                cid = data.get('id', '')
                cur = conn.execute("SELECT * FROM contracts WHERE id=? AND st='acc' AND tg_id=?", (cid, tg_id)).fetchone()
                if not cur:
                    resp = {'ok': False, 'msg': 'Контракт не найден'}
                else:
                    idx = next((i for i, x in enumerate(inv) if x.get('name') == cur['name']), None)
                    if idx is None:
                        resp = {'ok': False, 'msg': 'Нет предмета: ' + cur['name']}
                    else:
                        inv.pop(idx); balance += cur['reward']
                        state['rep'] = state.get('rep', 0) + cur['rep']
                        tx.insert(0, {'t': now, 'type': 'КОНТРАКТ', 'item': cur['name'], 'amount': cur['reward']})
                        tx = tx[:100]
                        conn.execute("DELETE FROM contracts WHERE id=?", (cid,))
                        resp = {'ok': True, 'balance': balance, 'reward': cur['reward'], 'rep': cur['rep']}
            elif action == 'ct-drop':
                conn.execute("DELETE FROM contracts WHERE id=? AND st='acc' AND tg_id=?", (data.get('id',''), tg_id))
                resp = {'ok': True}
            elif action == 'craft':
                rid = data.get('recipe', ''); uids = data.get('uids', [])
                r = RCP.get(rid)
                if not r or len(uids) != r['need']:
                    resp = {'ok': False, 'msg': 'Неверный рецепт'}
                else:
                    its = [x for x in inv if x.get('uid') in uids and x.get('rarity') == r['from']]
                    if len(its) != r['need']:
                        resp = {'ok': False, 'msg': 'Не хватает предметов'}
                    else:
                        inv = [x for x in inv if x not in its]
                        basis = sum(x.get('bought', 0) for x in its)
                        if random.random() < r['p']:
                            tpl = random.choice([i for i in ITEMS if i[2] == r['to']])
                            res = {'uid': int(now*1000), 'name': tpl[0], 'rarity': tpl[2], 'cat': tpl[1],
                                   'hue': random.randint(0,360), 'bought': basis, 'val': tpl[3], 'date': now}
                            inv.append(res)
                            tx.insert(0, {'t': now, 'type': 'КРАФТ', 'item': res['name'], 'amount': 0})
                            tx = tx[:100]
                            resp = {'ok': True, 'res': res['name']}
                        else:
                            tx.insert(0, {'t': now, 'type': 'КРАФТ', 'item': 'ПРОВАЛ', 'amount': 0})
                            tx = tx[:100]
                            resp = {'ok': True, 'res': None}
            elif action == 'save':
                resp = {'ok': True}
            else:
                resp = {'ok': False, 'msg': 'unknown action'}

            state['inv'] = inv; state['tx'] = tx
            conn.execute("UPDATE users SET balance=?, state=?, updated=? WHERE tg_id=?",
                         (balance, json.dumps(state, ensure_ascii=False), now, tg_id))
            conn.commit(); conn.close()
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

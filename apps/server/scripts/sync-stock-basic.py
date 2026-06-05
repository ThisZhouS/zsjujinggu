#!/usr/bin/env python3
"""Sync stock basic info - standalone script"""
import os, re, time
import psycopg2
import psycopg2.extras
import requests
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "http://api.mairuiapi.com"
API_KEY = os.getenv("MAIRUI_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

from urllib.parse import urlparse
parsed = urlparse(DATABASE_URL)
DB_CONFIG = {
    "host": parsed.hostname or "localhost",
    "port": parsed.port or 5432,
    "database": parsed.path.lstrip("/"),
    "user": parsed.username,
    "password": parsed.password,
}

OTHER_DELAY = 0.15

def get_conn():
    return psycopg2.connect(**DB_CONFIG)

def extract_numeric(val):
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return val
    s = str(val).strip()
    if not s:
        return None
    try:
        return float(s)
    except ValueError:
        pass
    m = re.match(r"([0-9]+\.?[0-9]*)", s)
    if m:
        return float(m.group(1))
    return None

def code_without_suffix(code: str) -> str:
    return code.split(".")[0]

def code_with_suffix(code: str) -> str:
    if "." in code:
        return code
    if code.startswith("6") or code.startswith("9") or code.startswith("688"):
        return f"{code}.SH"
    return f"{code}.SZ"

def get_stock_codes():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT dm FROM stock_list ORDER BY dm")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    codes = [r[0] for r in rows if r[0]]
    return [c if "." in c else code_with_suffix(c) for c in codes]

stock_codes = get_stock_codes()
print(f"共获取到 {len(stock_codes)} 只股票代码")

print("\n=== 6. 同步股票基本信息 ===")
total = 0
success = 0
fail = 0

conn = get_conn()
cur = conn.cursor()

for idx, code in enumerate(stock_codes, 1):
    if idx % 500 == 0:
        print(f"  进度: {idx}/{len(stock_codes)}，成功 {success}，共 {total} 条")

    try:
        api_code = code_without_suffix(code)
        url = f"{BASE_URL}/hscp/gsjj/{api_code}/{API_KEY}"
        resp = requests.get(url, timeout=30)
        if resp.status_code != 200:
            fail += 1
            time.sleep(OTHER_DELAY)
            continue
        item = resp.json()
        # Handle flat dict or nested in 'data'
        if isinstance(item, dict):
            if "name" not in item:
                inner = item.get("data")
                if isinstance(inner, dict) and "name" in inner:
                    item = inner
        else:
            fail += 1
            time.sleep(OTHER_DELAY)
            continue

        mc = item.get("name") or ""
        if not mc:
            fail += 1
            time.sleep(OTHER_DELAY)
            continue

        dm_val = code_without_suffix(code)
        ssrq = item.get("ldate") or item.get("rdate") or ""
        fxj = extract_numeric(item.get("sprice"))
        fxsl = extract_numeric(item.get("rprice"))

        cur.execute(
            """INSERT INTO stock_basic_info (dm, mc, ssrq, fxj, fxsl)
               VALUES (%s, %s, %s, %s, %s)
               ON CONFLICT (dm) DO UPDATE SET
                 mc=EXCLUDED.mc, ssrq=EXCLUDED.ssrq, fxj=EXCLUDED.fxj, fxsl=EXCLUDED.fxsl""",
            (dm_val, mc, ssrq, fxj, fxsl),
        )
        total += 1
        conn.commit()
        success += 1

    except Exception as e:
        fail += 1
        print(f"  ✗ {code}: {e}")

    time.sleep(OTHER_DELAY)

cur.close()
conn.close()
print(f"\n  ✓ 完成！成功 {success}/{len(stock_codes)}，失败 {fail}，共 {total} 条记录")

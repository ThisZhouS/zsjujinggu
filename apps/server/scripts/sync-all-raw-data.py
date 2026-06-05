#!/usr/bin/env python3
"""
全量原始数据获取脚本 - 从 Mairui API 获取所有原始数据

数据表与 API 映射：
1. stock_list          -> /hslt/list/{key}
2. hs_stock_history_trading -> /hsstock/history/{code}/d/n/{key}?st=YYYYMMDD&et=YYYYMMDD
3. company_top_flow_holders  -> /hsstock/financial/flowholder/{code}/{key}
4. executive_member          -> /hscp/ljjj/{code}/{key}
5. recent_dividend           -> /hscp/jnfh/{code}/{key}
6. stock (basic info)        -> /hscp/gsjj/{code}/{key}

使用方式：
  cd apps/server
  python3 scripts/sync-all-raw-data.py
"""

import json
import os
import re
import time
from datetime import datetime, date
from typing import Optional
from urllib.parse import urlparse, parse_qs

import psycopg2
import psycopg2.extras
import requests
from dotenv import load_dotenv

# ── 配置 ──────────────────────────────────────────────────────────────

load_dotenv()

BASE_URL = "http://api.mairuiapi.com"
API_KEY = os.getenv("MAIRUI_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")

if not API_KEY:
    raise SystemExit("错误: 未配置 MAIRUI_API_KEY")
if not DATABASE_URL:
    raise SystemExit("错误: 未配置 DATABASE_URL")

# 从 DATABASE_URL 解析连接参数
parsed = urlparse(DATABASE_URL)
DB_CONFIG = {
    "host": parsed.hostname or "localhost",
    "port": parsed.port or 5432,
    "database": parsed.path.lstrip("/"),
    "user": parsed.username,
    "password": parsed.password,
}

# 限速：历史交易 500ms，其他 200ms
TRADING_DELAY = 0.3
OTHER_DELAY = 0.15

# 批量写入大小
BATCH_SIZE = 500

# 历史交易按年分段拉取
CURRENT_YEAR = date.today().year
EARLIEST_YEAR = 1991


def get_conn():
    """获取数据库连接"""
    return psycopg2.connect(**DB_CONFIG)


def api_get(url: str, timeout: int = 30) -> list | dict:
    """调用 Mairui API 并返回数据"""
    try:
        resp = requests.get(url, timeout=timeout)
        if resp.status_code != 200:
            return []
        data = resp.json()
        # Handle nested error responses like {"data": "<html>404</html>"}
        if isinstance(data, dict):
            inner = data.get("data")
            if isinstance(inner, str) and inner.startswith("<html>"):
                return []
        if isinstance(data, list):
            return data
        return data
    except Exception:
        return []


def normalize_date(date_str: str) -> Optional[str]:
    """统一日期格式为 YYYY-MM-DD"""
    if not date_str or date_str == "--":
        return None
    s = str(date_str).strip()
    if " " in s:
        s = s.split(" ")[0]
    # YYYYMMDD -> YYYY-MM-DD
    m = re.match(r"^(\d{4})(\d{2})(\d{2})$", s)
    if m:
        return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    # 已经是 YYYY-MM-DD
    if re.match(r"^\d{4}-\d{2}-\d{2}$", s):
        return s
    return None


def code_without_suffix(code: str) -> str:
    """去除股票代码后缀 .SZ/.SH"""
    return code.split(".")[0]


def code_with_suffix(code: str) -> str:
    """添加股票代码后缀"""
    if "." in code:
        return code
    if code.startswith("6") or code.startswith("9") or code.startswith("688"):
        return f"{code}.SH"
    return f"{code}.SZ"


# ── 1. 同步股票列表 ────────────────────────────────────────────────────

def sync_stock_list():
    print("\n=== 1. 同步股票列表 ===")
    url = f"{BASE_URL}/hslt/list/{API_KEY}"
    data = api_get(url)
    if not data:
        print("  股票列表 API 无返回")
        return 0

    conn = get_conn()
    cur = conn.cursor()
    count = 0
    for item in data:
        dm = item.get("dm")
        if not dm:
            continue
        dm_clean = code_without_suffix(dm)
        mc = item.get("mc") or item.get("jc") or ""
        jys = item.get("jys") or "A"
        try:
            cur.execute(
                """INSERT INTO stock_list (dm, mc, jys, "createdAt")
                   VALUES (%s, %s, %s, NOW())
                   ON CONFLICT (dm) DO UPDATE SET mc=EXCLUDED.mc, jys=EXCLUDED.jys""",
                (dm_clean, mc, jys),
            )
            count += 1
        except Exception as e:
            pass
    conn.commit()
    cur.close()
    conn.close()
    print(f"  ✓ 同步 {count} 只股票到 stock_list")
    return count


# ── 获取股票代码列表 ──────────────────────────────────────────────────

def get_stock_codes() -> list[str]:
    """从 stock_list 表读取所有股票代码（带后缀格式）"""
    conn = get_conn()
    cur = conn.cursor()
    cur.execute('SELECT dm FROM stock_list ORDER BY dm')
    rows = cur.fetchall()
    cur.close()
    conn.close()
    codes = [r[0] for r in rows if r[0]]
    # 确保带后缀
    return [c if "." in c else code_with_suffix(c) for c in codes]


# ── 2. 同步历史交易数据 ──────────────────────────────────────────────

def sync_trading_data(stock_codes: list[str]):
    print(f"\n=== 2. 同步历史交易数据 ({len(stock_codes)} 只股票) ===")
    total = 0
    success = 0
    fail = 0

    conn = get_conn()
    cur = conn.cursor()

    for idx, code in enumerate(stock_codes, 1):
        code_clean = code_without_suffix(code)
        if idx % 100 == 0:
            print(f"  进度: {idx}/{len(stock_codes)}，成功 {success}，失败 {fail}，共 {total} 条")

        try:
            all_records = []
            # 按年分段拉取，避免单次请求数据量过大
            for year_start in range(EARLIEST_YEAR, CURRENT_YEAR + 1):
                year_end = year_start
                st = f"{year_start}0101"
                et = f"{year_end}1231"
                if year_end == CURRENT_YEAR:
                    et = date.today().strftime("%Y%m%d")

                url = f"{BASE_URL}/hsstock/history/{code}/d/n/{API_KEY}?st={st}&et={et}"
                data = api_get(url, timeout=60)
                if not data:
                    continue

                for item in data:
                    t_raw = item.get("t", "")
                    t = normalize_date(t_raw)
                    if not t:
                        continue
                    all_records.append((
                        code_clean,
                        t,
                        "n",
                        item.get("o"),
                        item.get("h"),
                        item.get("l"),
                        item.get("c"),
                        item.get("v"),
                        item.get("a"),
                        item.get("pc"),
                        item.get("sf"),
                    ))

            if not all_records:
                fail += 1
                time.sleep(TRADING_DELAY)
                continue

            # 批量插入
            inserted = 0
            for i in range(0, len(all_records), BATCH_SIZE):
                batch = all_records[i:i + BATCH_SIZE]
                psycopg2.extras.execute_values(
                    cur,
                    """INSERT INTO hs_stock_history_trading
                       (dm, t, model, o, h, l, c, v, a, pc, sf)
                       VALUES %s
                       ON CONFLICT (dm, t, model) DO NOTHING""",
                    batch,
                    template="( %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s )",
                )
                inserted += len(batch)

            conn.commit()
            total += inserted
            success += 1

        except Exception as e:
            fail += 1
            print(f"  ✗ {code}: {e}")

        time.sleep(TRADING_DELAY)

    cur.close()
    conn.close()
    print(f"\n  ✓ 完成！成功 {success}/{len(stock_codes)}，失败 {fail}，共 {total} 条记录")
    return total


# ── 3. 同步十大流通股东 ─────────────────────────────────────────────

def sync_top_flow_holders(stock_codes: list[str]):
    print(f"\n=== 3. 同步十大流通股东 ({len(stock_codes)} 只股票) ===")
    total = 0
    success = 0
    fail = 0

    conn = get_conn()
    cur = conn.cursor()

    for idx, code in enumerate(stock_codes, 1):
        if idx % 200 == 0:
            print(f"  进度: {idx}/{len(stock_codes)}，成功 {success}，共 {total} 条")

        try:
            url = f"{BASE_URL}/hsstock/financial/flowholder/{code}/{API_KEY}"
            data = api_get(url, timeout=30)
            if not data:
                fail += 1
                time.sleep(OTHER_DELAY)
                continue

            records = []
            for item in data:
                gdlx = item.get("gdlx") or ""
                # 只保存自然人
                if gdlx != "自然人":
                    continue
                gdmc = item.get("gdmc")
                jzrq = normalize_date(item.get("jzrq"))
                if not gdmc or not jzrq:
                    continue
                records.append((
                    code_without_suffix(code),
                    jzrq,
                    normalize_date(item.get("ggrq")),
                    gdmc,
                    gdlx,
                    item.get("cgsl"),
                    item.get("bdyy"),
                    item.get("cgbl"),
                    item.get("gfxz"),
                    item.get("cgpm"),
                ))

            if records:
                # company_top_flow_holders 没有唯一约束，先查询去重
                existing = set()
                unique_codes = set(r[0] for r in records)
                for sc in unique_codes:
                    cur.execute(
                        'SELECT "stockCode", jzrq, gdmc FROM company_top_flow_holders WHERE "stockCode" = %s',
                        (sc,)
                    )
                    for row in cur.fetchall():
                        existing.add((row[0], row[1], row[2]))

                new_records = [r for r in records if (r[0], r[1], r[3]) not in existing]
                if new_records:
                    for i in range(0, len(new_records), BATCH_SIZE):
                        batch = new_records[i:i + BATCH_SIZE]
                        psycopg2.extras.execute_values(
                            cur,
                            """INSERT INTO company_top_flow_holders
                               ("stockCode", jzrq, ggrq, gdmc, gdlx, cgsl, bdyy, cgbl, gfxz, cgpm)
                               VALUES %s""",
                            batch,
                            template="( %s, %s, %s, %s, %s, %s, %s, %s, %s, %s )",
                        )
                    conn.commit()
                    total += len(new_records)
                    success += 1
                else:
                    fail += 1
            else:
                fail += 1

        except Exception as e:
            fail += 1
            print(f"  ✗ {code}: {e}")

        time.sleep(OTHER_DELAY)

    cur.close()
    conn.close()
    print(f"\n  ✓ 完成！成功 {success}/{len(stock_codes)}，失败 {fail}，共 {total} 条记录")
    return total


# ── 4. 同步历届高管成员 ─────────────────────────────────────────────

def sync_executive_members(stock_codes: list[str]):
    print(f"\n=== 4. 同步历届高管成员 ({len(stock_codes)} 只股票) ===")
    total = 0
    success = 0
    fail = 0

    conn = get_conn()
    cur = conn.cursor()

    for idx, code in enumerate(stock_codes, 1):
        if idx % 200 == 0:
            print(f"  进度: {idx}/{len(stock_codes)}，成功 {success}，共 {total} 条")

        try:
            # /hscp/ 系列 API 不需要后缀
            api_code = code_without_suffix(code)
            url = f"{BASE_URL}/hscp/ljjj/{api_code}/{API_KEY}"
            data = api_get(url, timeout=30)
            if not data:
                fail += 1
                time.sleep(OTHER_DELAY)
                continue

            records = []
            for item in data:
                dm_val = code_without_suffix(code)
                member_name = item.get("name") or item.get("mc") or item.get("xm")
                if not member_name:
                    continue
                title = item.get("title") or item.get("zw") or item.get("position") or ""
                sdate_raw = item.get("sdate") or item.get("rxrq") or ""
                edate_raw = item.get("edate") or item.get("lkrq") or ""
                sdate = normalize_date(sdate_raw) or sdate_raw
                edate = normalize_date(edate_raw) or edate_raw
                if not sdate or not edate:
                    continue
                records.append((
                    dm_val,
                    member_name,
                    title,
                    sdate,
                    edate,
                ))

            if records:
                for i in range(0, len(records), BATCH_SIZE):
                    batch = records[i:i + BATCH_SIZE]
                    psycopg2.extras.execute_values(
                        cur,
                        """INSERT INTO executive_member (dm, name, title, sdate, edate)
                           VALUES %s
                           ON CONFLICT (dm, sdate, edate) DO NOTHING""",
                        batch,
                        template="( %s, %s, %s, %s, %s )",
                    )
                conn.commit()
                total += len(records)
                success += 1
            else:
                fail += 1

        except Exception as e:
            fail += 1
            print(f"  ✗ {code}: {e}")

        time.sleep(OTHER_DELAY)

    cur.close()
    conn.close()
    print(f"\n  ✓ 完成！成功 {success}/{len(stock_codes)}，失败 {fail}，共 {total} 条记录")
    return total


# ── 5. 同步分红数据 ─────────────────────────────────────────────────

def sync_dividends(stock_codes: list[str]):
    print(f"\n=== 5. 同步分红数据 ({len(stock_codes)} 只股票) ===")
    total = 0
    success = 0
    fail = 0

    conn = get_conn()
    cur = conn.cursor()

    # Load existing keys for manual dedup (no unique constraint on table)
    cur.execute('SELECT dm, jzrq, plrq FROM recent_dividend')
    existing = set((r[0], r[1], r[2]) for r in cur.fetchall())
    print(f"  已有 {len(existing)} 条记录")

    for idx, code in enumerate(stock_codes, 1):
        if idx % 200 == 0:
            print(f"  进度: {idx}/{len(stock_codes)}，成功 {success}，共 {total} 条")

        try:
            # /hscp/ 系列 API 不需要后缀
            api_code = code_without_suffix(code)
            url = f"{BASE_URL}/hscp/jnfh/{api_code}/{API_KEY}"
            data = api_get(url, timeout=30)
            if not data:
                fail += 1
                time.sleep(OTHER_DELAY)
                continue

            records = []
            for item in data:
                dm_val = code_without_suffix(code)
                jzrq = normalize_date(item.get("sdate") or item.get("jzrq"))
                plrq = normalize_date(item.get("cdate") or item.get("plrq"))
                if not jzrq or not plrq:
                    continue
                key = (dm_val, jzrq, plrq)
                if key in existing:
                    continue
                existing.add(key)
                # fhx = 派息方案
                send = item.get("send")
                fhx = f"每 10 股派{send}元" if send else None
                records.append((
                    dm_val,
                    jzrq,
                    plrq,
                    fhx,
                    normalize_date(item.get("hdate") or item.get("fhjyr")),
                    normalize_date(item.get("edate") or item.get("fhjzr")),
                    item.get("give") and f"每 10 股送{item['give']}股",
                    item.get("hfjyr"),
                    item.get("hfjzr"),
                    item.get("zf") and f"每 10 股转{item['zf']}股",
                    item.get("zfjyr"),
                    item.get("zfjzr"),
                ))

            if records:
                for i in range(0, len(records), BATCH_SIZE):
                    batch = records[i:i + BATCH_SIZE]
                    psycopg2.extras.execute_values(
                        cur,
                        """INSERT INTO recent_dividend
                           (dm, jzrq, plrq, fhx, fhjyr, fhjzr, hf, hfjyr, hfjzr, zf, zfjyr, zfjzr)
                           VALUES %s""",
                        batch,
                        template="( %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s )",
                    )
                conn.commit()
                total += len(records)
                success += 1
            else:
                fail += 1

        except Exception as e:
            fail += 1
            print(f"  ✗ {code}: {e}")

        time.sleep(OTHER_DELAY)

    cur.close()
    conn.close()
    print(f"\n  ✓ 完成！成功 {success}/{len(stock_codes)}，失败 {fail}，共 {total} 条记录")
    return total


# ── 6. 同步股票基本信息 ─────────────────────────────────────────────

def extract_numeric(val) -> Optional[float]:
    """Extract numeric value from strings like '1940590万元(CNY)' or '40.00'"""
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


def sync_stock_basic_info(stock_codes: list[str]):
    print(f"\n=== 6. 同步股票基本信息 ({len(stock_codes)} 只股票) ===")
    total = 0
    success = 0
    fail = 0

    conn = get_conn()
    cur = conn.cursor()

    for idx, code in enumerate(stock_codes, 1):
        if idx % 200 == 0:
            print(f"  进度: {idx}/{len(stock_codes)}，成功 {success}，共 {total} 条")

        try:
            # /hscp/ 系列 API 不需要后缀
            api_code = code_without_suffix(code)
            url = f"{BASE_URL}/hscp/gsjj/{api_code}/{API_KEY}"
            data = api_get(url, timeout=30)
            # gsjj returns a flat dict directly (no nested "data" key)
            if isinstance(data, dict) and "name" in data:
                data = [data]
            elif isinstance(data, dict):
                inner = data.get("data")
                if isinstance(inner, dict):
                    data = [inner]
                elif isinstance(inner, list):
                    data = inner
                else:
                    data = []

            for item in data:
                dm_val = code_without_suffix(code)
                mc = item.get("name") or item.get("mc") or ""
                if not mc:
                    continue
                ssrq = item.get("ldate") or item.get("rdate") or ""
                fxj = extract_numeric(item.get("sprice"))
                fxsl = extract_numeric(item.get("rprice"))

                cur.execute(
                    """INSERT INTO stock_basic_info (dm, mc, ssrq, fxj, fxsl, "createdAt")
                       VALUES (%s, %s, %s, %s, %s, NOW())
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
    return total


# ── 主函数 ────────────────────────────────────────────────────────────

def main():
    start_time = time.time()
    print("=" * 60)
    print("全量原始数据获取脚本")
    print(f"API Key: {'已配置' if API_KEY else '未配置'}")
    print(f"数据库: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")
    print("=" * 60)

    # 1. 同步股票列表
    sync_stock_list()

    # 获取股票代码
    stock_codes = get_stock_codes()
    if not stock_codes:
        print("\n错误: 未找到任何股票代码")
        return

    print(f"\n共获取到 {len(stock_codes)} 只股票代码")

    # 2. 同步历史交易数据（按年分段，耗时最长）
    sync_trading_data(stock_codes)

    # 3. 同步十大流通股东
    sync_top_flow_holders(stock_codes)

    # 4. 同步历届高管成员
    sync_executive_members(stock_codes)

    # 5. 同步分红数据
    sync_dividends(stock_codes)

    # 6. 同步股票基本信息
    sync_stock_basic_info(stock_codes)

    elapsed = time.time() - start_time
    print(f"\n{'=' * 60}")
    print(f"全量获取完成！总耗时: {elapsed / 60:.1f} 分钟")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()

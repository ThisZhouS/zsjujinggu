#!/usr/bin/env python3
"""
涨停/跌停板历史数据补录脚本

遍历过去 N 天的日期，调用 Mairui API 的涨停/跌停股池接口，
将数据写入 limit_up_pool 和 limit_down_pool 表。

使用方式：
  cd apps/server
  python3 scripts/sync-limit-history.py [--days 30]
"""

import argparse
import json
import os
import time
from datetime import date, timedelta
from typing import Optional
from urllib.parse import urlparse

import psycopg2
import psycopg2.extras
import requests
from dotenv import load_dotenv

# ── 配置 ──────────────────────────────────────────────────────────────

load_dotenv()

BASE_URL = "https://api.mairui.club"
API_KEY = os.getenv("MAIRUI_API_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")
DAYS = 30  # 默认补录过去 30 天

if not API_KEY:
    raise SystemExit("错误: 未配置 MAIRUI_API_KEY")
if not DATABASE_URL:
    raise SystemExit("错误: 未配置 DATABASE_URL")

parsed = urlparse(DATABASE_URL)
DB_CONFIG = {
    "host": parsed.hostname or "localhost",
    "port": parsed.port or 5432,
    "database": parsed.path.lstrip("/"),
    "user": parsed.username,
    "password": parsed.password,
}

DELAY = 0.2
BATCH_SIZE = 100


def get_conn():
    """获取数据库连接"""
    return psycopg2.connect(**DB_CONFIG)


def api_get(url: str, timeout: int = 30) -> list:
    """调用 Mairui API"""
    try:
        resp = requests.get(url, timeout=timeout)
        if resp.status_code != 200:
            return []
        data = resp.json()
        if isinstance(data, dict):
            inner = data.get("data")
            if isinstance(inner, str) and inner.startswith("<html>"):
                return []
            if isinstance(inner, dict):
                return [inner]
            if isinstance(inner, list):
                return inner
        if isinstance(data, list):
            return data
        return data
    except Exception:
        return []


def normalize_date(date_obj: date) -> str:
    """日期格式: YYYY-MM-DD"""
    return date_obj.strftime("%Y-%m-%d")


def sync_limit_up_pool(date_str: str, conn, cur):
    """同步涨停股池"""
    url = f"{BASE_URL}/hslt/ztgc/{date_str}/{API_KEY}"
    data = api_get(url, timeout=30)

    records = []
    for item in data:
        dm = item.get("dm")
        fbt = item.get("fbt")
        lbt = item.get("lbt")
        if not dm or not fbt or not lbt:
            continue
        records.append((
            dm,
            date_str,
            item.get("Mc") or item.get("mc") or "",
            item.get("p"),
            item.get("zf"),
            item.get("cje") or item.get("Cje"),
            item.get("lt"),
            item.get("zsz"),
            item.get("hs"),
            item.get("Lbc") or item.get("lbc"),
            fbt,
            lbt,
            item.get("zj"),
            item.get("zbc"),
            item.get("tj"),
            item.get("hy"),
        ))

    if not records:
        return 0

    inserted = 0
    skipped = 0
    for i in range(0, len(records), BATCH_SIZE):
        batch = records[i:i + BATCH_SIZE]
        for rec in batch:
            try:
                cur.execute(
                    """INSERT INTO limit_up_pool
                       (dm, date, mc, p, zf, cje, lt, zsz, hs, lbc, fbt, lbt, zj, zbc, tj, hy)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                       ON CONFLICT (dm, date, fbt, lbt) DO NOTHING""",
                    rec,
                )
                inserted += 1
            except Exception:
                skipped += 1

    conn.commit()
    return inserted


def sync_limit_down_pool(date_str: str, conn, cur):
    """同步跌停股池"""
    url = f"{BASE_URL}/hslt/dtgc/{date_str}/{API_KEY}"
    data = api_get(url, timeout=30)

    records = []
    for item in data:
        dm = item.get("dm")
        lbt = item.get("lbt")
        if not dm or not lbt:
            continue
        records.append((
            dm,
            date_str,
            item.get("mc") or "",
            item.get("p"),
            item.get("zf"),
            item.get("Cje") or item.get("cje"),
            item.get("lt"),
            item.get("zsz"),
            item.get("pe"),
            item.get("hs"),
            item.get("lbc"),
            lbt,
            item.get("zj"),
            item.get("fba"),
            item.get("zbc"),
        ))

    if not records:
        return 0

    inserted = 0
    for i in range(0, len(records), BATCH_SIZE):
        batch = records[i:i + BATCH_SIZE]
        for rec in batch:
            try:
                cur.execute(
                    """INSERT INTO limit_down_pool
                       (dm, date, mc, p, zf, cje, lt, zsz, pe, hs, lbc, lbt, zj, fba, zbc)
                       VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                       ON CONFLICT (dm, date, lbt) DO NOTHING""",
                    rec,
                )
                inserted += 1
            except Exception:
                pass

    conn.commit()
    return inserted


def main():
    parser = argparse.ArgumentParser(description="涨停/跌停板历史数据补录")
    parser.add_argument("--days", type=int, default=DAYS, help=f"补录天数 (默认: {DAYS})")
    args = parser.parse_args()

    start_date = date.today() - timedelta(days=args.days)
    end_date = date.today()

    print("=" * 60)
    print("涨停/跌停板历史数据补录")
    print(f"时间范围: {start_date} ~ {end_date}")
    print(f"数据库: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")
    print("=" * 60)

    conn = get_conn()
    cur = conn.cursor()

    total_up = 0
    total_down = 0
    day_count = 0

    current = start_date
    while current <= end_date:
        date_str = normalize_date(current)
        day_count += 1

        # 周末和节假日 API 通常返回空，但仍需调用
        up_count = sync_limit_up_pool(date_str, conn, cur)
        total_up += up_count

        down_count = sync_limit_down_pool(date_str, conn, cur)
        total_down += down_count

        if day_count % 5 == 0:
            print(f"  进度: {day_count} 天, 涨停 {total_up} 条, 跌停 {total_down} 条")

        time.sleep(DELAY)
        current += timedelta(days=1)

    cur.close()
    conn.close()

    print(f"\n{'=' * 60}")
    print(f"补录完成！共 {day_count} 天")
    print(f"  涨停: {total_up} 条")
    print(f"  跌停: {total_down} 条")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()

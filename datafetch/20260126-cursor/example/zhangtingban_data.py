#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
独立涨停股池获取程序（PostgreSQL 版）- 表名：zhangtingban_data
支持日期范围遍历，从 START_DATE 到 END_DATE 依次获取并存储数据。
"""

import sys
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import requests
from sqlalchemy import (
    Column, DateTime, Float, String, PrimaryKeyConstraint, create_engine
)
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from sqlalchemy.dialects.postgresql import insert
from contextlib import contextmanager

# -------------------- 配置区域（请根据实际情况修改）--------------------
# PostgreSQL 数据库连接信息
DB_USER = "postgres"          # 修改为真实用户名
DB_PASSWORD = "postgres18"      # 修改为真实密码
DB_HOST = "127.0.0.1"
DB_PORT = 5432
DB_NAME = "FastAPI"          # 修改为真实数据库名
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# API 许可证密钥（必须修改为真实密钥）
LICENSE_KEY = "C149118D-501A-4768-A5F6-C1E6C4087522"

# 日期范围设置（格式：YYYY-MM-DD）
START_DATE = "2026-02-01"
END_DATE   = "2026-02-28"

# 日志级别
LOG_LEVEL = logging.INFO
# --------------------------------------------------------------------

# 配置基础日志
logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("limit_up_pool_fetcher")

# -------------------- 数据库模型 --------------------
Base = declarative_base()

class LimitUpPoolNew(Base):
    """涨停股池新表模型（PostgreSQL 版，字段映射已调整）"""
    __tablename__ = "zhangtingban_data"   # 表名已按要求修改

    stock_id = Column(String(20), primary_key=True, comment="股票代码")
    trading_date = Column(String(20), primary_key=True, comment="交易日期")
    stock_name = Column(String(200), comment="股票名称")
    current_price = Column(Float, comment="当前价格")
    change_percent = Column(Float, comment="涨幅%")
    cje = Column(Float, comment="成交额")
    lt = Column(Float, comment="流通市值")
    market_capitalization = Column(Float, comment="总市值")
    hs = Column(Float, comment="换手率")
    continuous_limit = Column(Float, comment="连板数")
    fbt = Column(String(20), primary_key=True, comment="首次封板时间")
    date = Column(String(20), primary_key=True, comment="最后封板时间")   # 原 lbt
    zj = Column(Float, comment="封板资金")
    zbc = Column(Float, comment="炸板次数")
    tj = Column(String(50), comment="涨停统计")
    hy = Column(String(200), comment="行业")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = (
        PrimaryKeyConstraint("stock_id", "trading_date", "fbt", "date"),
        {"comment": "涨停股池表（自定义）"},
    )

# -------------------- 数据库工具函数 --------------------
_engine = None
_SessionLocal = None

def init_database():
    """初始化 PostgreSQL 数据库连接和表"""
    global _engine, _SessionLocal
    _engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
    # 创建表（如果不存在）
    Base.metadata.create_all(_engine)
    _SessionLocal = sessionmaker(bind=_engine, expire_on_commit=False)
    logger.info("PostgreSQL 数据库初始化完成，表已就绪")

def get_db_context() -> Session:
    """获取数据库会话上下文（作为上下文管理器使用）"""
    if _SessionLocal is None:
        init_database()
    session = _SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

def bulk_insert(session: Session, model_class, data: List[Dict], ignore_duplicates: bool = True) -> int:
    """
    批量插入数据（PostgreSQL 优化版）
    - 如果 ignore_duplicates 为 True，使用 INSERT ... ON CONFLICT DO NOTHING 跳过重复。
    - 返回实际插入的行数。
    """
    if not data:
        return 0

    if ignore_duplicates:
        # 使用 PostgreSQL 的 ON CONFLICT 语法
        stmt = insert(model_class).values(data)
        # 获取主键列名
        pk_columns = [col.name for col in model_class.__table__.primary_key.columns]
        stmt = stmt.on_conflict_do_nothing(index_elements=pk_columns)
        try:
            result = session.execute(stmt)
            session.commit()
            inserted = result.rowcount
            logger.debug(f"批量插入完成，插入 {inserted} 行")
            return inserted
        except Exception as e:
            session.rollback()
            logger.error(f"批量插入失败，回退到逐条插入: {e}")
            # 回退：逐条插入并计数
            count = 0
            for item in data:
                try:
                    session.execute(insert(model_class).values(**item).on_conflict_do_nothing())
                    session.commit()
                    count += 1
                except Exception as inner_e:
                    session.rollback()
                    logger.error(f"逐条插入失败: {inner_e}")
            return count
    else:
        # 不忽略重复，直接批量插入，出错则抛出
        session.bulk_insert_mappings(model_class, data)
        session.commit()
        return len(data)

# -------------------- API 客户端 --------------------
class StockPoolClassification:
    """股票池分类API客户端（仅保留涨停股池相关方法）"""

    BASE_URL = "http://api.mairuiapi.com"

    def __init__(self, license_key: Optional[str] = None):
        self.license_key = license_key or LICENSE_KEY
        if not self.license_key:
            raise ValueError("API许可证密钥未配置")

    def _make_request(self, url: str) -> List[Dict[str, Any]]:
        """发送HTTP请求并返回JSON数据"""
        try:
            logger.info(f"发送API请求: {url}")
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            data = response.json()
            if not isinstance(data, list):
                data = [data] if data else []
            logger.info(f"成功获取 {len(data)} 条数据")
            return data
        except requests.exceptions.RequestException as e:
            logger.error(f"API请求失败: {e}")
            raise
        except Exception as e:
            logger.error(f"处理API响应时出错: {e}")
            raise

    def fetch_limit_up_pool(self, date: str) -> List[Dict[str, Any]]:
        """
        获取涨停股池原始数据
        :param date: 日期，格式 yyyy-MM-dd
        :return: 数据列表，字段为原始API返回的键名
        """
        if not date:
            raise ValueError("日期不能为空")
        url = f"{self.BASE_URL}/hslt/ztgc/{date}/{self.license_key}"
        data = self._make_request(url)

        result = []
        for item in data:
            # 主键字段不能为空
            dm = item.get("dm") or ""
            fbt = item.get("fbt") or ""
            lbt = item.get("lbt") or ""
            if not dm or not fbt or not lbt:
                logger.warning(f"跳过无效数据：主键字段为空 (dm={dm}, fbt={fbt}, lbt={lbt})")
                continue

            # 统一字段名（兼容大小写）
            mapped = {
                "dm": dm,
                "date": date,          # 交易日期
                "mc": item.get("Mc") or item.get("mc") or "",
                "p": item.get("p"),
                "zf": item.get("zf"),
                "cje": item.get("cje") or item.get("Cje"),
                "lt": item.get("lt"),
                "zsz": item.get("zsz"),
                "hs": item.get("hs"),
                "lbc": item.get("Lbc") or item.get("lbc"),
                "fbt": fbt,
                "lbt": lbt,
                "zj": item.get("zj"),
                "zbc": item.get("zbc"),
                "tj": item.get("tj") or "",
                "hy": item.get("hy") or "",
            }
            result.append(mapped)
        return result

    def fetch_and_save_limit_up_pool(self, date: str) -> int:
        """
        获取涨停股池数据并存储到新数据库表
        :param date: 日期，格式 yyyy-MM-dd
        :return: 成功存储的记录数
        """
        raw_data = self.fetch_limit_up_pool(date)
        if not raw_data:
            logger.warning(f"未获取到涨停股池数据，日期: {date}")
            return 0

        # 将原始字段映射到新模型字段
        mapped_data = []
        for item in raw_data:
            new_item = {
                "stock_id": item["dm"],
                "trading_date": item["date"],   # 交易日期
                "stock_name": item["mc"],
                "current_price": item["p"],
                "change_percent": item["zf"],
                "cje": item["cje"],
                "lt": item["lt"],
                "market_capitalization": item["zsz"],
                "hs": item["hs"],
                "continuous_limit": item["lbc"],
                "fbt": item["fbt"],
                "date": item["lbt"],          # 原 lbt 存入新 date 字段
                "zj": item["zj"],
                "zbc": item["zbc"],
                "tj": item["tj"],
                "hy": item["hy"],
                # created_at 由数据库自动生成默认值，无需传入
            }
            mapped_data.append(new_item)

        try:
            with get_db_context() as session:
                count = bulk_insert(session, LimitUpPoolNew, mapped_data, ignore_duplicates=True)
                logger.info(f"涨停股池 - 日期 {date} 存储 {count} 条记录")
                return count
        except Exception as e:
            logger.error(f"存储涨停股池数据失败: {e}")
            raise

# -------------------- 日期工具函数 --------------------
def date_range(start: str, end: str) -> List[str]:
    """
    生成从 start 到 end 的日期列表（包含两端），格式 YYYY-MM-DD
    """
    start_dt = datetime.strptime(start, "%Y-%m-%d")
    end_dt = datetime.strptime(end, "%Y-%m-%d")
    delta = end_dt - start_dt
    return [(start_dt + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(delta.days + 1)]

# -------------------- 主函数 --------------------
def main(start_date: Optional[str] = None, end_date: Optional[str] = None) -> None:
    """
    主入口：遍历日期范围，依次获取并存储涨停股池数据
    :param start_date: 开始日期，格式 YYYY-MM-DD，默认为 START_DATE
    :param end_date:   结束日期，格式 YYYY-MM-DD，默认为 END_DATE
    """
    # 初始化数据库
    init_database()

    # 使用配置中的默认值
    if start_date is None:
        start_date = START_DATE
    if end_date is None:
        end_date = END_DATE

    # 生成日期列表
    dates = date_range(start_date, end_date)
    logger.info("开始同步涨停股池数据，日期范围: %s 至 %s (共 %d 天)", start_date, end_date, len(dates))

    client = StockPoolClassification()

    for date_str in dates:
        logger.info("处理日期: %s", date_str)
        try:
            client.fetch_and_save_limit_up_pool(date_str)
        except Exception as e:
            logger.error("日期 %s 处理失败: %s", date_str, e)
            # 可根据需要决定是否继续循环，默认继续
            continue

    logger.info("所有日期处理完成")

@contextmanager
def get_db_context() -> Session:
    """获取数据库会话上下文（作为上下文管理器使用）"""
    if _SessionLocal is None:
        init_database()
    session = _SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

if __name__ == "__main__":
    # 可在此处覆盖日期范围，例如 main("2026-02-01", "2026-02-28")
    main()
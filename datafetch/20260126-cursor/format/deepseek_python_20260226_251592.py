"""
独立接口程序：获取并存储股东变化趋势数据（仅存储第一条记录到PostgreSQL数据库）。

本程序基于 shareholder_detailed_data_fetch_and_save_shareholder_change_trend.py 修改，
整合了股东变化趋势相关代码，将数据存储到新的PostgreSQL表中，字段名称已按要求调整。
表名已改为 gudong_renshu。

API接口: fetch_shareholder_change_trend
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import List, Optional


def add_project_root_to_sys_path(project_root: Path) -> None:
    """将项目根目录加入 sys.path，保证脚本可从任意工作目录运行。"""
    if str(project_root) not in sys.path:
        sys.path.insert(0, str(project_root))


PROJECT_ROOT = Path(__file__).resolve().parent.parent
add_project_root_to_sys_path(PROJECT_ROOT)

# 导入原项目模块
from api_clients.ShareholderDetailedData.ShareholderDetailedData import (
    ShareholderDetailedData,
)
from api_clients.MajorMarketLists.MajorMarketLists_table import StockList
from config.database import get_db_context, init_database
from utils.logger import get_logger

# ---------- PostgreSQL 数据库连接配置（请根据实际情况修改）----------
NEW_DB_CONFIG = {
    "host": "127.0.0.1",          # PostgreSQL 服务器地址
    "port": 5432,                  # PostgreSQL 默认端口
    "database": "FastAPI",    # 数据库名
    "user": "postgres",           # 用户名
    "password": "postgres18",   # 密码
}

logger = get_logger("format.shareholder_change_trend_to_postgres")

# ---------- 新表模型定义（使用 SQLAlchemy ORM）----------
from sqlalchemy import Column, String, DateTime, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

NewBase = declarative_base()

class ShareholderChangeTrendNew(NewBase):
    """股东变化趋势新表模型（存储第一条数据）"""
    __tablename__ = "gudong_renshu"  # 表名已按要求修改

    stock_id = Column(String(20), primary_key=True, comment="股票代码")
    date = Column(String(20), primary_key=True, comment="截止日期yyyy-MM-dd")
    holder_count = Column(String(100), comment="股东户数")
    count_change = Column(String(200), comment="比上期变化情况")
    created_at = Column(DateTime, default=datetime.now, comment="创建时间")

    __table_args__ = {"comment": "股东变化趋势表（新）"}

# 创建 PostgreSQL 引擎和会话工厂
# 连接 URL 格式: postgresql+psycopg2://user:password@host:port/database
db_url = (
    f"postgresql+psycopg2://{NEW_DB_CONFIG['user']}:{NEW_DB_CONFIG['password']}@"
    f"{NEW_DB_CONFIG['host']}:{NEW_DB_CONFIG['port']}/{NEW_DB_CONFIG['database']}"
)
new_engine = create_engine(db_url, echo=False, pool_pre_ping=True)
NewSessionLocal = sessionmaker(bind=new_engine)

# 创建新表（如果不存在）
NewBase.metadata.create_all(new_engine)


# ---------- 原有工具函数 ----------
def remove_suffix(code: str) -> str:
    """去掉股票代码中的 . 及其后缀。"""
    if "." in code:
        return code.split(".")[0]
    return code


def get_stock_codes_from_db(max_count: Optional[int] = None) -> List[str]:
    """从 `stock_list` 表获取股票代码（去掉 . 及其后缀）。"""
    with get_db_context() as session:
        query = session.query(StockList.dm).order_by(StockList.dm)
        if max_count is not None:
            query = query.limit(max_count)
        rows = query.all()
    codes = [row.dm for row in rows if row.dm]
    return [remove_suffix(code) for code in codes]


def main() -> None:
    """主函数：批量同步股东变化趋势数据，只存储第一条记录到 PostgreSQL。"""
    # 初始化原数据库连接（用于读取股票代码）
    init_database()

    client = ShareholderDetailedData()

    stock_codes = get_stock_codes_from_db(max_count=None)
    logger.info("从股票列表读取到股票代码数量: {}", len(stock_codes))

    total = 0
    for code in stock_codes:
        try:
            # 获取股东变化趋势数据（返回列表）
            data_list = client.fetch_shareholder_change_trend(stock_code=code)
            if not data_list:
                logger.warning("股票 {} 无股东变化趋势数据", code)
                continue

            # 只取第一条数据
            first_item = data_list[0]
            # 转换为新模型字段
            new_record = ShareholderChangeTrendNew(
                stock_id=first_item["dm"],
                date=first_item["jzrq"],
                holder_count=first_item.get("gdhs", ""),
                count_change=first_item.get("bh", ""),
            )

            # 写入 PostgreSQL 数据库
            new_session = NewSessionLocal()
            try:
                new_session.merge(new_record)  # 存在则更新，不存在则插入
                new_session.commit()
                total += 1
                logger.info("股票 {} 股东变化趋势第一条数据已存储", code)
            except Exception as e:
                new_session.rollback()
                logger.error("股票 {} 数据存储失败: {}", code, e)
            finally:
                new_session.close()

        except Exception as exc:
            logger.error("股票 {} 处理失败: {}", code, exc)

    logger.info("股东变化趋势累计写入记录数: {}", total)


if __name__ == "__main__":
    main()
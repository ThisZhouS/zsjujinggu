"""
诊断脚本：检查数据库连接信息和表结构
"""

import sys
from pathlib import Path

# 添加项目路径
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from config.database import get_db_context, init_database
from sqlalchemy import text


def main():
    """诊断数据库连接"""
    # 初始化数据库
    init_database()
    
    with get_db_context() as session:
        # 检查当前连接的数据库
        result = session.execute(text("SELECT current_database()")).fetchone()
        print(f"当前数据库: {result[0]}")
        
        result = session.execute(text("SELECT current_schema()")).fetchone()
        print(f"当前schema: {result[0]}")
        
        result = session.execute(text("SHOW server_version")).fetchone()
        print(f"PostgreSQL版本: {result[0]}")
        
        # 检查表是否存在
        result = session.execute(text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'gudong_renshu'
            );
        """)).fetchone()
        print(f"gudong_renshu 表存在: {result[0]}")
        
        # 显示所有表
        result = session.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)).fetchall()
        print(f"\n数据库中的表 ({len(result)}个):")
        for row in result:
            print(f"  - {row[0]}")


if __name__ == "__main__":
    main()

import psycopg2
from psycopg2 import sql

# 源数据库连接
source_conn = psycopg2.connect(
    host="127.0.0.1",
    database="postgres",
    user="postgres",
    password="postgres18"
)

# 目标数据库连接
target_conn = psycopg2.connect(
    host="127.0.0.1",
    database="API",
    user="postgres",
    password="postgres18"
)

# 从源数据库读取数据
with source_conn.cursor() as source_cur:
    query = """
    SELECT gdmc FROM company_top_flow_holders 
    WHERE gdlx = %s AND jzrq = %s
    """
    source_cur.execute(query, ('自然人', '20250930'))
    data = source_cur.fetchall()
    
    # 获取列名
    # col_names = [desc[0] for desc in source_cur.description]

# 插入到目标数据库
if data:
    with target_conn.cursor() as target_cur:
        # 构建INSERT语句
        # columns = ', '.join(col_names)
        #placeholders = ', '.join(['%s'] * len(col_names))
        # insert_query = f"""
        # INSERT INTO niu_san ({columns}) 
        # VALUES ({placeholders})
        # """
        insert_query = f"""
        INSERT INTO niu_san (name) 
        VALUES (%s)
        """
        # 批量插入
        target_cur.executemany(insert_query, data)
        target_conn.commit()
        print(f"成功插入 {len(data)} 条记录")

source_conn.close()
target_conn.close()
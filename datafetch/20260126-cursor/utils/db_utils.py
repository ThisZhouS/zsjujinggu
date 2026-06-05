"""
数据库工具模块。

该模块提供数据库操作相关的工具函数，包括批量插入、更新、查询等。
"""

from typing import List, Dict, Any, Optional, Type

import pandas as pd
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.inspection import inspect as sqlalchemy_inspect

from config.database import get_db_context
from core.exceptions import DatabaseException
from utils.logger import get_logger


logger = get_logger("utils.db_utils")


def _map_attr_to_column(model_class: Type, data_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    将数据字典的键从Python属性名映射到数据库列名。

    当使用 pg_insert(table).values() 时，SQLAlchemy期望字典键匹配数据库列名，
    而不是Python属性名。此函数进行转换。

    Args:
        model_class (Type): 数据模型类。
        data_dict (Dict[str, Any]): 使用Python属性名作为键的数据字典。

    Returns:
        Dict[str, Any]: 使用数据库列名作为键的数据字典。

    API接口: 无
    """
    mapper = sqlalchemy_inspect(model_class)
    mapped_dict = {}
    
    # 创建属性名到列名的映射
    attr_to_column = {}
    for column in mapper.columns:
        # column.key 是Python属性名，column.name 是数据库列名
        attr_to_column[column.key] = column.name
    
    for attr_name, value in data_dict.items():
        if attr_name in attr_to_column:
            # 使用数据库列名（可能是自定义的，如 "Hbzj"）
            mapped_dict[attr_to_column[attr_name]] = value
        # 如果属性不存在于模型中，跳过（可能是额外字段）
    
    return mapped_dict


def ensure_float_array_columns(
    session: Session,
    table_name: str,
    column_names: List[str],
) -> None:
    """
    确保指定表的列为 PostgreSQL double precision[] 类型。

    用于修复历史建表时将“五档”数组字段误建为 Float（double precision）标量导致的插入失败问题。
    若列已是数组类型，则不做任何修改；若为标量类型，则将其迁移为数组类型：
    - NULL -> NULL
    - 标量值 -> ARRAY[标量值]

    Args:
        session (Session): 数据库会话。
        table_name (str): 表名（不含 schema）。
        column_names (List[str]): 需要确保为数组类型的列名列表。

    Returns:
        None: 无返回值。

    API接口: 无
    """
    if not column_names:
        return

    try:
        # 读取当前列类型
        cols_sql = text(
            """
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name = :table_name
              AND column_name = ANY(:column_names)
            """
        )
        rows = session.execute(
            cols_sql,
            {"table_name": table_name, "column_names": column_names},
        ).fetchall()
        current_types = {row[0]: row[1] for row in rows}

        for col in column_names:
            data_type = current_types.get(col)
            # information_schema: array columns have data_type='ARRAY'
            if data_type == "ARRAY":
                continue
            if data_type is None:
                # 表/列不存在时不处理（由建表流程负责）
                continue

            alter_sql = text(
                f"""
                ALTER TABLE public.{table_name}
                ALTER COLUMN {col}
                TYPE double precision[]
                USING (
                    CASE
                        WHEN {col} IS NULL THEN NULL
                        ELSE ARRAY[{col}::double precision]
                    END
                )
                """
            )
            session.execute(alter_sql)

        session.commit()
    except Exception as exc:
        session.rollback()
        raise DatabaseException(
            f"确保表 {table_name} 列为数组类型失败: {str(exc)}",
            "ENSURE_FLOAT_ARRAY_COLUMNS_ERROR",
        )


def bulk_insert(
    session: Session,
    model_class: Type,
    data_list: List[Dict[str, Any]],
    ignore_duplicates: bool = False,
    batch_size: int = 100,
) -> int:
    """
    批量插入数据。

    Args:
        session (Session): 数据库会话。
        model_class (Type): 数据模型类。
        data_list (List[Dict[str, Any]]): 要插入的数据列表。
        ignore_duplicates (bool): 是否忽略重复数据，默认为False。
        batch_size (int): 每批插入的记录数，默认为100。当数据量较大时，分批插入可提高性能。

    Returns:
        int: 成功插入的记录数。

    Raises:
        DatabaseException: 如果插入失败。

    API接口: 无
    """
    if not data_list:
        return 0

    total_count = len(data_list)
    inserted_count = 0

    # 根据表的字段数量自动调整 batch_size
    # 如果表字段很多（>50），使用更小的批次以避免 SQL 编译时间过长
    table = model_class.__table__
    column_count = len(table.columns)
    use_single_insert = False
    
    if column_count > 50:
        # 对于字段特别多的表（>50），如果 batch_size 仍然较大，使用逐条插入
        # 这样可以避免 SQL 编译时间过长的问题
        if batch_size > 1:
            use_single_insert = True
            logger.debug(
                f"表 {model_class.__tablename__} 有 {column_count} 个字段，"
                f"使用逐条插入模式以避免 SQL 编译时间过长"
            )

    try:
        if use_single_insert:
            # 对于字段特别多的表，使用逐条插入以避免 SQL 编译时间过长
            pk_columns = [col.name for col in table.primary_key.columns] if ignore_duplicates else None
            
            for idx, item in enumerate(data_list, 1):
                try:
                    if ignore_duplicates:
                        # 将属性名映射到列名
                        mapped_item = _map_attr_to_column(model_class, item)
                        stmt = pg_insert(table).values(mapped_item)
                        if pk_columns:
                            try:
                                stmt = stmt.on_conflict_do_nothing(index_elements=pk_columns)
                                session.execute(stmt)
                            except SQLAlchemyError as e:
                                # 如果使用 index_elements 失败，需要先回滚事务
                                session.rollback()
                                # 尝试使用其他方式
                                if "没有匹配ON CONFLICT说明的唯一或者排除约束" in str(e) or "no unique or exclusion constraint" in str(e).lower():
                                    pk_constraint = table.primary_key
                                    if pk_constraint and pk_constraint.name:
                                        try:
                                            stmt = pg_insert(table).values(mapped_item)
                                            stmt = stmt.on_conflict_do_nothing(constraint=pk_constraint.name)
                                            session.execute(stmt)
                                        except SQLAlchemyError:
                                            session.rollback()
                                            stmt = pg_insert(table).values(mapped_item)
                                            stmt = stmt.on_conflict_do_nothing()
                                            session.execute(stmt)
                                    else:
                                        stmt = pg_insert(table).values(mapped_item)
                                        stmt = stmt.on_conflict_do_nothing()
                                        session.execute(stmt)
                                else:
                                    raise
                        else:
                            stmt = stmt.on_conflict_do_nothing()
                            session.execute(stmt)
                    else:
                        session.bulk_insert_mappings(model_class, [item])
                    
                    # 每 10 条记录提交一次，平衡性能和安全性
                    if idx % 10 == 0:
                        session.commit()
                        logger.debug(
                            f"已插入 {idx}/{total_count} 条记录到 {model_class.__tablename__}"
                        )
                except SQLAlchemyError as e:
                    session.rollback()
                    error_msg = f"插入数据失败（第 {idx} 条记录）: {str(e)}"
                    logger.error(error_msg)
                    raise DatabaseException(error_msg, "BULK_INSERT_ERROR")
            
            # 提交剩余记录
            session.commit()
            inserted_count = total_count
            logger.info(f"成功插入 {inserted_count} 条记录到 {model_class.__tablename__}（逐条插入模式）")
        elif total_count <= batch_size:
            # 如果数据量小于等于批次大小，直接插入
            if ignore_duplicates:
                # PostgreSQL 环境下，使用 ON CONFLICT DO NOTHING 避免唯一约束冲突
                pk_columns = [col.name for col in table.primary_key.columns] if table.primary_key else None

                # 将属性名映射到列名
                mapped_data_list = [_map_attr_to_column(model_class, item) for item in data_list]
                stmt = pg_insert(table).values(mapped_data_list)
                if pk_columns:
                    try:
                        # 尝试使用主键列作为冲突检测
                        stmt = stmt.on_conflict_do_nothing(index_elements=pk_columns)
                        session.execute(stmt)
                    except SQLAlchemyError as e:
                        # 如果使用 index_elements 失败，需要先回滚事务
                        session.rollback()
                        # 如果使用 index_elements 失败，尝试使用约束名称或直接使用 on_conflict_do_nothing
                        if "没有匹配ON CONFLICT说明的唯一或者排除约束" in str(e) or "no unique or exclusion constraint" in str(e).lower():
                            # 尝试使用主键约束名称
                            pk_constraint = table.primary_key
                            if pk_constraint and pk_constraint.name:
                                try:
                                    stmt = pg_insert(table).values(mapped_data_list)
                                    stmt = stmt.on_conflict_do_nothing(constraint=pk_constraint.name)
                                    session.execute(stmt)
                                except SQLAlchemyError:
                                    # 如果还是失败，回滚并尝试使用不指定冲突检测的方式
                                    session.rollback()
                                    stmt = pg_insert(table).values(mapped_data_list)
                                    stmt = stmt.on_conflict_do_nothing()
                                    session.execute(stmt)
                            else:
                                # 没有约束名称，直接使用 on_conflict_do_nothing
                                stmt = pg_insert(table).values(mapped_data_list)
                                stmt = stmt.on_conflict_do_nothing()
                                session.execute(stmt)
                        else:
                            raise
                else:
                    # 没有主键，直接使用 on_conflict_do_nothing
                    stmt = stmt.on_conflict_do_nothing()
                    session.execute(stmt)
            else:
                # 标准批量插入，若有主键冲突会抛出异常
                session.bulk_insert_mappings(model_class, data_list)

            session.commit()
            inserted_count = total_count
            logger.info(f"成功插入 {inserted_count} 条记录到 {model_class.__tablename__}")
        else:
            # 分批插入
            pk_columns = [col.name for col in table.primary_key.columns] if ignore_duplicates else None
            total_batches = (total_count + batch_size - 1) // batch_size

            for i in range(0, total_count, batch_size):
                batch = data_list[i : i + batch_size]
                batch_num = (i // batch_size) + 1

                try:
                    if ignore_duplicates:
                        # 将属性名映射到列名
                        mapped_batch = [_map_attr_to_column(model_class, item) for item in batch]
                        stmt = pg_insert(table).values(mapped_batch)
                        if pk_columns:
                            try:
                                # 尝试使用主键列作为冲突检测
                                stmt = stmt.on_conflict_do_nothing(index_elements=pk_columns)
                                session.execute(stmt)
                            except SQLAlchemyError as e:
                                # 如果使用 index_elements 失败，需要先回滚事务
                                session.rollback()
                                # 如果使用 index_elements 失败，尝试使用约束名称或直接使用 on_conflict_do_nothing
                                if "没有匹配ON CONFLICT说明的唯一或者排除约束" in str(e) or "no unique or exclusion constraint" in str(e).lower():
                                    # 尝试使用主键约束名称
                                    pk_constraint = table.primary_key
                                    if pk_constraint and pk_constraint.name:
                                        try:
                                            stmt = pg_insert(table).values(mapped_batch)
                                            stmt = stmt.on_conflict_do_nothing(constraint=pk_constraint.name)
                                            session.execute(stmt)
                                        except SQLAlchemyError:
                                            # 如果还是失败，回滚并尝试使用不指定冲突检测的方式
                                            session.rollback()
                                            stmt = pg_insert(table).values(mapped_batch)
                                            stmt = stmt.on_conflict_do_nothing()
                                            session.execute(stmt)
                                    else:
                                        # 没有约束名称，直接使用 on_conflict_do_nothing
                                        stmt = pg_insert(table).values(mapped_batch)
                                        stmt = stmt.on_conflict_do_nothing()
                                        session.execute(stmt)
                                else:
                                    raise
                        else:
                            # 没有主键，直接使用 on_conflict_do_nothing
                            stmt = stmt.on_conflict_do_nothing()
                            session.execute(stmt)
                    else:
                        session.bulk_insert_mappings(model_class, batch)

                    session.commit()
                    inserted_count += len(batch)
                    logger.debug(
                        f"批次 {batch_num}/{total_batches}: 成功插入 {len(batch)} 条记录到 {model_class.__tablename__}"
                    )
                except SQLAlchemyError as e:
                    session.rollback()
                    error_msg = f"批量插入数据失败（批次 {batch_num}/{total_batches}）: {str(e)}"
                    logger.error(error_msg)
                    raise DatabaseException(error_msg, "BULK_INSERT_ERROR")

            logger.info(
                f"成功插入 {inserted_count} 条记录到 {model_class.__tablename__}（共 {total_batches} 个批次）"
            )

        return inserted_count

    except SQLAlchemyError as e:
        session.rollback()
        error_msg = f"批量插入数据失败: {str(e)}"
        logger.error(error_msg)
        raise DatabaseException(error_msg, "BULK_INSERT_ERROR")
    except Exception as e:
        session.rollback()
        error_msg = f"批量插入数据时发生未知错误: {str(e)}"
        logger.error(error_msg)
        raise DatabaseException(error_msg, "BULK_INSERT_ERROR")


def bulk_update(
    session: Session,
    model_class: Type,
    data_list: List[Dict[str, Any]],
    update_keys: List[str],
) -> int:
    """
    批量更新数据。

    Args:
        session (Session): 数据库会话。
        model_class (Type): 数据模型类。
        data_list (List[Dict[str, Any]]): 要更新的数据列表。
        update_keys (List[str]): 用于匹配记录的键列表。

    Returns:
        int: 成功更新的记录数。

    Raises:
        DatabaseException: 如果更新失败。

    API接口: 无
    """
    if not data_list:
        return 0

    try:
        session.bulk_update_mappings(model_class, data_list)
        session.commit()
        updated_count = len(data_list)
        logger.info(f"成功更新 {updated_count} 条记录到 {model_class.__tablename__}")
        return updated_count

    except SQLAlchemyError as e:
        session.rollback()
        error_msg = f"批量更新数据失败: {str(e)}"
        logger.error(error_msg)
        raise DatabaseException(error_msg, "BULK_UPDATE_ERROR")
    except Exception as e:
        session.rollback()
        error_msg = f"批量更新数据时发生未知错误: {str(e)}"
        logger.error(error_msg)
        raise DatabaseException(error_msg, "BULK_UPDATE_ERROR")


def execute_raw_sql(sql: str, parameters: Optional[Dict[str, Any]] = None) -> Any:
    """
    执行原始SQL语句。

    Args:
        sql (str): SQL语句。
        parameters (Optional[Dict[str, Any]]): SQL参数，默认为None。

    Returns:
        Any: 查询结果。

    Raises:
        DatabaseException: 如果执行失败。

    API接口: 无
    """
    try:
        with get_db_context() as session:
            if parameters:
                result = session.execute(text(sql), parameters)
            else:
                result = session.execute(text(sql))
            session.commit()
            return result
    except SQLAlchemyError as e:
        error_msg = f"执行SQL失败: {str(e)}"
        logger.error(error_msg)
        raise DatabaseException(error_msg, "EXECUTE_SQL_ERROR")


def query_to_dataframe(
    session: Session,
    sql: str,
    parameters: Optional[Dict[str, Any]] = None,
) -> pd.DataFrame:
    """
    将SQL查询结果转换为DataFrame。

    Args:
        session (Session): 数据库会话。
        sql (str): SQL查询语句。
        parameters (Optional[Dict[str, Any]]): SQL参数，默认为None。

    Returns:
        pd.DataFrame: 查询结果DataFrame。

    Raises:
        DatabaseException: 如果查询失败。

    API接口: 无
    """
    try:
        if parameters:
            result = session.execute(text(sql), parameters)
        else:
            result = session.execute(text(sql))

        df = pd.DataFrame(result.fetchall(), columns=result.keys())
        return df

    except SQLAlchemyError as e:
        error_msg = f"查询数据失败: {str(e)}"
        logger.error(error_msg)
        raise DatabaseException(error_msg, "QUERY_ERROR")
    except Exception as e:
        error_msg = f"转换为DataFrame失败: {str(e)}"
        logger.error(error_msg)
        raise DatabaseException(error_msg, "DATAFRAME_CONVERSION_ERROR")


def dataframe_to_database(
    df: pd.DataFrame,
    table_name: str,
    if_exists: str = "append",
    index: bool = False,
    chunksize: Optional[int] = None,
) -> int:
    """
    将DataFrame写入数据库。

    Args:
        df (pd.DataFrame): 要写入的DataFrame。
        table_name (str): 目标表名。
        if_exists (str): 如果表存在时的处理方式（"fail", "replace", "append"），默认为"append"。
        index (bool): 是否写入索引，默认为False。
        chunksize (Optional[int]): 分块写入大小，默认为None。

    Returns:
        int: 写入的记录数。

    Raises:
        DatabaseException: 如果写入失败。

    API接口: 无
    """
    from config.database import engine

    if engine is None:
        raise DatabaseException("数据库未初始化", "DATABASE_NOT_INITIALIZED")

    try:
        rows_inserted = df.to_sql(
            table_name,
            engine,
            if_exists=if_exists,
            index=index,
            chunksize=chunksize,
            method="multi",
        )
        logger.info(f"成功写入 {rows_inserted} 条记录到表 {table_name}")
        return rows_inserted

    except Exception as e:
        error_msg = f"DataFrame写入数据库失败: {str(e)}"
        logger.error(error_msg)
        raise DatabaseException(error_msg, "DATAFRAME_TO_DB_ERROR")


def get_record_count(session: Session, model_class: Type) -> int:
    """
    获取表中的记录数。

    Args:
        session (Session): 数据库会话。
        model_class (Type): 数据模型类。

    Returns:
        int: 记录数。

    Raises:
        DatabaseException: 如果查询失败。

    API接口: 无
    """
    try:
        count = session.query(model_class).count()
        return count
    except SQLAlchemyError as e:
        error_msg = f"获取记录数失败: {str(e)}"
        logger.error(error_msg)
        raise DatabaseException(error_msg, "GET_COUNT_ERROR")


def delete_by_condition(
    session: Session,
    model_class: Type,
    condition: Any,
) -> int:
    """
    根据条件删除记录。

    Args:
        session (Session): 数据库会话。
        model_class (Type): 数据模型类。
        condition (Any): 删除条件（SQLAlchemy查询条件）。

    Returns:
        int: 删除的记录数。

    Raises:
        DatabaseException: 如果删除失败。

    API接口: 无
    """
    try:
        deleted_count = session.query(model_class).filter(condition).delete()
        session.commit()
        logger.info(f"成功删除 {deleted_count} 条记录从 {model_class.__tablename__}")
        return deleted_count

    except SQLAlchemyError as e:
        session.rollback()
        error_msg = f"删除记录失败: {str(e)}"
        logger.error(error_msg)
        raise DatabaseException(error_msg, "DELETE_ERROR")



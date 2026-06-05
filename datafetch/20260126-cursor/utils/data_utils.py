"""
数据处理工具模块。

该模块提供数据清洗、转换和验证相关的工具函数。
"""

from typing import Any, Optional, Union, Dict, List
import pandas as pd
import numpy as np


def clean_numeric(value: Any, default: float = 0.0) -> float:
    """
    清理并转换数值，处理None、空字符串等异常情况。

    Args:
        value (Any): 待清理的值。
        default (float): 默认值，当值无法转换时使用，默认为0.0。

    Returns:
        float: 清理后的数值。

    API接口: 无
    """
    if value is None:
        return default

    if isinstance(value, str):
        value = value.strip()
        if value == "" or value.lower() == "null" or value.lower() == "none":
            return default

    try:
        return float(value)
    except (ValueError, TypeError):
        return default


def clean_numeric_to_none(value: Any) -> Optional[float]:
    """
    清理并转换数值，将无效值转换为None（用于数据库NULL值）。

    处理以下情况：
    - None -> None
    - 空字符串 -> None
    - "-" -> None
    - "null", "none" (不区分大小写) -> None
    - 其他无法转换的值 -> None
    - 有效数值 -> float

    Args:
        value (Any): 待清理的值。

    Returns:
        Optional[float]: 清理后的数值，无效值返回None。

    API接口: 无
    """
    if value is None:
        return None

    if isinstance(value, str):
        value = value.strip()
        if value == "" or value == "-" or value.lower() == "null" or value.lower() == "none":
            return None

    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def clean_string(value: Any, default: str = "") -> str:
    """
    清理字符串，处理None、空值等异常情况。

    Args:
        value (Any): 待清理的值。
        default (str): 默认值，当值无法转换时使用，默认为空字符串。

    Returns:
        str: 清理后的字符串。

    API接口: 无
    """
    if value is None:
        return default

    if isinstance(value, (int, float)):
        return str(value)

    result = str(value).strip()
    return result if result else default


def safe_dict_get(
    data: Dict[str, Any],
    key: str,
    default: Any = None,
    nested_keys: Optional[List[str]] = None,
) -> Any:
    """
    安全地从字典中获取值，支持嵌套键。

    Args:
        data (Dict[str, Any]): 数据字典。
        key (str): 键名。
        default (Any): 默认值，当键不存在时返回，默认为None。
        nested_keys (Optional[List[str]]): 嵌套键列表，用于访问嵌套字典。

    Returns:
        Any: 获取到的值，如果不存在则返回默认值。

    API接口: 无
    """
    if nested_keys:
        current = data
        for k in nested_keys:
            if not isinstance(current, dict) or k not in current:
                return default
            current = current[k]
        return current.get(key, default) if isinstance(current, dict) else default

    return data.get(key, default)


def normalize_dataframe(df: pd.DataFrame, drop_na: bool = False) -> pd.DataFrame:
    """
    规范化DataFrame，清理空值和异常数据。

    Args:
        df (pd.DataFrame): 待处理的DataFrame。
        drop_na (bool): 是否删除包含空值的行，默认为False。

    Returns:
        pd.DataFrame: 处理后的DataFrame。

    API接口: 无
    """
    df = df.copy()

    if drop_na:
        df = df.dropna()

    # 将无穷大值替换为NaN
    df = df.replace([np.inf, -np.inf], np.nan)

    return df


def validate_required_fields(
    data: Dict[str, Any],
    required_fields: List[str],
) -> tuple[bool, Optional[str]]:
    """
    验证数据中是否包含所有必需字段。

    Args:
        data (Dict[str, Any]): 待验证的数据字典。
        required_fields (List[str]): 必需字段列表。

    Returns:
        tuple[bool, Optional[str]]: (是否通过验证, 错误消息)。

    API接口: 无
    """
    missing_fields = [field for field in required_fields if field not in data or data[field] is None]

    if missing_fields:
        error_msg = f"缺少必需字段: {', '.join(missing_fields)}"
        return False, error_msg

    return True, None


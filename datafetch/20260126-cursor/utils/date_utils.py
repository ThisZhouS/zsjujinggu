"""
日期时间工具模块。

该模块提供日期时间相关的工具函数，用于处理各种日期格式转换和计算。
"""

from datetime import datetime, date, timedelta
from typing import Optional, Union


def str_to_date(date_str: str, format_str: str = "%Y-%m-%d") -> date:
    """
    将字符串转换为日期对象。

    Args:
        date_str (str): 日期字符串。
        format_str (str): 日期格式，默认为"%Y-%m-%d"。

    Returns:
        date: 日期对象。

    Raises:
        ValueError: 如果日期字符串格式不正确。

    API接口: 无
    """
    return datetime.strptime(date_str, format_str).date()


def date_to_str(date_obj: Union[date, datetime], format_str: str = "%Y-%m-%d") -> str:
    """
    将日期对象转换为字符串。

    Args:
        date_obj (Union[date, datetime]): 日期或日期时间对象。
        format_str (str): 日期格式，默认为"%Y-%m-%d"。

    Returns:
        str: 日期字符串。

    API接口: 无
    """
    if isinstance(date_obj, datetime):
        return date_obj.strftime(format_str)
    return date_obj.strftime(format_str)


def get_today() -> date:
    """
    获取今天的日期。

    Returns:
        date: 今天的日期对象。

    API接口: 无
    """
    return date.today()


def get_yesterday() -> date:
    """
    获取昨天的日期。

    Returns:
        date: 昨天的日期对象。

    API接口: 无
    """
    return date.today() - timedelta(days=1)


def get_date_range(
    start_date: Union[str, date],
    end_date: Union[str, date],
    format_str: str = "%Y-%m-%d",
) -> list[date]:
    """
    获取日期范围内的所有日期列表。

    Args:
        start_date (Union[str, date]): 开始日期。
        end_date (Union[str, date]): 结束日期。
        format_str (str): 日期格式，默认为"%Y-%m-%d"。

    Returns:
        list[date]: 日期列表。

    API接口: 无
    """
    if isinstance(start_date, str):
        start_date = str_to_date(start_date, format_str)
    if isinstance(end_date, str):
        end_date = str_to_date(end_date, format_str)

    date_list = []
    current_date = start_date
    while current_date <= end_date:
        date_list.append(current_date)
        current_date += timedelta(days=1)

    return date_list


def format_timestamp(timestamp: Union[int, float], format_str: str = "%Y-%m-%d %H:%M:%S") -> str:
    """
    将时间戳转换为格式化的日期时间字符串。

    Args:
        timestamp (Union[int, float]): 时间戳（秒或毫秒）。
        format_str (str): 日期时间格式，默认为"%Y-%m-%d %H:%M:%S"。

    Returns:
        str: 格式化的日期时间字符串。

    API接口: 无
    """
    # 如果时间戳大于10位，认为是毫秒，需要除以1000
    if timestamp > 9999999999:
        timestamp = timestamp / 1000

    dt = datetime.fromtimestamp(timestamp)
    return dt.strftime(format_str)


def datetime_str_to_timestamp(datetime_str: str, format_str: str = "%Y-%m-%d %H:%M:%S") -> int:
    """
    将日期时间字符串转换为时间戳（秒）。

    Args:
        datetime_str (str): 日期时间字符串，如"2026-01-30 00:00:00"。
        format_str (str): 日期时间格式，默认为"%Y-%m-%d %H:%M:%S"。

    Returns:
        int: 时间戳（秒）。

    Raises:
        ValueError: 如果日期时间字符串格式不正确。

    API接口: 无
    """
    dt = datetime.strptime(datetime_str, format_str)
    return int(dt.timestamp())

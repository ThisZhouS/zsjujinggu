"""
测试配置文件加载和基本功能。
"""

from __future__ import annotations

import sys
from pathlib import Path

# 添加项目路径
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

try:
    import yaml
    print("✓ pyyaml imported successfully")
except ImportError:
    print("✗ pyyaml not installed")
    print("Please run: pip install pyyaml")
    sys.exit(1)

from scripts.run_useful_full_fetch import (
    load_config_file,
    FetchConfig,
    boolean_config,
    DEFAULT_CONFIG_FILE,
)

def main() -> None:
    """主测试函数。"""
    print("=" * 60)
    print("测试配置文件加载和基本功能")
    print("=" * 60)

    # 测试1: 配置文件存在性
    print("\n[测试1] 配置文件存在性")
    config_path = DEFAULT_CONFIG_FILE
    print(f"  配置文件路径: {config_path}")
    print(f"  配置文件存在: {config_path.exists()}")

    # 测试2: 加载配置
    print("\n[测试2] 加载配置")
    config = load_config_file(config_path)
    print(f"  resume: {config.resume}")
    print(f"  currency: {config.currency}")
    print(f"  retry_times: {config.retry_times}")
    print(f"  scripts count: {len(config.scripts) if config.scripts else 0}")
    print(f"  verbose: {config.verbose}")
    print(f"  dry_run: {config.dry_run}")

    # 测试3: boolean_config 函数
    print("\n[测试3] boolean_config 函数测试")
    print(f"  boolean_config('true') = {boolean_config('true')}")
    print(f"  boolean_config('True') = {boolean_config('True')}")
    print(f"  boolean_config('1') = {boolean_config('1')}")
    print(f"  boolean_config('false') = {boolean_config('false')}")
    print(f"  boolean_config('False') = {boolean_config('False')}")
    print(f"  boolean_config('no') = {boolean_config('no')}")
    print(f"  boolean_config(None) = {boolean_config(None)}")

    # 测试4: FetchConfig 数据类
    print("\n[测试4] FetchConfig 数据类测试")
    test_config = FetchConfig(
        resume=True,
        currency=10,
        retry_times=5,
        verbose=True,
        dry_run=True,
    )
    print(f"  test_config.resume = {test_config.resume}")
    print(f"  test_config.currency = {test_config.currency}")
    print(f"  test_config.retry_times = {test_config.retry_times}")
    print(f"  test_config.verbose = {test_config.verbose}")
    print(f"  test_config.dry_run = {test_config.dry_run}")

    print("\n" + "=" * 60)
    print("所有测试完成！")
    print("=" * 60)


if __name__ == "__main__":
    main()

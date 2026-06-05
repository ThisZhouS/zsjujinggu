"""
测试全量获取脚本功能。
"""

import sys
from pathlib import Path

# 添加项目路径
PROJECT_ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(PROJECT_ROOT))

try:
    import yaml
    print("OK: pyyaml installed")
except ImportError:
    print("ERROR: pyyaml not installed")
    print("Please run: pip install pyyaml")
    sys.exit(1)

# 测试配置文件加载
from scripts.run_useful_full_fetch import (
    load_config_file,
    FetchConfig,
    DEFAULT_CONFIG_FILE,
)

print("=" * 60)
print("Config File Test")
print("=" * 60)

config_path = DEFAULT_CONFIG_FILE
print(f"Config file path: {config_path}")
print(f"Config file exists: {config_path.exists()}")

config = load_config_file(config_path)
print("\nConfig values:")
print(f"  resume: {config.resume}")
print(f"  currency: {config.currency}")
print(f"  retry_times: {config.retry_times}")
print(f"  scripts count: {len(config.scripts) if config.scripts else 0}")
print(f"  verbose: {config.verbose}")
print(f"  dry_run: {config.dry_run}")

print("\n" + "=" * 60)
print("Test Complete!")
print("=" * 60)

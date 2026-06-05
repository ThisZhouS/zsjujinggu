# Format 文件夹说明

本文件夹包含从 `example/` 目录中拆解出来的独立接口程序。每个接口对应一个独立的 Python 程序文件，可以独立运行，也支持多个接口程序并发运行。

## 文件命名规则

文件命名格式：`{模块名}_{接口方法名}.py`

例如：
- `major_market_lists_fetch_and_save_stock_list.py` - 主要市场列表模块的股票列表接口
- `company_basic_info_fetch_and_save_company_intro.py` - 公司基本信息模块的公司简介接口

## 已创建的接口文件

### major_market_lists (5个接口)
- ✅ `major_market_lists_fetch_and_save_stock_list.py`
- ✅ `major_market_lists_fetch_and_save_hs_fund_list.py`
- ✅ `major_market_lists_fetch_and_save_hs_main_index_list.py`
- ✅ `major_market_lists_fetch_and_save_new_stock_calendar.py`
- ✅ `major_market_lists_fetch_and_save_hk_stock_list.py`

### other_market_lists (4个接口)
- ✅ `other_market_lists_fetch_and_save_bj_index_list.py`
- ✅ `other_market_lists_fetch_and_save_kc_stock_list.py`
- ✅ `other_market_lists_fetch_and_save_etf_fund_list.py`
- ✅ `other_market_lists_fetch_and_save_bj_stock_list.py`

### company_basic_info (4个接口)
- ✅ `company_basic_info_fetch_and_save_company_intro.py`
- ✅ `company_basic_info_fetch_and_save_company_capital.py`
- ✅ `company_basic_info_fetch_and_save_stock_basic_info.py`
- ✅ `company_basic_info_fetch_and_save_lift_restriction.py`

### company_historical_data (3个接口)
- ✅ `company_historical_data_fetch_and_save_supervisory_board_member.py`
- ✅ `company_historical_data_fetch_and_save_executive_member.py`
- ✅ `company_historical_data_fetch_and_save_board_member.py`

### trading_details_special_data (3个接口)
- ✅ `trading_details_special_data_fetch_and_save_stop_price_history.py`
- ✅ `trading_details_special_data_fetch_and_save_today_tick_trade.py`
- ✅ `trading_details_special_data_fetch_and_save_money_flow.py`

### index_real_time_data (1个接口)
- ✅ `index_real_time_data_fetch_and_save_index_real_time_data.py`

### financial_core_indicators (3个接口)
- ✅ `financial_core_indicators_fetch_and_save_financial_main_indicators.py`
- ✅ `financial_core_indicators_fetch_and_save_financial_indicators.py`
- ✅ `financial_core_indicators_fetch_and_save_performance_forecast.py`

### financial_quarters_events (4个接口)
- ✅ `financial_quarters_events_fetch_and_save_recent_dividend.py`
- ✅ `financial_quarters_events_fetch_and_save_recent_additional_issue.py`
- ✅ `financial_quarters_events_fetch_and_save_quarterly_profit.py`
- ✅ `financial_quarters_events_fetch_and_save_quarterly_cash_flow.py`

### financial_statements (3个接口)
- ✅ `financial_statements_fetch_and_save_income_statement.py`
- ✅ `financial_statements_fetch_and_save_cashflow_statement.py`
- ✅ `financial_statements_fetch_and_save_balance_sheet.py`

### historical_trading_data (4个接口)
- ✅ `historical_trading_data_fetch_and_save_hs_stock_latest_trading.py`
- ✅ `historical_trading_data_fetch_and_save_hs_index_latest_trading.py`
- ✅ `historical_trading_data_fetch_and_save_hs_index_history_trading.py`
- ✅ `historical_trading_data_fetch_and_save_hk_stock_history_trading.py`

### index_relationship_mapping (4个接口)
- ✅ `index_relationship_mapping_fetch_and_save_zg_tree.py`
- ✅ `index_relationship_mapping_fetch_and_save_belonging_indices.py`
- ✅ `index_relationship_mapping_fetch_and_save_related_codes_by_stock.py`
- ✅ `index_relationship_mapping_fetch_and_save_related_stocks_by_code.py`

### index_technical_indicators (5个接口)
- ✅ `index_technical_indicators_fetch_and_save_history_boll.py`
- ✅ `index_technical_indicators_fetch_and_save_history_kdj.py`
- ✅ `index_technical_indicators_fetch_and_save_history_ma.py`
- ✅ `index_technical_indicators_fetch_and_save_history_macd.py`
- ✅ `index_technical_indicators_fetch_and_save_market_indicators.py`

### market_depth_data (4个接口)
- ✅ `market_depth_data_fetch_and_save_bj_stock_real_five.py`
- ✅ `market_depth_data_fetch_and_save_hk_stock_real_five.py`
- ✅ `market_depth_data_fetch_and_save_hs_stock_real_five.py`
- ✅ `market_depth_data_fetch_and_save_kc_stock_real_five.py`

### stock_real_time_data (5个接口)
- ✅ `stock_real_time_data_fetch_and_save_kc_stock_real_time_data.py`
- ✅ `stock_real_time_data_fetch_and_save_hs_index_real_time_data.py`
- ✅ `stock_real_time_data_fetch_and_save_hf_fund_real_time_data.py`
- ✅ `stock_real_time_data_fetch_and_save_hk_stock_real_time_data.py`
- ✅ `stock_real_time_data_fetch_and_save_bj_stock_real_time_data.py`

### realtime_trading_interfaces (5个接口)
- ✅ `realtime_trading_interfaces_fetch_and_save_realtime_trading_all_broker.py`
- ✅ `realtime_trading_interfaces_fetch_and_save_realtime_trading_all_network.py`
- ✅ `realtime_trading_interfaces_fetch_and_save_realtime_trading_broker.py`
- ✅ `realtime_trading_interfaces_fetch_and_save_realtime_trading_multi_stock.py`
- ✅ `realtime_trading_interfaces_fetch_and_save_realtime_trading_network.py`

### shareholder_basic_info (3个接口)
- ✅ `shareholder_basic_info_fetch_and_save_company_top_flow_holders.py`
- ✅ `shareholder_basic_info_fetch_and_save_company_top_holders.py`
- ✅ `shareholder_basic_info_fetch_and_save_company_shareholder_count.py`

### shareholder_detailed_data (4个接口)
- ✅ `shareholder_detailed_data_fetch_and_save_top10_float_shareholders.py`
- ✅ `shareholder_detailed_data_fetch_and_save_top10_shareholders.py`
- ✅ `shareholder_detailed_data_fetch_and_save_fund_holdings.py`
- ✅ `shareholder_detailed_data_fetch_and_save_shareholder_change_trend.py`

### shanghai_shenzhen_technical_indicators (4个接口)
- ✅ `shanghai_shenzhen_technical_indicators_fetch_and_save_history_boll.py`
- ✅ `shanghai_shenzhen_technical_indicators_fetch_and_save_history_kdj.py`
- ✅ `shanghai_shenzhen_technical_indicators_fetch_and_save_history_ma.py`
- ✅ `shanghai_shenzhen_technical_indicators_fetch_and_save_history_macd.py`

### stock_pool_classification (5个接口)
- ✅ `stock_pool_classification_fetch_and_save_limit_down_pool.py`
- ✅ `stock_pool_classification_fetch_and_save_strong_pool.py`
- ✅ `stock_pool_classification_fetch_and_save_limit_up_break_pool.py`
- ✅ `stock_pool_classification_fetch_and_save_limit_up_pool.py`
- ✅ `stock_pool_classification_fetch_and_save_sub_new_pool.py`

## 统计信息

**总计：69个接口文件已全部创建完成！**

所有接口文件都已从 `example/` 目录中的同步脚本拆解出来，每个接口对应一个独立的程序文件，可以独立运行，也支持多个接口程序并发运行。

## 使用方法

### 单个接口运行

```bash
python format/major_market_lists_fetch_and_save_stock_list.py
```

### 并发运行多个接口

可以使用 Python 的 `multiprocessing` 或 `subprocess` 模块，或者使用 shell 脚本：

```bash
# Windows PowerShell
Start-Process python -ArgumentList "format/major_market_lists_fetch_and_save_stock_list.py"
Start-Process python -ArgumentList "format/company_basic_info_fetch_and_save_company_intro.py"

# Linux/Mac
python format/major_market_lists_fetch_and_save_stock_list.py &
python format/company_basic_info_fetch_and_save_company_intro.py &
```

## 程序结构

每个接口程序都遵循相同的结构：

1. **导入部分**：导入必要的模块和类
2. **路径设置**：将项目根目录加入 sys.path
3. **辅助函数**：如需要，包含获取股票代码等辅助函数
4. **主函数**：初始化数据库、创建客户端、调用接口、处理数据

## 注意事项

1. 每个程序都是独立的，可以单独运行
2. 所有程序共享同一个数据库连接配置
3. 并发运行时需要注意数据库连接池的配置
4. 每个程序都有独立的日志记录器，日志文件会保存在对应的日志目录中



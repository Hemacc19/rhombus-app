import pytest
import pandas as pd
from unittest.mock import patch, MagicMock
from pyspark.sql import SparkSession
from spark_engine.transformations import SparkTransformationEngine

@pytest.fixture(scope="module")
def spark_session():
    return SparkSession.builder.master("local[2]").appName("TestSparkEngine").getOrCreate()

@pytest.fixture
def dummy_dataframe(spark_session):
    data = [
        {"id": 1, "Name": "John Doe", "Email": "john.doe@example.com"},
        {"id": 2, "Name": "Jane Smith", "Email": "jane_smith@domain.com"}
    ]
    pdf = pd.DataFrame(data)
    return spark_session.createDataFrame(pdf.astype(str))

@patch("spark_engine.transformations.SparkTransformationEngine._load_dataframe")
@patch("spark_engine.transformations.SparkTransformationEngine._save_spark_df")
def test_spark_nl_regex_replace(mock_save, mock_load, dummy_dataframe, spark_session):
    mock_load.return_value = (dummy_dataframe, 'csv')
    mock_save.return_value = "processed_test.csv"
    
    engine = SparkTransformationEngine()
    engine.spark = spark_session
    
    regex_pattern = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,7}\b"
    
    result = engine.process_job(
        file_key="dummy.csv",
        job_type="NL_REGEX_REPLACE",
        target_columns=["Email"],
        regex_pattern=regex_pattern,
        replacement_value="REDACTED",
        progress_callback=None
    )
    
    assert result["total_rows"] == 2
    assert result["target_columns"] == ["Email"]
    assert mock_save.called
    
    saved_df = mock_save.call_args[0][0]
    result_data = saved_df.toPandas().to_dict(orient="records")
    
    for row in result_data:
        assert row["Email"] == "REDACTED"

@patch("spark_engine.transformations.SparkTransformationEngine._load_dataframe")
@patch("spark_engine.transformations.SparkTransformationEngine._save_spark_df")
def test_spark_entity_extraction(mock_save, mock_load, dummy_dataframe, spark_session):
    mock_load.return_value = (dummy_dataframe, 'csv')
    mock_save.return_value = "processed_test_extract.csv"
    
    engine = SparkTransformationEngine()
    engine.spark = spark_session
    
    # Simple regex to extract domain name
    regex_pattern = r"@([A-Za-z0-9.-]+)"
    
    result = engine.process_job(
        file_key="dummy.csv",
        job_type="ENTITY_EXTRACTION",
        target_columns=["Email"],
        regex_pattern=regex_pattern,
        replacement_value="",
        progress_callback=None
    )
    
    saved_df = mock_save.call_args[0][0]
    result_data = saved_df.toPandas().to_dict(orient="records")
    
    assert result_data[0]["Email"] == "example.com"
    assert result_data[1]["Email"] == "domain.com"

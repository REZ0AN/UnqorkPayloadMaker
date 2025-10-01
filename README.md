# Unqork Request Payload Maker

A web-based tool to transform CSV or JSON data into API request payloads.

## Features

- **File Upload**
  - Supports CSV and JSON file formats
  - Shows preview of first 5 rows of data
  - Validates file format before processing

- **Request Configuration**
  - Supports HTTP methods: GET, POST, PUT
  - Custom API path configuration
  - Path automatically appends ID for PUT requests

- **Field Customization**
  - Toggle between camelCase and snake_case naming
  - Custom field mapping support
  - Select/deselect fields to include in payload
  - Separate selection for query parameters (GET) and body fields (POST/PUT)

- **Output Options**
  - Copy generated JSON to clipboard
  - Download JSON file with timestamp
  - Formatted JSON preview

## Validation Cases

The tool will show error messages when:

1. No file is selected
2. Unsupported file format is uploaded
3. API path is not provided
4. No fields are selected for payload generation
5. Required '_id' field is missing for PUT requests
6. Invalid key mappings are provided
7. File parsing fails
8. Empty data is submitted

**Note**: The tool provides immediate feedback through alerts and prevents payload generation until all required conditions are met.

## Step-by-Step Guide: Unqork Request Payload Maker

### 1. GET Request Flow

1. Upload Data File:
   - Click "Select CSV or JSON File"
   - Choose your data file (CSV or JSON format)
   - Preview table will show first 5 rows

2. Configure Request:
   - Select "GET" from HTTP Method dropdown
   - Enter API path (e.g., `/v1/clients`)

3. Field Configuration:
   - Choose naming convention (camelCase or snake_case)
   - Select fields to include as query parameters
   - Use "Select/Deselect All" checkbox to toggle all fields

4. Generate Payload:
   - Click "Generate Payload" button
   - Review generated JSON output
   - Copy or download the payload

### 2. POST Request Flow

1. Upload Data File:
   - Upload CSV/JSON file
   - Preview data automatically appears

2. Configure Request:
   - Select "POST" from HTTP Method dropdown
   - Enter API path

3. Field Configuration:
   - Select naming convention
   - Choose fields for request body
   - Map field names if needed

4. Generate Payload:
   - Generate and review JSON
   - Each row becomes a separate request object
   - Download or copy to clipboard

### 3. PUT Request Flow

1. Upload Data File:
   - File must contain `_id` field
   - Upload and verify preview

2. Configure Request:
   - Select "PUT" method
   - Enter base API path
   - Tool will automatically append `_id` to path

3. Field Configuration:
   - Select fields for request body
   - Configure field mapping
   - `_id` field is handled automatically

4. Generate Payload:
   - Generate JSON payload
   - Path will include `/{_id}` for each request
   - Review and export

## Best Practices

1. Always verify data preview before proceeding
2. Check field mappings match API requirements
3. Review generated payload before using
4. Use appropriate naming convention for target API
5. Keep API paths consistent with backend expectations
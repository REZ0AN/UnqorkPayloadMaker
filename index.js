let csvData = [];
let csvHeaders = [];

document.getElementById('csvFile').addEventListener('change', handleFileUpload);
document.getElementById('jsonFile').addEventListener('change', handleFileUpload);
document.getElementById('method').addEventListener('change', handleOnMethodChange );

function handleOnMethodChange(event) {
    const generatePayloadButton = document.getElementById('btn-generate-payload');
    generatePayloadButton.style.display = 'block';
    if(event.target.value == 'GET'){
        const jsonOutput = document.getElementById('jsonOutput');
        jsonOutput.textContent = "";
        const mappingSection = document.getElementById('mapping-body');
        mappingSection.style.display = 'none';
        createQueryMapping();
        toggleSelectAll('selectAllQuery','.field-checkbox-query','GET');
    } else {

        const jsonOutput = document.getElementById('jsonOutput');
        jsonOutput.textContent = "";
        const mappingSection = document.getElementById('mapping-query');
        mappingSection.style.display = 'none';
        createBodyMapping();
        toggleSelectAll('selectAllBody','.field-checkbox',null);
    }
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        const fileType = file.name.split('.').pop().toLowerCase(); // detect file extension

        if (fileType === 'csv') {
            Papa.parse(content, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: function(results) {
                    csvData = results.data;
                    csvHeaders = results.meta.fields;

                    if (csvHeaders && csvHeaders.length > 0) {
                        showCsvPreview();
                        // enable input fields for method and path
                        const method = document.getElementById('method');
                        const path = document.getElementById('path');
                        method.removeAttribute('disabled');
                        path.removeAttribute('disabled');
                    } else {
                        showError('Could not parse CSV headers. Please check your file format.');
                    }
                },
                error: function(error) {
                    showError('Error parsing CSV: ' + error.message);
                }
            });

        } else if (fileType === 'json') {
            try {
                const jsonData = JSON.parse(content);
                csvData = Array.isArray(jsonData) ? jsonData : [jsonData];
                csvHeaders = csvData.length > 0 ? Object.keys(csvData[0]) : [];

                if (csvHeaders.length > 0) {
                    showCsvPreview();
                    // enable input fields for method and path
                    const method = document.getElementById('method');
                    const path = document.getElementById('path');
                    method.removeAttribute('disabled');
                    path.removeAttribute('disabled');
                    
                } else {
                    showError('Could not parse JSON headers. Please check your file format.');
                }
            } catch (err) {
                showError('Error parsing JSON: ' + err.message);
            }

        } else {
            showError('Unsupported file type. Please upload a CSV or JSON file.');
        }
    };

    reader.readAsText(file);
}


function showCsvPreview() {
    const previewSection = document.getElementById('previewSection');
    const previewContainer = document.getElementById('csvPreview');
    
    let html = '<table class="preview-table"><thead><tr>';
    csvHeaders.forEach(header => {
        html += `<th>${header}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    // Show first 5 rows
    const previewRows = csvData.slice(0, 5);
    previewRows.forEach(row => {
        html += '<tr>';
        csvHeaders.forEach(header => {
            html += `<td>${row[header] || ''}</td>`;
        });
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    if (csvData.length > 5) {
        html += `<p style="margin-top: 10px; color: #666; font-style: italic;">Showing first 5 rows of ${csvData.length} total rows</p>`;
    }
    
    previewContainer.innerHTML = html;
    previewSection.style.display = 'block';
}

function createQueryMapping(){
    const mappingContainer = document.getElementById('mapping-query-container');
    const mappingSection = document.getElementById('mapping-query');
    
    mappingContainer.innerHTML = '';
    
    csvHeaders.forEach((header, index) => {
        const mappingItem = document.createElement('div');
        mappingItem.className = 'mapping-item';
        mappingItem.id = `mapping-query-${index}`;
        
        const camelCaseKey = toCamelCase(header);
        
        mappingItem.innerHTML = `
            <input type="checkbox" class="field-checkbox-query" id="checkbox-query-${index}" 
                    data-header="${header}" onchange="toggleField(${index},'GET')" checked>
            <div class="csv-header">${header}</div>
            <div class="arrow">→</div>
            <input type="text" class="key-input" id="key-query-${index}" value="${camelCaseKey}" 
                    data-header="${header}" placeholder="camelCase key">
        `;
        
        mappingContainer.appendChild(mappingItem);
    });
    
    mappingSection.style.display = 'block';
}

function createBodyMapping() {
    const mappingContainer = document.getElementById('mapping-body-container');
    const mappingSection = document.getElementById('mapping-body');
    
    mappingContainer.innerHTML = '';
    
    csvHeaders.forEach((header, index) => {
        const mappingItem = document.createElement('div');
        mappingItem.className = 'mapping-item';
        mappingItem.id = `mapping-${index}`;
        
        const camelCaseKey = toCamelCase(header);
        
        mappingItem.innerHTML = `
            <input type="checkbox" class="field-checkbox" id="checkbox-${index}" 
                    data-header="${header}" onchange="toggleField(${index},${null})" checked>
            <div class="csv-header">${header}</div>
            <div class="arrow">→</div>
            <input type="text" class="key-input" id="key-${index}" value="${camelCaseKey}" 
                    data-header="${header}" placeholder="camelCase key">
        `;
        
        mappingContainer.appendChild(mappingItem);
    });
    
    mappingSection.style.display = 'block';
}

function toggleSelectAll(selectAllId, selectFieldCheckbox,method) {
    const selectAllCheckbox = document.getElementById(selectAllId);
    const fieldCheckboxes = document.querySelectorAll(selectFieldCheckbox);
    fieldCheckboxes.forEach((checkbox, index) => {
        checkbox.checked = selectAllCheckbox.checked;
        toggleField(index,method);
    });
}

function toggleField(index,method) {
    const checkbox = document.getElementById(method == "GET"? `checkbox-query-${index}` : `checkbox-${index}`);
    const mappingItem = document.getElementById(method == "GET"?`mapping-query-${index}` : `mapping-${index}`);
    const keyInput = document.getElementById(method == "GET"? `key-query-${index}` : `key-${index}`);
    
    if (checkbox.checked) {
        mappingItem.classList.remove('disabled');
        keyInput.disabled = false; 
        const selectAllCheckbox = document.getElementById(method=="GET"? 'selectAllQuery' : 'selectAllBody');
        const suffix = method == 'GET'? "-query" : "";
        if(!selectAllCheckbox.checked) {
            selectAllCheckbox.checked = Array.from(document.querySelectorAll(`.field-checkbox${suffix}:checked`)).length === csvHeaders.length;
        }
    } else {
        mappingItem.classList.add('disabled');
        keyInput.disabled = true;
        const selectAllCheckbox = document.getElementById(method=="GET"? 'selectAllQuery' : 'selectAllBody');
        selectAllCheckbox.checked = false; // Uncheck "Select All" if any field is unchecked
    }
}


function toCamelCase(str) {
    const camelCasePattern = /^[a-z][a-zA-Z0-9]*$/;
    if (camelCasePattern.test(str)) {
        return str;
    }
    const numberWords = {
        '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
        '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
        '10': 'ten', '11': 'eleven', '12': 'twelve', '13': 'thirteen',
        '14': 'fourteen', '15': 'fifteen', '16': 'sixteen', '17': 'seventeen',
        '18': 'eighteen', '19': 'nineteen', '20': 'twenty'
    };

    return str
        .toLowerCase() // Handle forward slashes as "Or"
        .replace(/\//g, ' or ') // Handle parentheses and other separators
        .replace(/&/g, ' and ') // Convert ampersand to "and"
        .replace(/[()]+/g, ' ') // Remove parentheses 
        .replace(/\b(\d+)\b/g, (match, num) => {
            return numberWords[num] || num; // Convert numbers to words
        }).replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase()) // Convert non-alphanumeric characters to camelCase
        .replace(/^[^a-zA-Z]+/, '') // Remove leading non-alphabet
}

function generatePayload() {
    const method = document.getElementById('method').value;
    const path = document.getElementById('path').value;
    
    if (!path.trim()) {
        showError('Please enter an API path.');
        return;
    }

    // Get selected fields and their key mappings
    const keyMappings = {};
    const queryKeyMappings = {};
    const selectedCheckboxes = document.querySelectorAll('.field-checkbox:checked');

    let isBodyNeeded = true;
    if (selectedCheckboxes.length === 0 && method !== 'GET') {
        showError('Please select at least one field to include in the payload.');
        return;
    }
    isBodyNeeded = selectedCheckboxes.length != 0;
    // Get the Checkboxes for Body Field
    selectedCheckboxes.forEach(checkbox => {
        const header = checkbox.dataset.header;
        const index = checkbox.id.split('-')[1];
        const keyInput = document.getElementById(`key-${index}`);
        const key = keyInput.value.trim();
        
        if (key) {
            keyMappings[header] = key;
        } else {
            showError(`Please provide a key name for field: ${header}`);
            return;
        }
    });

    // Get the Checkboxes for the Query Field
    let isQueryNeeded = false;
    if (method == "GET") {
        isBodyNeeded = false;
        const selectedQueryCheckboxes = document.querySelectorAll('.field-checkbox-query:checked');
        isQueryNeeded = selectedQueryCheckboxes.length != 0;
        selectedQueryCheckboxes.forEach(checkbox => {
            const header = checkbox.dataset.header;
            const index = checkbox.id.split('-')[2];
            const keyInput = document.getElementById(`key-query-${index}`);
            const key = keyInput.value.trim();
            
            if (key) {
                queryKeyMappings[header] = key;
            } else {
                showError(`Please provide a key name for field: ${header}`);
                return;
            }
        });
    }


    // Generate request objects with only selected fields
    const requests = csvData.map(row => {
        const body = {};
        const query = {};

        if(isBodyNeeded) {
            Object.keys(keyMappings).forEach(header => {
                const key = keyMappings[header];
                body[key] = row[header];
            });
        }

        if(isQueryNeeded) {
            Object.keys(queryKeyMappings).forEach(header => {
                const key = queryKeyMappings[header];
                query[key] = row[header];
            });
        }
        return {
            "_request": {
                "method": method,
                "path": path,
                ...(isQueryNeeded && { query: query }),
                ...(isBodyNeeded && { body: body}),
            }
        };
    });
    const uniqueRequests = Array.from(
                            new Map(
                                requests.map(req => [JSON.stringify(req), req])
                            ).values()
                        );
    
    displayOutput(uniqueRequests);
}

function displayOutput(requests) {
    const outputSection = document.getElementById('outputSection');
    const jsonOutput = document.getElementById('jsonOutput');
    
    const formattedJson = JSON.stringify(requests, null, 2);
    jsonOutput.textContent = formattedJson;
    outputSection.style.display = 'block';
    
    // Scroll to output
    outputSection.scrollIntoView({ behavior: 'smooth' });
}

function copyToClipboard() {
    const jsonOutput = document.getElementById('jsonOutput');
    const text = jsonOutput.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector('.copy-btn');
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        btn.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }, 2000);
    }).catch(err => {
        showError('Failed to copy to clipboard: ' + err.message);
    });
}

function showError(message) {
    window.alert(message);
}


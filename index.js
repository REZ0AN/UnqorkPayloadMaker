let csvData = [];
let csvHeaders = [];
let fileName ="";
let selectedCase = "CAMEL";
document.getElementById('file-input').addEventListener('change', handleFileUpload);
document.getElementById('method').addEventListener('change', handleOnMethodChange );
document.getElementById('case').addEventListener('change',handleOnCaseChange);

function handleOnCaseChange(event){
    selectedCase = event.target.value;
    showFieldMappings();
}

function parseCSV(content) {
    Papa.parse(content, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: function(results) {
                    csvData = results.data;
                    csvHeaders = results.meta.fields;
                },
                error: function(error) {
                    showError('Error parsing CSV: ' + error.message);
                }
    });
}

function showPreview() {
    const previewSection = document.getElementById('preview-data');
    const previewContainer = document.getElementById('data-preview-table');
    
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
    showFieldMappings();
}


function enableInputOnForm() {
    // enable input method and path for input
    const method = document.getElementById('method');
    const path = document.getElementById('path');
    method.removeAttribute('disabled');
    path.removeAttribute('disabled');
    method.classList.remove('disabled');
    path.classList.remove('disabled');
}

function hideSections(type) {
    const outputSection = document.getElementById('outputSection');
    const mappingSectionBody = document.getElementById('mapping-body');
    const mappingSectionQuery = document.getElementById('mapping-query');
    const generatePayloadButton = document.getElementById('btn-generate-payload');
    outputSection.style.display = 'none';

    switch(type) {
        case "GET" :
                mappingSectionBody.style.display = 'none';
                break;
        case "PUT" :
        case "POST" :
                mappingSectionQuery.style.display = 'none';
                break;
        default :
                generatePayloadButton.style.display = 'none';
                mappingSectionBody.style.display = 'none';
                mappingSectionQuery.style.display = 'none';
    }

}
function handleFileUpload(event) {

    hideSections(null);

    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {
        const content = e.target.result;
        const fileType = file.name.split('.').pop().toLowerCase(); 

        fileName = file.name;

        if (fileType === 'csv') {

            parseCSV(content);
            if (csvHeaders.length > 0) {
                
                // preview data
                showPreview();
                
                // enabling input on form fields
                enableInputOnForm();
                
            } 

        } else if (fileType === 'json') {
            try {

                const jsonData = JSON.parse(content);
                csvData = Array.isArray(jsonData) ? jsonData : [jsonData];
                csvHeaders = csvData.length > 0 ? Object.keys(csvData[0]) : [];

                if (csvHeaders.length > 0) {
                    
                    // preview data
                    showPreview();
                    
                    // enabling input on form fields
                    enableInputOnForm();
                    
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

function handleOnMethodChange(event) {

    const generatePayloadButton = document.getElementById('btn-generate-payload');
    const method = event.target.value;
    generatePayloadButton.style.display = 'block';
    hideSections(method);

    if(method === 'GET'){
        fieldSelection('query');
        toggleSelectAll('select-query','.field-checkbox-query');

    } else {
        fieldSelection('body');
        toggleSelectAll('select-body','.field-checkbox-body');
    }
}

function showFieldMappings() {
    const mappingContainer = document.getElementById('mapping-container');
    const mappingSection = document.getElementById('mapping-fields');
    
    mappingContainer.innerHTML = '';
    let parsedHeaders = csvHeaders.filter(header => header !== '_id');
    parsedHeaders.forEach((header, index) => {
        const mappingItem = document.createElement('div');
        mappingItem.className = 'mapping-item';
        
        const caseKey = selectedCase==='CAMEL'? toCamelCase(header) : toSnakeCase(header);
        
        mappingItem.innerHTML = `
            <div class="csv-header">${header}</div>
            <div class="arrow">→</div>
            <input type="text" class="key-input" value="${caseKey}" id="key-${index}" 
                    data-header="${header}" placeholder="camelCase key">
        `;
        
        mappingContainer.appendChild(mappingItem);
    });
    
    mappingSection.style.display = 'block';
}

function fieldSelection(type) {
    const mappingContainer = document.getElementById(`mapping-${type}-container`);
    const mappingSection = document.getElementById(`mapping-${type}`);
    const mappingCheckboxClass = `field-checkbox-${type}`;
    const mappingCheckboxIdPrefix = `checkbox-${type}`;
    const selectAllCheckbox = `select-${type}`;
    mappingContainer.innerHTML='';
    let parsedHeaders = csvHeaders.filter(header => header !== '_id');
    parsedHeaders.forEach((header, index) => {
        const mappingItem = document.createElement('div');
        mappingItem.className = 'mapping-item';
        mappingItem.id = `mapping-${type}-${index}`;
        mappingItem.innerHTML = `
            <input type="checkbox" class="field-checkbox ${mappingCheckboxClass}" id="${mappingCheckboxIdPrefix}-${index}" 
                    data-header="${header}" onchange="toggleField('.${mappingCheckboxClass}','${mappingCheckboxIdPrefix}-${index}', '${selectAllCheckbox}')" checked>
            <div class="csv-header">${header}</div>
        `;
        
        mappingContainer.appendChild(mappingItem);
    });
    
    mappingSection.style.display = 'block';
}

function toggleSelectAll(selectAll, selectFieldCheckbox) {

    const selectAllCheckbox = document.getElementById(selectAll);
    const type = selectAll.split('-')[1];
    const fieldCheckboxes = document.querySelectorAll(selectFieldCheckbox);

    fieldCheckboxes.forEach((checkbox, index) => {
        const itemId = `checkbox-${type}-${index}`;
        checkbox.checked = selectAllCheckbox.checked;
        toggleField(selectFieldCheckbox, itemId, selectAll);
    });
}

function toggleField(itemClass, itemId, selectAllCheckboxId) {

    const checkbox = document.getElementById(itemId);
    const selectAllCheckbox = document.getElementById(selectAllCheckboxId);

    if (checkbox.checked) {
        if(!selectAllCheckbox.checked) {
            const hasId = csvHeaders.includes("_id");
            let size = csvHeaders.length;
            if(hasId) {
                size = size - 1;
            }
            selectAllCheckbox.checked = Array.from(document.querySelectorAll(`${itemClass}:checked`)).length === size;
        }
    } else {
        selectAllCheckbox.checked = false;
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

function toSnakeCase(str) {
    const snakeCasePattern = /^[a-z][a-z0-9_]*$/;
    if (snakeCasePattern.test(str)) {
        return str;
    }
    
    // Check if string is in camelCase or PascalCase
    const camelCasePattern = /^[a-z][a-zA-Z0-9]*$|^[A-Z][a-zA-Z0-9]*$/;
    if (camelCasePattern.test(str)) {
        // Convert camelCase/PascalCase to snake_case
        return str
            .replace(/([A-Z])/g, '_$1') // Add underscore before capital letters
            .toLowerCase()
            .replace(/^_/, ''); // Remove leading underscore if present
    }
    
    const numberWords = {
        '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
        '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
        '10': 'ten', '11': 'eleven', '12': 'twelve', '13': 'thirteen',
        '14': 'fourteen', '15': 'fifteen', '16': 'sixteen', '17': 'seventeen',
        '18': 'eighteen', '19': 'nineteen', '20': 'twenty'
    };

    return str
        .toLowerCase()
        .replace(/\//g, ' or ') // Handle forward slashes as "or"
        .replace(/&/g, ' and ') // Convert ampersand to "and"
        .replace(/[()]+/g, ' ') // Remove parentheses
        .replace(/\b(\d+)\b/g, (match, num) => {
            return numberWords[num] || num; // Convert numbers to words
        })
        .replace(/[^a-zA-Z0-9]+/g, '_') // Convert non-alphanumeric characters to underscores
        .replace(/^[^a-z]+/, '') // Remove leading non-alphabet characters
        .replace(/_+/g, '_') // Replace multiple underscores with single underscore
        .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
}

function generatePayload() {
    const method = document.getElementById('method').value;
    const path = document.getElementById('path').value;
    document.getElementById('json')
    if (!path.trim()) {
        showError('Please enter an API path.');
        return;
    }
    const keyMappings = {};
    let fields = document.querySelectorAll('.key-input');
    fields.forEach((field)=>{
        const header = field.dataset.header;
        const index = field.id.split('-')[1];
        const keyInput = document.getElementById(`key-${index}`);
        const key = keyInput.value.trim();
        if (key) {
            keyMappings[header] = key;
        } else {
            showError(`Please provide a key name for field: ${header}`);
            return;
        }
    })
    let isBodyNeeded = false;
    let isQueryNeeded = false;
    let isPathModificationNeeded = false;
    if(method == 'GET') {
        isQueryNeeded=true;
        selectedCheckboxes = document.querySelectorAll('.field-checkbox-query:checked');
    } else  {
        isBodyNeeded= true;
 
        if(method == 'PUT') {
            if(!csvHeaders.includes('_id')) {

                showError("'_id' not found in Headers");
                return;
            }
            isPathModificationNeeded = true;
        } 
        selectedCheckboxes = document.querySelectorAll('.field-checkbox-body:checked');
    }
    
    let selectedFields = [];
    selectedCheckboxes.forEach((checkbox)=>{
        const header = checkbox.dataset.header;
        selectedFields.push(header);
    })
    if(selectedFields.length == 0) {
        showError("No fields selected. Please choose one or more options to continue.")
        return;
    }

    // Generate request objects with only selected fields
    const requests = csvData.map(row => {
        const body = {};
        const query = {};

        if(isBodyNeeded) {
           selectedFields.forEach(header => {
                const key = keyMappings[header];
                body[key] = row[header];
            });
        }

        if(isQueryNeeded) {
           selectedFields.forEach(header => {
                const key = keyMappings[header];
                query[key] = row[header];
            });
        }
        return {
            "_request": {
                "method": method,
                "path": isPathModificationNeeded? `${path}/${row['_id']}` : path,
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

function downloadJson() {
    const jsonOutput = document.getElementById('jsonOutput');
    const method = document.getElementById('method').value;
    const text = jsonOutput.textContent;
    
    if (!text || text.trim() === '') {
        showError('No JSON data to download');
        return;
    }
    
    // Create a blob from the JSON text
    const blob = new Blob([text], { type: 'application/json' });
    
    // Create a temporary download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `[${method}]-payload-${fileName}-${new Date().toISOString()}.json`; // Filename with timestamp
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Visual feedback
    const btn = document.querySelector('.download-btn');
    const originalText = btn.textContent;
    btn.textContent = 'Downloaded!';
    btn.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
    
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }, 2000);
}

function showError(message) {
    window.alert(message);
}


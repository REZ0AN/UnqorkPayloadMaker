
        let csvData = [];
        let csvHeaders = [];

        document.getElementById('csvFile').addEventListener('change', handleFileUpload);

        function handleFileUpload(event) {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                const csv = e.target.result;
                
                Papa.parse(csv, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                    complete: function(results) {
                        csvData = results.data;
                        csvHeaders = results.meta.fields;
                        
                        if (csvHeaders && csvHeaders.length > 0) {
                            showCsvPreview();
                            createHeaderMapping();
                            showSuccess(`CSV loaded successfully! Found ${csvData.length} rows and ${csvHeaders.length} columns.`);
                        } else {
                            showError('Could not parse CSV headers. Please check your file format.');
                        }
                    },
                    error: function(error) {
                        showError('Error parsing CSV: ' + error.message);
                    }
                });
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

        function createHeaderMapping() {
            const mappingContainer = document.getElementById('mappingContainer');
            const mappingSection = document.getElementById('mappingSection');
            
            mappingContainer.innerHTML = '';
            
            csvHeaders.forEach((header, index) => {
                const mappingItem = document.createElement('div');
                mappingItem.className = 'mapping-item';
                mappingItem.id = `mapping-${index}`;
                
                const camelCaseKey = toCamelCase(header);
                
                mappingItem.innerHTML = `
                    <input type="checkbox" class="field-checkbox" id="checkbox-${index}" 
                           data-header="${header}" onchange="toggleField(${index})" checked>
                    <div class="csv-header">${header}</div>
                    <div class="arrow">→</div>
                    <input type="text" class="key-input" id="key-${index}" value="${camelCaseKey}" 
                           data-header="${header}" placeholder="camelCase key">
                `;
                
                mappingContainer.appendChild(mappingItem);
            });
            
            mappingSection.style.display = 'block';
            updateSelectAllState();
        }

        function toggleSelectAll() {
            const selectAllCheckbox = document.getElementById('selectAll');
            const fieldCheckboxes = document.querySelectorAll('.field-checkbox');
            fieldCheckboxes.forEach((checkbox, index) => {
                checkbox.checked = selectAllCheckbox.checked;
                toggleField(index);
            });
        }

        function toggleField(index) {
            const checkbox = document.getElementById(`checkbox-${index}`);
            const mappingItem = document.getElementById(`mapping-${index}`);
            const keyInput = document.getElementById(`key-${index}`);
            
            if (checkbox.checked) {
                mappingItem.classList.remove('disabled');
                keyInput.disabled = false; 
                const selectAllCheckbox = document.getElementById('selectAll');
                if(!selectAllCheckbox.checked) {
                    selectAllCheckbox.checked = Array.from(document.querySelectorAll('.field-checkbox:checked')).length === csvHeaders.length;
                }
            } else {
                mappingItem.classList.add('disabled');
                keyInput.disabled = true;
                const selectAllCheckbox = document.getElementById('selectAll');
                selectAllCheckbox.checked = false; // Uncheck "Select All" if any field is unchecked
            }
        }


        function toCamelCase(str) {
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
            const selectedCheckboxes = document.querySelectorAll('.field-checkbox:checked');
            
            if (selectedCheckboxes.length === 0) {
                showError('Please select at least one field to include in the payload.');
                return;
            }
            
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

            // Generate request objects with only selected fields
            const requests = csvData.map(row => {
                const body = {};
                Object.keys(keyMappings).forEach(header => {
                    const key = keyMappings[header];
                    body[key] = row[header];
                });

                return {
                    "_request": {
                        "method": method,
                        "body": body,
                        "path": path
                    }
                };
            });

            displayOutput(requests);
        }

        function displayOutput(requests) {
            const outputSection = document.getElementById('outputSection');
            const jsonOutput = document.getElementById('jsonOutput');
            
            const formattedJson = JSON.stringify(requests, null, 2);
            jsonOutput.textContent = formattedJson;
            outputSection.style.display = 'block';
            
            // Scroll to output
            outputSection.scrollIntoView({ behavior: 'smooth' });
            
            const selectedFields = document.querySelectorAll('.field-checkbox:checked').length;
            showSuccess(`Generated ${requests.length} request objects with ${selectedFields} selected fields each!`);
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
            removeMessages();
            const error = document.createElement('div');
            error.className = 'error';
            error.textContent = message;
            document.querySelector('.content').appendChild(error);
        }

        function showSuccess(message) {
            removeMessages();
            const success = document.createElement('div');
            success.className = 'success';
            success.textContent = message;
            document.querySelector('.content').appendChild(success);
        }

        function removeMessages() {
            const messages = document.querySelectorAll('.error, .success');
            messages.forEach(msg => msg.remove());
        }
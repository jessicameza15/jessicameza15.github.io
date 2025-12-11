document.addEventListener('DOMContentLoaded', () => {
    const csvUrl = 'district_data.csv';
    let districtData = [];

    // DOM Elements
    const searchInput = document.getElementById('districtSearch');
    const searchResults = document.getElementById('searchResults');
    const resultSection = document.getElementById('resultSection');
    const districtNameDisplay = document.getElementById('districtNameDisplay');
    const dataTableBody = document.getElementById('dataTableBody');
    const ctx = document.getElementById('absenteeismChart').getContext('2d');

    // Add a status element for debugging/feedback
    const statusDiv = document.createElement('div');
    statusDiv.style.textAlign = 'center';
    statusDiv.style.marginTop = '1rem';
    statusDiv.style.color = '#64748b';
    document.querySelector('.search-section').appendChild(statusDiv);

    let chartInstance = null;

    // Load and Parse CSV
    statusDiv.textContent = 'Loading data...';

    Papa.parse(csvUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function (results) {
            if (results.data && results.data.length > 0) {
                // Normalize keys to handle potential BOM or whitespace issues
                // We want to find the key that holds the district name (clean_name)
                // and map it to a standard 'name' property, and keep the rest.

                const rawKeys = Object.keys(results.data[0]);
                console.log("Raw CSV Keys:", rawKeys);

                // Find the name key (it might have BOM like \uFEFFclean_name)
                const nameKey = rawKeys.find(k => k.trim().replace(/^\ufeff/, '') === 'clean_name');

                if (!nameKey) {
                    console.error("Could not find 'clean_name' column. Keys found:", rawKeys);
                    statusDiv.textContent = 'Error: Data format incorrect (missing clean_name column).';
                    statusDiv.style.color = 'red';
                    return;
                }

                districtData = results.data.map(row => {
                    const newRow = { ...row };
                    // Create a standard 'clean_name' property if the key was slightly off
                    if (nameKey !== 'clean_name') {
                        newRow.clean_name = newRow[nameKey];
                    }
                    return newRow;
                });

                console.log("Processed Data (first 3):", districtData.slice(0, 3));
                statusDiv.textContent = ''; // Clear loading message
            } else {
                statusDiv.textContent = 'Error: No data found in CSV file.';
                statusDiv.style.color = 'red';
            }
        },
        error: function (error) {
            console.error("Error parsing CSV:", error);
            statusDiv.textContent = 'Error loading data file. Please check connection.';
            statusDiv.style.color = 'red';
        }
    });

    // Search Functionality
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        searchResults.innerHTML = '';

        if (query.length < 2) {
            searchResults.classList.add('hidden');
            return;
        }

        if (districtData.length === 0) {
            console.warn("Search attempted but data is empty");
            return;
        }

        const filtered = districtData.filter(row =>
            row.clean_name && row.clean_name.toLowerCase().includes(query)
        );

        if (filtered.length > 0) {
            searchResults.classList.remove('hidden');
            filtered.forEach(district => {
                const div = document.createElement('div');
                div.className = 'search-result-item';
                div.textContent = district.clean_name;
                div.addEventListener('click', () => {
                    selectDistrict(district);
                    searchResults.classList.add('hidden');
                    searchInput.value = ''; // Optional: clear search after selection
                });
                searchResults.appendChild(div);
            });
        } else {
            // Optional: Show "no results"
            searchResults.classList.remove('hidden');
            const noRes = document.createElement('div');
            noRes.className = 'search-result-item';
            noRes.style.cursor = 'default';
            noRes.style.color = '#999';
            noRes.textContent = 'No matching districts found';
            searchResults.appendChild(noRes);
        }
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            searchResults.classList.add('hidden');
        }
    });

    function selectDistrict(district) {
        // Show result section
        resultSection.classList.remove('hidden');
        districtNameDisplay.textContent = district.clean_name;

        // Prepare data for Chart and Table
        const yearKeys = ["20192020", "20202021", "20212022", "20222023", "20232024", "20242025"];
        const yearLabels = ["2019-2020", "2020-2021", "2021-2022", "2022-2023", "2023-2024", "2024-2025"];

        const dataPoints = yearKeys.map(key => {
            const val = district[key];
            return (val === "NA" || val === "" || val === undefined) ? null : parseFloat(val);
        });

        updateChart(yearLabels, dataPoints, district.clean_name);
        updateTable(yearLabels, dataPoints);
    }

    function updateChart(labels, data, label) {
        if (chartInstance) {
            chartInstance.destroy();
        }

        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Chronic Absenteeism Rate (%)',
                    data: data,
                    borderColor: '#2563eb', // Primary color from CSS
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#2563eb',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    fill: true,
                    tension: 0.3 // Smooth curves
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `Rate: ${context.parsed.y}%`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Percent (%)'
                        },
                        grid: {
                            color: '#e2e8f0'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    function updateTable(labels, data) {
        dataTableBody.innerHTML = '';

        for (let i = labels.length - 1; i >= 0; i--) {
            if (data[i] !== null) {
                const row = document.createElement('tr');
                const yearCell = document.createElement('td');
                yearCell.textContent = labels[i];
                const valueCell = document.createElement('td');
                valueCell.textContent = `${data[i]}%`;

                row.appendChild(yearCell);
                row.appendChild(valueCell);
                dataTableBody.appendChild(row);
            }
        }
    }
});


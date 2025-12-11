document.addEventListener('DOMContentLoaded', () => {
    const csvUrl = 'district_data.csv'; // Ensure this matches your file name exactly
    let districtData = [];

    // DOM Elements
    const searchInput = document.getElementById('districtSearch');
    const searchResults = document.getElementById('searchResults');
    const resultSection = document.getElementById('resultSection');
    const districtNameDisplay = document.getElementById('districtNameDisplay');
    const dataTableBody = document.getElementById('dataTableBody');
    const ctx = document.getElementById('absenteeismChart').getContext('2d');

    let chartInstance = null;

    // Load and Parse CSV
    Papa.parse(csvUrl, {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            console.log("CSV Loaded:", results.data);
            districtData = results.data;
        },
        error: function(error) {
            console.error("Error parsing CSV:", error);
        }
    });

    // Search Functionality
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        searchResults.innerHTML = '';
        
        if (query.length < 2) {
            searchResults.classList.add('hidden');
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
            searchResults.classList.add('hidden');
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
        // The CSV columns are: clean_name, 20242025, 20232024, 20222023, 20212022, 20202021, 20192020
        // We want to display them chronologically on the chart? 
        // Usually X axis is time. So 2019-2020 -> 2024-2025.
        // Let's create an ordered list of keys
        
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
                            label: function(context) {
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
        // Iterate backwards to show newest first in table, or forwards? 
        // Let's do newest first (reverse order input arrays for table display)
        
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

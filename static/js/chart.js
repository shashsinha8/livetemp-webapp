// Chart.js setup
let temperatureChart;
let expandedChart;
let isExpanded = false;

// Helper function to calculate y-axis range
function calculateYAxisRange(data) {
    if (data.length === 0) return { min: 84, max: 87 }; // Default fallback
    
    const temperatures = data.map(point => point.temperature || point);
    const min = Math.min(...temperatures);
    const max = Math.max(...temperatures);
    
    // Add ±2 degrees padding to the range
    return {
        min: Math.floor(min - 2),
        max: Math.ceil(max + 2)
    };
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the main chart
    const ctx = document.getElementById('temperatureChart').getContext('2d');
    temperatureChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Temperature (°F)',
                data: [],
                borderColor: '#ff5722',
                backgroundColor: 'rgba(255, 87, 34, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Temperature (°F)'
                    },
                    beginAtZero: false
                }
            }
        }
    });

    // Initialize expanded chart with similar dynamic range
    const expandedCtx = document.getElementById('expandedTemperatureChart').getContext('2d');
    expandedChart = new Chart(expandedCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Temperature (°F)',
                data: [],
                borderColor: '#1a2980',
                backgroundColor: 'rgba(26, 41, 128, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                zoom: {
                    zoom: {
                        wheel: {
                            enabled: true,
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x',
                    },
                    pan: {
                        enabled: true,
                        mode: 'x',
                    }
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Temperature (°F)'
                    },
                    beginAtZero: false
                },
                x: {
                    title: {
                        display: true,
                        text: 'Time'
                    }
                }
            }
        }
    });

    // Set up event listeners
    setupEventListeners();
    
    // Start data updates
    updateCurrentTemperature();
    updateChart();
    
    // Set up regular updates
    setInterval(updateCurrentTemperature, 2000);
    setInterval(updateChart, 30000);
});

function setupEventListeners() {
    // Chart container click handler
    document.querySelector('.chart-container').addEventListener('click', () => {
        isExpanded = false;
        toggleExpandedView();
    });
    
    // Close button handler
    document.querySelector('.close-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        isExpanded = true;
        toggleExpandedView();
    });
    
    // Zoom control handlers
    document.querySelector('.zoom-in-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        expandedChart.zoom(1.1);
    });
    
    document.querySelector('.zoom-out-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        expandedChart.zoom(0.9);
    });
    
    document.querySelector('.reset-zoom-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        expandedChart.resetZoom();
    });
}

function toggleExpandedView() {
    const overlay = document.getElementById('expanded-chart-overlay');
    if (!isExpanded) {
        overlay.style.display = 'block';
        setTimeout(() => {
            overlay.classList.add('visible');
            updateChart();
        }, 10);
        isExpanded = true;
    } else {
        overlay.classList.remove('visible');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
        isExpanded = false;
    }
}

function updateCurrentTemperature() {
    fetch('/get_temperature')
        .then(response => response.json())
        .then(data => {
            document.getElementById('temperature').textContent = data.temperature.toFixed(1);
            
            if (temperatureChart.data.labels.length >= 10) {
                temperatureChart.data.labels.shift();
                temperatureChart.data.datasets[0].data.shift();
            }
            temperatureChart.data.labels.push(data.timestamp);
            temperatureChart.data.datasets[0].data.push(data.temperature);
            
            // Update y-axis range
            const range = calculateYAxisRange(temperatureChart.data.datasets[0].data);
            temperatureChart.options.scales.y.min = range.min;
            temperatureChart.options.scales.y.max = range.max;
            
            temperatureChart.update();
        });
}

function updateChart() {
    fetch('/get_temperature_history')
        .then(response => response.json())
        .then(data => {
            if (isExpanded) {
                const historical = data.historical;
                expandedChart.data.labels = historical.map(item => item.timestamp);
                expandedChart.data.datasets[0].data = historical.map(item => item.temperature);
                
                // Update y-axis range for expanded chart
                const range = calculateYAxisRange(historical.map(item => item.temperature));
                expandedChart.options.scales.y.min = range.min;
                expandedChart.options.scales.y.max = range.max;
                
                expandedChart.update();
                
                document.querySelector('.range-value').textContent = 
                    `Last ${historical.length} readings (${data.metadata.interval} intervals)`;
            }
        });
} 
// Chart.js setup
let temperatureChart;

document.addEventListener('DOMContentLoaded', function() {
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
                        text: 'Time',
                        color: '#555'
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Temperature (°F)',
                        color: '#555'
                    },
                    suggestedMin: 97,
                    suggestedMax: 105,
                    grid: {
                        color: '#eee'
                    }
                }
            }
        }
    });

    // Load history first
    loadHistory();

    // Set up regular updates
    setInterval(updateCurrentTemperature, 1000);
    setInterval(updateChart, 5000);
});

function loadHistory() {
    fetch('/get_temperature_history')
        .then(response => response.json())
        .then(history => {
            // Clear existing data
            temperatureChart.data.labels = [];
            temperatureChart.data.datasets[0].data = [];
            
            // Add historical data
            history.forEach(point => {
                temperatureChart.data.labels.push(point.timestamp);
                temperatureChart.data.datasets[0].data.push(point.temperature);
            });
            
            temperatureChart.update();
            
            // Update current temperature if history exists
            if (history.length > 0) {
                document.getElementById("temperature").textContent = history[history.length - 1].temperature;
            }
        });
}

function updateCurrentTemperature() {
    fetch('/get_temperature')
        .then(response => response.json())
        .then(data => {
            document.getElementById("temperature").textContent = data.temperature;
        });
}

function updateChart() {
    fetch('/get_temperature')
        .then(response => response.json())
        .then(data => {
            if (temperatureChart.data.labels.length > 500) {
                temperatureChart.data.labels.shift();
                temperatureChart.data.datasets[0].data.shift();
            }
            temperatureChart.data.labels.push(data.timestamp);
            temperatureChart.data.datasets[0].data.push(data.temperature);
            temperatureChart.update();
        });
} 
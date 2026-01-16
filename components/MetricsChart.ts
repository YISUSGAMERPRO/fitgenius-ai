// Este archivo provee una función para graficar métricas de rendimiento usando Chart.js
// Se puede importar y usar en WorkoutView.tsx

import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export function renderMetricsChart(canvasId: string, metrics: { labels: string[], data: number[], label: string, color: string }) {
    const ctx = document.getElementById(canvasId) as HTMLCanvasElement;
    if (!ctx) return;
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: metrics.labels,
            datasets: [{
                label: metrics.label,
                data: metrics.data,
                backgroundColor: metrics.color,
                borderRadius: 8,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: { display: false }
            },
            scales: {
                x: { grid: { display: false } },
                y: { beginAtZero: true, grid: { color: '#222' } }
            }
        }
    });
}

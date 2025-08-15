// step2/components/BoxplotChart.tsx
"use client";

import dynamic from 'next/dynamic';

import { BoxplotStatistics, ChartSeries, PLOT_COLORS } from '@/features/step2/types/types';

import type { ApexOptions } from 'apexcharts';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface BoxplotChartProps {
    statistics: BoxplotStatistics;
    selectedVariable: string;
}

export default function BoxplotChart({ statistics, selectedVariable }: BoxplotChartProps) {
    const stats = statistics;

    // ApexCharts 箱型圖配置
    const options: ApexOptions = {
        chart: {
            type: 'boxPlot',
            height: 350,
            toolbar: {
                show: true,
                tools: {
                    download: true,
                    selection: false,
                    zoom: false,
                    zoomin: false,
                    zoomout: false,
                    pan: false,
                    reset: false
                }
            }
        },
        title: {
            align: 'center',
            style: {
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151'
            }
        },
        plotOptions: {
            boxPlot: {
                colors: {
                    upper: 'transparent',
                    lower: 'transparent'
                },
            },
            bar: {
                columnWidth: '20%'
            }
        },
        colors: [PLOT_COLORS.primary, PLOT_COLORS.primary],
        stroke: {
            colors: [PLOT_COLORS.primary],
            width: 2
        },
        xaxis: {
            type: 'category',
            categories: [selectedVariable],
            labels: {
                style: {
                    fontSize: '12px'
                }
            }
        },
        yaxis: {
            labels: {
                style: {
                    fontSize: '12px'
                },
                formatter: (val: number) => val?.toFixed(2) || '0'
            }
        },
        grid: {
            xaxis: {
                lines: {
                    show: false
                }
            },
            padding: {
                left: 20,
                right: 20
            }
        },
        legend: {
            markers: {
                fillColors: [PLOT_COLORS.primary, PLOT_COLORS.primary]
            }
        },
        markers: {
            size: [0, 4],
            colors: [PLOT_COLORS.primary],
            strokeColors: PLOT_COLORS.primary,
            strokeWidth: 1,
            hover: {
                size: 6
            }
        },
        tooltip: {
            shared: false,
            intersect: true,
            custom: function ({ seriesIndex, dataPointIndex, w }: any) {
                if (seriesIndex === 0) {
                    return `
                        <div class="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                            <p class="text-sm font-medium text-gray-900 mb-2">統計資訊</p>
                            <div class="space-y-1 text-xs">
                                <p class="text-gray-600">最大值: <span class="font-semibold text-gray-900">${stats.max.toFixed(2)}</span></p>
                                <p class="text-gray-600">Q3 (75%): <span class="font-semibold text-gray-900">${stats.q3.toFixed(2)}</span></p>
                                <p class="text-gray-600">中位數: <span class="font-semibold text-gray-900">${stats.median.toFixed(2)}</span></p>
                                <p class="text-gray-600">Q1 (25%): <span class="font-semibold text-gray-900">${stats.q1.toFixed(2)}</span></p>
                                <p class="text-gray-600">最小值: <span class="font-semibold text-gray-900">${stats.min.toFixed(2)}</span></p>
                                <p class="text-gray-600">平均值: <span class="font-semibold text-[#0F2844]">${stats.mean.toFixed(2)}</span></p>
                            </div>
                        </div>
                    `;
                }
                return `
                    <div class="bg-white px-3 py-2 border border-gray-200 rounded shadow-sm">
                        <span class="text-xs text-gray-600">離群值: </span>
                        <span class="text-xs font-semibold">${w.config.series[seriesIndex].data[dataPointIndex].y.toFixed(2)}</span>
                    </div>
                `;
            }
        }
    };

    // 準備箱型圖數據
    const series: ChartSeries[] = [{
        name: selectedVariable,
        type: 'boxPlot',
        data: [{
            x: selectedVariable,
            y: [stats.min, stats.q1, stats.median, stats.q3, stats.max]
        }]
    }];

    // 如果有離群值，添加散點圖
    if (stats.outliers.length > 0) {
        series.push({
            name: '離群值',
            type: 'scatter',
            data: stats.outliers.slice(0, 50).map(val => ({
                x: selectedVariable,
                y: val
            }))
        });
    }

    return (
        <>
            <div className="bg-white rounded-lg border p-4">
                <Chart
                    options={options}
                    series={series}
                    type="boxPlot"
                    height={350}
                />
            </div>

            {/* 統計摘要 */}
            <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-3 text-sm">統計摘要</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>樣本數: {stats.n}</div>
                    <div>遺漏值: {stats.missing}</div>
                    <div>平均值: {stats.mean.toFixed(2)}</div>
                    <div>中位數: {stats.median.toFixed(2)}</div>
                    <div>標準差: {stats.std.toFixed(2)}</div>
                    <div>最小值: {stats.min.toFixed(2)}</div>
                    <div>最大值: {stats.max.toFixed(2)}</div>
                    <div>Q1 (25%): {stats.q1.toFixed(2)}</div>
                    <div>Q3 (75%): {stats.q3.toFixed(2)}</div>
                    <div>離群值數量: {stats.outliers.length}</div>
                </div>
                {stats.outliers.length > 0 && (
                    <div className="mt-2 text-xs text-gray-600">
                        離群值: {stats.outliers.slice(0, 5).map(v => v.toFixed(2)).join(", ")}
                        {stats.outliers.length > 5 && ` ... (共 ${stats.outliers.length} 個)`}
                    </div>
                )}
            </div>
        </>
    );
}
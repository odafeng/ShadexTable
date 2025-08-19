// BarplotChart.tsx - 優化版本
"use client";

import { memo, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { BarplotStatistics, PlotDataPoint, PLOT_COLORS } from '@/features/step2/types/types';
import type { ApexOptions } from 'apexcharts';

const Chart = dynamic(() => import('react-apexcharts'), { 
    ssr: false,
    loading: () => <div className="h-[350px] bg-gray-50 animate-pulse rounded-lg" />
});

interface BarplotChartProps {
    statistics: BarplotStatistics;
    selectedVariable: string;
    data: PlotDataPoint[];
}

const BarplotChart = memo(function BarplotChart({ statistics, selectedVariable, data }: BarplotChartProps) {
    const stats = statistics;

    // 準備長條圖資料（限制前10個類別）
    const { categories, counts, percentages } = useMemo(() => ({
        categories: stats.categories.slice(0, 10),
        counts: stats.counts.slice(0, 10),
        percentages: stats.percentages.slice(0, 10)
    }), [stats]);

    // ApexCharts 長條圖配置
    const options: ApexOptions = useMemo(() => ({
        chart: {
            type: 'bar',
            height: 350,
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 400,
                animateGradually: {
                    enabled: true,
                    delay: 150
                }
            },
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
            text: `${selectedVariable} 分布`,
            align: 'left',
            style: {
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151'
            }
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                dataLabels: {
                    position: 'top'
                },
                distributed: true
            }
        },
        dataLabels: {
            enabled: true,
            formatter: function (_: number, opts: any) {
                const percentage = percentages[opts.dataPointIndex];
                return percentage ? `${percentage.toFixed(1)}%` : '';
            },
            offsetY: -20,
            style: {
                fontSize: '11px',
                colors: ["#304758"]
            }
        },
        colors: PLOT_COLORS.palette,
        xaxis: {
            categories: categories,
            labels: {
                rotate: -45,
                rotateAlways: true,
                style: {
                    fontSize: '11px'
                }
            }
        },
        yaxis: {
            title: {
                text: '數量',
                style: {
                    fontSize: '12px'
                }
            },
            labels: {
                style: {
                    fontSize: '12px'
                }
            }
        },
        tooltip: {
            y: {
                formatter: function (val: number, opts: any) {
                    const percentage = percentages[opts.dataPointIndex];
                    return `${val} (${percentage?.toFixed(1)}%)`;
                }
            }
        },
        legend: {
            show: false
        }
    }), [selectedVariable, categories, percentages]);

    const series = useMemo(() => [{
        name: '數量',
        data: counts
    }], [counts]);

    return (
        <>
            <div className="bg-white rounded-lg border p-4">
                <Chart
                    options={options}
                    series={series}
                    type="bar"
                    height={350}
                />
            </div>

            {/* 分布統計 */}
            <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-3 text-sm">分布統計</h4>
                <div className="mb-3 text-xs text-gray-600">
                    <span>總數: {stats.total}</span>
                    <span className="mx-2">|</span>
                    <span>類別數: {stats.unique_count}</span>
                    <span className="mx-2">|</span>
                    <span>眾數: {stats.mode}</span>
                </div>
                {data.length > 10 && (
                    <p className="text-xs text-gray-500 mt-2">
                        圖表顯示前 10 個類別，共 {data.length} 個類別
                    </p>
                )}
            </div>
        </>
    );
});

export default BarplotChart;
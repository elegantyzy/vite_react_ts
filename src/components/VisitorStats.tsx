import React, { useEffect, useState } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import './VisitorStats.css';

interface VisitorData {
  dates: string[];
  visitors: number[];
}

interface VisitorStats {
  [key: string]: number;
}

const VisitorStats: React.FC = () => {
  const [chart1, setChart1] = useState<echarts.ECharts | null>(null);
  const [chart2, setChart2] = useState<echarts.ECharts | null>(null);
  const [chart3, setChart3] = useState<echarts.ECharts | null>(null);
  const [totalVisitors, setTotalVisitors] = useState<number>(0);

  // 生成访客唯一ID
  const generateVisitorId = (): string => {
    return 'visitor_' + Math.random().toString(36).substr(2, 9);
  };

  // 设置cookie
  const setCookie = (name: string, value: string, days: number): void => {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "; expires=" + date.toUTCString();
    document.cookie = name + "=" + value + expires + "; path=/";
  };

  // 获取cookie
  const getCookie = (name: string): string | null => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  // 检查访客是否应该被计数
  const shouldCountVisitor = (): boolean => {
    let visitorId = getCookie('visitorId');
    const lastVisit = getCookie('lastVisit');
    const now = new Date().getTime();

    if (!visitorId) {
      visitorId = generateVisitorId();
      setCookie('visitorId', visitorId, 365);
      setCookie('lastVisit', now.toString(), 1);
      return true;
    }

    if (lastVisit && (now - parseInt(lastVisit)) < 24 * 60 * 60 * 1000) {
      return false;
    }

    setCookie('lastVisit', now.toString(), 1);
    return true;
  };

  // 更新访问计数
  const updateVisitorCount = (): void => {
    if (!shouldCountVisitor()) {
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const visitors: VisitorStats = JSON.parse(localStorage.getItem('visitorStats') || '{}');
    
    visitors[today] = (visitors[today] || 0) + 1;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
    
    Object.keys(visitors).forEach(date => {
      if (date < thirtyDaysAgoStr) {
        delete visitors[date];
      }
    });

    localStorage.setItem('visitorStats', JSON.stringify(visitors));
  };

  // 获取访问数据
  const getVisitorData = (): VisitorData => {
    const today = new Date();
    const visitors: VisitorStats = JSON.parse(localStorage.getItem('visitorStats') || '{}');
    
    const dates: string[] = [];
    const visitorCounts: number[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      dates.push(dateStr.slice(5));
      visitorCounts.push(visitors[dateStr] || 0);
    }

    return {
      dates,
      visitors: visitorCounts
    };
  };

  // 获取总访问量
  const calculateTotalVisitors = (): number => {
    const visitors: VisitorStats = JSON.parse(localStorage.getItem('visitorStats') || '{}');
    return Object.values(visitors).reduce((sum, count) => sum + count, 0);
  };

  useEffect(() => {
    updateVisitorCount();
    setTotalVisitors(calculateTotalVisitors());
    
    const theme = {
      backgroundColor: 'transparent',
      textStyle: { 
        color: '#00ffff',
        fontSize: 14
      },
      title: { 
        textStyle: { 
          color: '#00ffff',
          fontSize: 16,
          fontWeight: 'normal'
        }
      },
      legend: { 
        textStyle: { color: '#00ffff' },
        itemStyle: { borderColor: '#00ffff' }
      },
      xAxis: { 
        axisLine: { lineStyle: { color: '#00ffff' } },
        splitLine: { show: false },
        axisTick: { show: false }
      },
      yAxis: { 
        axisLine: { lineStyle: { color: '#00ffff' } },
        splitLine: { 
          show: true,
          lineStyle: { 
            color: 'rgba(0, 255, 255, 0.1)',
            type: 'dashed' as const
          }
        }
      }
    };

    const chartDom1 = document.getElementById('visitor-line-chart');
    const chartDom2 = document.getElementById('visitor-pie-chart');
    const chartDom3 = document.getElementById('visitor-bar-chart');

    if (chartDom1 && chartDom2 && chartDom3) {
      const lineChart = echarts.init(chartDom1);
      const pieChart = echarts.init(chartDom2);
      const barChart = echarts.init(chartDom3);

      setChart1(lineChart);
      setChart2(pieChart);
      setChart3(barChart);

      const visitorData = getVisitorData();
      
      const lineOption: EChartsOption = {
        ...theme,
        title: {
          text: '访问趋势',
          left: 'left'
        },
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(0, 255, 255, 0.1)',
          borderColor: '#00ffff',
          textStyle: { color: '#00ffff' }
        },
        grid: {
          top: '15%',
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: visitorData.dates,
          boundaryGap: false
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '访问量',
            type: 'line',
            data: visitorData.visitors,
            smooth: true,
            symbol: 'circle',
            symbolSize: 8,
            lineStyle: {
              width: 3,
              color: '#00ffff'
            },
            itemStyle: {
              color: '#00ffff',
              borderWidth: 2,
              borderColor: '#fff'
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(0, 255, 255, 0.5)' },
                { offset: 1, color: 'rgba(0, 255, 255, 0.1)' }
              ])
            }
          }
        ]
      };

      const pieOption: EChartsOption = {
        ...theme,
        title: {
          text: '访问时段分布',
          left: 'center'
        },
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(0, 255, 255, 0.1)',
          borderColor: '#00ffff',
          textStyle: { color: '#00ffff' }
        },
        legend: {
          orient: 'vertical',
          left: '5%',
          top: 'middle'
        },
        series: [
          {
            name: '访问时段',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['60%', '50%'],
            data: [
              { value: 35, name: '早晨' },
              { value: 30, name: '下午' },
              { value: 25, name: '晚上' },
              { value: 10, name: '凌晨' }
            ],
            itemStyle: {
              borderColor: '#041129',
              borderWidth: 2
            },
            label: {
              color: '#00ffff'
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(0, 255, 255, 0.5)'
              }
            }
          }
        ]
      };

      const barOption: EChartsOption = {
        ...theme,
        title: {
          text: '访问设备统计',
          left: 'left'
        },
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(0, 255, 255, 0.1)',
          borderColor: '#00ffff',
          textStyle: { color: '#00ffff' }
        },
        grid: {
          top: '15%',
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: ['PC端', '移动端', '平板', '其他']
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '访问量',
            type: 'bar',
            data: [45, 35, 15, 5],
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 1, 0, 0, [
                { offset: 0, color: 'rgba(0, 255, 255, 0.1)' },
                { offset: 1, color: 'rgba(0, 255, 255, 0.8)' }
              ]),
              borderRadius: [4, 4, 0, 0]
            }
          }
        ]
      };

      lineChart.setOption(lineOption);
      pieChart.setOption(pieOption);
      barChart.setOption(barOption);

      return () => {
        lineChart.dispose();
        pieChart.dispose();
        barChart.dispose();
      };
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      chart1?.resize();
      chart2?.resize();
      chart3?.resize();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [chart1, chart2, chart3]);

  return (
    <div className="visitor-stats-container">
      <div className="stats-header">
        <h1>网站访问统计</h1>
        <div className="total-visitors">
          <span className="number">{totalVisitors}</span>
          <span className="label">总访问量</span>
        </div>
      </div>
      <div className="charts-grid">
        <div className="chart-container">
          <div id="visitor-line-chart" className="chart"></div>
        </div>
        <div className="chart-container">
          <div id="visitor-pie-chart" className="chart"></div>
        </div>
        <div className="chart-container">
          <div id="visitor-bar-chart" className="chart"></div>
        </div>
      </div>
    </div>
  );
};

export default VisitorStats; 
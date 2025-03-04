import React, { useEffect, useState } from 'react';
import * as echarts from 'echarts';
import './VisitorStats.css';

interface VisitorData {
  dates: string[];
  visitors: number[];
}

interface VisitorStats {
  [key: string]: number;
}

interface TimeDistribution {
  morning: number;
  afternoon: number;
  evening: number;
  night: number;
}

interface DeviceDistribution {
  pc: number;
  mobile: number;
  tablet: number;
  other: number;
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

    // 更新访问统计
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

    // 更新时段分布
    const currentHour = new Date().getHours();
    let timeDistribution = JSON.parse(localStorage.getItem('timeDistribution') || JSON.stringify({
      morning: 0,
      afternoon: 0,
      evening: 0,
      night: 0
    }));

    if (currentHour >= 6 && currentHour < 12) {
      timeDistribution.morning += 1;
    } else if (currentHour >= 12 && currentHour < 18) {
      timeDistribution.afternoon += 1;
    } else if (currentHour >= 18 && currentHour < 24) {
      timeDistribution.evening += 1;
    } else {
      timeDistribution.night += 1;
    }
    
    localStorage.setItem('timeDistribution', JSON.stringify(timeDistribution));

    // 更新设备分布
    const deviceType = getDeviceType();
    let deviceDistribution = JSON.parse(localStorage.getItem('deviceDistribution') || JSON.stringify({
      pc: 0,
      mobile: 0,
      tablet: 0,
      other: 0
    }));

    deviceDistribution[deviceType] += 1;
    localStorage.setItem('deviceDistribution', JSON.stringify(deviceDistribution));
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
    return Object.values(visitors).reduce((sum, count) => sum + count, 1);
  };

  // 获取时段分布
  const getTimeDistribution = (): TimeDistribution => {
    const currentHour = new Date().getHours();
    
    // 从 localStorage 获取时段分布数据
    let distribution = JSON.parse(localStorage.getItem('timeDistribution') || JSON.stringify({
      morning: 0,    // 6-12点
      afternoon: 0,  // 12-18点
      evening: 0,    // 18-24点
      night: 0      // 0-6点
    }));

    // 根据当前时间更新分布
    if (shouldCountVisitor()) {
      if (currentHour >= 6 && currentHour < 12) {
        distribution.morning += 1;
      } else if (currentHour >= 12 && currentHour < 18) {
        distribution.afternoon += 1;
      } else if (currentHour >= 18 && currentHour < 24) {
        distribution.evening += 1;
      } else {
        distribution.night += 1;
      }
      
      // 保存更新后的分布数据
      localStorage.setItem('timeDistribution', JSON.stringify(distribution));
    }

    return distribution;
  };

  // 添加获取设备类型的函数
  const getDeviceType = (): string => {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    else if (/Macintosh|Windows|Linux/.test(ua)) {
      return 'pc';
    }
    return 'other';
  };

  // 添加获取设备分布的函数
  const getDeviceDistribution = (): DeviceDistribution => {
    // 从 localStorage 获取设备分布数据
    let distribution = JSON.parse(localStorage.getItem('deviceDistribution') || JSON.stringify({
      pc: 0,
      mobile: 0,
      tablet: 0,
      other: 0
    }));

    // 根据当前设备类型更新分布
    if (shouldCountVisitor()) {
      const deviceType = getDeviceType();
      distribution[deviceType] += 1;
      
      // 保存更新后的分布数据
      localStorage.setItem('deviceDistribution', JSON.stringify(distribution));
    }

    return distribution;
  };

  useEffect(() => {
    // 初始化访问统计
    updateVisitorCount();
    
    // 初始化图表
    const chartDom1 = document.getElementById('visitor-line-chart');
    const chartDom2 = document.getElementById('visitor-pie-chart');
    const chartDom3 = document.getElementById('visitor-bar-chart');

    if (chartDom1 && chartDom2 && chartDom3) {
      const theme = {
        backgroundColor: 'transparent',
        textStyle: { color: '#00ffff', fontSize: 14 },
        title: { textStyle: { color: '#00ffff', fontSize: 16, fontWeight: 'normal' } },
        legend: { textStyle: { color: '#00ffff' }, itemStyle: { borderColor: '#00ffff' } },
        xAxis: { 
          axisLine: { lineStyle: { color: '#00ffff' } },
          splitLine: { show: false },
          axisTick: { show: false }
        },
        yAxis: { 
          axisLine: { lineStyle: { color: '#00ffff' } },
          splitLine: { 
            show: true,
            lineStyle: { color: 'rgba(0, 255, 255, 0.1)', type: 'dashed' as const }
          }
        }
      };

      const lineChart = echarts.init(chartDom1);
      const pieChart = echarts.init(chartDom2);
      const barChart = echarts.init(chartDom3);

      setChart1(lineChart);
      setChart2(pieChart);
      setChart3(barChart);

      // 初始化图表配置
      const visitorData = getVisitorData();
      const timeDistribution = getTimeDistribution();
      const deviceDistribution = getDeviceDistribution();

      // 折线图配置
      lineChart.setOption({
        ...theme,
        title: { text: '访问趋势', left: 'left' },
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
        yAxis: { type: 'value' },
        series: [{
          name: '访问量',
          type: 'line',
          data: visitorData.visitors,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { width: 3, color: '#00ffff' },
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
        }]
      });

      // 饼图配置
      pieChart.setOption({
        ...theme,
        title: { text: '访问时段分布', left: 'center' },
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
        series: [{
          name: '访问时段',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['60%', '50%'],
          data: [
            { value: timeDistribution.morning, name: '早晨 (6-12点)' },
            { value: timeDistribution.afternoon, name: '下午 (12-18点)' },
            { value: timeDistribution.evening, name: '晚上 (18-24点)' },
            { value: timeDistribution.night, name: '凌晨 (0-6点)' }
          ],
          itemStyle: {
            borderColor: '#041129',
            borderWidth: 2
          },
          label: { color: '#00ffff' },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 255, 255, 0.5)'
            }
          }
        }]
      });

      // 柱状图配置
      barChart.setOption({
        ...theme,
        title: { text: '访问设备统计', left: 'left' },
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
        yAxis: { type: 'value' },
        series: [{
          name: '访问量',
          type: 'bar',
          data: [
            deviceDistribution.pc,
            deviceDistribution.mobile,
            deviceDistribution.tablet,
            deviceDistribution.other
          ],
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 1, 0, 0, [
              { offset: 0, color: 'rgba(0, 255, 255, 0.1)' },
              { offset: 1, color: 'rgba(0, 255, 255, 0.8)' }
            ]),
            borderRadius: [4, 4, 0, 0]
          }
        }]
      });

      // 创建更新函数
      const updateCharts = () => {
        setTotalVisitors(calculateTotalVisitors());
        const newVisitorData = getVisitorData();
        const newTimeDistribution = getTimeDistribution();
        const newDeviceDistribution = getDeviceDistribution();

        // 更新图表数据
        lineChart.setOption({
          xAxis: { data: newVisitorData.dates },
          series: [{ data: newVisitorData.visitors }]
        });

        pieChart.setOption({
          series: [{
            data: [
              { value: newTimeDistribution.morning, name: '早晨 (6-12点)' },
              { value: newTimeDistribution.afternoon, name: '下午 (12-18点)' },
              { value: newTimeDistribution.evening, name: '晚上 (18-24点)' },
              { value: newTimeDistribution.night, name: '凌晨 (0-6点)' }
            ]
          }]
        });

        barChart.setOption({
          series: [{
            data: [
              newDeviceDistribution.pc,
              newDeviceDistribution.mobile,
              newDeviceDistribution.tablet,
              newDeviceDistribution.other
            ]
          }]
        });
      };

      // 设置定时更新
      const timer = setInterval(updateCharts, 1 * 1000 * 10);

      // 清理函数
      return () => {
        clearInterval(timer);
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
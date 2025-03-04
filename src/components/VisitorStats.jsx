import React, { useEffect, useState } from 'react';
import * as echarts from 'echarts';

const VisitorStats = () => {
  const [chart, setChart] = useState(null);

  // 生成访客唯一ID
  const generateVisitorId = () => {
    return 'visitor_' + Math.random().toString(36).substr(2, 9);
  };

  // 设置cookie
  const setCookie = (name, value, days) => {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = "; expires=" + date.toUTCString();
    document.cookie = name + "=" + value + expires + "; path=/";
  };

  // 获取cookie
  const getCookie = (name) => {
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
  const shouldCountVisitor = () => {
    let visitorId = getCookie('visitorId');
    const lastVisit = getCookie('lastVisit');
    const now = new Date().getTime();

    // 如果是新访客
    if (!visitorId) {
      visitorId = generateVisitorId();
      setCookie('visitorId', visitorId, 365); // 保存365天
      setCookie('lastVisit', now, 1); // 保存最后访问时间
      return true;
    }

    // 如果是老访客，检查是否过了24小时
    if (lastVisit && (now - parseInt(lastVisit)) < 24 * 60 * 60 * 1000) {
      return false;
    }

    // 更新最后访问时间
    setCookie('lastVisit', now, 1);
    return true;
  };

  // 更新访问计数
  const updateVisitorCount = () => {
    if (!shouldCountVisitor()) {
      return; // 如果不应该计数，直接返回
    }

    const today = new Date().toISOString().split('T')[0];
    const visitors = JSON.parse(localStorage.getItem('visitorStats')) || {};
    
    // 更新今天的访问量
    visitors[today] = (visitors[today] || 0) + 1;
    
    // 只保留最近30天的数据
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
  const getVisitorData = () => {
    const today = new Date();
    const visitors = JSON.parse(localStorage.getItem('visitorStats')) || {};
    
    const dates = [];
    const visitorCounts = [];
    
    // 获取最近7天的数据
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      dates.push(dateStr.slice(5)); // 只显示月-日
      visitorCounts.push(visitors[dateStr] || 0);
    }

    return {
      dates,
      visitors: visitorCounts
    };
  };

  useEffect(() => {
    // 更新访问计数
    updateVisitorCount();
    
    // 初始化图表
    const chartDom = document.getElementById('visitor-chart');
    const myChart = echarts.init(chartDom);
    setChart(myChart);

    const visitorData = getVisitorData();
    
    // 配置图表选项
    const option = {
      title: {
        text: '近7天网站访问量统计'
      },
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: visitorData.dates
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
          markPoint: {
            data: [
              { type: 'max', name: '最大值' },
              { type: 'min', name: '最小值' }
            ]
          }
        }
      ]
    };

    myChart.setOption(option);

    return () => {
      myChart.dispose();
    };
  }, []);

  // 窗口大小改变时重绘图表
  useEffect(() => {
    const handleResize = () => {
      chart?.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [chart]);

  return (
    <div className="visitor-stats-container">
      <div id="visitor-chart" style={{ width: '100%', height: '400px' }}></div>
    </div>
  );
};

export default VisitorStats; 
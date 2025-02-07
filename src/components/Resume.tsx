import { motion } from 'framer-motion';
import { useState } from 'react';
import styles from './Resume.module.css';

// Mock 数据
const resumeData = {
  basicInfo: {
    name: "张三",
    title: "高级前端工程师",
    email: "zhangsan@example.com",
    phone: "13800138000",
    location: "上海",
    avatar: "https://via.placeholder.com/150"
  },
  experience: [
    {
      id: 1,
      company: "科技有限公司",
      position: "高级前端工程师",
      period: "2020-至今",
      description: "负责公司核心产品的前端开发，优化用户体验，提升产品性能"
    },
    {
      id: 2,
      company: "互联网公司",
      position: "前端工程师",
      period: "2018-2020",
      description: "参与多个项目的开发，使用 React 构建用户界面"
    }
  ],
  skills: [
    "React", "TypeScript", "Node.js", "Vue.js", "Webpack", "CSS3", "HTML5"
  ]
};

const Resume = () => {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  return (
    <motion.div 
      className={styles.container}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* 基本信息部分 */}
      <motion.section className={styles.basicInfo} variants={itemVariants}>
        <motion.img 
          src={resumeData.basicInfo.avatar}
          alt="avatar"
          className={styles.avatar}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        />
        <div className={styles.info}>
          <motion.h1>{resumeData.basicInfo.name}</motion.h1>
          <motion.h2>{resumeData.basicInfo.title}</motion.h2>
          <motion.div className={styles.contact}>
            <p>{resumeData.basicInfo.email}</p>
            <p>{resumeData.basicInfo.phone}</p>
            <p>{resumeData.basicInfo.location}</p>
          </motion.div>
        </div>
      </motion.section>

      {/* 工作经验部分 */}
      <motion.section className={styles.experience} variants={itemVariants}>
        <h2>工作经验</h2>
        {resumeData.experience.map((exp) => (
          <motion.div 
            key={exp.id}
            className={styles.experienceItem}
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedSection(exp.id.toString())}
          >
            <h3>{exp.company}</h3>
            <h4>{exp.position}</h4>
            <p className={styles.period}>{exp.period}</p>
            <motion.p
              initial={false}
              animate={{ height: selectedSection === exp.id.toString() ? 'auto' : '0' }}
              className={styles.description}
            >
              {exp.description}
            </motion.p>
          </motion.div>
        ))}
      </motion.section>

      {/* 技能部分 */}
      <motion.section className={styles.skills} variants={itemVariants}>
        <h2>技能专长</h2>
        <div className={styles.skillsContainer}>
          {resumeData.skills.map((skill, index) => (
            <motion.span
              key={index}
              className={styles.skillTag}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {skill}
            </motion.span>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );
};

export default Resume; 
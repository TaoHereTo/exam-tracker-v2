export const MODULES = ['政治理论', '常识判断', '判断推理', '言语理解', '数量关系', '资料分析'];
export const MODULE_SCORES = {
    '政治理论': 0.7, '常识判断': 0.8, '判断推理': 0.8,
    '言语理解': 0.8, '数量关系': 0.8, '资料分析': 0.7
};

export const FULL_EXAM_CONFIG = {
    totalTime: 120, totalQuestions: 130,
    modules: {
        '政治理论': { questions: 20, pointsPerQuestion: 0.7 },
        '常识判断': { questions: 15, pointsPerQuestion: 0.8 },
        '言语理解': { questions: 30, pointsPerQuestion: 0.8 },
        '判断推理': { questions: 35, pointsPerQuestion: 0.8 },
        '数量关系': { questions: 10, pointsPerQuestion: 0.8 },
        '资料分析': { questions: 20, pointsPerQuestion: 0.7 },
    }
}; 
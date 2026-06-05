import { theme } from 'antd';

const { defaultAlgorithm, darkAlgorithm } = theme;

export const lightTheme = {
  algorithm: defaultAlgorithm,
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 4,
  },
};

export const darkTheme = {
  algorithm: darkAlgorithm,
  token: {
    colorPrimary: '#177ddc',
    borderRadius: 4,
  },
};

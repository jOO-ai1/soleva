import React from 'react';
import { Button, Dropdown, Space } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, isRTL } = useLanguage();

  const languageOptions = [
  {
    key: 'en',
    label:
    <Space>
          <span className="flag-icon">🇺🇸</span>
          English
        </Space>,

    onClick: () => setLanguage('en')
  },
  {
    key: 'ar',
    label:
    <Space>
          <span className="flag-icon">🇪🇬</span>
          العربية
        </Space>,

    onClick: () => setLanguage('ar')
  }];


  const currentLanguageLabel = language === 'ar' ?
  <Space>
      <span className="flag-icon">🇪🇬</span>
      العربية
    </Space> :

  <Space>
      <span className="flag-icon">🇺🇸</span>
      English
    </Space>;


  return (
    <Dropdown
      menu={{ items: languageOptions }}
      trigger={['click']}
      placement={isRTL ? 'bottomLeft' : 'bottomRight'}>

      <Button
        type="text"
        icon={<GlobalOutlined />}
        className="language-switcher-btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          height: '40px',
          padding: '4px 8px',
          border: 'none',
          background: 'transparent',
          color: 'var(--text-primary)',
          transition: 'all var(--transition-normal)'
        }}>

        <span className="language-label">
          {currentLanguageLabel}
        </span>
      </Button>
    </Dropdown>);

};

export default LanguageSwitcher;
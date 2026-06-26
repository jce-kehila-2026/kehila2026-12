import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import GroupsIcon from '@mui/icons-material/Groups';
import HandshakeIcon from '@mui/icons-material/Handshake';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import PreviewIcon from '@mui/icons-material/Preview';
import PublicHomePageHomeTab from './PublicHomePageHomeTab';
import PublicHomePageLearnTogetherTab from './PublicHomePageLearnTogetherTab';
import PublicHomePageInspirationStoriesTab from './PublicHomePageInspirationStoriesTab';
import PublicHomePagePressCoverageTab from './PublicHomePagePressCoverageTab';
import PublicHomePageTeamTab from './PublicHomePageTeamTab';
import PartnersManagementPage from './PartnersManagementPage';
import PublicHomePageContactTab from './PublicHomePageContactTab';
import { useAdminLocale } from '../context/AdminLocaleContext';
import AdminPageHeader from '../components/AdminPageHeader';

const TABS = [
  { key: 'home', labelKey: 'cmsTabHome', icon: <HomeIcon />, Component: PublicHomePageHomeTab },
  { key: 'aboutUs', labelKey: 'cmsTabAboutUs', icon: <InfoIcon />, Component: PublicHomePageLearnTogetherTab },
  {
    key: 'inspirationStories',
    labelKey: 'cmsTabInspiration',
    icon: <AutoStoriesIcon />,
    Component: PublicHomePageInspirationStoriesTab,
  },
  {
    key: 'pressCoverage',
    labelKey: 'cmsTabPress',
    icon: <NewspaperIcon />,
    Component: PublicHomePagePressCoverageTab,
  },
  {
    key: 'team',
    labelKey: 'cmsTabTeam',
    icon: <GroupsIcon />,
    Component: PublicHomePageTeamTab,
  },
  {
    key: 'partners',
    labelKey: 'cmsTabPartners',
    icon: <HandshakeIcon />,
    Component: PartnersManagementPage,
  },
  {
    key: 'contact',
    labelKey: 'cmsTabContact',
    icon: <ContactMailIcon />,
    Component: PublicHomePageContactTab,
  },
];

export default function CMSPage() {
  const { t, direction } = useAdminLocale();
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Box className="admin-cms-page" sx={{ pb: 12 }} dir={direction}>
      <AdminPageHeader
        title={t('cmsHomePageTitle')}
        actions={(
          <Button
            variant="outlined"
            startIcon={<PreviewIcon />}
            component="a"
            href="/public?preview=1"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ flexShrink: 0 }}
          >
            {t('cmsPreviewHomePage')}
          </Button>
        )}
      />

      <Tabs
        value={tabIndex}
        onChange={(_, v) => setTabIndex(v)}
        TabIndicatorProps={{ sx: { display: 'none' } }}
        sx={{
          mb: 3,
          minHeight: '2.375rem',
          width: 'fit-content',
          maxWidth: '100%',
          padding: '0.1875rem',
          borderRadius: '12px',
          background: '#fdf2f8',
          '& .MuiTabs-flexContainer': {
            gap: '0.1875rem',
          },
        }}
      >
        {TABS.map((tab) => (
          <Tab
            key={tab.key}
            label={t(tab.labelKey)}
            icon={tab.icon}
            iconPosition="start"
            disableRipple
            sx={{
              minHeight: '1.875rem',
              minWidth: 'auto',
              padding: '0.4375rem 0.75rem',
              borderRadius: '9px',
              color: '#db4f9f',
              fontWeight: 700,
              transition: 'color 160ms ease, background 160ms ease, box-shadow 160ms ease',
              '&:hover': {
                color: '#fff',
                background: 'linear-gradient(135deg, #e73386, #dc2577)',
              },
              '&.Mui-selected': {
                color: '#fff',
                background: 'linear-gradient(135deg, #e73386, #dc2577)',
              },
            }}
          />
        ))}
      </Tabs>

      {TABS.map((tab, index) => (
        <Box key={tab.key} hidden={tabIndex !== index} role="tabpanel">
          {tabIndex === index ? <tab.Component /> : null}
        </Box>
      ))}
    </Box>
  );
}
